import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Category, Product } from "@/lib/db/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();

    const { slug } = await params;

    const category = await Category.findOne({ slug, isActive: true }).populate(
      "children",
      "name slug image productCount",
    );

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({
      $or: [{ category: category._id }, { subcategory: category._id }],
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}
