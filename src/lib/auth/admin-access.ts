import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { getAuthFromRequest } from "./jwt";
import { authOptions } from "./auth-options";

export async function hasAdminAccess(request: NextRequest): Promise<boolean> {
  const [tokenUser, session] = await Promise.all([
    getAuthFromRequest(request),
    getServerSession(authOptions),
  ]);

  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  return tokenUser?.role === "admin" || sessionRole === "admin";
}
