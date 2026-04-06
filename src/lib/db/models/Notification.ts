import mongoose, { Document, Model, Schema } from "mongoose";

export type NotificationAudience = "user" | "admin";
export type NotificationType =
  | "order-created"
  | "payment-update"
  | "tracking-update"
  | "system";

export interface INotificationDoc extends Document {
  recipient: mongoose.Types.ObjectId;
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order-created", "payment-update", "tracking-update", "system"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    orderNumber: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ audience: 1, createdAt: -1 });

const Notification: Model<INotificationDoc> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDoc>("Notification", NotificationSchema);

export default Notification;
