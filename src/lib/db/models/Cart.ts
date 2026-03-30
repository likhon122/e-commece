import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItemDoc {
  product: mongoose.Types.ObjectId;
  variant: {
    sku: string;
    size: string;
    color: string;
    colorCode: string;
  };
  quantity: number;
  price: number;
}

export interface ICartDoc extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: ICartItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItemDoc>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      sku: { type: String, required: true },
      size: { type: String, required: true },
      color: { type: String, required: true },
      colorCode: { type: String, required: true },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const CartSchema = new Schema<ICartDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  },
);

// Ensure either user or sessionId is present
CartSchema.pre("save", function (next) {
  if (!this.user && !this.sessionId) {
    next(new Error("Cart must have either user or sessionId"));
  }
  next();
});

// Indexes
CartSchema.index({ user: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete guest carts after 30 days

const Cart: Model<ICartDoc> =
  mongoose.models.Cart || mongoose.model<ICartDoc>("Cart", CartSchema);

export default Cart;
