import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Category, Product } from "@/lib/db/models";
import { hasAdminAccess } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validations";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await connectDB();

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Admin get product error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await connectDB();

    const body = await request.json();
    const validationResult = updateProductSchema.safeParse(body);

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

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const updates = validationResult.data;
    const previousCategory = String(product.category);

    if (updates.category) {
      const category = await Category.findById(updates.category);
      if (!category) {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 400 },
        );
      }
    }

    if (updates.name !== undefined) product.name = updates.name;
    if (updates.description !== undefined)
      product.description = updates.description;
    if (updates.shortDescription !== undefined)
      product.shortDescription = updates.shortDescription;
    if (updates.category !== undefined)
      product.set("category", updates.category);
    if (updates.subcategory !== undefined)
      product.set("subcategory", updates.subcategory || null);
    if (updates.brand !== undefined) product.brand = updates.brand;
    if (updates.basePrice !== undefined) product.basePrice = updates.basePrice;
    if (updates.salePrice !== undefined) product.salePrice = updates.salePrice;
    if (updates.images !== undefined) product.images = updates.images;
    if (updates.video !== undefined) product.video = updates.video;
    if (updates.variants !== undefined) product.variants = updates.variants;
    if (updates.specifications !== undefined)
      product.specifications = updates.specifications;
    if (updates.tags !== undefined) product.tags = updates.tags;
    if (updates.seoTitle !== undefined) product.seoTitle = updates.seoTitle;
    if (updates.seoDescription !== undefined)
      product.seoDescription = updates.seoDescription;
    if (updates.seoKeywords !== undefined)
      product.seoKeywords = updates.seoKeywords;
    if (updates.isActive !== undefined) product.isActive = updates.isActive;
    if (updates.isFeatured !== undefined)
      product.isFeatured = updates.isFeatured;
    if (updates.isNew !== undefined) product.isNew = updates.isNew;

    await product.save();

    const nextCategory = String(product.category);
    if (previousCategory !== nextCategory) {
      await Promise.all([
        Category.findByIdAndUpdate(previousCategory, {
          $inc: { productCount: -1 },
        }),
        Category.findByIdAndUpdate(nextCategory, { $inc: { productCount: 1 } }),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Admin update product error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 },
    );
  }
}
