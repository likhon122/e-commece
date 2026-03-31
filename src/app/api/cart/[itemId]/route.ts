import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Cart, Product } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { updateCartItemSchema } from "@/lib/validations";
import { cookies } from "next/headers";
import { getAvailableStock } from "@/lib/orders/inventory";

async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("cartSessionId")?.value;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await connectDB();

    const { itemId } = await params;
    const body = await request.json();

    const validationResult = updateCartItemSchema.safeParse(body);
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

    const { quantity } = validationResult.data;
    const user = await getAuthFromRequest(request);

    let cart;
    if (user) {
      cart = await Cart.findOne({ user: user.userId });
    } else {
      const sessionId = await getSessionId();
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: "Cart not found" },
          { status: 404 },
        );
      }
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id.toString() === itemId,
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 },
      );
    }

    // Check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    const variant = product?.variants.find(
      (v) => v.sku === cart.items[itemIndex].variant.sku,
    );

    if (!variant || getAvailableStock(variant) < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 },
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate("items.product");

    return NextResponse.json({
      success: true,
      message: "Cart updated",
      data: cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await connectDB();

    const { itemId } = await params;
    const user = await getAuthFromRequest(request);

    let cart;
    if (user) {
      cart = await Cart.findOne({ user: user.userId });
    } else {
      const sessionId = await getSessionId();
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: "Cart not found" },
          { status: 404 },
        );
      }
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    cart.items = cart.items.filter(
      (item: any) => item._id.toString() !== itemId,
    );
    await cart.save();
    await cart.populate("items.product");

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove cart item" },
      { status: 500 },
    );
  }
}
