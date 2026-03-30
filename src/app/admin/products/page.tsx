import type { Metadata } from "next";
import AdminProductsPageClient from "../../../components/admin/AdminProductsPageClient";

export const metadata: Metadata = {
  title: "Products - Admin",
  description: "Manage products with live data",
};

export default function AdminProductsPage() {
  return <AdminProductsPageClient />;
}
