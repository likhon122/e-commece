import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/db/connection";
import { Order, Cart, User, CheckoutSession } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { sendAdminOrderAlertEmail, sendOrderConfirmationEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";
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

    if (!mongoose.Types.ObjectId.isValid(authUser.userId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication session is invalid. Please sign out, sign in again, then retry checkout.",
        },
        { status: 401 },
      );
    }

    const authUserObjectId = new mongoose.Types.ObjectId(authUser.userId);

    await connectDB();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

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

    const { shippingAddress, billingAddress, paymentMethod, notes, items: directItems } =
      validationResult.data;

    // Get user's cart
    let cart = await Cart.findOne({ user: authUserObjectId }).populate("items.product");

    // Fallback to session ID if cart is empty or not found for user
    if (!cart || cart.items.length === 0) {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get("cartSessionId")?.value;
      if (sessionId) {
        cart = await Cart.findOne({ sessionId }).populate("items.product");
      }
    }

    let cartItems = cart?.items || [];
    if (cartItems.length === 0 && directItems && directItems.length > 0) {
      // Use direct items from frontend payload
      cartItems = directItems;
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 },
      );
    }

    let orderItems;
    let subtotal;
    try {
      const orderBuildResult = await validateAndBuildOrderItemsFromCart(cartItems);
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

    if (paymentMethod === "sslcommerz") {
      const cookieStore = await cookies();
      const cartSessionId = cookieStore.get("cartSessionId")?.value;

      let checkoutSession;
      try {
        checkoutSession = await CheckoutSession.create({
          user: authUserObjectId,
          cartSessionId,
          paymentMethod: "sslcommerz",
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          notes,
          items: orderItems.map((item) => ({
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
          })),
          subtotal,
          shippingCost,
          tax,
          discount,
          total,
          status: "pending",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
      } catch (checkoutSessionError) {
        console.error("Checkout session create error:", checkoutSessionError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create checkout session. Please retry.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Checkout session created successfully",
        data: {
          checkoutSession: {
            _id: checkoutSession._id,
            total: checkoutSession.total,
            paymentMethod: checkoutSession.paymentMethod,
            status: checkoutSession.status,
          },
        },
      });
    }

    // Create order
    let order;
    try {
      order = await Order.create({
        user: authUserObjectId,
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
    } catch (orderCreateError) {
      console.error("Order create db error:", orderCreateError);
      return NextResponse.json(
        { success: false, error: "Failed to persist order. Please retry." },
        { status: 500 },
      );
    }

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

    // Clear cart if it exists in DB
    if (cart && cart._id) {
      await Cart.findByIdAndDelete(cart._id);
    }

    // Get user for email
    const user = await User.findById(authUserObjectId);

    try {
      const adminRecipients = await notifyAllAdmins({
        type: "order-created",
        title: `New order ${order.orderNumber}`,
        message: `Customer ${
          user?.name || shippingAddress.name
        } placed an order worth ৳${Number(order.total || 0).toLocaleString()}.`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        metadata: {
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          total: order.total,
        },
      });

      const offlineAdmins = adminRecipients.filter((admin) => !admin.online);
      await Promise.all(
        offlineAdmins.map((admin) =>
          sendAdminOrderAlertEmail(
            admin.email,
            "Admin",
            order.orderNumber,
            user?.name || shippingAddress.name,
            Number(order.total || 0),
            order.paymentMethod,
            order.paymentStatus,
          ),
        ),
      );
    } catch (notifyError) {
      console.error("Admin new-order notification error:", notifyError);
    }

    // Send confirmation email
    if (user) {
      try {
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
      } catch (emailError) {
        // Do not fail checkout when email provider is down.
        console.error("Order confirmation email error:", emailError);
      }
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
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Cast to ObjectId")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication session is invalid. Please sign out, sign in again, then retry checkout.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 },
    );
  }
}
