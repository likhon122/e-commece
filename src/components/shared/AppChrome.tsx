import { getCategories, type CategoryWithChildren } from "@/lib/api/categories";
import AppChromeClient from "./AppChromeClient";
import type { NavItem } from "./Header";

function buildNavigation(categories: CategoryWithChildren[]): NavItem[] {
  const navItems: NavItem[] = [{ name: "Home", href: "/" }];

  const mapCategoryToNavItem = (
    category: CategoryWithChildren,
    parentSegments: string[] = [],
  ): NavItem => {
    const segments = [...parentSegments, category.slug];
    return {
      name: category.name,
      href: `/categories/${segments.join("/")}`,
      children:
        category.children && category.children.length > 0
          ? category.children.map((child) =>
              mapCategoryToNavItem(child, segments),
            )
          : undefined,
    };
  };

  // Add dynamic categories with full depth
  for (const category of categories) {
    navItems.push(mapCategoryToNavItem(category));
  }

  // Add static navigation items
  navItems.push({ name: "New Arrivals", href: "/products?new=true" });
  navItems.push({ name: "Sale", href: "/products?sale=true", badge: "HOT" });

  return navItems;
}

export default async function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch categories server-side
  const { data: categories, success } = await getCategories();
  const navigation = buildNavigation(success ? categories : []);

  return <AppChromeClient navigation={navigation}>{children}</AppChromeClient>;
}
