import type { Metadata } from "next";
import AdminSettingsPageClient from "../../../components/admin/AdminSettingsPageClient";

export const metadata: Metadata = {
  title: "Settings - Admin",
  description: "Admin settings",
};

export default function AdminSettingsPage() {
  return <AdminSettingsPageClient />;
}
