"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { Badge, Button } from "@/components/ui";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface OrderItem {
  productName: string;
  productImage: string;
  quantity: number;
}

interface AccountOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: OrderItem[];
}

const statusColors: Record<
  OrderStatus,
  "default" | "success" | "warning" | "secondary"
> = {
  pending: "warning",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "success",
  cancelled: "secondary",
  refunded: "secondary",
};

const paymentColors: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "secondary"
> = {
  pending: "warning",
  paid: "success",
  failed: "secondary",
  refunded: "secondary",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/orders?limit=50", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          setError(json.error || "Failed to load orders.");
          setOrders([]);
          return;
        }

        setOrders(Array.isArray(json.data) ? json.data : []);
      } catch {
        setError("Unable to fetch orders right now.");
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">My Orders</h1>
        <p className="text-secondary-600">Track and manage your orders</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-secondary-200 bg-white p-12 text-center text-secondary-600">
          Loading your orders...
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="rounded-xl border border-secondary-200 bg-white p-12 text-center">
          <Package className="mx-auto h-16 w-16 text-secondary-300" />
          <h2 className="mt-4 text-lg font-semibold text-secondary-900">
            No orders yet
          </h2>
          <p className="mt-2 text-secondary-600">
            You have not placed any orders. Start shopping!
          </p>
          <a href="/products">
            <Button className="mt-6">Browse Products</Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => (
            <div
              key={order._id}
              className="rounded-xl border border-secondary-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-secondary-900">
                      {order.orderNumber}
                    </span>
                    <Badge
                      variant={statusColors[order.status] || "secondary"}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                    <Badge
                      variant={paymentColors[order.paymentStatus] || "secondary"}
                      className="capitalize"
                    >
                      payment: {order.paymentStatus}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-secondary-500">
                    Placed on {new Date(order.createdAt).toLocaleString()} · {order.items.length} item(s)
                  </p>
                </div>

                <p className="text-lg font-semibold text-secondary-900">
                  BDT {Number(order.total || 0).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto">
                {order.items.slice(0, 4).map((item, index) => (
                  <div
                    key={`${order._id}-${index}`}
                    className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary-100"
                    title={`${item.productName} x ${item.quantity}`}
                  >
                    {item.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
