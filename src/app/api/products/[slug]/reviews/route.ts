import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Product } from "@/lib/db/models";
import { getAuthFromRequest } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const { slug } = await params;
    const body = await request.json();

    const validationResult = createReviewSchema.safeParse(body);
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

    const { rating, comment } = validationResult.data;

    const product = await Product.findOne({ slug, isActive: true });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === user.userId,
    );

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    // Add review
    product.reviews.push({
      user: user.userId as any,
      rating,
      comment,
      createdAt: new Date(),
    });

    // Update ratings
    const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = {
      average: Math.round((totalRatings / product.reviews.length) * 10) / 10,
      count: product.reviews.length,
    };

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Add review error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add review" },
      { status: 500 },
    );
  }
}
