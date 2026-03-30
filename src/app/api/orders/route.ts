import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db/connection";
import { Order, Cart, User } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";
import {
  calculateOrderTotals,
  confirmReservedOrderStock,
  reserveOrderStock,
  validateAndBuildOrderItemsFromCart,
} from "@/lib/orders/inventory";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = { user: user.userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required: please log in again. If you used Google or NextAuth login, refresh session and retry checkout.",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();
    const validationResult = createOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { shippingAddress, billingAddress, paymentMethod, notes } =
      validationResult.data;

    // Get user's cart
    let cart = await Cart.findOne({ user: authUser.userId }).populate("items.product");

    // Fallback to session ID if cart is empty or not found for user
    if (!cart || cart.items.length === 0) {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get("cartSessionId")?.value;
      if (sessionId) {
        cart = await Cart.findOne({ sessionId }).populate("items.product");
      }
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 },
      );
    }

    let orderItems;
    let subtotal;
    try {
      const orderBuildResult = await validateAndBuildOrderItemsFromCart(cart.items);
      orderItems = orderBuildResult.orderItems;
      subtotal = orderBuildResult.subtotal;
    } catch (stockError) {
      return NextResponse.json(
        {
          success: false,
          error:
            stockError instanceof Error
              ? stockError.message
              : "Unable to validate stock",
        },
        { status: 400 },
      );
    }

    const { shippingCost, tax, discount, total } = calculateOrderTotals(subtotal);

    // Create order
    const order = await Order.create({
      user: authUser.userId,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      stockReservationStatus: "reserved",
      status: "pending",
      notes,
      statusHistory: [{ status: "pending", updatedAt: new Date() }],
    });

    try {
      await reserveOrderStock(order._id.toString());

      // COD has no payment callback; confirm reservation immediately after reserve.
      if (paymentMethod === "cod") {
        await confirmReservedOrderStock(order._id.toString());
      }
    } catch (reservationError) {
      await Order.findByIdAndDelete(order._id);
      return NextResponse.json(
        {
          success: false,
          error:
            reservationError instanceof Error
              ? reservationError.message
              : "Unable to reserve stock",
        },
        { status: 409 },
      );
    }

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    // Get user for email
    const user = await User.findById(authUser.userId);

    // Send confirmation email
    if (user) {
      await sendOrderConfirmationEmail(
        user.email,
        user.name,
        order.orderNumber,
        {
          items: orderItems.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.total,
          })),
          subtotal,
          shipping: shippingCost,
          total,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          paymentMethod: order.paymentMethod,
          status: order.status,
        },
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 },
    );
  }
}
