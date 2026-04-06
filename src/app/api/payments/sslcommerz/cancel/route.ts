import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { CheckoutSession, Order } from "@/lib/db/models";
import { getCallbackBaseUrl } from "@/lib/payments/base-url";
import { verifySSLCommerzCallbackSignature } from "@/lib/payments/signature";
import { readPaymentCallbackPayload } from "@/lib/payments/callback-payload";
import { releaseReservedOrderStock } from "@/lib/orders/inventory";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

async function handleCancel(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "payment:sslcommerz:cancel", {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  const data = await readPaymentCallbackPayload(request);
  const payload = data as Record<string, unknown>;
  const tran_id = String(data.tran_id || "");

  const baseUrl = getCallbackBaseUrl(request);

  const hasSignatureFields =
    typeof payload.verify_sign === "string" &&
    typeof payload.verify_key === "string";
  if (hasSignatureFields && !verifySSLCommerzCallbackSignature(payload)) {
    return NextResponse.redirect(
      new URL(`/account/orders?payment=invalid-signature`, baseUrl),
    );
  }

  if (tran_id) {
    try {
      await connectDB();
      const order = await Order.findOne({
        orderNumber: tran_id,
        paymentMethod: "sslcommerz",
      });

      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        order.statusHistory.push({
          status: order.status,
          note: "SSLCommerz payment cancelled by user",
          updatedAt: new Date(),
        });
        await order.save();
        await releaseReservedOrderStock(order._id.toString());
      }

      const checkoutSession = await CheckoutSession.findOne({
        gatewayTransactionId: tran_id,
        paymentMethod: "sslcommerz",
      });
      if (checkoutSession && checkoutSession.status === "pending") {
        checkoutSession.status = "cancelled";
        await checkoutSession.save();
      }
    } catch (error) {
      console.error("SSLCommerz cancel callback error:", error);
    }
  }

  return NextResponse.redirect(
    new URL(`/account/orders?payment=cancelled&order=${tran_id || "unknown"}`, baseUrl),
  );
}

export async function POST(request: NextRequest) {
  return handleCancel(request);
}

export async function GET(request: NextRequest) {
  return handleCancel(request);
}
