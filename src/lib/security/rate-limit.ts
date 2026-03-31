import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "anonymous"
  );
}

export function checkRateLimit(
  request: NextRequest,
  namespace: string,
  options: RateLimitOptions,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const identifier = getClientIdentifier(request);
  const key = `${namespace}:${identifier}`;

  const existing = memoryStore.get(key);
  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitExceededResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
