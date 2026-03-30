import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";

export interface ICategoryDoc extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDoc>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    seoTitle: {
      type: String,
      maxlength: [70, "SEO title cannot exceed 70 characters"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Generate slug before saving
CategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Auto-generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = `${this.name} | Mythium`;
  }
  if (!this.seoDescription && this.description) {
    this.seoDescription = this.description.substring(0, 160);
  }

  next();
});

// Update parent's children array after save
CategorySchema.post("save", async function () {
  if (this.parent) {
    await mongoose.model("Category").findByIdAndUpdate(this.parent, {
      $addToSet: { children: this._id },
    });
  }
});

// Remove from parent's children array before delete
CategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    if (this.parent) {
      await mongoose.model("Category").findByIdAndUpdate(this.parent, {
        $pull: { children: this._id },
      });
    }
  },
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

const Category: Model<ICategoryDoc> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDoc>("Category", CategorySchema);

export default Category;
