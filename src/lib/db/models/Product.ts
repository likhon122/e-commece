import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";

export interface IProductImageDoc {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface IProductVideoDoc {
  url: string;
  alt: string;
  poster?: string;
}

export interface IProductVariantDoc {
  sku: string;
  size: string;
  color: string;
  colorCode: string;
  stock: number;
  reservedStock?: number;
  price?: number;
  images?: string[];
}

export interface IProductSpecDoc {
  key: string;
  value: string;
}

export interface IProductReviewDoc {
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProductDoc extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  brand?: string;
  basePrice: number;
  salePrice?: number;
  discount?: number;
  images: IProductImageDoc[];
  video?: IProductVideoDoc;
  variants: IProductVariantDoc[];
  specifications: IProductSpecDoc[];
  tags: string[];
  ratings: {
    average: number;
    count: number;
  };
  reviews: IProductReviewDoc[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  viewCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
  totalStock: number;
}

const ProductImageSchema = new Schema<IProductImageDoc>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProductVideoSchema = new Schema<IProductVideoDoc>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    poster: { type: String },
  },
  { _id: false },
);

const ProductVariantSchema = new Schema<IProductVariantDoc>(
  {
    sku: { type: String, required: true, unique: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    colorCode: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, min: 0, default: 0 },
    price: { type: Number },
    images: [{ type: String }],
  },
  { _id: true },
);

const ProductSpecSchema = new Schema<IProductSpecDoc>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const ProductReviewSchema = new Schema<IProductReviewDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ProductSchema = new Schema<IProductDoc>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    brand: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      min: [0, "Sale price cannot be negative"],
    },
    discount: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    images: [ProductImageSchema],
    video: ProductVideoSchema,
    variants: [ProductVariantSchema],
    specifications: [ProductSpecSchema],
    tags: [{ type: String, lowercase: true, trim: true }],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    reviews: [ProductReviewSchema],
    seoTitle: {
      type: String,
      maxlength: [70, "SEO title cannot exceed 70 characters"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    seoKeywords: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // @ts-ignore - isNew conflicts with mongoose internal isNew property
    isNew: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for total stock
ProductSchema.virtual("totalStock").get(function (this: any) {
  return this.variants.reduce(
    (total: number, variant: any) => total + variant.stock,
    0,
  );
});

// Generate slug before saving
ProductSchema.pre("save", function (this: any, next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Calculate discount if sale price is set
  if (this.salePrice && this.basePrice) {
    this.discount = Math.round(
      ((this.basePrice - this.salePrice) / this.basePrice) * 100,
    );
  }

  // Auto-generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = `${this.name} | Mythium`;
  }
  if (!this.seoDescription) {
    this.seoDescription = this.shortDescription.substring(0, 160);
  }

  next();
});

// Indexes for faster queries
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ "ratings.average": -1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" });

const Product: Model<IProductDoc> =
  mongoose.models.Product ||
  mongoose.model<IProductDoc>("Product", ProductSchema);

export default Product;
