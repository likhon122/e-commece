import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";

type AuthUser = {
  userId: string;
  role: "user" | "admin";
};

const accessTokenSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

const protectedPagePrefixes = ["/account", "/checkout"];
const adminPagePrefixes = ["/admin"];

const protectedApiPrefixes = ["/api/cart", "/api/orders", "/api/notifications", "/api/account"];
const adminApiPrefixes = ["/api/admin"];

function pathMatches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const accessToken = request.cookies.get("accessToken")?.value;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, accessTokenSecret);
      const userId = typeof payload.userId === "string" ? payload.userId : "";
      const role = payload.role === "admin" ? "admin" : "user";

      if (userId) {
        return { userId, role };
      }
    } catch {
      // Fall back to NextAuth token.
    }
  }

  try {
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (nextAuthToken?.id) {
      return {
        userId: String(nextAuthToken.id),
        role: nextAuthToken.role === "admin" ? "admin" : "user",
      };
    }
  } catch {
    // No active auth token.
  }

  return null;
}

function jsonAuthError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const needsPageAuth = pathMatches(pathname, protectedPagePrefixes);
  const needsPageAdmin = pathMatches(pathname, adminPagePrefixes);
  const needsApiAuth = pathMatches(pathname, protectedApiPrefixes);
  const needsApiAdmin = pathMatches(pathname, adminApiPrefixes);

  const needsAuth = needsPageAuth || needsPageAdmin || needsApiAuth || needsApiAdmin;
  const needsAdmin = needsPageAdmin || needsApiAdmin;

  if (!needsAuth) {
    return NextResponse.next();
  }

  const authUser = await getAuthUser(request);

  if (!authUser) {
    if (pathname.startsWith("/api/")) {
      return jsonAuthError("Authentication required", 401);
    }

    const redirectUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  if (needsAdmin && authUser.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return jsonAuthError("Admin access required", 403);
    }

    return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/api/cart/:path*",
    "/api/orders/:path*",
    "/api/notifications/:path*",
    "/api/account/:path*",
    "/api/admin/:path*",
  ],
};
