import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { CheckoutSession } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { initSSLCommerz } from "@/lib/payments/sslcommerz";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, "payment:sslcommerz:init", {
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
    const { checkoutSessionId } = body;

    const checkoutSession = await CheckoutSession.findOne({
      _id: checkoutSessionId,
      user: user.userId,
      paymentMethod: "sslcommerz",
      status: "pending",
    });

    if (!checkoutSession) {
      return NextResponse.json(
        { success: false, error: "Checkout session not found or already processed" },
        { status: 404 },
      );
    }

    if (checkoutSession.expiresAt < new Date()) {
      checkoutSession.status = "cancelled";
      await checkoutSession.save();
      return NextResponse.json(
        { success: false, error: "Checkout session expired. Please retry checkout." },
        { status: 410 },
      );
    }

    const transactionId = `MTH-CS-${checkoutSession._id.toString()}`;
    checkoutSession.gatewayTransactionId = transactionId;
    await checkoutSession.save();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const response = await initSSLCommerz({
      total_amount: checkoutSession.total,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${baseUrl}/api/payments/sslcommerz/success`,
      fail_url: `${baseUrl}/api/payments/sslcommerz/fail`,
      cancel_url: `${baseUrl}/api/payments/sslcommerz/cancel`,
      ipn_url: `${baseUrl}/api/payments/sslcommerz/ipn`,
      cus_name: checkoutSession.shippingAddress.name,
      cus_email: user.email,
      cus_phone: checkoutSession.shippingAddress.phone,
      cus_add1: checkoutSession.shippingAddress.street,
      cus_city: checkoutSession.shippingAddress.city,
      cus_postcode: checkoutSession.shippingAddress.postalCode,
      cus_country: checkoutSession.shippingAddress.country,
      ship_name: checkoutSession.shippingAddress.name,
      ship_add1: checkoutSession.shippingAddress.street,
      ship_city: checkoutSession.shippingAddress.city,
      ship_postcode: checkoutSession.shippingAddress.postalCode,
      ship_country: checkoutSession.shippingAddress.country,
      shipping_method: "Courier",
      num_of_item: checkoutSession.items.length,
      product_name: "Mythium Order",
      product_category: "Clothing",
      product_profile: "physical-goods",
    });

    if (!response) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to initialize payment: no response from SSLCommerz. Check SSLCOMMERZ credentials and network connectivity.",
        },
        { status: 502 },
      );
    }

    const paymentStatus = String(response.status || "").toUpperCase();
    const gatewayUrl =
      response.GatewayPageURL ||
      response.gatewayPageURL ||
      response.redirectGatewayURL ||
      response.directPaymentURL ||
      response.directPaymentURLCard ||
      response.directPaymentURLBank;

    if (paymentStatus !== "SUCCESS" || !gatewayUrl) {
      const providerMessage =
        response.failedreason ||
        response.failedReason ||
        response.error ||
        (Array.isArray(response.desc) ? response.desc.join(", ") : undefined);

      return NextResponse.json(
        {
          success: false,
          error:
            providerMessage ||
            "Failed to initialize payment: SSLCommerz did not return a valid payment URL.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gatewayUrl,
        sessionKey: response.sessionkey,
      },
    });
  } catch (error) {
    console.error("SSLCommerz init error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 },
    );
  }
}
