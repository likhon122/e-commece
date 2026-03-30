import { Metadata } from "next";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Mythium Admin Dashboard",
};

const stats = [
  {
    name: "Total Revenue",
    value: "৳1,234,567",
    change: "+12.5%",
    isPositive: true,
    icon: DollarSign,
  },
  {
    name: "Total Orders",
    value: "1,234",
    change: "+8.2%",
    isPositive: true,
    icon: ShoppingCart,
  },
  {
    name: "Total Customers",
    value: "5,678",
    change: "+15.3%",
    isPositive: true,
    icon: Users,
  },
  {
    name: "Total Products",
    value: "456",
    change: "-2.1%",
    isPositive: false,
    icon: Package,
  },
];

const recentOrders = [
  { id: "MTH-ABC123", customer: "John Doe", total: 2500, status: "confirmed" },
  {
    id: "MTH-DEF456",
    customer: "Jane Smith",
    total: 4200,
    status: "processing",
  },
  { id: "MTH-GHI789", customer: "Bob Johnson", total: 1800, status: "shipped" },
  {
    id: "MTH-JKL012",
    customer: "Alice Brown",
    total: 3100,
    status: "delivered",
  },
  {
    id: "MTH-MNO345",
    customer: "Charlie Wilson",
    total: 5600,
    status: "pending",
  },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary-100 p-3">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-secondary-600">{stat.name}</p>
                <p className="mt-1 text-2xl font-bold text-secondary-900">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b border-secondary-100 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-secondary-900">{order.id}</p>
                    <p className="text-sm text-secondary-500">
                      {order.customer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">
                      ৳{order.total.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-secondary-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-12 w-12 rounded-lg bg-secondary-100" />
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">
                      Product Name {i}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {120 - i * 15} sold
                    </p>
                  </div>
                  <p className="font-medium text-secondary-900">
                    ৳{(2500 - i * 300).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="rounded-lg border border-secondary-200 p-4 text-left transition-colors hover:bg-secondary-50">
              <Package className="h-6 w-6 text-primary-600" />
              <p className="mt-2 font-medium text-secondary-900">Add Product</p>
              <p className="text-sm text-secondary-500">Create a new product</p>
            </button>
            <button className="rounded-lg border border-secondary-200 p-4 text-left transition-colors hover:bg-secondary-50">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
              <p className="mt-2 font-medium text-secondary-900">View Orders</p>
              <p className="text-sm text-secondary-500">Manage all orders</p>
            </button>
            <button className="rounded-lg border border-secondary-200 p-4 text-left transition-colors hover:bg-secondary-50">
              <Users className="h-6 w-6 text-primary-600" />
              <p className="mt-2 font-medium text-secondary-900">Customers</p>
              <p className="text-sm text-secondary-500">View customers</p>
            </button>
            <button className="rounded-lg border border-secondary-200 p-4 text-left transition-colors hover:bg-secondary-50">
              <DollarSign className="h-6 w-6 text-primary-600" />
              <p className="mt-2 font-medium text-secondary-900">Reports</p>
              <p className="text-sm text-secondary-500">View sales reports</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
