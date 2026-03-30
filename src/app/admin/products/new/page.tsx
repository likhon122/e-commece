import type { Metadata } from "next";
import AdminProductCreateForm from "../../../../components/admin/AdminProductCreateForm";

export const metadata: Metadata = {
  title: "Create Product - Admin",
  description: "Add a new product",
};

export default function AdminCreateProductPage() {
  return <AdminProductCreateForm />;
}
