"use client";

import { usePathname } from "next/navigation";
import Header, { type NavItem } from "./Header";
import Footer from "./Footer";
import CartSidebar from "./CartSidebar";

interface AppChromeClientProps {
  children: React.ReactNode;
  navigation: NavItem[];
}

export default function AppChromeClient({
  children,
  navigation,
}: AppChromeClientProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header categories={navigation} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartSidebar />
    </>
  );
}
