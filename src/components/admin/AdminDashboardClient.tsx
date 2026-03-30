"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type DashboardData = {
  generatedAt: string;
  periodDays: number;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalTransactions: number;
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
  };
  salesTrend: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customer: { name: string; email: string };
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    soldCount: number;
    revenue: number;
    image: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
  }>;
  recentProducts: Array<{
    _id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    soldCount: number;
    totalStock: number;
    isActive: boolean;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    _id: string;
    orderNumber: string;
    transactionId: string;
    customer: { name: string; email: string };
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    _id: string;
    type: "order" | "user" | "product" | "transaction";
    title: string;
    description: string;
    createdAt: string;
    amount?: number;
    status?: string;
  }>;
};

type HistoryTab = "orders" | "users" | "products" | "transactions" | "activity";

const refreshMs = 15000;

const statusStyles: Record<string, "warning" | "secondary" | "default" | "success" | "danger"> = {
  pending: "warning",
  confirmed: "default",
  processing: "secondary",
  shipped: "secondary",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
  paid: "success",
  failed: "danger",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden border-[#285A48]/20 bg-white/80 backdrop-blur-xl">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#B0E4CC]/40 blur-xl" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-secondary-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-secondary-900">{value}</p>
          </div>
          <div className="rounded-xl bg-[#285A48]/10 p-2.5">
            <Icon className="h-5 w-5 text-[#285A48]" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
          <span className={isPositive ? "text-green-700" : "text-red-700"}>
            {Math.abs(change).toFixed(1)}% {isPositive ? "up" : "down"}
          </span>
          <span className="text-secondary-500">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardClient() {
  const [period, setPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const response = await fetch(
        `/api/admin/dashboard?period=${period}&historyLimit=12`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to fetch admin dashboard");
      }

      const payload = await response.json();
      setData(payload.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();

    const timer = setInterval(() => {
      fetchDashboard();
    }, refreshMs);

    return () => clearInterval(timer);
  }, [fetchDashboard]);

  const maxRevenue = useMemo(() => {
    if (!data?.salesTrend?.length) {
      return 0;
    }
    return Math.max(...data.salesTrend.map((entry) => entry.revenue), 1);
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-secondary-200 bg-white p-10 text-center shadow-sm">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#285A48]" />
        <p className="mt-3 text-secondary-600">Loading live admin intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1 text-sm">{error || "Unknown error"}</p>
        <Button
          className="mt-4"
          onClick={() => fetchDashboard(true)}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#f7fbf8] via-[#f8f4e8] to-[#eef8f3] p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#408A71]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-56 w-56 rounded-full bg-[#B0E4CC]/40 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#285A48]/15 bg-white/70 p-5 backdrop-blur">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-secondary-900">
            <Sparkles className="h-6 w-6 text-[#285A48]" />
            Executive Command Center
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            Real-time control room for users, products, orders, and payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            Live every {Math.round(refreshMs / 1000)}s
          </span>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-xl border border-[#285A48]/30 bg-white px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <Button
            onClick={() => fetchDashboard(true)}
            isLoading={refreshing}
            variant="primary"
            size="sm"
          >
            Refresh now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Revenue"
          value={formatCurrency(data.stats.totalRevenue)}
          change={data.stats.revenueChange}
          icon={DollarSign}
        />
        <StatCard
          title="Orders"
          value={data.stats.totalOrders.toLocaleString("en-BD")}
          change={data.stats.ordersChange}
          icon={ShoppingCart}
        />
        <StatCard
          title="Customers"
          value={data.stats.totalCustomers.toLocaleString("en-BD")}
          change={data.stats.customersChange}
          icon={Users}
        />
        <Card className="border-[#285A48]/20 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary-500">Products</p>
              <Package className="h-5 w-5 text-[#285A48]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-secondary-900">
              {data.stats.totalProducts.toLocaleString("en-BD")}
            </p>
            <p className="mt-3 text-sm text-secondary-500">Active catalog count</p>
          </CardContent>
        </Card>
        <Card className="border-[#285A48]/20 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary-500">Transactions</p>
              <Wallet className="h-5 w-5 text-[#285A48]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-secondary-900">
              {data.stats.totalTransactions.toLocaleString("en-BD")}
            </p>
            <p className="mt-3 text-sm text-secondary-500">Captured payment events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-[#285A48]/20 bg-white/85 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-secondary-900">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-2 rounded-2xl border border-[#285A48]/10 bg-gradient-to-b from-[#f7fffb] to-white p-4">
              {data.salesTrend.map((entry) => {
                const height = `${Math.max((entry.revenue / maxRevenue) * 100, 6)}%`;
                return (
                  <div key={entry.date} className="group flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#285A48] to-[#6dc1a0] transition-all duration-500 group-hover:from-[#1f4a3a]"
                      style={{ height }}
                      title={`${entry.label}: ${formatCurrency(entry.revenue)} (${entry.orders} orders)`}
                    />
                    <span className="text-[10px] text-secondary-500">{entry.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#285A48]/20 bg-white/85 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-secondary-900">Order Status Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.statusBreakdown.map((row) => (
              <div key={row.status} className="flex items-center justify-between rounded-xl border border-secondary-100 p-3">
                <Badge variant={statusStyles[row.status] || "secondary"}>{row.status}</Badge>
                <span className="font-semibold text-secondary-900">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[#285A48]/20 bg-white/85 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-secondary-900">Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.map((product) => (
              <div key={product._id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-secondary-900">{product.name}</p>
                  <p className="text-xs text-secondary-500">{product.soldCount} sold</p>
                </div>
                <p className="font-semibold text-[#285A48]">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#285A48]/20 bg-white/85 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-secondary-900">Recent Orders Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-secondary-900">{order.orderNumber}</p>
                  <p className="truncate text-xs text-secondary-500">{order.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary-900">{formatCurrency(order.total)}</p>
                  <Badge variant={statusStyles[order.status] || "secondary"}>{order.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#285A48]/20 bg-white/90 backdrop-blur-xl">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-secondary-900">
            <Activity className="h-5 w-5 text-[#285A48]" />
            Complete Website History
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {([
              "orders",
              "users",
              "products",
              "transactions",
              "activity",
            ] as HistoryTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${
                  activeTab === tab
                    ? "bg-[#285A48] text-white"
                    : "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "orders" && (
            <div className="space-y-2">
              {data.recentOrders.map((order) => (
                <div key={order._id} className="grid gap-2 rounded-xl border border-secondary-100 p-3 text-sm sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-secondary-900">{order.orderNumber}</p>
                    <p className="text-xs text-secondary-500">{order.customer.name}</p>
                  </div>
                  <p className="font-medium text-secondary-900">{formatCurrency(order.total)}</p>
                  <p className="text-secondary-600">{formatDate(order.createdAt)}</p>
                  <Badge variant={statusStyles[order.status] || "secondary"}>{order.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-2">
              {data.recentUsers.map((user) => (
                <div key={user._id} className="grid gap-2 rounded-xl border border-secondary-100 p-3 text-sm sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-secondary-900">{user.name}</p>
                    <p className="text-xs text-secondary-500">{user.email}</p>
                  </div>
                  <p className="text-secondary-700">Orders: {user.orderCount}</p>
                  <p className="font-medium text-secondary-900">{formatCurrency(user.totalSpent)}</p>
                  <Badge variant={user.isVerified ? "success" : "warning"}>
                    {user.isVerified ? "verified" : "unverified"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-2">
              {data.recentProducts.map((product) => (
                <div key={product._id} className="grid gap-2 rounded-xl border border-secondary-100 p-3 text-sm sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-secondary-900">{product.name}</p>
                    <p className="truncate text-xs text-secondary-500">{product.category}</p>
                  </div>
                  <p className="text-secondary-700">Stock: {product.totalStock}</p>
                  <p className="font-medium text-secondary-900">{formatCurrency(product.price)}</p>
                  <Badge variant={product.isActive ? "success" : "danger"}>
                    {product.isActive ? "active" : "inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-2">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="grid gap-2 rounded-xl border border-secondary-100 p-3 text-sm sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-secondary-900">{transaction.transactionId}</p>
                    <p className="text-xs text-secondary-500">{transaction.orderNumber}</p>
                  </div>
                  <p className="text-secondary-700 capitalize">{transaction.paymentMethod}</p>
                  <p className="font-medium text-secondary-900">{formatCurrency(transaction.amount)}</p>
                  <Badge variant={statusStyles[transaction.paymentStatus] || "secondary"}>
                    {transaction.paymentStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <div key={activity._id} className="rounded-xl border border-secondary-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-secondary-900">{activity.title}</p>
                    <Badge variant="secondary">{activity.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-secondary-600">{activity.description}</p>
                  <p className="mt-1 text-xs text-secondary-500">{toRelative(activity.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200 bg-white/70 px-4 py-3 text-xs text-secondary-600">
        <p>Last synchronized: {formatDate(data.generatedAt)}</p>
        <p>Dashboard period: {data.periodDays} days</p>
        <Link href="/admin/orders" className="font-semibold text-[#285A48] hover:underline">
          Open order manager
        </Link>
      </div>
    </div>
  );
}
