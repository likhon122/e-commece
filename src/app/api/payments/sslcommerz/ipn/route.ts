import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Cart, CheckoutSession, Order } from "@/lib/db/models";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { verifySSLCommerzCallbackSignature } from "@/lib/payments/signature";
import { readPaymentCallbackPayload } from "@/lib/payments/callback-payload";
import {
  buildOrderItemsFromCheckoutSession,
  confirmReservedOrderStock,
  releaseReservedOrderStock,
  reserveOrderStock,
} from "@/lib/orders/inventory";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

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

async function handleIpn(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, "payment:sslcommerz:ipn", {
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfterSec);
    }

    await connectDB();

    const payload = await getPayload(request);
    const { tran_id, val_id } = payload as Record<string, string>;
    const status = String(payload.status || "").toUpperCase();

    if (
      !tran_id ||
      !val_id ||
      (status !== "VALID" && status !== "VALIDATED" && status !== "SUCCESS")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid IPN payload" },
        { status: 400 },
      );
    }

    const hasSignatureFields =
      typeof payload.verify_sign === "string" &&
      typeof payload.verify_key === "string";
    if (hasSignatureFields && !verifySSLCommerzCallbackSignature(payload)) {
      // Do not hard-fail here; we still perform authoritative server-side validation via val_id.
      console.warn(
        "SSLCommerz IPN signature mismatch; continuing with val_id verification",
      );
    }

    const validation = await validateSSLCommerzPayment(val_id);
    if (
      !validation ||
      (validation.status !== "VALID" && validation.status !== "VALIDATED") ||
      validation.tran_id !== tran_id
    ) {
      return NextResponse.json(
        { success: false, error: "Payment validation failed" },
        { status: 400 },
      );
    }

    const checkoutSession = await CheckoutSession.findOne({
      gatewayTransactionId: tran_id,
      paymentMethod: "sslcommerz",
    });

    if (checkoutSession) {
      if (checkoutSession.createdOrder) {
        return NextResponse.json({
          success: true,
          message: "Already processed",
        });
      }

      if (!isAmountMatch(checkoutSession.total, validation.amount)) {
        checkoutSession.status = "failed";
        checkoutSession.validationId = val_id;
        await checkoutSession.save();
        return NextResponse.json(
          { success: false, error: "Amount mismatch" },
          { status: 400 },
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
        billingAddress:
          checkoutSession.billingAddress || checkoutSession.shippingAddress,
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
        console.error("SSLCommerz IPN stock confirmation error:", stockError);
        try {
          await releaseReservedOrderStock(order._id.toString());
        } catch (releaseError) {
          console.error("SSLCommerz IPN stock release error:", releaseError);
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
          ? "Payment received via SSLCommerz IPN"
          : "Payment received via SSLCommerz IPN; stock confirmation failed and requires manual review",
        updatedAt: new Date(),
      });
      await order.save();

      checkoutSession.status = "paid";
      checkoutSession.validationId = val_id;
      checkoutSession.createdOrder = order._id;
      await checkoutSession.save();

      await Cart.findOneAndDelete({ user: checkoutSession.user });
      if (checkoutSession.cartSessionId) {
        await Cart.findOneAndDelete({
          sessionId: checkoutSession.cartSessionId,
        });
      }

      return NextResponse.json({
        success: true,
        message: stockConfirmed
          ? "Payment recorded"
          : "Payment recorded with stock review required",
      });
    }

    const order = await Order.findOne({
      orderNumber: tran_id,
      paymentMethod: "sslcommerz",
    });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (order.paymentStatus !== "pending") {
      return NextResponse.json(
        { success: false, error: "Order is not payable" },
        { status: 409 },
      );
    }

    if (!isAmountMatch(order.total, validation.amount)) {
      order.paymentStatus = "failed";
      order.statusHistory.push({
        status: order.status,
        note: "SSLCommerz IPN amount mismatch",
        updatedAt: new Date(),
      });
      await order.save();
      await releaseReservedOrderStock(order._id.toString());
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 },
      );
    }

    let stockConfirmed = true;
    try {
      await confirmReservedOrderStock(order._id.toString());
    } catch (stockError) {
      stockConfirmed = false;
      console.error("SSLCommerz IPN legacy stock confirmation error:", stockError);
      try {
        await releaseReservedOrderStock(order._id.toString());
      } catch (releaseError) {
        console.error("SSLCommerz IPN legacy stock release error:", releaseError);
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
        ? "Payment received via SSLCommerz IPN"
        : "Payment received via SSLCommerz IPN; stock confirmation failed and requires manual review",
      updatedAt: new Date(),
    });
    await order.save();

    return NextResponse.json({
      success: true,
      message: stockConfirmed
        ? "Payment recorded"
        : "Payment recorded with stock review required",
    });
  } catch (error) {
    console.error("SSLCommerz IPN error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handleIpn(request);
}

export async function GET(request: NextRequest) {
  return handleIpn(request);
}
