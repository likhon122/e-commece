import type { Metadata } from "next";
import AdminCustomersPageClient from "../../../components/admin/AdminCustomersPageClient";

export const metadata: Metadata = {
  title: "Customers - Admin",
  description: "Manage customers",
};

export default function AdminCustomersPage() {
  return <AdminCustomersPageClient />;
}
