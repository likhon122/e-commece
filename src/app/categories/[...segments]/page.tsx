import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Types } from "mongoose";
import connectDB from "@/lib/db/connection";
import { Category } from "@/lib/db/models";
import { getProducts, getProductFacets } from "@/lib/api/products";
import CategoryProductsClient from "../[category]/CategoryProductsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

type CategoryPathNode = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  parent?: Types.ObjectId | null;
};

interface DeepCategoryPageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<SearchParams>;
}

async function resolveCategoryPath(
  segments: string[],
): Promise<CategoryPathNode[] | null> {
  if (!segments.length) {
    return null;
  }

  await connectDB();

  const categories = (await Category.find({
    slug: { $in: segments },
    isActive: true,
  })
    .select("name slug parent description seoTitle seoDescription")
    .lean()) as CategoryPathNode[];

  if (categories.length !== segments.length) {
    return null;
  }

  const categoryMap = new Map<string, CategoryPathNode>();
  for (const category of categories) {
    categoryMap.set(category.slug, category);
  }

  const chain: CategoryPathNode[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const slug = segments[index];
    const category = categoryMap.get(slug);
    if (!category) {
      return null;
    }

    const actualParent = category.parent ? String(category.parent) : null;
    const expectedParent = index === 0 ? null : String(chain[index - 1]._id);

    if (actualParent !== expectedParent) {
      return null;
    }

    chain.push(category);
  }

  return chain;
}

export async function generateMetadata({
  params,
}: DeepCategoryPageProps): Promise<Metadata> {
  const { segments } = await params;

  // Let existing single/two-level routes handle their own metadata.
  if (segments.length < 3) {
    return { title: "Category" };
  }

  const chain = await resolveCategoryPath(segments);
  if (!chain) {
    return { title: "Category Not Found" };
  }

  const leaf = chain[chain.length - 1];
  const parentName =
    chain.length > 1 ? chain[chain.length - 2].name : undefined;

  return {
    title:
      leaf.seoTitle || `${leaf.name}${parentName ? ` - ${parentName}` : ""}`,
    description:
      leaf.seoDescription ||
      leaf.description ||
      `Shop ${leaf.name} at Mythium. Discover premium quality products.`,
  };
}

export default async function DeepCategoryPage({
  params,
  searchParams,
}: DeepCategoryPageProps) {
  const { segments } = await params;
  const resolvedSearchParams = await searchParams;

  // Existing routes already handle /categories/[category] and /categories/[category]/[subcategory]
  if (segments.length < 3) {
    notFound();
  }

  const chain = await resolveCategoryPath(segments);
  if (!chain) {
    notFound();
  }

  const root = chain[0];
  const leaf = chain[chain.length - 1];

  const childCategories = (await Category.find({
    parent: leaf._id,
    isActive: true,
  })
    .select("name slug")
    .sort({ sortOrder: 1, name: 1 })
    .lean()) as Array<{ _id: Types.ObjectId; name: string; slug: string }>;

  const page = parseInt((resolvedSearchParams.page as string) || "1", 10);
  const sortBy = (resolvedSearchParams.sortBy as string) || "newest";
  const minPrice = resolvedSearchParams.minPrice
    ? parseInt(resolvedSearchParams.minPrice as string, 10)
    : undefined;
  const maxPrice = resolvedSearchParams.maxPrice
    ? parseInt(resolvedSearchParams.maxPrice as string, 10)
    : undefined;
  const sizes = resolvedSearchParams.sizes
    ? Array.isArray(resolvedSearchParams.sizes)
      ? resolvedSearchParams.sizes
      : [resolvedSearchParams.sizes]
    : [];
  const colors = resolvedSearchParams.colors
    ? Array.isArray(resolvedSearchParams.colors)
      ? resolvedSearchParams.colors
      : [resolvedSearchParams.colors]
    : [];
  const search = resolvedSearchParams.search as string | undefined;

  const { data: products, pagination } = await getProducts({
    category: root.slug,
    subcategory: leaf.slug,
    page,
    limit: 24,
    sortBy,
    minPrice,
    maxPrice,
    sizes,
    colors,
    search,
  });

  const facets = await getProductFacets(leaf.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container py-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#285A48]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              href="/categories"
              className="text-gray-500 hover:text-[#285A48]"
            >
              Categories
            </Link>
            {chain.map((category, index) => {
              const href = `/categories/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === chain.length - 1;
              return (
                <div key={category.slug} className="contents">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {isLast ? (
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-gray-500 hover:text-[#285A48]"
                    >
                      {category.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#285A48] to-[#408A71] py-12">
        <div className="container">
          <p className="text-sm font-medium uppercase tracking-wider text-white/60">
            {chain
              .slice(0, -1)
              .map((entry) => entry.name)
              .join(" / ")}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">
            {leaf.name}
          </h1>
          {leaf.description && (
            <p className="mt-3 max-w-2xl text-lg text-white/80">
              {leaf.description}
            </p>
          )}
          <p className="mt-4 text-sm text-white/60">
            {pagination.total} {pagination.total === 1 ? "product" : "products"}{" "}
            found
          </p>
        </div>
      </div>

      {childCategories.length > 0 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Shop by Subcategory
            </h2>
            <div className="flex flex-wrap gap-3">
              {childCategories.map((child) => (
                <Link
                  key={String(child._id)}
                  href={`/categories/${[...segments, child.slug].join("/")}`}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-[#285A48] hover:bg-[#285A48] hover:text-white"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <CategoryProductsClient
        categorySlug={root.slug}
        subcategorySlug={leaf.slug}
        categoryName={leaf.name}
        initialProducts={products}
        initialPagination={pagination}
        facets={facets}
        initialFilters={{
          search: search || "",
          minPrice: minPrice?.toString() || "",
          maxPrice: maxPrice?.toString() || "",
          sizes,
          colors,
          sortBy,
        }}
      />
    </div>
  );
}
