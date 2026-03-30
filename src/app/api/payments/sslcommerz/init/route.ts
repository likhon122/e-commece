import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { initSSLCommerz } from "@/lib/payments/sslcommerz";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();
    const { orderId } = body;

    const order = await Order.findOne({
      _id: orderId,
      user: user.userId,
      paymentMethod: "sslcommerz",
      paymentStatus: "pending",
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or already paid" },
        { status: 404 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const response = await initSSLCommerz({
      total_amount: order.total,
      currency: "BDT",
      tran_id: order.orderNumber,
      success_url: `${baseUrl}/api/payments/sslcommerz/success`,
      fail_url: `${baseUrl}/api/payments/sslcommerz/fail`,
      cancel_url: `${baseUrl}/api/payments/sslcommerz/cancel`,
      ipn_url: `${baseUrl}/api/payments/sslcommerz/ipn`,
      cus_name: order.shippingAddress.name,
      cus_email: user.email,
      cus_phone: order.shippingAddress.phone,
      cus_add1: order.shippingAddress.street,
      cus_city: order.shippingAddress.city,
      cus_postcode: order.shippingAddress.postalCode,
      cus_country: order.shippingAddress.country,
      shipping_method: "Courier",
      num_of_item: order.items.length,
      product_name: "Mythium Order",
      product_category: "Clothing",
      product_profile: "physical-goods",
    });

    if (!response || response.status !== "SUCCESS") {
      return NextResponse.json(
        { success: false, error: "Failed to initialize payment" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gatewayUrl: response.GatewayPageURL,
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
