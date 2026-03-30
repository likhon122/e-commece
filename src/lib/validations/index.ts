import { z } from "zod";

function isAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalUploadPath(value: string): boolean {
  return value.startsWith("/uploads/");
}

const mediaUrlSchema = z.string().refine(
  (value) => isAbsoluteUrl(value) || isLocalUploadPath(value),
  "Invalid media URL",
);

// Auth Schemas
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Address Schema
export const addressSchema = z.object({
  type: z.enum(["home", "office", "other"]).default("home"),
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(
      /^(\+?880|0)?1[3-9]\d{8}$/,
      "Please enter a valid Bangladesh phone number",
    ),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Division is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  country: z.string().default("Bangladesh"),
  isDefault: z.boolean().default(false),
});

// Profile Schema
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  phone: z
    .string()
    .regex(
      /^(\+?880|0)?1[3-9]\d{8}$/,
      "Please enter a valid Bangladesh phone number",
    )
    .optional()
    .or(z.literal("")),
  avatar: z.string().url().optional().or(z.literal("")),
});

// Product Schemas
export const productVariantSchema = z.object({
  sku: z.string().min(3, "SKU is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  price: z.number().min(0).optional(),
  images: z.array(z.string().url()).optional(),
});

export const productImageSchema = z.object({
  url: mediaUrlSchema,
  alt: z.string().min(1, "Alt text is required"),
  isPrimary: z.boolean().default(false),
});

export const productVideoSchema = z.object({
  url: mediaUrlSchema,
  alt: z.string().min(1, "Video alt text is required"),
  poster: mediaUrlSchema.optional(),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(200, "Product name cannot exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(500, "Short description cannot exceed 500 characters"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  basePrice: z.number().min(0, "Price cannot be negative"),
  salePrice: z.number().min(0).optional(),
  images: z
    .array(productImageSchema)
    .min(1, "At least one image is required")
    .max(5, "You can upload maximum 5 images"),
  video: productVideoSchema.optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Category Schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parent: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Cart Schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variant: z.object({
    sku: z.string().min(1),
    size: z.string().min(1),
    color: z.string().min(1),
    colorCode: z.string().min(1),
  }),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// Order Schemas
export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cod", "sslcommerz", "bkash"]),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  trackingNumber: z.string().optional(),
  note: z.string().max(500).optional(),
});

// Review Schema
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000),
});

// Search Schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "popularity", "rating"])
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(12),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
