import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order, User } from "@/lib/db/models";
import { executeBkashPayment } from "@/lib/payments/bkash";
import { sendAdminOrderAlertEmail, sendOrderStatusUpdateEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";
import {
  confirmReservedOrderStock,
  releaseReservedOrderStock,
} from "@/lib/orders/inventory";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

function getBaseUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

function isAmountMatch(expected: number, received: string): boolean {
  const parsed = Number(received);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Math.abs(expected - parsed) < 0.01;
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
    console.error("bKash admin payment notification error:", notifyError);
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, "payment:bkash:callback", {
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfterSec);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get("paymentID");
    const status = searchParams.get("status");
    const baseUrl = getBaseUrl(request);

    if (status !== "success" || !paymentID) {
      if (paymentID) {
        const failedOrder = await Order.findOne({
          paymentMethod: "bkash",
          paymentStatus: "pending",
          "paymentDetails.transactionId": paymentID,
        });

        if (failedOrder) {
          failedOrder.paymentStatus = "failed";
          failedOrder.statusHistory.push({
            status: failedOrder.status,
            note: `bKash callback status: ${status || "unknown"}`,
            updatedAt: new Date(),
          });
          await failedOrder.save();
          await releaseReservedOrderStock(failedOrder._id.toString());
        }
      }

      return NextResponse.redirect(
        new URL(`/account/orders?payment=bkash-${status || "error"}`, baseUrl),
      );
    }

    // Execute the payment
    const execution = await executeBkashPayment(paymentID);

    if (
      !execution ||
      execution.statusCode !== "0000" ||
      execution.transactionStatus !== "Completed"
    ) {
      const failedOrder = await Order.findOne({
        paymentMethod: "bkash",
        paymentStatus: "pending",
        "paymentDetails.transactionId": paymentID,
      });

      if (failedOrder) {
        failedOrder.paymentStatus = "failed";
        failedOrder.statusHistory.push({
          status: failedOrder.status,
          note: "bKash payment execution failed",
          updatedAt: new Date(),
        });
        await failedOrder.save();
        await releaseReservedOrderStock(failedOrder._id.toString());
      }

      return NextResponse.redirect(
        new URL(`/account/orders?payment=bkash-execution-failed`, baseUrl),
      );
    }

    const orderNumber = execution.payerReference;
    if (!orderNumber) {
      return NextResponse.redirect(
        new URL(`/account/orders?payment=bkash-missing-reference`, baseUrl),
      );
    }

    const order = await Order.findOne({
      orderNumber,
      paymentMethod: "bkash",
      "paymentDetails.transactionId": paymentID,
    });

    if (!order) {
      return NextResponse.redirect(
        new URL(`/account/orders?payment=order-not-found`, baseUrl),
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.redirect(
        new URL(`/account/orders?paid=${order.orderNumber}`, baseUrl),
      );
    }

    if (order.paymentStatus !== "pending") {
      return NextResponse.redirect(
        new URL(`/account/orders?payment=invalid-order-state`, baseUrl),
      );
    }

    if (!isAmountMatch(order.total, execution.amount)) {
      order.paymentStatus = "failed";
      order.statusHistory.push({
        status: order.status,
        note: "bKash callback amount mismatch",
        updatedAt: new Date(),
      });
      await order.save();
      await releaseReservedOrderStock(order._id.toString());

      return NextResponse.redirect(
        new URL(`/account/orders?payment=amount-mismatch`, baseUrl),
      );
    }

    await confirmReservedOrderStock(order._id.toString());

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paymentDetails = {
      transactionId: execution.paymentID,
      bankTransactionId: execution.trxID,
      validationId: execution.merchantInvoiceNumber,
    };
    order.statusHistory.push({
      status: "confirmed",
      note: "Payment received via bKash",
      updatedAt: new Date(),
    });

    await order.save();

    // Send email notification
    const user = await User.findById(order.user);
    if (user) {
      await sendOrderStatusUpdateEmail(
        user.email,
        user.name,
        order.orderNumber,
        "confirmed",
      );

      await notifyAdminsPaidOrder(order, user.name);
    } else {
      await notifyAdminsPaidOrder(
        order,
        order.shippingAddress?.name || "Customer",
      );
    }

    return NextResponse.redirect(
      new URL(`/account/orders?paid=${order.orderNumber}`, baseUrl),
    );
  } catch (error) {
    console.error("bKash callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      new URL(`/account/orders?payment=processing-error`, baseUrl),
    );
  }
}
