import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { CheckoutSession, Order } from "@/lib/db/models";
import { getCallbackBaseUrl } from "@/lib/payments/base-url";
import { verifySSLCommerzCallbackSignature } from "@/lib/payments/signature";
import { releaseReservedOrderStock } from "@/lib/orders/inventory";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

async function handleFail(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "payment:sslcommerz:fail", {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  const data =
    request.method === "GET"
      ? Object.fromEntries(request.nextUrl.searchParams.entries())
      : Object.fromEntries((await request.formData()).entries());
  const payload = data as Record<string, unknown>;
  const tran_id = data.tran_id as string;

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
          note: "SSLCommerz payment failed",
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
        checkoutSession.status = "failed";
        await checkoutSession.save();
      }
    } catch (error) {
      console.error("SSLCommerz fail callback error:", error);
    }
  }

  return NextResponse.redirect(
    new URL(`/account/orders?payment=failed&order=${tran_id || "unknown"}`, baseUrl),
  );
}

export async function POST(request: NextRequest) {
  return handleFail(request);
}

export async function GET(request: NextRequest) {
  return handleFail(request);
}
