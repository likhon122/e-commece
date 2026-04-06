import { NextRequest } from "next/server";

function parseJsonBody(rawBody: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawBody);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not JSON; handled by caller.
  }

  return {};
}

function parseUrlEncodedBody(rawBody: string): Record<string, unknown> {
  if (!rawBody.includes("=")) {
    return {};
  }

  const params = new URLSearchParams(rawBody);
  const entries = Array.from(params.entries());
  if (entries.length === 0) {
    return {};
  }

  return Object.fromEntries(entries);
}

export async function readPaymentCallbackPayload(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const queryPayload = Object.fromEntries(request.nextUrl.searchParams.entries());

  if (request.method === "GET") {
    return queryPayload;
  }

  const rawBody = (await request.text()).trim();
  if (!rawBody) {
    return queryPayload;
  }

  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const jsonFirst = contentType.includes("application/json");

  const bodyPayload = jsonFirst
    ? parseJsonBody(rawBody)
    : parseUrlEncodedBody(rawBody);

  const fallbackPayload = jsonFirst
    ? parseUrlEncodedBody(rawBody)
    : parseJsonBody(rawBody);

  return {
    ...queryPayload,
    ...bodyPayload,
    ...fallbackPayload,
  };
}
