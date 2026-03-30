import { getCategories, type CategoryWithChildren } from "@/lib/api/categories";
import Header from "./Header";

export default async function NavigationWrapper() {
  const { data: categories, success } = await getCategories();

  // Transform categories into navigation format
  const navigation = buildNavigation(success ? categories : []);

  return <Header categories={navigation} />;
}

interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
  badge?: string;
}

function buildNavigation(categories: CategoryWithChildren[]): NavItem[] {
  const navItems: NavItem[] = [{ name: "Home", href: "/" }];

  const mapCategoryToNavItem = (
    category: CategoryWithChildren,
    parentSegments: string[] = [],
  ): NavItem => {
    const segments = [...parentSegments, category.slug];
    const href = `/categories/${segments.join("/")}`;

    return {
      name: category.name,
      href,
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
