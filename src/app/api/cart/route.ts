import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Cart, Product } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { addToCartSchema } from "@/lib/validations";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

// Helper to get or create session ID for guest users
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cartSessionId")?.value;

  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set("cartSessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
  }

  return sessionId;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getAuthFromRequest(request);

    let cart;
    if (user) {
      cart = await Cart.findOne({ user: user.userId }).populate(
        "items.product",
      );
    } else {
      const sessionId = await getSessionId();
      cart = await Cart.findOne({ sessionId }).populate("items.product");
    }

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { items: [] },
      });
    }

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validationResult = addToCartSchema.safeParse(body);

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

    const { productId, variant, quantity } = validationResult.data;

    // Verify product and variant exist
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const productVariant = product.variants.find((v) => v.sku === variant.sku);
    if (!productVariant) {
      return NextResponse.json(
        { success: false, error: "Product variant not found" },
        { status: 404 },
      );
    }

    // Check stock
    if (productVariant.stock < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 },
      );
    }

    const user = await getAuthFromRequest(request);
    const price =
      productVariant.price || product.salePrice || product.basePrice;

    let cart;
    if (user) {
      cart = await Cart.findOne({ user: user.userId });
    } else {
      const sessionId = await getSessionId();
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      // Create new cart
      cart = new Cart({
        ...(user ? { user: user.userId } : { sessionId: await getSessionId() }),
        items: [{ product: productId, variant, quantity, price }],
      });
    } else {
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.variant.sku === variant.sku,
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;

        // Check stock again
        if (cart.items[existingItemIndex].quantity > productVariant.stock) {
          return NextResponse.json(
            { success: false, error: "Insufficient stock" },
            { status: 400 },
          );
        }
      } else {
        // Add new item
        cart.items.push({ product: productId, variant, quantity, price });
      }
    }

    await cart.save();
    await cart.populate("items.product");

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const user = await getAuthFromRequest(request);

    if (user) {
      await Cart.findOneAndDelete({ user: user.userId });
    } else {
      const sessionId = await getSessionId();
      await Cart.findOneAndDelete({ sessionId });
    }

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 },
    );
  }
}
