"use client";

import { useEffect, useState } from "react";
import { Activity, DollarSign, ShoppingBag, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { fetchJson, formatCurrency } from "./utils";

type DashboardPayload = {
  success: boolean;
  data: {
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
    statusBreakdown: Array<{ status: string; count: number }>;
  };
};

const tiles = [
  { key: "totalRevenue", label: "Revenue", icon: DollarSign },
  { key: "totalOrders", label: "Orders", icon: ShoppingBag },
  { key: "totalCustomers", label: "Customers", icon: Users },
  { key: "totalTransactions", label: "Transactions", icon: Wallet },
] as const;

export default function AdminAnalyticsPageClient() {
  const [data, setData] = useState<DashboardPayload["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchJson<DashboardPayload>("/api/admin/dashboard?period=30");
        setData(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">Analytics Console</h1>
        <p className="mt-1 text-sm text-secondary-600">Performance metrics and status distribution in one place.</p>
      </div>

      {loading && <p className="text-sm text-secondary-600">Loading analytics...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.key} className="border-[#285A48]/20 bg-white/90">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-secondary-600">{tile.label}</p>
                    <tile.icon className="h-5 w-5 text-[#285A48]" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-secondary-900">
                    {tile.key === "totalRevenue"
                      ? formatCurrency(data.stats.totalRevenue)
                      : data.stats[tile.key].toLocaleString("en-BD")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[#285A48]/20 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between rounded-lg border border-secondary-100 px-3 py-2">
                  <span className="capitalize text-secondary-700">{status.status}</span>
                  <span className="font-semibold text-secondary-900">{status.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
