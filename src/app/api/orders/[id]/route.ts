import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const { id } = await params;

    // Find by order ID or order number
    const order = await Order.findOne({
      $or: [{ _id: id }, { orderNumber: id }],
      user: user.userId,
    }).populate("items.product", "name slug images");

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
