import { Metadata } from "next";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | Mythium",
  description: "Mythium Executive Command Center - Real-time analytics and control",
};

export default function AdminDashboard() {
  return <AdminDashboardClient />;
}
