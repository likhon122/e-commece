import type { Metadata } from "next";
import AdminOrdersPageClient from "../../../components/admin/AdminOrdersPageClient";

export const metadata: Metadata = {
  title: "Orders - Admin",
  description: "Manage orders with live data",
};

export default function AdminOrdersPage() {
  return <AdminOrdersPageClient />;
}
