"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { fetchJson, formatCurrency, formatDate } from "./utils";

type UsersResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    orderCount: number;
    totalSpent: number;
    createdAt: string;
  }>;
};

export default function AdminCustomersPageClient() {
  const [users, setUsers] = useState<UsersResponse["users"]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) =>
      [user.name, user.email].join(" ").toLowerCase().includes(keyword),
    );
  }, [users, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">Customer Intelligence</h1>
        <p className="mt-1 text-sm text-secondary-600">Verified users, purchase behavior, and lifecycle value.</p>
      </div>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardHeader className="space-y-4">
          <CardTitle>Customers</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="Search customer by name or email"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-secondary-600">Loading customers...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-3 rounded-xl border border-secondary-100 p-4 text-sm sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-secondary-900">{user.name}</p>
                    <p className="truncate text-xs text-secondary-500">{user.email}</p>
                  </div>
                  <p className="text-secondary-700">Orders: {user.orderCount}</p>
                  <p className="text-secondary-700">{formatCurrency(user.totalSpent)}</p>
                  <p className="text-secondary-500">{formatDate(user.createdAt)}</p>
                  <Badge variant={user.isVerified ? "success" : "warning"}>
                    {user.isVerified ? "verified" : "unverified"}
                  </Badge>
                </div>
              ))}
              {!filtered.length && (
                <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center text-secondary-500">
                  No customers found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
