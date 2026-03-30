import mongoose, { Schema, Document, Model } from "mongoose";
import { generateOrderNumber } from "@/lib/utils";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "sslcommerz" | "bkash";

export interface IOrderAddressDoc {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderItemDoc {
  product: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  variant: {
    sku: string;
    size: string;
    color: string;
    colorCode: string;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface IStatusHistoryDoc {
  status: OrderStatus;
  note?: string;
  updatedAt: Date;
}

export interface IOrderDoc extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItemDoc[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: IOrderAddressDoc;
  billingAddress?: IOrderAddressDoc;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    transactionId?: string;
    bankTransactionId?: string;
    cardType?: string;
    cardBrand?: string;
    validationId?: string;
  };
  status: OrderStatus;
  trackingNumber?: string;
  notes?: string;
  statusHistory: IStatusHistoryDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderAddressSchema = new Schema<IOrderAddressDoc>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "Bangladesh" },
  },
  { _id: false },
);

const OrderItemSchema = new Schema<IOrderItemDoc>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    variant: {
      sku: { type: String, required: true },
      size: { type: String, required: true },
      color: { type: String, required: true },
      colorCode: { type: String, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema<IStatusHistoryDoc>(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      required: true,
    },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrderDoc>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItemDoc[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: OrderAddressSchema,
      required: true,
    },
    billingAddress: OrderAddressSchema,
    paymentMethod: {
      type: String,
      enum: ["cod", "sslcommerz", "bkash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: String,
      bankTransactionId: String,
      cardType: String,
      cardBrand: String,
      validationId: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    trackingNumber: String,
    notes: {
      type: String,
      maxlength: 500,
    },
    statusHistory: [StatusHistorySchema],
  },
  {
    timestamps: true,
  },
);

// Generate order number before saving
OrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }

  // Add to status history if status changed
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
    });
  }

  next();
});

// Indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrderDoc> =
  mongoose.models.Order || mongoose.model<IOrderDoc>("Order", OrderSchema);

export default Order;
