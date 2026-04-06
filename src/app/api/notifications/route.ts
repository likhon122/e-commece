import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { getAuthFromRequest } from "@/lib/auth";
import { Notification } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100,
    );
    const unreadOnly = searchParams.get("unread") === "1";

    const query: Record<string, unknown> = {
      recipient: auth.userId,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const [items, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ recipient: auth.userId, isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map((item) => ({
        id: item._id,
        type: item.type,
        title: item.title,
        message: item.message,
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        metadata: item.metadata,
        isRead: item.isRead,
        readAt: item.readAt,
        createdAt: item.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();
    const notificationId =
      typeof body.notificationId === "string" ? body.notificationId.trim() : "";
    const markAll = Boolean(body.markAll);

    if (!markAll && !notificationId) {
      return NextResponse.json(
        { success: false, error: "notificationId or markAll is required" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (markAll) {
      await Notification.updateMany(
        {
          recipient: auth.userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: now,
          },
        },
      );
    } else {
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: auth.userId,
        },
        {
          $set: {
            isRead: true,
            readAt: now,
          },
        },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
