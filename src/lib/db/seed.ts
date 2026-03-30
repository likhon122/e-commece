import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/mythium";

// Connect to MongoDB
async function connect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Define schemas inline for seeding
const CategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: String,
    image: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: String,
    shortDescription: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    basePrice: Number,
    salePrice: Number,
    discount: Number,
    images: [
      {
        url: String,
        alt: String,
        isPrimary: Boolean,
      },
    ],
    variants: [
      {
        sku: String,
        size: String,
        color: String,
        colorCode: String,
        stock: Number,
      },
    ],
    tags: [String],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    email: String,
    password: String,
    name: String,
    phone: String,
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Sample data
const categories = [
  {
    name: "Men",
    slug: "men",
    description: "Men's Fashion Collection",
    sortOrder: 1,
  },
  {
    name: "Women",
    slug: "women",
    description: "Women's Fashion Collection",
    sortOrder: 2,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Fashion Accessories",
    sortOrder: 3,
  },
  {
    name: "Footwear",
    slug: "footwear",
    description: "Shoes and Footwear",
    sortOrder: 4,
  },
];

const subcategories = [
  // Men subcategories
  { name: "T-Shirts", slug: "t-shirts", parentSlug: "men", sortOrder: 1 },
  { name: "Shirts", slug: "shirts", parentSlug: "men", sortOrder: 2 },
  { name: "Pants", slug: "pants", parentSlug: "men", sortOrder: 3 },
  { name: "Jackets", slug: "jackets", parentSlug: "men", sortOrder: 4 },
  // Women subcategories
  { name: "Dresses", slug: "dresses", parentSlug: "women", sortOrder: 1 },
  { name: "Tops", slug: "tops", parentSlug: "women", sortOrder: 2 },
  { name: "Pants", slug: "women-pants", parentSlug: "women", sortOrder: 3 },
  { name: "Skirts", slug: "skirts", parentSlug: "women", sortOrder: 4 },
  { name: "Accessories", slug: "women-accessories", parentSlug: "women", sortOrder: 5 },
  // Accessories subcategories
  { name: "Watches", slug: "watches", parentSlug: "accessories", sortOrder: 1 },
  { name: "Bags", slug: "bags", parentSlug: "accessories", sortOrder: 2 },
  { name: "Belts", slug: "belts", parentSlug: "accessories", sortOrder: 3 },
  { name: "Sunglasses", slug: "sunglasses", parentSlug: "accessories", sortOrder: 4 },
  // Footwear subcategories
  { name: "Sneakers", slug: "sneakers", parentSlug: "footwear", sortOrder: 1 },
  { name: "Formal Shoes", slug: "formal-shoes", parentSlug: "footwear", sortOrder: 2 },
  { name: "Sandals", slug: "sandals", parentSlug: "footwear", sortOrder: 3 },
  { name: "Boots", slug: "boots", parentSlug: "footwear", sortOrder: 4 },
];

const sampleProducts = [
  // Men's T-Shirts
  {
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-t-shirt",
    description:
      "Experience ultimate comfort with our Premium Cotton T-Shirt. Made from 100% organic cotton, this t-shirt offers exceptional softness and breathability.",
    shortDescription: "Soft and breathable organic cotton t-shirt for everyday comfort.",
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    basePrice: 1299,
    salePrice: 999,
    images: [
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", alt: "Premium Cotton T-Shirt", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Premium Cotton T-Shirt Back", isPrimary: false },
    ],
    variants: [
      { sku: "PCT-BLK-S", size: "S", color: "Black", colorCode: "#000000", stock: 25 },
      { sku: "PCT-BLK-M", size: "M", color: "Black", colorCode: "#000000", stock: 30 },
      { sku: "PCT-BLK-L", size: "L", color: "Black", colorCode: "#000000", stock: 20 },
      { sku: "PCT-WHT-S", size: "S", color: "White", colorCode: "#FFFFFF", stock: 25 },
      { sku: "PCT-WHT-M", size: "M", color: "White", colorCode: "#FFFFFF", stock: 35 },
      { sku: "PCT-WHT-L", size: "L", color: "White", colorCode: "#FFFFFF", stock: 15 },
    ],
    tags: ["cotton", "t-shirt", "casual", "men", "premium"],
    ratings: { average: 4.5, count: 128 },
    isFeatured: true,
    isNew: true,
  },
  {
    name: "Graphic Print Tee",
    slug: "graphic-print-tee",
    description: "Make a statement with our bold graphic print tee. Premium quality fabric with vibrant, long-lasting prints.",
    shortDescription: "Bold graphic tee with premium fabric.",
    categorySlug: "men",
    subcategorySlug: "t-shirts",
    basePrice: 1499,
    salePrice: 1199,
    images: [
      { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800", alt: "Graphic Print Tee", isPrimary: true },
    ],
    variants: [
      { sku: "GPT-NVY-M", size: "M", color: "Navy", colorCode: "#1e3a5f", stock: 20 },
      { sku: "GPT-NVY-L", size: "L", color: "Navy", colorCode: "#1e3a5f", stock: 25 },
      { sku: "GPT-NVY-XL", size: "XL", color: "Navy", colorCode: "#1e3a5f", stock: 15 },
    ],
    tags: ["graphic", "t-shirt", "casual", "men", "trendy"],
    ratings: { average: 4.3, count: 89 },
    isFeatured: true,
    isNew: true,
  },
  // Men's Shirts
  {
    name: "Oxford Button-Down Shirt",
    slug: "oxford-button-down-shirt",
    description: "Classic Oxford button-down shirt perfect for both office and casual wear. Crafted from premium cotton.",
    shortDescription: "Classic Oxford shirt for versatile styling.",
    categorySlug: "men",
    subcategorySlug: "shirts",
    basePrice: 2499,
    salePrice: 1999,
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Oxford Button-Down Shirt", isPrimary: true },
    ],
    variants: [
      { sku: "OBS-WHT-S", size: "S", color: "White", colorCode: "#FFFFFF", stock: 15 },
      { sku: "OBS-WHT-M", size: "M", color: "White", colorCode: "#FFFFFF", stock: 25 },
      { sku: "OBS-WHT-L", size: "L", color: "White", colorCode: "#FFFFFF", stock: 20 },
      { sku: "OBS-BLU-M", size: "M", color: "Blue", colorCode: "#2563eb", stock: 18 },
      { sku: "OBS-BLU-L", size: "L", color: "Blue", colorCode: "#2563eb", stock: 22 },
    ],
    tags: ["shirt", "oxford", "formal", "men", "office"],
    ratings: { average: 4.7, count: 156 },
    isFeatured: true,
    isNew: false,
  },
  // Men's Pants
  {
    name: "Slim Fit Denim Jeans",
    slug: "slim-fit-denim-jeans",
    description: "Classic slim fit denim jeans that combine style with comfort. Made from premium stretch denim.",
    shortDescription: "Classic slim fit jeans with premium stretch denim.",
    categorySlug: "men",
    subcategorySlug: "pants",
    basePrice: 2499,
    salePrice: 1999,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Slim Fit Denim Jeans", isPrimary: true },
    ],
    variants: [
      { sku: "SFJ-BLU-30", size: "30", color: "Blue", colorCode: "#1e3a5f", stock: 20 },
      { sku: "SFJ-BLU-32", size: "32", color: "Blue", colorCode: "#1e3a5f", stock: 25 },
      { sku: "SFJ-BLU-34", size: "34", color: "Blue", colorCode: "#1e3a5f", stock: 15 },
      { sku: "SFJ-BLK-32", size: "32", color: "Black", colorCode: "#000000", stock: 18 },
      { sku: "SFJ-BLK-34", size: "34", color: "Black", colorCode: "#000000", stock: 12 },
    ],
    tags: ["jeans", "denim", "slim-fit", "men", "casual"],
    ratings: { average: 4.6, count: 234 },
    isFeatured: true,
    isNew: false,
  },
  {
    name: "Chino Trousers",
    slug: "chino-trousers",
    description: "Versatile chino trousers suitable for smart casual occasions. Comfortable fit with quality construction.",
    shortDescription: "Versatile chinos for smart casual wear.",
    categorySlug: "men",
    subcategorySlug: "pants",
    basePrice: 1999,
    images: [
      { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800", alt: "Chino Trousers", isPrimary: true },
    ],
    variants: [
      { sku: "CHI-KHK-30", size: "30", color: "Khaki", colorCode: "#c4a35a", stock: 20 },
      { sku: "CHI-KHK-32", size: "32", color: "Khaki", colorCode: "#c4a35a", stock: 22 },
      { sku: "CHI-NVY-32", size: "32", color: "Navy", colorCode: "#1e3a5f", stock: 15 },
    ],
    tags: ["chinos", "trousers", "smart-casual", "men"],
    ratings: { average: 4.4, count: 98 },
    isFeatured: false,
    isNew: true,
  },
  // Men's Jackets
  {
    name: "Leather Biker Jacket",
    slug: "leather-biker-jacket",
    description: "Premium leather biker jacket with classic styling. Genuine leather with quality hardware and lining.",
    shortDescription: "Classic leather biker jacket with premium finish.",
    categorySlug: "men",
    subcategorySlug: "jackets",
    basePrice: 8999,
    salePrice: 6999,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Leather Biker Jacket", isPrimary: true },
    ],
    variants: [
      { sku: "LBJ-BLK-M", size: "M", color: "Black", colorCode: "#000000", stock: 8 },
      { sku: "LBJ-BLK-L", size: "L", color: "Black", colorCode: "#000000", stock: 10 },
      { sku: "LBJ-BLK-XL", size: "XL", color: "Black", colorCode: "#000000", stock: 5 },
    ],
    tags: ["jacket", "leather", "biker", "men", "premium"],
    ratings: { average: 4.8, count: 67 },
    isFeatured: true,
    isNew: false,
  },
  // Women's Dresses
  {
    name: "Floral Summer Dress",
    slug: "floral-summer-dress",
    description: "Beautiful floral print summer dress perfect for warm days. Light and breezy fabric.",
    shortDescription: "Light and breezy floral print dress for summer.",
    categorySlug: "women",
    subcategorySlug: "dresses",
    basePrice: 1899,
    images: [
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800", alt: "Floral Summer Dress", isPrimary: true },
    ],
    variants: [
      { sku: "FSD-FLR-S", size: "S", color: "Floral", colorCode: "#f472b6", stock: 15 },
      { sku: "FSD-FLR-M", size: "M", color: "Floral", colorCode: "#f472b6", stock: 20 },
      { sku: "FSD-FLR-L", size: "L", color: "Floral", colorCode: "#f472b6", stock: 10 },
    ],
    tags: ["dress", "summer", "floral", "women", "casual"],
    ratings: { average: 4.6, count: 145 },
    isFeatured: true,
    isNew: true,
  },
  {
    name: "Elegant Evening Gown",
    slug: "elegant-evening-gown",
    description: "Stunning evening gown perfect for special occasions. Elegant silhouette with premium fabric.",
    shortDescription: "Elegant gown for special occasions.",
    categorySlug: "women",
    subcategorySlug: "dresses",
    basePrice: 5999,
    salePrice: 4499,
    images: [
      { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", alt: "Elegant Evening Gown", isPrimary: true },
    ],
    variants: [
      { sku: "EEG-BLK-S", size: "S", color: "Black", colorCode: "#000000", stock: 8 },
      { sku: "EEG-BLK-M", size: "M", color: "Black", colorCode: "#000000", stock: 12 },
      { sku: "EEG-RED-M", size: "M", color: "Red", colorCode: "#dc2626", stock: 6 },
    ],
    tags: ["dress", "evening", "formal", "women", "elegant"],
    ratings: { average: 4.9, count: 89 },
    isFeatured: true,
    isNew: false,
  },
  // Women's Tops
  {
    name: "Silk Blouse",
    slug: "silk-blouse",
    description: "Luxurious silk blouse with elegant draping. Perfect for office or evening wear.",
    shortDescription: "Luxurious silk blouse for elegant styling.",
    categorySlug: "women",
    subcategorySlug: "tops",
    basePrice: 2999,
    salePrice: 2399,
    images: [
      { url: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800", alt: "Silk Blouse", isPrimary: true },
    ],
    variants: [
      { sku: "SLB-CRM-S", size: "S", color: "Cream", colorCode: "#fffdd0", stock: 12 },
      { sku: "SLB-CRM-M", size: "M", color: "Cream", colorCode: "#fffdd0", stock: 15 },
      { sku: "SLB-NVY-M", size: "M", color: "Navy", colorCode: "#1e3a5f", stock: 10 },
    ],
    tags: ["blouse", "silk", "formal", "women", "elegant"],
    ratings: { average: 4.7, count: 112 },
    isFeatured: true,
    isNew: true,
  },
  // Footwear
  {
    name: "Casual Leather Sneakers",
    slug: "casual-leather-sneakers",
    description: "Premium leather sneakers that combine style and comfort. Perfect for casual occasions.",
    shortDescription: "Versatile leather sneakers for any occasion.",
    categorySlug: "footwear",
    subcategorySlug: "sneakers",
    basePrice: 3499,
    salePrice: 2799,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Casual Leather Sneakers", isPrimary: true },
    ],
    variants: [
      { sku: "CLS-WHT-40", size: "40", color: "White", colorCode: "#FFFFFF", stock: 12 },
      { sku: "CLS-WHT-41", size: "41", color: "White", colorCode: "#FFFFFF", stock: 15 },
      { sku: "CLS-WHT-42", size: "42", color: "White", colorCode: "#FFFFFF", stock: 18 },
      { sku: "CLS-WHT-43", size: "43", color: "White", colorCode: "#FFFFFF", stock: 10 },
    ],
    tags: ["sneakers", "leather", "casual", "footwear"],
    ratings: { average: 4.5, count: 203 },
    isFeatured: true,
    isNew: true,
  },
  {
    name: "Classic Oxford Shoes",
    slug: "classic-oxford-shoes",
    description: "Timeless Oxford shoes crafted from premium leather. Perfect for formal occasions.",
    shortDescription: "Classic Oxford shoes for formal wear.",
    categorySlug: "footwear",
    subcategorySlug: "formal-shoes",
    basePrice: 4999,
    images: [
      { url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800", alt: "Classic Oxford Shoes", isPrimary: true },
    ],
    variants: [
      { sku: "COX-BLK-41", size: "41", color: "Black", colorCode: "#000000", stock: 10 },
      { sku: "COX-BLK-42", size: "42", color: "Black", colorCode: "#000000", stock: 12 },
      { sku: "COX-BRN-42", size: "42", color: "Brown", colorCode: "#92400e", stock: 8 },
    ],
    tags: ["oxford", "formal", "leather", "footwear", "classic"],
    ratings: { average: 4.8, count: 78 },
    isFeatured: false,
    isNew: false,
  },
  // Accessories
  {
    name: "Classic Analog Watch",
    slug: "classic-analog-watch",
    description: "Elegant analog watch with leather strap. Swiss movement with sapphire crystal.",
    shortDescription: "Elegant analog watch with premium build.",
    categorySlug: "accessories",
    subcategorySlug: "watches",
    basePrice: 7999,
    salePrice: 5999,
    images: [
      { url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800", alt: "Classic Analog Watch", isPrimary: true },
    ],
    variants: [
      { sku: "CAW-SLV", size: "One Size", color: "Silver", colorCode: "#C0C0C0", stock: 15 },
      { sku: "CAW-GLD", size: "One Size", color: "Gold", colorCode: "#FFD700", stock: 10 },
    ],
    tags: ["watch", "analog", "classic", "accessories", "luxury"],
    ratings: { average: 4.9, count: 156 },
    isFeatured: true,
    isNew: false,
  },
  {
    name: "Leather Messenger Bag",
    slug: "leather-messenger-bag",
    description: "Premium leather messenger bag with multiple compartments. Perfect for work and travel.",
    shortDescription: "Premium leather bag for professionals.",
    categorySlug: "accessories",
    subcategorySlug: "bags",
    basePrice: 4999,
    salePrice: 3999,
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", alt: "Leather Messenger Bag", isPrimary: true },
    ],
    variants: [
      { sku: "LMB-BRN", size: "One Size", color: "Brown", colorCode: "#92400e", stock: 20 },
      { sku: "LMB-BLK", size: "One Size", color: "Black", colorCode: "#000000", stock: 15 },
    ],
    tags: ["bag", "leather", "messenger", "accessories", "professional"],
    ratings: { average: 4.6, count: 134 },
    isFeatured: true,
    isNew: true,
  },
];

async function seed() {
  await connect();

  console.log("Clearing existing data...");
  await Category.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  console.log("Creating categories...");
  const createdCategories: Record<string, mongoose.Types.ObjectId> = {};

  for (const cat of categories) {
    const category = await Category.create(cat);
    createdCategories[cat.slug] = category._id;
  }

  for (const subcat of subcategories) {
    const category = await Category.create({
      ...subcat,
      parent: createdCategories[subcat.parentSlug],
    });
    createdCategories[subcat.slug] = category._id;
  }

  console.log("Creating products...");
  for (const prod of sampleProducts) {
    const { categorySlug, subcategorySlug, ...productData } = prod;
    await Product.create({
      ...productData,
      category: createdCategories[categorySlug],
      subcategory: subcategorySlug ? createdCategories[subcategorySlug] : undefined,
    });
  }

  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  await User.create({
    email: "admin@mythium.com",
    password: hashedPassword,
    name: "Admin User",
    role: "admin",
    isVerified: true,
  });

  console.log("Creating test user...");
  const userPassword = await bcrypt.hash("User123!", 12);
  await User.create({
    email: "user@example.com",
    password: userPassword,
    name: "Test User",
    role: "user",
    isVerified: true,
  });

  console.log("Seed completed successfully!");
  console.log("\nTest Credentials:");
  console.log("Admin: admin@mythium.com / Admin123!");
  console.log("User: user@example.com / User123!");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed error:", error);
  process.exit(1);
});
