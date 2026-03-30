import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, JWTPayload } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

type RouteHandler = (
  request: AuthenticatedRequest,
  context?: { params: Record<string, string> },
) => Promise<NextResponse>;

export function withAuth(
  handler: RouteHandler,
  requireAdmin: boolean = false,
): RouteHandler {
  return async (request: AuthenticatedRequest, context) => {
    try {
      const user = await getAuthFromRequest(request);

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 },
        );
      }

      if (requireAdmin && user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 },
        );
      }

      request.user = user;
      return handler(request, context);
    } catch {
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 },
      );
    }
  };
}

export function withOptionalAuth(handler: RouteHandler): RouteHandler {
  return async (request: AuthenticatedRequest, context) => {
    try {
      const user = await getAuthFromRequest(request);
      if (user) {
        request.user = user;
      }
      return handler(request, context);
    } catch {
      // Continue without auth
      return handler(request, context);
    }
  };
}
