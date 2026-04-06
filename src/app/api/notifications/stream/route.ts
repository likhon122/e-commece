import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { getAuthFromRequest } from "@/lib/auth";
import { Notification } from "@/lib/db/models";
import { markUserOffline, markUserOnline } from "@/lib/notifications/presence";

export const runtime = "nodejs";

function formatSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  await connectDB();

  const userId = String(auth.userId);
  markUserOnline(userId);

  const encoder = new TextEncoder();
  let lastSeen = new Date();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(formatSseEvent("ready", { ts: Date.now(), userId })),
      );

      const poll = async () => {
        const items = await Notification.find({
          recipient: userId,
          createdAt: { $gt: lastSeen },
        })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();

        if (!items.length) {
          return;
        }

        lastSeen = new Date(items[items.length - 1].createdAt);

        for (const item of items) {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("notification", {
                id: item._id,
                type: item.type,
                title: item.title,
                message: item.message,
                orderNumber: item.orderNumber,
                createdAt: item.createdAt,
                isRead: item.isRead,
              }),
            ),
          );
        }
      };

      const pollTimer = setInterval(() => {
        poll().catch((error) => {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("error", {
                message: "Notification stream polling failed",
                detail: error instanceof Error ? error.message : String(error),
              }),
            ),
          );
        });
      }, 4000);

      const heartbeat = setInterval(() => {
        controller.enqueue(
          encoder.encode(formatSseEvent("ping", { ts: Date.now() })),
        );
      }, 20000);

      const close = () => {
        clearInterval(pollTimer);
        clearInterval(heartbeat);
        markUserOffline(userId);
        try {
          controller.close();
        } catch {
          // Stream may already be closed.
        }
      };

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      markUserOffline(userId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
