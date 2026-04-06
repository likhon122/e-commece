import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Cart, CheckoutSession, Order, User } from "@/lib/db/models";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { sendAdminOrderAlertEmail, sendOrderStatusUpdateEmail } from "@/lib/email";
import { verifySSLCommerzCallbackSignature } from "@/lib/payments/signature";
import { getCallbackBaseUrl } from "@/lib/payments/base-url";
import { readPaymentCallbackPayload } from "@/lib/payments/callback-payload";
import { notifyAllAdmins } from "@/lib/notifications";
import {
  buildOrderItemsFromCheckoutSession,
  confirmReservedOrderStock,
  releaseReservedOrderStock,
  reserveOrderStock,
} from "@/lib/orders/inventory";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rate-limit";

function getBaseUrl(request: NextRequest): string {
  return getCallbackBaseUrl(request);
}

function isAmountMatch(expected: number, received: string): boolean {
  const parsed = Number(received);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Math.abs(expected - parsed) < 0.01;
}

async function getPayload(request: NextRequest): Promise<Record<string, unknown>> {
  return readPaymentCallbackPayload(request);
}

async function notifyAdminsPaidOrder(
  order: {
    _id: unknown;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
  },
  customerName: string,
) {
  try {
    const adminRecipients = await notifyAllAdmins({
      type: "payment-update",
      title: `Payment confirmed for ${order.orderNumber}`,
      message: `${customerName} completed payment. Total ৳${Number(
        order.total || 0,
      ).toLocaleString()}.`,
      orderId: order._id as any,
      orderNumber: order.orderNumber,
      metadata: {
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
    });

    const offlineAdmins = adminRecipients.filter((admin) => !admin.online);
    await Promise.all(
      offlineAdmins.map((admin) =>
        sendAdminOrderAlertEmail(
          admin.email,
          "Admin",
          order.orderNumber,
          customerName,
          Number(order.total || 0),
          order.paymentMethod,
          order.paymentStatus,
        ),
      ),
    );
  } catch (notifyError) {
    console.error("SSLCommerz admin payment notification error:", notifyError);
  }
}

async function handleSuccess(request: NextRequest): Promise<NextResponse> {
  const rateLimit = checkRateLimit(request, "payment:sslcommerz:success", {
    maxRequests: 40,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  await connectDB();
  const baseUrl = getBaseUrl(request);
  const payload = await getPayload(request);

  const tran_id = String(payload.tran_id || "");
  const val_id = String(payload.val_id || "");
  const status = String(payload.status || "").toUpperCase();

  if (
    !tran_id ||
    !val_id ||
    (status !== "VALID" && status !== "VALIDATED" && status !== "SUCCESS")
  ) {
    return NextResponse.redirect(
      new URL(`/account/orders?payment=ssl-invalid-callback`, baseUrl),
    );
  }

  const hasSignatureFields =
    typeof payload.verify_sign === "string" &&
    typeof payload.verify_key === "string";
  if (hasSignatureFields && !verifySSLCommerzCallbackSignature(payload)) {
    // Do not hard-fail here; we still perform authoritative server-side validation via val_id.
    console.warn("SSLCommerz signature mismatch; continuing with val_id verification");
  }

  const validation = await validateSSLCommerzPayment(val_id);
  if (
    !validation ||
    (validation.status !== "VALID" && validation.status !== "VALIDATED")
  ) {
    return NextResponse.redirect(
      new URL(`/account/orders?payment=ssl-validation-failed`, baseUrl),
    );
  }

  if (validation.tran_id !== tran_id) {
    return NextResponse.redirect(
      new URL(`/account/orders?payment=ssl-reference-mismatch`, baseUrl),
    );
  }

  const checkoutSession = await CheckoutSession.findOne({
    gatewayTransactionId: tran_id,
    paymentMethod: "sslcommerz",
  });

  if (!checkoutSession) {
    const order = await Order.findOne({
      orderNumber: tran_id,
      paymentMethod: "sslcommerz",
    });

    if (!order) {
      return NextResponse.redirect(
        new URL(`/account/orders?payment=session-not-found`, baseUrl),
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.redirect(
        new URL(`/account/orders?paid=${order.orderNumber}`, baseUrl),
      );
    }

    if (!isAmountMatch(order.total, validation.amount)) {
      order.paymentStatus = "failed";
      order.statusHistory.push({
        status: order.status,
        note: "SSLCommerz callback amount mismatch",
        updatedAt: new Date(),
      });
      await order.save();
      await releaseReservedOrderStock(order._id.toString());

      return NextResponse.redirect(
        new URL(`/account/orders?payment=amount-mismatch`, baseUrl),
      );
    }

    let stockConfirmed = true;
    try {
      await confirmReservedOrderStock(order._id.toString());
    } catch (stockError) {
      stockConfirmed = false;
      console.error("SSLCommerz legacy stock confirmation error:", stockError);
      try {
        await releaseReservedOrderStock(order._id.toString());
      } catch (releaseError) {
        console.error("SSLCommerz legacy stock release error:", releaseError);
      }
    }

    order.paymentStatus = "paid";
    order.status = stockConfirmed ? "confirmed" : "pending";
    if (!stockConfirmed) {
      order.stockReservationStatus = "released";
    }
    order.paymentDetails = {
      transactionId: validation.tran_id,
      bankTransactionId: validation.bank_tran_id,
      cardType: validation.card_type,
      cardBrand: validation.card_brand,
      validationId: val_id,
    };
    order.statusHistory.push({
      status: stockConfirmed ? "confirmed" : "pending",
      note: stockConfirmed
        ? "Payment received via SSLCommerz"
        : "Payment received via SSLCommerz; stock confirmation failed and requires manual review",
      updatedAt: new Date(),
    });
    await order.save();

    try {
      const legacyUser = await User.findById(order.user);
      if (legacyUser) {
        await sendOrderStatusUpdateEmail(
          legacyUser.email,
          legacyUser.name,
          order.orderNumber,
          stockConfirmed ? "confirmed" : "pending",
        );

        await notifyAdminsPaidOrder(order, legacyUser.name);
      } else {
        await notifyAdminsPaidOrder(
          order,
          order.shippingAddress?.name || "Customer",
        );
      }
    } catch (emailError) {
      // Do not fail payment confirmation when email delivery fails.
      console.error("SSLCommerz legacy status email error:", emailError);
    }

    return NextResponse.redirect(
      new URL(
        stockConfirmed
          ? `/account/orders?paid=${order.orderNumber}`
          : `/account/orders?paid=${order.orderNumber}&stock=review`,
        baseUrl,
      ),
    );
  }

  if (checkoutSession.createdOrder) {
    const existingOrder = await Order.findById(checkoutSession.createdOrder);
    if (existingOrder) {
      return NextResponse.redirect(
        new URL(`/account/orders?paid=${existingOrder.orderNumber}`, baseUrl),
      );
    }
  }

  if (!isAmountMatch(checkoutSession.total, validation.amount)) {
    checkoutSession.status = "failed";
    checkoutSession.validationId = val_id;
    await checkoutSession.save();
    return NextResponse.redirect(
      new URL(`/account/orders?payment=amount-mismatch`, baseUrl),
    );
  }

  const { orderItems, subtotal } = await buildOrderItemsFromCheckoutSession(
    checkoutSession.items,
    checkoutSession.subtotal,
  );

  const order = await Order.create({
    user: checkoutSession.user,
    items: orderItems,
    subtotal,
    shippingCost: checkoutSession.shippingCost,
    tax: checkoutSession.tax,
    discount: checkoutSession.discount,
    total: checkoutSession.total,
    shippingAddress: checkoutSession.shippingAddress,
    billingAddress: checkoutSession.billingAddress || checkoutSession.shippingAddress,
    paymentMethod: "sslcommerz",
    paymentStatus: "pending",
    stockReservationStatus: "reserved",
    status: "pending",
    notes: checkoutSession.notes,
    statusHistory: [{ status: "pending", updatedAt: new Date() }],
  });

  let stockConfirmed = true;
  try {
    await reserveOrderStock(order._id.toString());
    await confirmReservedOrderStock(order._id.toString());
  } catch (stockError) {
    stockConfirmed = false;
    console.error("SSLCommerz success stock confirmation error:", stockError);
    try {
      await releaseReservedOrderStock(order._id.toString());
    } catch (releaseError) {
      console.error("SSLCommerz success stock release error:", releaseError);
    }
  }

  order.paymentStatus = "paid";
  order.status = stockConfirmed ? "confirmed" : "pending";
  if (!stockConfirmed) {
    order.stockReservationStatus = "released";
  }
  order.paymentDetails = {
    transactionId: validation.tran_id,
    bankTransactionId: validation.bank_tran_id,
    cardType: validation.card_type,
    cardBrand: validation.card_brand,
    validationId: val_id,
  };
  order.statusHistory.push({
    status: stockConfirmed ? "confirmed" : "pending",
    note: stockConfirmed
      ? "Payment received via SSLCommerz"
      : "Payment received via SSLCommerz; stock confirmation failed and requires manual review",
    updatedAt: new Date(),
  });
  await order.save();

  checkoutSession.status = "paid";
  checkoutSession.validationId = val_id;
  checkoutSession.createdOrder = order._id;
  await checkoutSession.save();

  try {
    await Cart.findOneAndDelete({ user: checkoutSession.user });
    if (checkoutSession.cartSessionId) {
      await Cart.findOneAndDelete({ sessionId: checkoutSession.cartSessionId });
    }
  } catch (cartCleanupError) {
    // Order and payment are already persisted; avoid converting to processing-error.
    console.error("SSLCommerz cart cleanup error:", cartCleanupError);
  }

  try {
    const user = await User.findById(order.user);
    if (user) {
      await sendOrderStatusUpdateEmail(
        user.email,
        user.name,
        order.orderNumber,
        stockConfirmed ? "confirmed" : "pending",
      );

      await notifyAdminsPaidOrder(order, user.name);
    } else {
      await notifyAdminsPaidOrder(
        order,
        order.shippingAddress?.name || "Customer",
      );
    }
  } catch (emailError) {
    // Do not fail payment confirmation when email delivery fails.
    console.error("SSLCommerz status email error:", emailError);
  }

  return NextResponse.redirect(
    new URL(
      stockConfirmed
        ? `/account/orders?paid=${order.orderNumber}`
        : `/account/orders?paid=${order.orderNumber}&stock=review`,
      baseUrl,
    ),
  );
}

export async function POST(request: NextRequest) {
  try {
    return await handleSuccess(request);
  } catch (error) {
    console.error("SSLCommerz success error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/account/orders?payment=processing-error`, baseUrl),
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handleSuccess(request);
  } catch (error) {
    console.error("SSLCommerz success GET error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/account/orders?payment=processing-error`, baseUrl),
    );
  }
}
