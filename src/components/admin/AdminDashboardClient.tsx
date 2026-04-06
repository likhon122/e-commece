"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CreditCard,
  DollarSign,
  Eye,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PremiumFullPageLoading,
} from "@/components/ui";

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

const CHART_COLORS = {
  primary: "#285A48",
  secondary: "#408A71",
  accent: "#6dc1a0",
  light: "#B0E4CC",
  gradient: ["#285A48", "#408A71", "#6dc1a0", "#8ad4ad", "#B0E4CC"],
};

const PIE_COLORS = ["#285A48", "#408A71", "#6dc1a0", "#8ad4ad", "#B0E4CC", "#d4f0e3", "#f0b429", "#e74c3c"];

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
  accentColor = "from-[#285A48] to-[#408A71]",
  subtitle,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  subtitle?: string;
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className="group relative overflow-hidden border-0 bg-white shadow-[0_4px_24px_-4px_rgba(40,90,72,0.15)] transition-all duration-500 hover:shadow-[0_8px_40px_-8px_rgba(40,90,72,0.25)] hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#B0E4CC]/30 to-transparent blur-2xl group-hover:scale-110 transition-transform" />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-secondary-900">{value}</p>
            {subtitle && <p className="text-xs text-secondary-500">{subtitle}</p>}
          </div>
          <div className={`rounded-2xl bg-gradient-to-br ${accentColor} p-3 shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}>
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
            <span className="text-xs text-secondary-500">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#B0E4CC]/50 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-secondary-700">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="mt-1 text-sm font-bold text-[#285A48]">
            {entry.name === "revenue" ? formatCurrency(entry.value) : `${entry.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
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

  const pieChartData = useMemo(() => {
    if (!data?.statusBreakdown?.length) return [];
    return data.statusBreakdown.map((item) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count,
    }));
  }, [data]);

  const barChartData = useMemo(() => {
    if (!data?.topProducts?.length) return [];
    return data.topProducts.slice(0, 6).map((product) => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name,
      revenue: product.revenue,
      sold: product.soldCount,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="py-4">
        <PremiumFullPageLoading
          title="Loading executive dashboard"
          subtitle="Fetching KPIs, real-time signals, and strategic commerce highlights."
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Activity className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-red-800">Dashboard Unavailable</h3>
        <p className="mt-2 text-sm text-red-600">{error || "Unknown error occurred"}</p>
        <Button
          className="mt-6"
          onClick={() => fetchDashboard(true)}
          variant="primary"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-8 overflow-hidden">
      {/* Premium Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#f7fbf8] via-[#f8f4e8]/50 to-[#eef8f3]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-96 w-96 rounded-full bg-[#408A71]/10 blur-[100px]" />
      <div className="pointer-events-none fixed -right-40 top-40 h-96 w-96 rounded-full bg-[#B0E4CC]/30 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#285A48]/5 blur-[120px]" />

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#285A48]/10 bg-white/80 p-6 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.15)] backdrop-blur-xl">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-secondary-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              Executive Command Center
            </h1>
            <p className="mt-2 text-sm text-secondary-600">
              Real-time analytics • Live monitoring • {data.periodDays}-day insights
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-700">Live • {Math.round(refreshMs / 1000)}s</span>
            </div>

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-xl border-2 border-[#285A48]/20 bg-white px-4 py-2.5 text-sm font-medium text-secondary-700 shadow-sm transition-all hover:border-[#285A48]/40 focus:border-[#285A48] focus:outline-none focus:ring-4 focus:ring-[#285A48]/10"
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
              className="rounded-xl shadow-lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data.stats.totalRevenue)}
            change={data.stats.revenueChange}
            icon={DollarSign}
            accentColor="from-emerald-500 to-emerald-600"
            subtitle="Gross sales value"
          />
          <StatCard
            title="Orders"
            value={data.stats.totalOrders.toLocaleString("en-BD")}
            change={data.stats.ordersChange}
            icon={ShoppingCart}
            accentColor="from-blue-500 to-blue-600"
            subtitle="Total orders placed"
          />
          <StatCard
            title="Customers"
            value={data.stats.totalCustomers.toLocaleString("en-BD")}
            change={data.stats.customersChange}
            icon={Users}
            accentColor="from-violet-500 to-violet-600"
            subtitle="Registered users"
          />
          <StatCard
            title="Products"
            value={data.stats.totalProducts.toLocaleString("en-BD")}
            icon={Package}
            accentColor="from-amber-500 to-amber-600"
            subtitle="Active catalog items"
          />
          <StatCard
            title="Transactions"
            value={data.stats.totalTransactions.toLocaleString("en-BD")}
            icon={CreditCard}
            accentColor="from-rose-500 to-rose-600"
            subtitle="Payment events"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {/* Revenue Trend Area Chart */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#285A48]" />
                Revenue & Orders Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: CHART_COLORS.primary, strokeWidth: 0, r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Pie Chart */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-[#285A48]" />
                Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "#9CA3AF", strokeWidth: 1 }}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} orders`, "Count"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Bar Chart */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Boxes className="h-5 w-5 text-[#285A48]" />
              Top Products Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? formatCurrency(value) : `${value} sold`,
                      name === "revenue" ? "Revenue" : "Units Sold"
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="sold"
                    fill={CHART_COLORS.accent}
                    radius={[4, 4, 0, 0]}
                    name="Units Sold"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/orders" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-[#285A48]/10 bg-white/90 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-100/50 blur-xl" />
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <p className="mt-3 text-2xl font-bold text-secondary-900">{data.recentOrders.length}</p>
              <p className="text-sm text-secondary-600">Recent Orders</p>
              <span className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 group-hover:underline">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/customers" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-[#285A48]/10 bg-white/90 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-violet-100/50 blur-xl" />
              <Users className="h-8 w-8 text-violet-500" />
              <p className="mt-3 text-2xl font-bold text-secondary-900">{data.recentUsers.length}</p>
              <p className="text-sm text-secondary-600">Recent Customers</p>
              <span className="mt-2 inline-flex items-center text-xs font-medium text-violet-600 group-hover:underline">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/products" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-[#285A48]/10 bg-white/90 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-100/50 blur-xl" />
              <Package className="h-8 w-8 text-amber-500" />
              <p className="mt-3 text-2xl font-bold text-secondary-900">{data.recentProducts.length}</p>
              <p className="text-sm text-secondary-600">Recent Products</p>
              <span className="mt-2 inline-flex items-center text-xs font-medium text-amber-600 group-hover:underline">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/analytics" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-[#285A48]/10 bg-white/90 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100/50 blur-xl" />
              <Wallet className="h-8 w-8 text-emerald-500" />
              <p className="mt-3 text-2xl font-bold text-secondary-900">{data.recentTransactions.length}</p>
              <p className="text-sm text-secondary-600">Recent Transactions</p>
              <span className="mt-2 inline-flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                View analytics <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>

        {/* Recent Orders & Top Products */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#285A48]" />
                  Recent Orders
                </span>
                <Link href="/admin/orders" className="text-xs font-medium text-[#285A48] hover:underline">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-secondary-100 p-0">
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-secondary-900">{order.orderNumber}</p>
                    <p className="truncate text-xs text-secondary-500">{order.customer.name}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-secondary-900">{formatCurrency(order.total)}</p>
                    <Badge variant={statusStyles[order.status] || "secondary"} className="mt-1">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#285A48]" />
                  Top Selling Products
                </span>
                <Link href="/admin/products" className="text-xs font-medium text-[#285A48] hover:underline">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-secondary-100 p-0">
              {data.topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary-50/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#285A48]/10 to-[#B0E4CC]/30 font-bold text-[#285A48]">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-secondary-900">{product.name}</p>
                    <p className="text-xs text-secondary-500">{product.soldCount} units sold</p>
                  </div>
                  <p className="font-bold text-[#285A48]">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity History Tabs */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-secondary-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-[#285A48]" />
              Activity Timeline
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {(["orders", "users", "products", "transactions", "activity"] as HistoryTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-[#285A48] to-[#408A71] text-white shadow-lg"
                      : "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {activeTab === "orders" && (
                <div className="divide-y divide-secondary-100">
                  {data.recentOrders.map((order) => (
                    <div key={order._id} className="grid gap-3 p-4 text-sm transition-colors hover:bg-secondary-50/50 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
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
                <div className="divide-y divide-secondary-100">
                  {data.recentUsers.map((user) => (
                    <div key={user._id} className="grid gap-3 p-4 text-sm transition-colors hover:bg-secondary-50/50 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
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
                <div className="divide-y divide-secondary-100">
                  {data.recentProducts.map((product) => (
                    <div key={product._id} className="grid gap-3 p-4 text-sm transition-colors hover:bg-secondary-50/50 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
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
                <div className="divide-y divide-secondary-100">
                  {data.recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="grid gap-3 p-4 text-sm transition-colors hover:bg-secondary-50/50 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
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
                <div className="divide-y divide-secondary-100">
                  {data.recentActivity.map((activity) => (
                    <div key={activity._id} className="p-4 transition-colors hover:bg-secondary-50/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-secondary-900">{activity.title}</p>
                        <Badge variant="secondary">{activity.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-secondary-600">{activity.description}</p>
                      <p className="mt-2 text-xs text-secondary-500">{toRelative(activity.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-white/80 px-6 py-4 text-sm backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <p className="text-secondary-600">
              <span className="font-medium">Last sync:</span> {formatDate(data.generatedAt)}
            </p>
            <p className="text-secondary-600">
              <span className="font-medium">Period:</span> {data.periodDays} days
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 font-semibold text-[#285A48] transition-colors hover:text-[#408A71]"
          >
            Open Order Manager <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
