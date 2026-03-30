import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/connection";
import { Product, User } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { authOptions } from "@/lib/auth/auth-options";

const PRODUCT_SELECT_FIELDS =
  "name slug basePrice salePrice images variants ratings category subcategory isNew isFeatured isActive createdAt";

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const [tokenUser, session] = await Promise.all([
    getAuthFromRequest(request),
    getServerSession(authOptions),
  ]);

  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  return tokenUser?.userId || sessionUserId || null;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUserId(request);

    if (userId) {
      const user = await User.findById(userId)
        .populate({
          path: "wishlist",
          match: { isActive: true },
          select: PRODUCT_SELECT_FIELDS,
          populate: [
            { path: "category", select: "name slug" },
            { path: "subcategory", select: "name slug" },
          ],
          options: { sort: { createdAt: -1 } },
        })
        .lean();

      const products = (user?.wishlist || []).map((item: any) => ({
        ...item,
        _id: item._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        data: products,
      });
    }

    const { searchParams } = new URL(request.url);
    const ids = (searchParams.get("ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!ids.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const products = await Product.find({
      _id: { $in: ids },
      isActive: true,
    })
      .select(PRODUCT_SELECT_FIELDS)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    const order = new Map(ids.map((id, index) => [id, index]));
    const orderedProducts = products
      .map((item: any) => ({ ...item, _id: item._id.toString() }))
      .sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));

    return NextResponse.json({
      success: true,
      data: orderedProducts,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    const product = await Product.findOne({ _id: productId, isActive: true }).select("_id");
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: product._id },
    });

    return NextResponse.json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Add wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add product to wishlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = (searchParams.get("productId") || "").trim();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove product from wishlist" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const ids = Array.isArray(body?.productIds)
      ? body.productIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (!ids.length) {
      return NextResponse.json({
        success: true,
        message: "Wishlist sync skipped",
      });
    }

    const products = await Product.find({
      _id: { $in: ids },
      isActive: true,
    }).select("_id");

    if (products.length) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { wishlist: { $each: products.map((item) => item._id) } },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Wishlist synced successfully",
    });
  } catch (error) {
    console.error("Sync wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync wishlist" },
      { status: 500 },
    );
  }
}
