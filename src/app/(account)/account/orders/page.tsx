import Link from "next/link";
import { Package, ChevronRight, Eye } from "lucide-react";
import { Badge, Button } from "@/components/ui";

const orders = [
  {
    id: "MTH-ABC123",
    date: "2026-03-25",
    status: "confirmed",
    total: 2500,
    items: 3,
  },
  {
    id: "MTH-DEF456",
    date: "2026-03-20",
    status: "delivered",
    total: 4200,
    items: 2,
  },
  {
    id: "MTH-GHI789",
    date: "2026-03-15",
    status: "shipped",
    total: 1800,
    items: 1,
  },
];

const statusColors: Record<
  string,
  "default" | "success" | "warning" | "secondary"
> = {
  pending: "warning",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "success",
  cancelled: "secondary",
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">My Orders</h1>
        <p className="text-secondary-600">Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-secondary-200 bg-white p-12 text-center">
          <Package className="mx-auto h-16 w-16 text-secondary-300" />
          <h2 className="mt-4 text-lg font-semibold text-secondary-900">
            No orders yet
          </h2>
          <p className="mt-2 text-secondary-600">
            You haven&apos;t placed any orders. Start shopping!
          </p>
          <Link href="/products">
            <Button className="mt-6">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-secondary-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-secondary-900">
                      {order.id}
                    </span>
                    <Badge
                      variant={statusColors[order.status]}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-secondary-500">
                    Placed on {order.date} · {order.items} item(s)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-secondary-900">
                    ৳{order.total.toLocaleString()}
                  </p>
                  <Link href={`/account/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {[1, 2, 3].slice(0, order.items).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 w-16 flex-shrink-0 rounded-lg bg-secondary-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
