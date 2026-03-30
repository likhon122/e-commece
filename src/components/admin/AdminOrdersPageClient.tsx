"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { fetchJson, formatCurrency, formatDate } from "./utils";

type OrdersResponse = {
  orders: Array<{
    id: string;
    orderNumber: string;
    customer: { name: string; email: string };
    itemCount: number;
    total: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }>;
};

const statusMap: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "default",
  processing: "secondary",
  shipped: "secondary",
  delivered: "success",
  cancelled: "danger",
  paid: "success",
  failed: "danger",
};

export default function AdminOrdersPageClient() {
  const [orders, setOrders] = useState<OrdersResponse["orders"]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchJson<OrdersResponse>("/api/admin/orders?limit=100");
        setOrders(payload.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) =>
      [order.orderNumber, order.customer.name, order.customer.email]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [orders, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">Orders Operations</h1>
        <p className="mt-1 text-sm text-secondary-600">Real-time monitoring for order and payment lifecycle.</p>
      </div>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardHeader className="space-y-4">
          <CardTitle>All Orders</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="Search order, name, email"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-secondary-600">Loading orders...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 rounded-xl border border-secondary-100 p-4 text-sm sm:grid-cols-[1.2fr_1fr_1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-secondary-900">{order.orderNumber}</p>
                    <p className="truncate text-xs text-secondary-500">{order.customer.name}</p>
                  </div>
                  <p className="text-secondary-700">{formatCurrency(order.total)}</p>
                  <p className="text-secondary-500">{formatDate(order.createdAt)}</p>
                  <Badge variant={statusMap[order.paymentStatus] || "secondary"}>{order.paymentStatus}</Badge>
                  <Badge variant={statusMap[order.status] || "secondary"}>{order.status}</Badge>
                </div>
              ))}
              {!filtered.length && (
                <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center text-secondary-500">
                  No orders found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
