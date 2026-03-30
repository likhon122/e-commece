import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { User, PendingUser } from "@/lib/db/models";
import { registerSchema } from "@/lib/validations";
import { generateRandomToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = validationResult.data;
    const emailLower = email.toLowerCase();

    // Check if user already exists in main collection
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Check if there's already a pending registration
    const existingPending = await PendingUser.findOne({ email: emailLower });
    if (existingPending) {
      // Delete old pending registration and create new one
      await PendingUser.deleteOne({ email: emailLower });
    }

    // Generate verification token
    const verificationToken = generateRandomToken(32);
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create pending user (not added to main User collection yet)
    await PendingUser.create({
      name,
      email: emailLower,
      password, // Will be hashed by pre-save hook
      verificationToken,
      verificationExpiry,
    });

    // Resolve app URL for verification links
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host =
      forwardedHost || request.headers.get("host") || request.nextUrl.host;
    const protocol =
      forwardedProto || request.nextUrl.protocol.replace(":", "") || "http";
    const requestAppUrl = host ? `${protocol}://${host}` : undefined;

    // Send verification email
    const emailSent = await sendVerificationEmail(
      emailLower,
      name,
      verificationToken,
      requestAppUrl,
    );

    if (!emailSent) {
      // Clean up pending user if email fails
      await PendingUser.deleteOne({ email: emailLower });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send verification email. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Verification email sent! Please check your inbox and click the link to complete registration.",
        requiresVerification: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
