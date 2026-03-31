import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { createBkashPayment } from "@/lib/payments/bkash";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, "payment:bkash:create", {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfterSec);
    }

    const user = await getAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required: session missing or expired. Please sign in and retry payment.",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();
    const { orderId } = body;

    const order = await Order.findOne({
      _id: orderId,
      user: user.userId,
      paymentMethod: "bkash",
      paymentStatus: "pending",
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or already paid" },
        { status: 404 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const response = await createBkashPayment({
      amount: order.total.toString(),
      payerReference: order.orderNumber,
      callbackURL: `${baseUrl}/api/payments/bkash/callback`,
      merchantInvoiceNumber: order.orderNumber,
    });

    if (!response || response.statusCode !== "0000") {
      return NextResponse.json(
        {
          success: false,
          error: response?.statusMessage || "Failed to create bKash payment",
        },
        { status: 500 },
      );
    }

    // Store payment ID
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId: response.paymentID,
      validationId: response.merchantInvoiceNumber,
    };
    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        bkashURL: response.bkashURL,
        paymentID: response.paymentID,
      },
    });
  } catch (error) {
    console.error("bKash create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bKash payment" },
      { status: 500 },
    );
  }
}
