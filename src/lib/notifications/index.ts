import mongoose from "mongoose";
import connectDB from "@/lib/db/connection";
import { Notification, User } from "@/lib/db/models";
import { isUserOnline } from "./presence";

interface CreateNotificationInput {
  recipient: string | mongoose.Types.ObjectId;
  audience: "user" | "admin";
  type: "order-created" | "payment-update" | "tracking-update" | "system";
  title: string;
  message: string;
  orderId?: string | mongoose.Types.ObjectId;
  orderNumber?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  await connectDB();

  await Notification.create({
    recipient: input.recipient,
    audience: input.audience,
    type: input.type,
    title: input.title,
    message: input.message,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    metadata: input.metadata,
  });
}

export async function notifyAllAdmins(input: {
  title: string;
  message: string;
  type?: "order-created" | "payment-update" | "tracking-update" | "system";
  orderId?: string | mongoose.Types.ObjectId;
  orderNumber?: string;
  metadata?: Record<string, unknown>;
}): Promise<Array<{ userId: string; email: string; online: boolean }>> {
  await connectDB();

  const admins = await User.find({ role: "admin" })
    .select("_id email")
    .lean<Array<{ _id: mongoose.Types.ObjectId; email: string }>>();

  if (!admins.length) {
    return [];
  }

  await Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin._id,
      audience: "admin",
      type: input.type || "system",
      title: input.title,
      message: input.message,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      metadata: input.metadata,
    })),
  );

  return admins.map((admin) => ({
    userId: admin._id.toString(),
    email: admin.email,
    online: isUserOnline(admin._id.toString()),
  }));
}

export async function notifyUser(input: {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: "order-created" | "payment-update" | "tracking-update" | "system";
  orderId?: string | mongoose.Types.ObjectId;
  orderNumber?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ email?: string; online: boolean }> {
  await connectDB();

  const user = await User.findById(input.userId)
    .select("_id email")
    .lean<{ _id: mongoose.Types.ObjectId; email: string } | null>();

  if (!user) {
    return { online: false };
  }

  await Notification.create({
    recipient: user._id,
    audience: "user",
    type: input.type || "system",
    title: input.title,
    message: input.message,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    metadata: input.metadata,
  });

  return {
    email: user.email,
    online: isUserOnline(user._id.toString()),
  };
}
