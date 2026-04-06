"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  Search,
  ShieldCheck,
  Truck,
  UserCircle2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PremiumSectionLoading,
} from "@/components/ui";
import { fetchJson, formatCurrency, formatDate } from "./utils";
import {
  buildDeliveryTimeline,
  getNextDeliveryStatus,
  getStatusLabel,
  type TrackableOrderStatus,
  type TrackingHistoryPoint,
} from "@/lib/orders/delivery-tracking";

type OrdersResponse = {
  orders: Array<{
    id: string;
    orderNumber: string;
    customer: {
      id?: string;
      name: string;
      email?: string;
      avatar?: string;
    };
    itemCount: number;
    total: number;
    paymentMethod?: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentDetails?: {
      transactionId?: string;
      bankTransactionId?: string;
      cardType?: string;
      cardBrand?: string;
      validationId?: string;
    };
    status: TrackableOrderStatus;
    trackingNumber?: string;
    notes?: string;
    shippingAddress?: {
      name?: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    statusHistory?: TrackingHistoryPoint[];
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
  refunded: "secondary",
  paid: "success",
  failed: "danger",
};

type DraftState = {
  trackingNumber: string;
  statusNote: string;
  notes: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  isRead: boolean;
  createdAt: string;
};

function getStatusIcon(status: string) {
  if (status === "delivered") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "shipped") return <Truck className="h-4 w-4" />;
  if (status === "processing") return <Package className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

export default function AdminOrdersPageClient() {
  const [orders, setOrders] = useState<OrdersResponse["orders"]>([]);
  const [query, setQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Record<string, { type: "success" | "error"; text: string }>
  >({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    let stream: EventSource | null = null;

    const loadNotifications = async () => {
      try {
        const response = await fetchJson<{
          data: NotificationItem[];
          unreadCount: number;
        }>("/api/notifications?limit=12");
        setNotifications(response.data || []);
        setUnreadCount(Number(response.unreadCount || 0));
      } catch {
        // Non-blocking for orders UI.
      }
    };

    const startRealtime = () => {
      stream = new EventSource("/api/notifications/stream");
      stream.addEventListener("notification", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as NotificationItem;
          setNotifications((current) => [payload, ...current].slice(0, 20));
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

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      // Keep UI unchanged on failure.
    }
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const paymentStatus = order.paymentStatus.toLowerCase();
      return paymentStatus !== "pending" && paymentStatus !== "failed";
    });
  }, [orders]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return visibleOrders;

    return visibleOrders.filter((order) =>
      [
        order.orderNumber,
        order.customer.name,
        order.customer.email,
        order.shippingAddress?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [visibleOrders, query]);

  const formatPaymentMethod = (value?: string) => {
    if (!value) return "N/A";
    if (value.toLowerCase() === "sslcommerz") return "SSLCommerz";
    if (value.toLowerCase() === "bkash") return "bKash";
    if (value.toLowerCase() === "cod") return "Cash on Delivery";
    return value;
  };

  const transactionRows = (order: OrdersResponse["orders"][number]) => [
    { label: "Transaction ID", value: order.paymentDetails?.transactionId },
    { label: "Bank Transaction", value: order.paymentDetails?.bankTransactionId },
    { label: "Validation ID", value: order.paymentDetails?.validationId },
    { label: "Card Type", value: order.paymentDetails?.cardType },
    { label: "Card Brand", value: order.paymentDetails?.cardBrand },
  ].filter((row) => Boolean(row.value));

  const getDraft = (order: OrdersResponse["orders"][number]): DraftState => {
    return (
      drafts[order.id] || {
        trackingNumber: order.trackingNumber || "",
        statusNote: "",
        notes: order.notes || "",
      }
    );
  };

  const setDraftField = (
    orderId: string,
    field: keyof DraftState,
    value: string,
    seed?: DraftState,
  ) => {
    setDrafts((current) => {
      const base = current[orderId] ||
        seed || {
          trackingNumber: "",
          statusNote: "",
          notes: "",
        };
      return {
        ...current,
        [orderId]: {
          ...base,
          [field]: value,
        },
      };
    });
  };

  const patchOrder = async (
    order: OrdersResponse["orders"][number],
    payload: {
      status?: string;
      trackingNumber?: string;
      notes?: string;
      statusNote?: string;
    },
  ) => {
    setSavingOrderId(order.id);
    setMessages((prev) => ({ ...prev, [order.id]: { type: "success", text: "" } }));

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: order.id, ...payload }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to update order");
      }

      const updatedOrder = json.order as OrdersResponse["orders"][number];
      setOrders((current) =>
        current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)),
      );

      setDrafts((current) => ({
        ...current,
        [order.id]: {
          trackingNumber: updatedOrder.trackingNumber || "",
          statusNote: "",
          notes: updatedOrder.notes || "",
        },
      }));

      setMessages((prev) => ({
        ...prev,
        [order.id]: { type: "success", text: "Tracking updated successfully." },
      }));
    } catch (patchError) {
      setMessages((prev) => ({
        ...prev,
        [order.id]: {
          type: "error",
          text: patchError instanceof Error ? patchError.message : "Unable to update order.",
        },
      }));
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleAdvanceStage = async (order: OrdersResponse["orders"][number]) => {
    const nextStatus = getNextDeliveryStatus(order.status);
    if (!nextStatus) {
      setMessages((prev) => ({
        ...prev,
        [order.id]: {
          type: "error",
          text: "No next delivery stage available for this order.",
        },
      }));
      return;
    }

    const draft = getDraft(order);
    await patchOrder(order, {
      status: nextStatus,
      trackingNumber: draft.trackingNumber,
      notes: draft.notes,
      statusNote:
        draft.statusNote.trim() || `Stage advanced to ${getStatusLabel(nextStatus)}.`,
    });
  };

  const handleSaveTracking = async (order: OrdersResponse["orders"][number]) => {
    const draft = getDraft(order);
    await patchOrder(order, {
      trackingNumber: draft.trackingNumber,
      notes: draft.notes,
      statusNote: draft.statusNote,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-[radial-gradient(circle_at_top_right,_#dcf8e8,_transparent_50%),linear-gradient(135deg,#ffffff_0%,#f4fcf7_48%,#eaf8f1_100%)] p-6 shadow-[0_20px_55px_-36px_rgba(14,58,43,0.55)]">
        <h1 className="text-2xl font-bold text-secondary-900">Advanced Delivery Command Center</h1>
        <p className="mt-1 text-sm text-secondary-600">
          Paid and refunded orders only. Pending and failed payment orders stay hidden by policy.
        </p>
      </div>

      <Card className="border-[#285A48]/20 bg-white/95">
        <CardHeader className="space-y-4">
          <CardTitle>Tracked Orders</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="Search order, name, email, phone"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-2xl border border-[#d4efe1] bg-[linear-gradient(135deg,#ffffff_0%,#f5fcf8_100%)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#285A48]" />
                <p className="text-sm font-semibold text-secondary-900">Admin Live Notifications</p>
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
              {notifications.slice(0, 5).map((notification) => (
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
                  <p className="mt-1 text-[10px] opacity-80">{formatDate(notification.createdAt)}</p>
                </div>
              ))}
              {!notifications.length ? (
                <p className="rounded-xl border border-dashed border-secondary-200 px-3 py-2 text-xs text-secondary-500">
                  No notifications yet.
                </p>
              ) : null}
            </div>
          </div>

          {loading && (
            <PremiumSectionLoading
              title="Loading order operations"
              subtitle="Syncing payment-cleared orders, tracking stages, and fulfillment controls."
              className="min-h-[260px] flex items-center justify-center"
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="space-y-4">
              {filtered.map((order) => {
                const timeline = buildDeliveryTimeline(
                  order.status,
                  order.statusHistory || [],
                );
                const draft = getDraft(order);
                const nextStatus = getNextDeliveryStatus(order.status);
                const trackingFormatValid =
                  !draft.trackingNumber || /^[A-Za-z0-9-]{6,40}$/.test(draft.trackingNumber);
                const needsTrackingForNextStage =
                  nextStatus === "shipped" || nextStatus === "delivered";
                const canAdvanceStage =
                  Boolean(nextStatus) &&
                  trackingFormatValid &&
                  (!needsTrackingForNextStage || Boolean(draft.trackingNumber.trim()));
                const message = messages[order.id];

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-secondary-100 bg-white p-4 shadow-[0_14px_28px_-24px_rgba(17,43,34,0.7)]"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr_1fr_auto_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-secondary-900">{order.orderNumber}</p>
                        <p className="truncate text-xs text-secondary-500">{order.customer.name}</p>
                      </div>
                      <p className="text-secondary-700">{formatCurrency(order.total)}</p>
                      <p className="text-secondary-500">{formatDate(order.createdAt)}</p>
                      <Badge variant={statusMap[order.paymentStatus] || "secondary"}>{order.paymentStatus}</Badge>
                      <Badge variant={statusMap[order.status] || "secondary"}>{order.status}</Badge>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId((current) =>
                            current === order.id ? null : order.id,
                          )
                        }
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-secondary-200 px-3 py-1.5 text-xs font-medium text-secondary-700 transition-colors hover:border-[#285A48]/40 hover:text-[#1f4d3d]"
                      >
                        Deep View
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {expandedOrderId === order.id ? (
                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                        <div className="space-y-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-[#0f2d24] to-[#1e4f3f] p-4 text-white">
                              <div className="mb-3 flex items-center gap-2">
                                <UserCircle2 className="h-4 w-4 text-emerald-200" />
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/90">
                                  Customer Profile
                                </p>
                              </div>
                              <div className="space-y-2 text-xs">
                                <p className="font-semibold text-white">{order.customer.name}</p>
                                <p className="text-emerald-100/90">{order.customer.email || "Email unavailable"}</p>
                                <p className="text-emerald-100/90">{order.shippingAddress?.phone || "Phone unavailable"}</p>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-emerald-100/95">
                                  {[
                                    order.shippingAddress?.street,
                                    order.shippingAddress?.city,
                                    order.shippingAddress?.state,
                                    order.shippingAddress?.postalCode,
                                    order.shippingAddress?.country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "Address unavailable"}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-[#123227] to-[#245645] p-4 text-white">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <ReceiptText className="h-4 w-4 text-emerald-200" />
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/90">
                                    Payment Transaction
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-emerald-100">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  {formatPaymentMethod(order.paymentMethod)}
                                </div>
                              </div>

                              <div className="space-y-2 rounded-xl border border-white/15 bg-white/10 p-3 text-xs">
                                {transactionRows(order).length > 0 ? (
                                  transactionRows(order).map((row) => (
                                    <div
                                      key={`${order.id}-${row.label}`}
                                      className="grid grid-cols-[130px_minmax(0,1fr)] gap-2"
                                    >
                                      <span className="text-emerald-100/80">{row.label}</span>
                                      <span className="truncate font-medium text-white">{row.value}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-emerald-100/80">
                                    No transaction references found for this payment.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-secondary-200 bg-white p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-500">
                                  Delivery Path Intelligence
                                </p>
                                <p className="mt-1 text-sm text-secondary-700">
                                  Full journey from order creation to successful delivery receipt.
                                </p>
                              </div>
                              <div className="rounded-xl border border-[#d4efe1] bg-[#f3fbf7] px-3 py-1.5 text-xs font-medium text-[#285A48]">
                                Current: {getStatusLabel(order.status)}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {timeline.map((stage, index) => (
                                <div key={`${order.id}-${stage.status}`} className="relative flex gap-3">
                                  <div className="relative flex flex-col items-center">
                                    <div
                                      className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                                        stage.isCompleted
                                          ? "border-emerald-600 bg-emerald-600 text-white"
                                          : "border-secondary-300 bg-white text-secondary-500"
                                      } ${stage.isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                                    >
                                      {getStatusIcon(stage.status)}
                                    </div>
                                    {index < timeline.length - 1 ? (
                                      <div
                                        className={`mt-1 h-9 w-[2px] ${
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
                                        {formatDate(String(stage.at))}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-[11px] text-secondary-400">Awaiting stage update</p>
                                    )}
                                    {stage.note ? (
                                      <p className="mt-1 rounded-lg bg-secondary-50 px-2 py-1 text-[11px] text-secondary-600">
                                        {stage.note}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {order.status === "cancelled" || order.status === "refunded" ? (
                              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                This order is marked as {order.status}. Delivery path is closed.
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-[#d4efe1] bg-gradient-to-br from-white to-[#f2fbf6] p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-[#285A48]" />
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#285A48]">
                                Dispatch Controls
                              </p>
                            </div>

                            <div className="space-y-3">
                              <Input
                                label="Tracking Number"
                                placeholder="Enter courier tracking number"
                                value={draft.trackingNumber}
                                onChange={(event) =>
                                  setDraftField(order.id, "trackingNumber", event.target.value, draft)
                                }
                              />
                              {!trackingFormatValid ? (
                                <p className="-mt-1 text-xs text-red-600">
                                  Tracking number must be 6-40 characters and only letters, numbers, hyphen.
                                </p>
                              ) : null}

                              <div>
                                <label className="mb-2 block text-sm font-medium text-[#091413]">
                                  Internal Delivery Note
                                </label>
                                <textarea
                                  className="min-h-[86px] w-full rounded-xl border-2 border-[#B0E4CC] px-4 py-2 text-sm text-[#091413] outline-none transition-all duration-200 focus:border-[#408A71] focus:ring-2 focus:ring-[#B0E4CC]/60"
                                  placeholder="Add scan update, rider handoff, or delivery remark"
                                  value={draft.statusNote}
                                  onChange={(event) =>
                                    setDraftField(order.id, "statusNote", event.target.value, draft)
                                  }
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium text-[#091413]">
                                  Admin Notes
                                </label>
                                <textarea
                                  className="min-h-[76px] w-full rounded-xl border-2 border-[#B0E4CC] px-4 py-2 text-sm text-[#091413] outline-none transition-all duration-200 focus:border-[#408A71] focus:ring-2 focus:ring-[#B0E4CC]/60"
                                  placeholder="Operational notes for this order"
                                  value={draft.notes}
                                  onChange={(event) =>
                                    setDraftField(order.id, "notes", event.target.value, draft)
                                  }
                                />
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleSaveTracking(order)}
                                  disabled={!trackingFormatValid || savingOrderId === order.id}
                                  isLoading={savingOrderId === order.id}
                                >
                                  Save Notes
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={() => handleAdvanceStage(order)}
                                  disabled={!canAdvanceStage || savingOrderId === order.id}
                                  isLoading={savingOrderId === order.id}
                                  className="gap-2"
                                >
                                  Advance Stage
                                  {nextStatus ? <ArrowRight className="h-4 w-4" /> : null}
                                </Button>
                              </div>

                              {nextStatus ? (
                                <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-white px-3 py-2 text-xs text-emerald-800 shadow-[0_10px_24px_-20px_rgba(16,121,89,0.9)]">
                                  <p className="font-semibold uppercase tracking-[0.08em] text-emerald-700">
                                    Next Step Highlight
                                  </p>
                                  <p className="mt-1">
                                    Move to <span className="font-bold">{getStatusLabel(nextStatus)}</span>
                                  </p>
                                </div>
                              ) : (
                                <p className="rounded-xl border border-secondary-200 bg-secondary-50 px-3 py-2 text-xs text-secondary-600">
                                  No further stage available. This order is at the final path state.
                                </p>
                              )}

                              {needsTrackingForNextStage && !draft.trackingNumber.trim() ? (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                  Add tracking number before advancing to {getStatusLabel(nextStatus!)}.
                                </p>
                              ) : null}

                              {order.trackingNumber ? (
                                <div className="flex items-center gap-2 rounded-xl border border-[#d4efe1] bg-white px-3 py-2 text-xs text-secondary-700">
                                  <MapPin className="h-3.5 w-3.5 text-[#285A48]" />
                                  Tracking: <span className="font-semibold">{order.trackingNumber}</span>
                                </div>
                              ) : null}

                              {message?.text ? (
                                <p
                                  className={`rounded-xl px-3 py-2 text-xs ${
                                    message.type === "error"
                                      ? "border border-red-200 bg-red-50 text-red-700"
                                      : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {message.text}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!filtered.length && (
                <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center text-secondary-500">
                  No paid/refunded orders found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
