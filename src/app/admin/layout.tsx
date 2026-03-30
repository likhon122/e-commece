import AdminLayoutShell from "../../components/admin/AdminLayoutShell";
import AdminAccessGate from "../../components/admin/AdminAccessGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutShell>
      <AdminAccessGate>{children}</AdminAccessGate>
    </AdminLayoutShell>
  );
}
