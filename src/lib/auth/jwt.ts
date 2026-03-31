import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export async function generateAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const cookieStore = await cookies();

  // Access token cookie
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  // Refresh token cookie
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

export async function getAuthFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  return verifyAccessToken(accessToken);
}

export async function getAuthFromRequest(
  request: NextRequest,
): Promise<JWTPayload | null> {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyAccessToken(token);
  }

  // Fallback to cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  if (accessToken) {
    const verified = await verifyAccessToken(accessToken);
    if (verified) {
      return verified;
    }
  }

  // Fallback to NextAuth JWT session token
  try {
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (nextAuthToken?.id && nextAuthToken.email) {
      return {
        userId: String(nextAuthToken.id),
        email: String(nextAuthToken.email),
        role:
          nextAuthToken.role === "admin"
            ? "admin"
            : "user",
      };
    }
  } catch {
    // Ignore NextAuth parse errors and return null below.
  }

  return null;
}

export function generateRandomToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
