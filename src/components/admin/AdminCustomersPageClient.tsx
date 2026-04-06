"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Crown,
  DollarSign,
  Filter,
  Mail,
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
  User,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastOrderDate?: string;
  averageOrderValue?: number;
};

type UsersResponse = {
  users: UserData[];
};

type CustomerSegment = "all" | "vip" | "regular" | "new" | "inactive";
type SortOption = "newest" | "oldest" | "highest-spent" | "most-orders" | "name";

const SEGMENT_COLORS = {
  vip: { bg: "from-amber-500 to-orange-500", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  regular: { bg: "from-blue-500 to-indigo-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  new: { bg: "from-emerald-500 to-teal-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  inactive: { bg: "from-gray-400 to-gray-500", light: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

function getCustomerSegment(user: UserData): keyof typeof SEGMENT_COLORS {
  const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  if (user.totalSpent >= 50000 || user.orderCount >= 10) return "vip";
  if (daysSinceJoin <= 30) return "new";
  if (user.orderCount === 0 && daysSinceJoin > 60) return "inactive";
  return "regular";
}

function CustomerCard({ user, onViewDetails }: { user: UserData; onViewDetails: (user: UserData) => void }) {
  const segment = getCustomerSegment(user);
  const colors = SEGMENT_COLORS[segment];
  const avgOrder = user.orderCount > 0 ? user.totalSpent / user.orderCount : 0;

  return (
    <Card className="group relative overflow-hidden border-0 bg-white shadow-[0_4px_24px_-4px_rgba(40,90,72,0.12)] transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(40,90,72,0.2)] hover:-translate-y-1">
      {/* Segment indicator */}
      <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${colors.bg}`} />

      {/* Background glow */}
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${colors.light} opacity-50 blur-2xl`} />

      <CardContent className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.bg} shadow-lg`}>
            <span className="text-xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
            {segment === "vip" && (
              <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-1 shadow-md">
                <Crown className="h-3 w-3 text-white" />
              </div>
            )}
            {user.isVerified && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 shadow-md">
                <BadgeCheck className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-secondary-900">{user.name}</h3>
              <Badge
                variant={segment === "vip" ? "warning" : segment === "new" ? "success" : segment === "inactive" ? "secondary" : "default"}
                className="text-[10px] uppercase"
              >
                {segment}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-secondary-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span className={`flex items-center gap-1 rounded-full ${colors.light} ${colors.text} px-2 py-1`}>
                <ShoppingBag className="h-3 w-3" /> {user.orderCount} orders
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                <DollarSign className="h-3 w-3" /> {formatCurrency(user.totalSpent)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-secondary-100 pt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-secondary-900">{user.orderCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-secondary-500">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#285A48]">{formatCurrency(avgOrder)}</p>
            <p className="text-[10px] uppercase tracking-wider text-secondary-500">Avg Order</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-secondary-900">{formatCurrency(user.totalSpent)}</p>
            <p className="text-[10px] uppercase tracking-wider text-secondary-500">Total</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-secondary-500">
            <Calendar className="h-3 w-3" />
            Joined {formatDate(user.createdAt).split(",")[0]}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-xl text-xs opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onViewDetails(user)}
          >
            View Details <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCustomersPageClient() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<CustomerSegment>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchJson<UsersResponse>("/api/admin/users?limit=100");
        setUsers((payload.users || []).filter((item) => item.role !== "admin"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.isVerified).length;
    const vip = users.filter((u) => getCustomerSegment(u) === "vip").length;
    const newCustomers = users.filter((u) => getCustomerSegment(u) === "new").length;
    const inactive = users.filter((u) => getCustomerSegment(u) === "inactive").length;
    const totalRevenue = users.reduce((sum, u) => sum + u.totalSpent, 0);
    const totalOrders = users.reduce((sum, u) => sum + u.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { total, verified, vip, newCustomers, inactive, totalRevenue, totalOrders, avgOrderValue };
  }, [users]);

  const segmentData = useMemo(() => {
    return [
      { name: "VIP", value: users.filter((u) => getCustomerSegment(u) === "vip").length, color: "#f59e0b" },
      { name: "Regular", value: users.filter((u) => getCustomerSegment(u) === "regular").length, color: "#3b82f6" },
      { name: "New", value: users.filter((u) => getCustomerSegment(u) === "new").length, color: "#10b981" },
      { name: "Inactive", value: users.filter((u) => getCustomerSegment(u) === "inactive").length, color: "#9ca3af" },
    ].filter((s) => s.value > 0);
  }, [users]);

  const topCustomers = useMemo(() => {
    return [...users].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [users]);

  const filtered = useMemo(() => {
    let result = [...users];

    // Filter by search query
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      result = result.filter((user) =>
        [user.name, user.email].join(" ").toLowerCase().includes(keyword)
      );
    }

    // Filter by segment
    if (segment !== "all") {
      result = result.filter((user) => getCustomerSegment(user) === segment);
    }

    // Filter by verified status
    if (verifiedFilter === "verified") {
      result = result.filter((u) => u.isVerified);
    } else if (verifiedFilter === "unverified") {
      result = result.filter((u) => !u.isVerified);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "highest-spent":
        result.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "most-orders":
        result.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [users, query, segment, sortBy, verifiedFilter]);

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
                  <Users className="h-6 w-6 text-white" />
                </div>
                Customer Intelligence
              </h1>
              <p className="mt-2 text-sm text-secondary-600">
                Comprehensive customer insights, segments, and lifetime value analytics
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div className="rounded-2xl border border-[#285A48]/10 bg-gradient-to-br from-white to-[#f7fff9] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Total</p>
                <Users className="h-4 w-4 text-[#285A48]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Verified</p>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.verified}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">VIP</p>
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">{stats.vip}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">New</p>
                <Star className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">{stats.newCustomers}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Inactive</p>
                <UserMinus className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-700">{stats.inactive}</p>
            </div>
            <div className="rounded-2xl border border-[#285A48]/20 bg-gradient-to-br from-[#f7fff9] to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#285A48]">Revenue</p>
                <DollarSign className="h-4 w-4 text-[#285A48]" />
              </div>
              <p className="mt-2 text-xl font-bold text-[#285A48]">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Orders</p>
                <ShoppingBag className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-violet-700">{stats.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Avg Order</p>
                <TrendingUp className="h-4 w-4 text-rose-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-rose-700">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Segment Distribution */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-[#285A48]" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "#9CA3AF", strokeWidth: 1 }}
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} customers`, "Count"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-amber-500" />
                Top Customers by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(name: string) => name.length > 10 ? name.slice(0, 10) + "..." : name}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Total Spent"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                    />
                    <Bar dataKey="totalSpent" fill="#285A48" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 rounded-xl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              {/* Segment Filter */}
              <div className="flex flex-wrap gap-2">
                {(["all", "vip", "regular", "new", "inactive"] as CustomerSegment[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegment(s)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
                      segment === s
                        ? "bg-gradient-to-r from-[#285A48] to-[#408A71] text-white shadow-lg"
                        : "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Verified Filter */}
              <div className="relative">
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                  className="appearance-none rounded-xl border-2 border-[#285A48]/20 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-secondary-700 transition-all hover:border-[#285A48]/40 focus:border-[#285A48] focus:outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>
                <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-xl border-2 border-[#285A48]/20 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-secondary-700 transition-all hover:border-[#285A48]/40 focus:border-[#285A48] focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest-spent">Highest Spent</option>
                  <option value="most-orders">Most Orders</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <PremiumSectionLoading
            title="Loading customers"
            subtitle="Collecting customer tiers, order behavior, and profile metrics."
            className="min-h-[42vh] flex items-center justify-center"
          />
        )}

        {/* Customer Grid */}
        {!loading && !error && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((user) => (
                <CustomerCard key={user.id} user={user} onViewDetails={setSelectedUser} />
              ))}
            </div>

            {/* Empty State */}
            {!filtered.length && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)]">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
                    <Users className="h-8 w-8 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">No customers found</h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results Count */}
            {filtered.length > 0 && (
              <p className="text-center text-sm text-secondary-500">
                Showing {filtered.length} of {users.length} customers
              </p>
            )}
          </>
        )}

        {/* Customer Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg border-0 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-secondary-100 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg p-2 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] text-2xl font-bold text-white shadow-lg">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">{selectedUser.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-secondary-500">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-secondary-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Total Orders</p>
                    <p className="mt-1 text-2xl font-bold text-secondary-900">{selectedUser.orderCount}</p>
                  </div>
                  <div className="rounded-xl bg-[#f7fff9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#285A48]">Total Spent</p>
                    <p className="mt-1 text-2xl font-bold text-[#285A48]">{formatCurrency(selectedUser.totalSpent)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Avg Order Value</p>
                    <p className="mt-1 text-xl font-bold text-blue-700">
                      {selectedUser.orderCount > 0
                        ? formatCurrency(selectedUser.totalSpent / selectedUser.orderCount)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Segment</p>
                    <p className="mt-1 text-xl font-bold capitalize text-violet-700">
                      {getCustomerSegment(selectedUser)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-secondary-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Verification Status</span>
                    <Badge variant={selectedUser.isVerified ? "success" : "warning"}>
                      {selectedUser.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Member Since</span>
                    <span className="font-medium text-secondary-900">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Customer ID</span>
                    <span className="font-mono text-xs text-secondary-600">{selectedUser.id}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="mt-6 w-full rounded-xl"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
