import { NextRequest } from "next/server";

function isLocalhostUrl(url: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url.trim());
}

export function getCallbackBaseUrl(request: NextRequest): string {
  const candidates = [
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((value): value is string => Boolean(value));

  const firstNonLocalhost = candidates.find((value) => !isLocalhostUrl(value));
  const selected = firstNonLocalhost || request.nextUrl.origin;

  return selected.replace(/\/$/, "");
}
