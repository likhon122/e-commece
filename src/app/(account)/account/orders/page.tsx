"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CircleCheckBig,
  CircleDashed,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge, Button, PremiumSectionLoading } from "@/components/ui";
import {
  buildDeliveryTimeline,
  getStatusLabel,
  type TrackingHistoryPoint,
  type TrackableOrderStatus,
} from "@/lib/orders/delivery-tracking";

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
  status: TrackableOrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  trackingNumber?: string;
  statusHistory?: TrackingHistoryPoint[];
  paymentDetails?: {
    transactionId?: string;
    bankTransactionId?: string;
    cardType?: string;
    cardBrand?: string;
    validationId?: string;
  };
  createdAt: string;
  items: OrderItem[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  isRead: boolean;
  createdAt: string;
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    let stream: EventSource | null = null;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=10", {
          cache: "no-store",
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          return;
        }

        setNotifications(Array.isArray(json.data) ? json.data : []);
        setUnreadCount(Number(json.unreadCount || 0));
      } catch {
        // Non-blocking for order page.
      }
    };

    const startRealtime = () => {
      stream = new EventSource("/api/notifications/stream");
      stream.addEventListener("notification", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as NotificationItem;
          setNotifications((current) => [payload, ...current].slice(0, 15));
          setUnreadCount((count) => count + 1);
        } catch {
          // Ignore malformed payloads.
        }
      });
    };

    loadNotifications();
    startRealtime();

    return () => {
      if (stream) {
        stream.close();
      }
    };
  }, []);

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAll: true }),
      });

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep current UI state on failure.
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  const getPaymentStatusTone = (status: PaymentStatus) => {
    if (status === "paid") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    if (status === "pending") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }
    if (status === "failed") {
      return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  const formatPaymentMethod = (value?: string) => {
    if (!value) return "N/A";
    if (value.toLowerCase() === "sslcommerz") return "SSLCommerz";
    if (value.toLowerCase() === "bkash") return "bKash";
    if (value.toLowerCase() === "cod") return "Cash on Delivery";
    return value;
  };

  const transactionRows = (order: AccountOrder) => [
    { label: "Transaction ID", value: order.paymentDetails?.transactionId },
    { label: "Bank Transaction", value: order.paymentDetails?.bankTransactionId },
    { label: "Validation ID", value: order.paymentDetails?.validationId },
    { label: "Card Type", value: order.paymentDetails?.cardType },
    { label: "Card Brand", value: order.paymentDetails?.cardBrand },
  ].filter((row) => Boolean(row.value));

  const getStageIcon = (status: string, completed: boolean) => {
    const tone = completed ? "text-white" : "text-secondary-400";
    if (status === "delivered") return <CircleCheckBig className={`h-3.5 w-3.5 ${tone}`} />;
    if (status === "shipped") return <Truck className={`h-3.5 w-3.5 ${tone}`} />;
    if (status === "processing") return <Package className={`h-3.5 w-3.5 ${tone}`} />;
    return <CircleDashed className={`h-3.5 w-3.5 ${tone}`} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">My Orders</h1>
        <p className="text-secondary-600">Track and manage your orders</p>
      </div>

      <div className="rounded-2xl border border-[#d4efe1] bg-[linear-gradient(135deg,#ffffff_0%,#f5fcf8_100%)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#285A48]" />
            <p className="text-sm font-semibold text-secondary-900">Live Order Notifications</p>
            <span className="rounded-full bg-[#285A48] px-2 py-0.5 text-[11px] font-semibold text-white">
              {unreadCount} unread
            </span>
          </div>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-[#285A48] underline-offset-4 hover:underline"
          >
            Mark all read
          </button>
        </div>

        <div className="space-y-2">
          {notifications.slice(0, 4).map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border px-3 py-2 text-xs ${
                notification.isRead
                  ? "border-secondary-200 bg-white text-secondary-600"
                  : "border-[#b8e8cf] bg-[#effaf4] text-[#1f4d3d]"
              }`}
            >
              <p className="font-semibold">{notification.title}</p>
              <p className="mt-0.5">{notification.message}</p>
              <p className="mt-1 text-[10px] opacity-80">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {!notifications.length ? (
            <p className="rounded-xl border border-dashed border-secondary-200 px-3 py-2 text-xs text-secondary-500">
              No notifications yet.
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <PremiumSectionLoading
          title="Loading your orders"
          subtitle="Fetching order history, payment details, and tracking timeline."
          className="min-h-[250px] flex items-center justify-center"
        />
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
              className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-[0_8px_30px_-20px_rgba(20,40,30,0.35)]"
            >
              <div className="bg-gradient-to-r from-[#f6fff7] via-white to-[#eef9f2] p-6">
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

                {order.paymentStatus === "pending" ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                    <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">
                      Payment is pending. Your order is waiting for gateway confirmation.
                    </p>
                  </div>
                ) : null}

                {order.paymentStatus === "failed" ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">
                      Payment failed. Please retry from checkout or contact support with your order number.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 border-t border-secondary-100 bg-white p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-500">
                    Ordered Items
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {order.items.slice(0, 6).map((item, index) => (
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

                <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-[#0f2d24] to-[#1e4f3f] p-4 text-white shadow-[0_14px_40px_-26px_rgba(3,20,14,0.8)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/90">
                      Payment Ledger
                    </p>
                    <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-100" />
                    <span className="text-sm text-emerald-50">
                      {formatPaymentMethod(order.paymentMethod)}
                    </span>
                    <span
                      className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getPaymentStatusTone(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl border border-white/15 bg-white/10 p-3">
                    {transactionRows(order).length > 0 ? (
                      transactionRows(order).map((row) => (
                        <div
                          key={`${order._id}-${row.label}`}
                          className="grid grid-cols-[120px_minmax(0,1fr)] gap-2 text-xs"
                        >
                          <span className="text-emerald-100/80">{row.label}</span>
                          <span className="truncate font-medium text-white">{row.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-emerald-100/80">
                        {order.paymentStatus === "paid" ? (
                          <CircleCheckBig className="h-3.5 w-3.5 text-emerald-200" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" />
                        )}
                        No transaction reference available yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary-100 bg-[#fbfefc] p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-500">
                      Delivery Tracking Path
                    </p>
                    <p className="mt-1 text-sm text-secondary-700">
                      End-to-end path from order confirmation to final delivery receipt.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d4efe1] bg-white px-3 py-1.5 text-xs font-medium text-[#285A48]">
                    Current: {getStatusLabel(order.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const timeline = buildDeliveryTimeline(order.status, order.statusHistory || []);
                    const nextStage = timeline.find((stage) => !stage.isCompleted);

                    return (
                      <>
                        {nextStage ? (
                          <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-white px-3 py-2 text-xs text-emerald-800 shadow-[0_10px_24px_-20px_rgba(16,121,89,0.9)]">
                            <p className="font-semibold uppercase tracking-[0.08em] text-emerald-700">
                              Next Step Highlight
                            </p>
                            <p className="mt-1">
                              Upcoming stage: <span className="font-bold">{nextStage.label}</span>
                            </p>
                          </div>
                        ) : null}

                        {timeline.map((stage, index, allStages) => (
                      <div key={`${order._id}-${stage.status}`} className="relative flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border ${
                              stage.isCompleted
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-secondary-300 bg-white"
                            } ${stage.isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                          >
                            {getStageIcon(stage.status, stage.isCompleted)}
                          </div>
                          {index < allStages.length - 1 ? (
                            <div
                              className={`mt-1 h-8 w-[2px] ${
                                stage.isCompleted ? "bg-emerald-500" : "bg-secondary-200"
                              }`}
                            />
                          ) : null}
                        </div>

                        <div className="pb-2">
                          <p className="text-sm font-semibold text-secondary-900">{stage.label}</p>
                          <p className="text-xs text-secondary-500">{stage.description}</p>
                          {stage.at ? (
                            <p className="mt-1 text-[11px] text-secondary-600">
                              {new Date(stage.at).toLocaleString()}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-secondary-400">Awaiting update</p>
                          )}
                          {stage.note ? (
                            <p className="mt-1 rounded-lg bg-secondary-50 px-2 py-1 text-[11px] text-secondary-600">
                              {stage.note}
                            </p>
                          ) : null}
                        </div>
                      </div>
                        ))}
                      </>
                    );
                  })()}
                </div>

                {order.trackingNumber ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d4efe1] bg-white px-3 py-2 text-xs text-secondary-700">
                    <MapPin className="h-3.5 w-3.5 text-[#285A48]" />
                    Courier Tracking: <span className="font-semibold">{order.trackingNumber}</span>
                  </div>
                ) : null}

                {order.status === "cancelled" || order.status === "refunded" ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    This order is marked as {order.status}. Delivery path is closed.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
