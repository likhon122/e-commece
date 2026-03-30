import type { Metadata } from "next";
import AdminProductCreateForm from "../../../../../components/admin/AdminProductCreateForm";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Edit Product - Admin",
  description: "Update an existing product",
};

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;

  return <AdminProductCreateForm mode="edit" productId={id} />;
}
