import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { User, PendingUser } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing verification token" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find pending user with valid token
    const pendingUser = await PendingUser.findOne({
      verificationToken: token,
      verificationExpiry: { $gt: new Date() },
    });

    if (!pendingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification link. Please register again.",
        },
        { status: 400 },
      );
    }

    // Check if user already exists (edge case)
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return NextResponse.json(
        {
          success: false,
          error: "This email is already verified. Please login.",
        },
        { status: 400 },
      );
    }

    // Create verified user in main collection
    const user = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed
      isVerified: true,
      provider: "credentials",
      role: "user",
    });

    // Skip password hashing since it's already hashed
    user.$locals.skipPasswordHash = true;
    await user.save();

    // Delete pending user record
    await PendingUser.deleteOne({ _id: pendingUser._id });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
