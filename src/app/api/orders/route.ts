import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order, Cart, Product, User } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
        { success: false, error: "Authentication required" },
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
    const cart = await Cart.findOne({ user: authUser.userId }).populate(
      "items.product",
    );

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 },
      );
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product || !product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `Product not found: ${item.product.name || "Unknown"}`,
          },
          { status: 400 },
        );
      }

      const variant = product.variants.find((v) => v.sku === item.variant.sku);
      if (!variant) {
        return NextResponse.json(
          { success: false, error: `Variant not found for ${product.name}` },
          { status: 400 },
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 },
        );
      }

      const price = variant.price || product.salePrice || product.basePrice;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images[0]?.url || "",
        variant: {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorCode: variant.colorCode,
        },
        quantity: item.quantity,
        price,
        total: itemTotal,
      });

      // Decrease stock
      variant.stock -= item.quantity;
      product.soldCount += item.quantity;
      await product.save();
    }

    // Calculate totals
    const shippingCost = subtotal >= 5000 ? 0 : 100; // Free shipping over 5000 BDT
    const tax = 0; // No tax calculation for now
    const discount = 0;
    const total = subtotal + shippingCost + tax - discount;

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
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      status: "pending",
      notes,
      statusHistory: [{ status: "pending", updatedAt: new Date() }],
    });

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
