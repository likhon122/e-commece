import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Category } from "@/lib/db/models";
import { hasAdminAccess } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    await connectDB();

    const categories = await Category.find({})
      .select("name slug description image parent isActive sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Admin categories get error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    await connectDB();

    const body = await request.json();
    const validationResult = createCategorySchema.safeParse(body);

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

    const categoryData = validationResult.data;

    const normalizedParent =
      categoryData.parent && categoryData.parent.trim() !== ""
        ? categoryData.parent
        : null;

    if (normalizedParent) {
      const parentCategory = await Category.findById(normalizedParent);
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: "Parent category not found" },
          { status: 400 },
        );
      }
    }

    const existing = await Category.findOne({
      name: { $regex: `^${categoryData.name}$`, $options: "i" },
      parent: normalizedParent,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Category with same name already exists" },
        { status: 400 },
      );
    }

    const category = await Category.create({
      ...categoryData,
      parent: normalizedParent,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: category,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin categories create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 },
    );
  }
}
