import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Product, Category } from "@/lib/db/models";
import { hasAdminAccess } from "@/lib/auth";
import { createProductSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "out_of_stock") {
      query["variants.stock"] = { $lte: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
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
    const validationResult = createProductSchema.safeParse(body);

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

    const productData = validationResult.data;

    // Verify category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 400 },
      );
    }

    const product = await Product.create(productData);

    if (productData.video?.url && !product.video?.url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Video was uploaded but could not be attached to the product. Please retry with a different video format.",
        },
        { status: 500 },
      );
    }

    // Update category product count
    await Category.findByIdAndUpdate(productData.category, {
      $inc: { productCount: 1 },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin create product error:", error);

    if (error && typeof error === "object") {
      const maybeMongoError = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
        keyValue?: Record<string, unknown>;
        message?: string;
        name?: string;
        errors?: Record<string, { message?: string }>;
      };

      if (maybeMongoError.code === 11000) {
        const duplicateField = Object.keys(maybeMongoError.keyPattern || {})[0] || "field";
        const duplicateValue =
          maybeMongoError.keyValue && duplicateField in maybeMongoError.keyValue
            ? String(maybeMongoError.keyValue[duplicateField])
            : "value";

        return NextResponse.json(
          {
            success: false,
            error: `Duplicate ${duplicateField}: ${duplicateValue}. Please use a unique value.`,
          },
          { status: 409 },
        );
      }

      if (maybeMongoError.name === "ValidationError" && maybeMongoError.errors) {
        const validationMessages = Object.values(maybeMongoError.errors)
          .map((entry) => entry?.message)
          .filter(Boolean) as string[];

        return NextResponse.json(
          {
            success: false,
            error: validationMessages[0] || "Product validation failed",
            details: validationMessages,
          },
          { status: 400 },
        );
      }

      if (maybeMongoError.message) {
        return NextResponse.json(
          {
            success: false,
            error: maybeMongoError.message,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Unexpected server error while creating product" },
      { status: 500 },
    );
  }
}
