import type { Metadata } from "next";
import AdminCategoriesPageClient from "../../../components/admin/AdminCategoriesPageClient";

export const metadata: Metadata = {
  title: "Categories - Admin",
  description: "Manage categories",
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesPageClient />;
}
