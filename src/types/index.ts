// User Types
export interface IAddress {
  _id?: string;
  type: "home" | "office" | "other";
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: "user" | "admin";
  avatar?: string;
  addresses: IAddress[];
  wishlist: string[];
  isVerified: boolean;
  verificationToken?: string;
  verificationExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface IProductVideo {
  url: string;
  alt: string;
  poster?: string;
}

export interface IProductVariant {
  _id?: string;
  sku: string;
  size: string;
  color: string;
  colorCode: string;
  stock: number;
  price?: number;
  images?: string[];
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProductReview {
  _id?: string;
  user: string | IUser;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string | ICategory;
  subcategory?: string | ICategory;
  brand?: string;
  basePrice: number;
  salePrice?: number;
  discount?: number;
  images: IProductImage[];
  video?: IProductVideo;
  variants: IProductVariant[];
  specifications: IProductSpecification[];
  tags: string[];
  ratings: {
    average: number;
    count: number;
  };
  reviews: IProductReview[];
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
}

// Category Types
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | ICategory;
  children?: ICategory[];
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface ICartItem {
  _id?: string;
  product: string | IProduct;
  variant: IProductVariant;
  quantity: number;
  price: number;
}

export interface ICart {
  _id: string;
  user?: string;
  sessionId?: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
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

export interface IOrderItem {
  product: string | IProduct;
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

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string | IUser;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: IAddress;
  billingAddress?: IAddress;
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
  statusHistory: {
    status: OrderStatus;
    note?: string;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Filter Types
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  tags?: string[];
  sortBy?: "price_asc" | "price_desc" | "newest" | "popularity" | "rating";
  search?: string;
  page?: number;
  limit?: number;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
  status: OrderStatus;
  createdAt: Date;
}
