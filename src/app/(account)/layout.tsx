"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navigation = [
  { name: "Profile", href: "/account/profile", icon: User },
  { name: "Orders", href: "/account/orders", icon: Package },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Addresses", href: "/account/addresses", icon: MapPin },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=" + pathname);
    }
  }, [status, router, pathname]);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-sage" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-brand-cream/20">
      {/* Breadcrumb */}
      <div className="border-b border-brand-mint/10 bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-brand-dark/50 transition-colors hover:text-brand-sage"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-brand-dark/30" />
            <span className="font-medium text-brand-dark">My Account</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside>
            <div className="rounded-2xl border border-brand-mint/20 bg-white p-6 shadow-lg shadow-brand-dark/5">
              {/* User Info */}
              <div className="mb-6 text-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="mx-auto h-20 w-20 rounded-full border-4 border-brand-mint/20 object-cover shadow-lg"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-forest to-brand-sage text-2xl font-semibold text-white shadow-lg shadow-brand-forest/25">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <h2 className="mt-4 text-lg font-semibold text-brand-dark">
                  {user.name}
                </h2>
                <p className="text-sm text-brand-dark/50">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-brand-forest to-brand-sage text-white shadow-md shadow-brand-forest/20"
                          : "text-brand-dark/70 hover:bg-brand-mint/10 hover:text-brand-forest",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="mt-6 border-t border-brand-mint/20 pt-6">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
