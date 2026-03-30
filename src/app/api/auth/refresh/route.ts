import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get("refreshToken")?.value;

    if (!refreshTokenCookie) {
      return NextResponse.json(
        { success: false, error: "Refresh token not found" },
        { status: 401 },
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshTokenCookie);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    await connectDB();

    // Find user and verify refresh token matches
    const user = await User.findById(payload.userId).select("+refreshToken");
    if (!user || user.refreshToken !== refreshTokenCookie) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Save new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookies
    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while refreshing tokens" },
      { status: 500 },
    );
  }
}
