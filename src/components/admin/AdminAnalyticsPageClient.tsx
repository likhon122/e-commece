"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingDown,
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
  LineChart,
  Line,
  ComposedChart,
  RadialBarChart,
  RadialBar,
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
import { fetchJson, formatCurrency } from "./utils";

type DashboardPayload = {
  success: boolean;
  data: {
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
    topProducts: Array<{
      _id: string;
      name: string;
      soldCount: number;
      revenue: number;
    }>;
  };
};

const CHART_COLORS = {
  primary: "#285A48",
  secondary: "#408A71",
  accent: "#6dc1a0",
  light: "#B0E4CC",
};

const PIE_COLORS = ["#285A48", "#408A71", "#6dc1a0", "#8ad4ad", "#B0E4CC", "#f0b429", "#e74c3c", "#9b59b6"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#6366f1",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#f97316",
};

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "emerald",
  subtitle,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: "emerald" | "blue" | "violet" | "amber" | "rose";
  subtitle?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  const colorClasses = {
    emerald: { bg: "from-emerald-500 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-700" },
    blue: { bg: "from-blue-500 to-blue-600", light: "bg-blue-50", text: "text-blue-700" },
    violet: { bg: "from-violet-500 to-violet-600", light: "bg-violet-50", text: "text-violet-700" },
    amber: { bg: "from-amber-500 to-amber-600", light: "bg-amber-50", text: "text-amber-700" },
    rose: { bg: "from-rose-500 to-rose-600", light: "bg-rose-50", text: "text-rose-700" },
  };
  const colors = colorClasses[color];

  return (
    <Card className="group relative overflow-hidden border-0 bg-white shadow-[0_4px_24px_-4px_rgba(40,90,72,0.15)] transition-all duration-500 hover:shadow-[0_8px_40px_-8px_rgba(40,90,72,0.25)] hover:-translate-y-1">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${colors.light} opacity-50 blur-2xl group-hover:scale-110 transition-transform`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-secondary-900">{value}</p>
            {subtitle && <p className="text-xs text-secondary-500">{subtitle}</p>}
          </div>
          <div className={`rounded-2xl bg-gradient-to-br ${colors.bg} p-3 shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </div>
            <span className="text-xs text-secondary-500">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#B0E4CC]/50 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-secondary-700">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="mt-1 text-sm font-bold" style={{ color: entry.color || CHART_COLORS.primary }}>
            {entry.name}: {typeof entry.value === "number" && entry.name.toLowerCase().includes("revenue")
              ? formatCurrency(entry.value)
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminAnalyticsPageClient() {
  const [data, setData] = useState<DashboardPayload["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30");

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const payload = await fetchJson<DashboardPayload>(`/api/admin/dashboard?period=${period}`);
      setData(payload.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Calculate additional metrics
  const avgOrderValue = data ? (data.stats.totalOrders > 0 ? data.stats.totalRevenue / data.stats.totalOrders : 0) : 0;
  const conversionRate = data ? (data.stats.totalCustomers > 0 ? (data.stats.totalOrders / data.stats.totalCustomers) * 100 : 0) : 0;

  // Prepare chart data
  const pieChartData = data?.statusBreakdown.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: STATUS_COLORS[item.status] || "#9ca3af",
  })) || [];

  const topProductsData = data?.topProducts.slice(0, 6).map((product) => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name,
    revenue: product.revenue,
    sold: product.soldCount,
  })) || [];

  // Radial bar data for performance metrics
  const performanceData = data ? [
    { name: "Orders", value: Math.min(data.stats.ordersChange + 50, 100), fill: "#285A48" },
    { name: "Revenue", value: Math.min(data.stats.revenueChange + 50, 100), fill: "#408A71" },
    { name: "Customers", value: Math.min(data.stats.customersChange + 50, 100), fill: "#6dc1a0" },
  ] : [];

  if (loading) {
    return (
      <div className="py-4">
        <PremiumFullPageLoading
          title="Loading analytics intelligence"
          subtitle="Crunching revenue, trendlines, and operational performance signals."
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-8 text-center shadow-lg">
        <Activity className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold text-red-800">Analytics Unavailable</h3>
        <p className="mt-2 text-sm text-red-600">{error || "Unknown error"}</p>
        <Button className="mt-6" onClick={() => fetchData(true)} variant="primary">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Premium Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#f7fbf8] via-[#f8f4e8]/50 to-[#eef8f3]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-96 w-96 rounded-full bg-[#408A71]/10 blur-[100px]" />
      <div className="pointer-events-none fixed -right-40 top-40 h-96 w-96 rounded-full bg-[#B0E4CC]/30 blur-[100px]" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-[#285A48]/10 bg-white/80 p-6 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.15)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-secondary-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                Analytics Console
              </h1>
              <p className="mt-2 text-sm text-secondary-600">
                Comprehensive performance metrics and business intelligence
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-[#285A48]/5 px-4 py-2">
                <Calendar className="h-4 w-4 text-[#285A48]" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-transparent text-sm font-medium text-secondary-700 focus:outline-none"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => fetchData(true)}
                isLoading={refreshing}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>

              <Button variant="primary" size="sm" className="gap-2 rounded-xl">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Revenue"
            value={formatCurrency(data.stats.totalRevenue)}
            change={data.stats.revenueChange}
            icon={DollarSign}
            color="emerald"
            subtitle={`${data.periodDays} days`}
          />
          <StatCard
            title="Orders"
            value={data.stats.totalOrders.toLocaleString()}
            change={data.stats.ordersChange}
            icon={ShoppingBag}
            color="blue"
          />
          <StatCard
            title="Customers"
            value={data.stats.totalCustomers.toLocaleString()}
            change={data.stats.customersChange}
            icon={Users}
            color="violet"
          />
          <StatCard
            title="Avg Order"
            value={formatCurrency(avgOrderValue)}
            icon={TrendingUp}
            color="amber"
          />
          <StatCard
            title="Products"
            value={data.stats.totalProducts.toLocaleString()}
            icon={Package}
            color="rose"
          />
          <StatCard
            title="Transactions"
            value={data.stats.totalTransactions.toLocaleString()}
            icon={CreditCard}
            color="blue"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          {/* Revenue & Orders Trend */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#285A48]" />
                Revenue & Orders Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.salesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      fill="url(#revenueGradientAnalytics)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke={CHART_COLORS.accent}
                      strokeWidth={3}
                      dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Gauge */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-[#285A48]" />
                Growth Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    barSize={12}
                    data={performanceData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      label={{ position: "insideStart", fill: "#fff", fontSize: 11 }}
                      background={{ fill: "#f3f4f6" }}
                      dataKey="value"
                      cornerRadius={6}
                    />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${(value - 50).toFixed(1)}%`, "Change"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#285A48]/5 p-3">
                  <p className={`text-lg font-bold ${data.stats.ordersChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {data.stats.ordersChange >= 0 ? "+" : ""}{data.stats.ordersChange.toFixed(1)}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-secondary-500">Orders</p>
                </div>
                <div className="rounded-xl bg-[#408A71]/5 p-3">
                  <p className={`text-lg font-bold ${data.stats.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {data.stats.revenueChange >= 0 ? "+" : ""}{data.stats.revenueChange.toFixed(1)}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-secondary-500">Revenue</p>
                </div>
                <div className="rounded-xl bg-[#6dc1a0]/10 p-3">
                  <p className={`text-lg font-bold ${data.stats.customersChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {data.stats.customersChange >= 0 ? "+" : ""}{data.stats.customersChange.toFixed(1)}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-secondary-500">Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Status Distribution */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-[#285A48]" />
                Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6 lg:flex-row">
                <div className="h-64 w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} orders`, "Count"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 lg:w-1/2">
                  {data.statusBreakdown.map((status) => (
                    <div key={status.status} className="flex items-center justify-between rounded-xl border border-secondary-100 p-3 transition-colors hover:bg-secondary-50">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[status.status] || "#9ca3af" }}
                        />
                        <span className="text-sm font-medium capitalize text-secondary-700">{status.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-secondary-900">{status.count}</span>
                        <Badge
                          variant={
                            status.status === "delivered" ? "success" :
                            status.status === "cancelled" || status.status === "refunded" ? "danger" :
                            status.status === "pending" ? "warning" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {((status.count / data.stats.totalOrders) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-[#285A48]" />
                Top Products Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? formatCurrency(value) : `${value} units`,
                        name === "revenue" ? "Revenue" : "Sold"
                      ]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="sold" name="Units Sold" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardHeader className="border-b border-secondary-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-[#285A48]" />
              Key Business Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#285A48]/10 bg-gradient-to-br from-[#f7fff9] to-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <p className="text-2xl font-bold text-[#285A48]">{formatCurrency(avgOrderValue)}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">Avg Order Value</p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-700">{conversionRate.toFixed(1)}%</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">Conversion Rate</p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <p className="text-2xl font-bold text-violet-700">
                  {data.stats.totalCustomers > 0 ? (data.stats.totalRevenue / data.stats.totalCustomers).toFixed(0) : 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">Revenue/Customer</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <p className="text-2xl font-bold text-amber-700">
                  {data.stats.totalCustomers > 0 ? (data.stats.totalOrders / data.stats.totalCustomers).toFixed(2) : 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">Orders/Customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-white/80 px-6 py-4 text-sm backdrop-blur-sm">
          <p className="text-secondary-600">
            <span className="font-medium">Data as of:</span> {new Date(data.generatedAt).toLocaleString()}
          </p>
          <p className="text-secondary-600">
            <span className="font-medium">Analysis Period:</span> {data.periodDays} days
          </p>
        </div>
      </div>
    </div>
  );
}
