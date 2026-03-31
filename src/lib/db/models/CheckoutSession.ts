import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICheckoutSessionAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ICheckoutSessionItem {
  product: mongoose.Types.ObjectId;
  variant: {
    sku: string;
    size: string;
    color: string;
    colorCode: string;
  };
  quantity: number;
}

export interface ICheckoutSessionDoc extends Document {
  user: mongoose.Types.ObjectId;
  cartSessionId?: string;
  paymentMethod: "sslcommerz";
  shippingAddress: ICheckoutSessionAddress;
  billingAddress?: ICheckoutSessionAddress;
  notes?: string;
  items: ICheckoutSessionItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  gatewayTransactionId?: string;
  validationId?: string;
  createdOrder?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<ICheckoutSessionAddress>(
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

const ItemSchema = new Schema<ICheckoutSessionItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
      sku: { type: String, required: true },
      size: { type: String, required: true },
      color: { type: String, required: true },
      colorCode: { type: String, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const CheckoutSessionSchema = new Schema<ICheckoutSessionDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cartSessionId: { type: String },
    paymentMethod: {
      type: String,
      enum: ["sslcommerz"],
      required: true,
    },
    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema },
    notes: { type: String, maxlength: 500 },
    items: {
      type: [ItemSchema],
      required: true,
      validate: {
        validator: (v: ICheckoutSessionItem[]) => v.length > 0,
        message: "Checkout session must have at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    gatewayTransactionId: { type: String, unique: true, sparse: true },
    validationId: { type: String },
    createdOrder: { type: Schema.Types.ObjectId, ref: "Order" },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

CheckoutSessionSchema.index({ status: 1, expiresAt: 1 });
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CheckoutSession: Model<ICheckoutSessionDoc> =
  mongoose.models.CheckoutSession ||
  mongoose.model<ICheckoutSessionDoc>("CheckoutSession", CheckoutSessionSchema);

export default CheckoutSession;
