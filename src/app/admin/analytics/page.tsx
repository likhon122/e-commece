import type { Metadata } from "next";
import AdminAnalyticsPageClient from "../../../components/admin/AdminAnalyticsPageClient";

export const metadata: Metadata = {
  title: "Analytics - Admin",
  description: "Admin analytics",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsPageClient />;
}
