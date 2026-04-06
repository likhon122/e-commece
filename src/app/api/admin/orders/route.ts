import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth";
import dbConnect from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";
import {
  DELIVERY_FLOW,
  type DeliveryFlowStatus,
  type TrackableOrderStatus,
} from "@/lib/orders/delivery-tracking";

const terminalStatuses: TrackableOrderStatus[] = ["cancelled", "refunded"];
const validStatuses: TrackableOrderStatus[] = [
  ...DELIVERY_FLOW,
  ...terminalStatuses,
];

function mapAdminOrder(order: any) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    customer: {
      id: order.user?._id,
      name: order.user?.name || order.shippingAddress?.name || "Guest",
      email: order.user?.email,
      avatar: order.user?.avatar,
    },
    items: order.items,
    itemCount: order.items?.length || 0,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentDetails: order.paymentDetails,
    status: order.status,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function isDeliveryFlowStatus(status: string): status is DeliveryFlowStatus {
  return DELIVERY_FLOW.includes(status as DeliveryFlowStatus);
}

const TRACKING_NUMBER_REGEX = /^[A-Za-z0-9-]{6,40}$/;

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const paymentMethod = searchParams.get("paymentMethod") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      const normalized = paymentStatus.toLowerCase();
      if (normalized === "paid" || normalized === "refunded") {
        query.paymentStatus = normalized;
      } else {
        query.paymentStatus = { $in: [] };
      }
    } else {
      query.paymentStatus = { $nin: ["pending", "failed"] };
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [orders, total, statusAggregation] = await Promise.all([
      Order.find(query)
        .populate("user", "name email avatar")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      all: total,
    };
    statusAggregation.forEach((item: { _id: string; count: number }) => {
      statusCounts[item._id] = item.count;
    });

    return NextResponse.json({
      orders: orders.map((order: any) => mapAdminOrder(order)),
      statusCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status, trackingNumber, notes, statusNote } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previousStatus = String(order.status) as TrackableOrderStatus;
    const previousTrackingNumber = String(order.trackingNumber || "");

    const normalizedStatus =
      typeof status === "string" ? status.trim().toLowerCase() : "";
    const normalizedTrackingNumber =
      typeof trackingNumber === "string" ? trackingNumber.trim() : undefined;
    const normalizedNotes = typeof notes === "string" ? notes.trim() : undefined;
    const normalizedStatusNote =
      typeof statusNote === "string" ? statusNote.trim().slice(0, 300) : "";

    if (
      normalizedTrackingNumber &&
      !TRACKING_NUMBER_REGEX.test(normalizedTrackingNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Tracking number must be 6-40 characters and contain only letters, numbers, and hyphens.",
        },
        { status: 400 },
      );
    }

    if (normalizedStatus && !validStatuses.includes(normalizedStatus as TrackableOrderStatus)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 },
      );
    }

    if (normalizedStatus && normalizedStatus !== order.status) {
      const currentStatus = String(order.status) as TrackableOrderStatus;

      if (terminalStatuses.includes(currentStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus}` },
          { status: 409 },
        );
      }

      if (isDeliveryFlowStatus(normalizedStatus)) {
        if (!isDeliveryFlowStatus(currentStatus)) {
          return NextResponse.json(
            { error: "Cannot move terminal orders into delivery flow" },
            { status: 409 },
          );
        }

        const currentIndex = DELIVERY_FLOW.indexOf(currentStatus);
        const nextExpected = DELIVERY_FLOW[currentIndex + 1];

        if (normalizedStatus !== nextExpected) {
          return NextResponse.json(
            {
              error: `Invalid transition. Next expected stage is ${nextExpected || "none"}`,
            },
            { status: 409 },
          );
        }
      }

      order.status = normalizedStatus;
      if (normalizedStatusNote) {
        (order as any).$locals = {
          ...((order as any).$locals || {}),
          statusNote: normalizedStatusNote,
        };
      }
    } else if (normalizedStatusNote) {
      order.statusHistory.push({
        status: order.status,
        note: normalizedStatusNote,
        updatedAt: new Date(),
      });
    }

    const effectiveTrackingNumber =
      normalizedTrackingNumber || String(order.trackingNumber || "");
    if (
      (normalizedStatus === "shipped" || normalizedStatus === "delivered") &&
      !effectiveTrackingNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Tracking number is required before moving to shipped or delivered stage.",
        },
        { status: 400 },
      );
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = normalizedTrackingNumber || undefined;
    }
    if (notes !== undefined) {
      order.notes = normalizedNotes || undefined;
    }

    await order.save();
    await order.populate("user", "name email avatar");

    const statusChanged = normalizedStatus && normalizedStatus !== previousStatus;
    const trackingChanged =
      trackingNumber !== undefined &&
      String(order.trackingNumber || "") !== previousTrackingNumber;
    const noteChanged = Boolean(normalizedStatusNote);

    if (statusChanged || trackingChanged || noteChanged) {
      const userNotice = await notifyUser({
        userId: order.user,
        type: "tracking-update",
        title: `Order ${order.orderNumber} tracking updated`,
        message: `Status: ${order.status.toUpperCase()}${
          order.trackingNumber ? ` · Tracking: ${order.trackingNumber}` : ""
        }`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        metadata: {
          status: order.status,
          trackingNumber: order.trackingNumber,
          statusNote: normalizedStatusNote,
        },
      });

      if (!userNotice.online && userNotice.email) {
        try {
          await sendOrderStatusUpdateEmail(
            userNotice.email,
            order.user?.name || order.shippingAddress?.name || "Customer",
            order.orderNumber,
            order.status,
            order.trackingNumber,
            normalizedStatusNote,
          );
        } catch (emailError) {
          console.error("Tracking update email error:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true, order: mapAdminOrder(order) });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
