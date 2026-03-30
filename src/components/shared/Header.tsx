"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Package,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { Button } from "@/components/ui";

// Navigation item type
export interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
  badge?: string;
}

// Default fallback navigation (used if server fetch fails)
const defaultNavigation: NavItem[] = [
  { name: "Home", href: "/" },
  {
    name: "Men",
    href: "/categories/men",
    children: [
      { name: "T-Shirts", href: "/categories/men/t-shirts" },
      { name: "Shirts", href: "/categories/men/shirts" },
      { name: "Pants", href: "/categories/men/pants" },
      { name: "Jackets", href: "/categories/men/jackets" },
    ],
  },
  {
    name: "Women",
    href: "/categories/women",
    children: [
      { name: "Dresses", href: "/categories/women/dresses" },
      { name: "Tops", href: "/categories/women/tops" },
      { name: "Pants", href: "/categories/women/women-pants" },
      { name: "Skirts", href: "/categories/women/skirts" },
    ],
  },
  {
    name: "Accessories",
    href: "/categories/accessories",
    children: [
      { name: "Watches", href: "/categories/accessories/watches" },
      { name: "Bags", href: "/categories/accessories/bags" },
      { name: "Belts", href: "/categories/accessories/belts" },
      { name: "Sunglasses", href: "/categories/accessories/sunglasses" },
    ],
  },
  {
    name: "Footwear",
    href: "/categories/footwear",
    children: [
      { name: "Sneakers", href: "/categories/footwear/sneakers" },
      { name: "Formal Shoes", href: "/categories/footwear/formal-shoes" },
      { name: "Sandals", href: "/categories/footwear/sandals" },
      { name: "Boots", href: "/categories/footwear/boots" },
    ],
  },
  { name: "New Arrivals", href: "/products?new=true" },
  { name: "Sale", href: "/products?sale=true", badge: "HOT" },
];

interface HeaderProps {
  categories?: NavItem[];
}

export default function Header({ categories }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedItems, setMobileExpandedItems] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { items, openCart } = useCartStore();
  const { data: session, status } = useSession();

  // Use provided categories or fallback to default
  const navigation =
    categories && categories.length > 0 ? categories : defaultNavigation;

  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const isAdmin = (user as { role?: string })?.role === "admin";

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const toggleMobileItem = (key: string) => {
    setMobileExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const renderDesktopChildren = (children: NavItem[], depth = 0) => {
    return (
      <div
        className={cn(
          "space-y-1",
          depth > 0 && "ml-4 border-l border-[#B0E4CC]/40 pl-3",
        )}
      >
        {children.map((child) => {
          const active =
            pathname === child.href || pathname.startsWith(child.href + "/");
          return (
            <div key={`${child.name}-${child.href}`}>
              <Link
                href={child.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#B0E4CC]/30 text-[#285A48]"
                    : "text-[#091413] hover:bg-[#B0E4CC]/20 hover:text-[#285A48]",
                )}
              >
                <span className="truncate">{child.name}</span>
                {child.children && child.children.length > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[#285A48]/70" />
                )}
              </Link>
              {child.children &&
                child.children.length > 0 &&
                renderDesktopChildren(child.children, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobileChildren = (
    children: NavItem[],
    parentKey: string,
    depth = 0,
  ) => {
    return (
      <div
        className={cn(
          "space-y-1",
          depth > 0
            ? "ml-3 border-l border-[#B0E4CC]/50 pl-3"
            : "ml-4 mt-1 border-l-2 border-[#B0E4CC]/50 pl-4",
        )}
      >
        {children.map((child, index) => {
          const key = `${parentKey}-${index}-${child.href}`;
          const isExpanded = mobileExpandedItems.includes(key);
          const hasChildren = Boolean(
            child.children && child.children.length > 0,
          );

          return (
            <div key={key}>
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={child.href}
                  className="block flex-1 rounded-lg py-2 text-sm text-[#091413]/80 transition-colors hover:text-[#285A48]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {child.name}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleMobileItem(key)}
                    className="rounded-md p-1.5 text-[#285A48] hover:bg-[#B0E4CC]/20"
                    aria-label={`Toggle ${child.name}`}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </div>
              {hasChildren &&
                isExpanded &&
                renderMobileChildren(child.children || [], key, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#091413] text-white">
        <div className="container mx-auto px-4">
          <p className="py-2.5 text-center text-sm font-medium tracking-wide">
            <span className="text-[#B0E4CC]">FREE SHIPPING</span> on orders over
            ৳5,000 | Use code{" "}
            <span className="font-bold text-[#F2E3BB]">MYTHIUM10</span> for 10%
            off
          </p>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-lg backdrop-blur-md"
            : "border-b border-[#B0E4CC]/30 bg-white",
        )}
      >
        <nav className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile menu button */}
            <button
              type="button"
              className="rounded-lg p-2 text-[#091413] hover:bg-[#B0E4CC]/20 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71]">
                <span className="font-display text-xl font-bold text-white">
                  M
                </span>
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-[#091413] lg:text-3xl">
                Mythium
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:gap-x-1">
              {navigation.map((item) => (
                <div key={item.name} className="group relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                        ? "bg-[#B0E4CC]/30 text-[#285A48]"
                        : "text-[#091413] hover:bg-[#B0E4CC]/20 hover:text-[#285A48]",
                    )}
                  >
                    {item.name}
                    {item.children && (
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    )}
                    {item.badge && (
                      <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {item.children && (
                    <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="max-h-[70vh] w-[320px] overflow-y-auto rounded-2xl border border-[#B0E4CC]/30 bg-white p-3 shadow-xl">
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#285A48]/80">
                          {item.name} Collections
                        </p>
                        {renderDesktopChildren(item.children)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-lg p-2.5 text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48]"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden rounded-lg p-2.5 text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48] sm:block"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg p-1.5 text-[#091413] transition-colors hover:bg-[#B0E4CC]/20"
                  >
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-[#B0E4CC]"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71] text-white">
                        <span className="text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        userMenuOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-[#B0E4CC]/30 bg-white p-2 shadow-xl"
                        >
                          {/* User Info */}
                          <div className="border-b border-[#B0E4CC]/30 px-3 py-3">
                            <p className="font-semibold text-[#091413]">
                              {user?.name}
                            </p>
                            <p className="text-sm text-[#091413]/60">
                              {user?.email}
                            </p>
                          </div>

                          {/* Admin Dashboard Link */}
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="mt-2 flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#285A48] to-[#408A71] px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          )}

                          <div className="mt-2 space-y-1">
                            <Link
                              href="/account/profile"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48]"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              My Profile
                            </Link>
                            <Link
                              href="/account/orders"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48]"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Package className="h-4 w-4" />
                              My Orders
                            </Link>
                            <Link
                              href="/account/wishlist"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48]"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Heart className="h-4 w-4" />
                              Wishlist
                            </Link>
                            <Link
                              href="/account/addresses"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#091413] transition-colors hover:bg-[#B0E4CC]/20 hover:text-[#285A48]"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MapPin className="h-4 w-4" />
                              Addresses
                            </Link>
                          </div>

                          <div className="mt-2 border-t border-[#B0E4CC]/30 pt-2">
                            <button
                              onClick={handleSignOut}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative rounded-lg bg-gradient-to-br from-[#285A48] to-[#408A71] p-2.5 text-white transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F2E3BB] text-xs font-bold text-[#091413]">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[#B0E4CC]/30"
              >
                <div className="py-4">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products, categories, brands..."
                      className="w-full rounded-xl border-2 border-[#B0E4CC] bg-[#B0E4CC]/10 px-5 py-4 pr-14 text-sm text-[#091413] placeholder:text-[#091413]/50 focus:border-[#408A71] focus:outline-none focus:ring-2 focus:ring-[#B0E4CC]/50"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-[#285A48] p-2 text-white transition-colors hover:bg-[#408A71]"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#B0E4CC]/30 bg-white lg:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex flex-1 items-center justify-between rounded-lg px-4 py-3 text-base font-medium",
                          pathname === item.href ||
                            pathname.startsWith(item.href + "/")
                            ? "bg-[#B0E4CC]/30 text-[#285A48]"
                            : "text-[#091413]",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                        {item.badge && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      {item.children && item.children.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleMobileItem(`root-${item.href}`)}
                          className="rounded-md p-2 text-[#285A48] hover:bg-[#B0E4CC]/20"
                          aria-label={`Toggle ${item.name}`}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              mobileExpandedItems.includes(
                                `root-${item.href}`,
                              ) && "rotate-180",
                            )}
                          />
                        </button>
                      )}
                    </div>
                    {item.children &&
                      item.children.length > 0 &&
                      mobileExpandedItems.includes(`root-${item.href}`) &&
                      renderMobileChildren(item.children, `root-${item.href}`)}
                  </div>
                ))}

                {/* Mobile User Section */}
                <div className="mt-4 border-t border-[#B0E4CC]/30 pt-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 rounded-lg bg-[#B0E4CC]/20 px-4 py-3">
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt={user?.name || "User"}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-[#B0E4CC]"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71] text-white">
                            <span className="text-lg font-semibold">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#091413]">
                            {user?.name}
                          </p>
                          <p className="text-sm text-[#091413]/60">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="mt-3 flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#285A48] to-[#408A71] px-4 py-3 text-base font-medium text-white"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="mt-3 space-y-1">
                        <Link
                          href="/account/profile"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-[#091413] hover:bg-[#B0E4CC]/20"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          My Profile
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-[#091413] hover:bg-[#B0E4CC]/20"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Package className="h-5 w-5" />
                          My Orders
                        </Link>
                        <Link
                          href="/account/wishlist"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-[#091413] hover:bg-[#B0E4CC]/20"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Heart className="h-5 w-5" />
                          Wishlist
                        </Link>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignOut();
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="block rounded-lg bg-gradient-to-r from-[#285A48] to-[#408A71] px-4 py-3 text-center text-base font-medium text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block rounded-lg border-2 border-[#B0E4CC] px-4 py-3 text-center text-base font-medium text-[#285A48]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
