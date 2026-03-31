import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order, User, Product } from "@/lib/db/models";
import { hasAdminAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await hasAdminAccess(request);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30";
    const historyLimitParam = searchParams.get("historyLimit") || "12";

    const periodDays = Math.min(Math.max(parseInt(period, 10) || 30, 1), 365);
    const historyLimit = Math.min(
      Math.max(parseInt(historyLimitParam, 10) || 12, 5),
      50,
    );

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - periodDays + 1);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    const previousEndDate = new Date(startDate);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      previousRevenue,
      previousOrders,
      previousCustomers,
      totalTransactions,
      recentOrders,
      topProducts,
      recentUsers,
      recentProducts,
      recentTransactions,
      salesByDay,
      statusBreakdown,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]),

      Order.countDocuments({ createdAt: { $gte: startDate } }),

      User.countDocuments({ role: "user", createdAt: { $gte: startDate } }),

      Product.countDocuments({ isActive: true }),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: previousEndDate },
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]),

      Order.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      }),

      User.countDocuments({
        role: "user",
        createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      }),

      Order.countDocuments({
        $or: [
          { "paymentDetails.transactionId": { $exists: true, $ne: "" } },
          { paymentStatus: { $in: ["paid", "refunded", "failed"] } },
        ],
      }),

      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(historyLimit)
        .lean(),

      Product.find({ isActive: true })
        .sort({ soldCount: -1 })
        .limit(historyLimit)
        .select("name images soldCount basePrice salePrice createdAt")
        .lean(),

      User.find({ role: "user" })
        .select("name email role isVerified createdAt")
        .sort({ createdAt: -1 })
        .limit(historyLimit)
        .lean(),

      Product.find()
        .populate("category", "name")
        .select(
          "name slug category basePrice salePrice soldCount variants isActive createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(historyLimit)
        .lean(),

      Order.find({
        $or: [
          { "paymentDetails.transactionId": { $exists: true, $ne: "" } },
          { paymentStatus: { $in: ["paid", "refunded", "failed"] } },
        ],
      })
        .populate("user", "name email")
        .select(
          "orderNumber total paymentMethod paymentStatus paymentDetails status createdAt user",
        )
        .sort({ createdAt: -1 })
        .limit(historyLimit)
        .lean(),

      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;

    const revenueChange = prevRevenue
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : 100;
    const ordersChange = previousOrders
      ? ((totalOrders - previousOrders) / previousOrders) * 100
      : 100;
    const customersChange = previousCustomers
      ? ((totalCustomers - previousCustomers) / previousCustomers) * 100
      : 100;

    const userIds = recentUsers.map((record) => record._id);
    const userOrderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    const userStatMap = new Map(
      userOrderStats.map((record) => [
        record._id.toString(),
        {
          orderCount: record.orderCount,
          totalSpent: record.totalSpent,
        },
      ]),
    );

    const trendMap = new Map(
      salesByDay.map((point) => [
        point._id,
        { revenue: point.revenue || 0, orders: point.orders || 0 },
      ]),
    );

    const salesTrend: Array<{
      date: string;
      label: string;
      revenue: number;
      orders: number;
    }> = [];

    for (let index = 0; index < periodDays; index += 1) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + index);

      const key = day.toISOString().slice(0, 10);
      const trendValue = trendMap.get(key) || { revenue: 0, orders: 0 };

      salesTrend.push({
        date: key,
        label: day.toLocaleDateString("en-BD", { month: "short", day: "numeric" }),
        revenue: trendValue.revenue,
        orders: trendValue.orders,
      });
    }

    const recentActivity = [
      ...recentOrders.map((order) => ({
        _id: `order-${order._id.toString()}`,
        type: "order" as const,
        title: `New order ${order.orderNumber}`,
        description: `${(order.user as { name?: string })?.name || "Guest"} placed an order`,
        createdAt: order.createdAt,
        amount: order.total,
        status: order.status,
      })),
      ...recentUsers.map((record) => ({
        _id: `user-${record._id.toString()}`,
        type: "user" as const,
        title: `New user ${record.name}`,
        description: `${record.email} registered`,
        createdAt: record.createdAt,
        status: record.isVerified ? "verified" : "unverified",
      })),
      ...recentProducts.map((product) => ({
        _id: `product-${product._id.toString()}`,
        type: "product" as const,
        title: `Product updated: ${product.name}`,
        description: `Catalog item ${product.isActive ? "active" : "inactive"}`,
        createdAt: product.createdAt,
        status: product.isActive ? "active" : "inactive",
      })),
      ...recentTransactions.map((transaction) => ({
        _id: `txn-${transaction._id.toString()}`,
        type: "transaction" as const,
        title: `Payment ${transaction.paymentStatus}`,
        description:
          transaction.paymentDetails?.transactionId ||
          `Order ${transaction.orderNumber} via ${transaction.paymentMethod}`,
        createdAt: transaction.createdAt,
        amount: transaction.total,
        status: transaction.paymentStatus,
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, historyLimit * 2);

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        periodDays,
        stats: {
          totalRevenue: currentRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          totalTransactions,
          revenueChange: Math.round(revenueChange * 10) / 10,
          ordersChange: Math.round(ordersChange * 10) / 10,
          customersChange: Math.round(customersChange * 10) / 10,
        },
        salesTrend,
        statusBreakdown: statusBreakdown.map((entry) => ({
          status: entry._id,
          count: entry.count,
        })),
        recentOrders: recentOrders.map((order) => ({
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          customer: {
            name: (order.user as unknown as { name?: string })?.name || "Guest",
            email: (order.user as unknown as { email?: string })?.email || "",
          },
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        })),
        topProducts: topProducts.map((product) => ({
          _id: product._id.toString(),
          name: product.name,
          image: product.images[0]?.url || "",
          soldCount: product.soldCount,
          revenue: product.soldCount * (product.salePrice || product.basePrice),
          createdAt: product.createdAt,
        })),
        recentUsers: recentUsers.map((record) => {
          const statsForUser = userStatMap.get(record._id.toString()) || {
            orderCount: 0,
            totalSpent: 0,
          };

          return {
            _id: record._id.toString(),
            name: record.name,
            email: record.email,
            role: record.role,
            isVerified: record.isVerified,
            createdAt: record.createdAt,
            orderCount: statsForUser.orderCount,
            totalSpent: statsForUser.totalSpent,
          };
        }),
        recentProducts: recentProducts.map((product) => ({
          _id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          category:
            (product.category as { name?: string })?.name || "Uncategorized",
          price: product.salePrice || product.basePrice,
          soldCount: product.soldCount,
          totalStock: product.variants.reduce(
            (total, variant) => total + variant.stock,
            0,
          ),
          isActive: product.isActive,
          createdAt: product.createdAt,
        })),
        recentTransactions: recentTransactions.map((transaction) => ({
          _id: transaction._id.toString(),
          orderNumber: transaction.orderNumber,
          transactionId:
            transaction.paymentDetails?.transactionId ||
            transaction.paymentDetails?.bankTransactionId ||
            `ORD-${transaction.orderNumber}`,
          customer: {
            name: (transaction.user as { name?: string })?.name || "Guest",
            email: (transaction.user as { email?: string })?.email || "",
          },
          amount: transaction.total,
          paymentMethod: transaction.paymentMethod,
          paymentStatus: transaction.paymentStatus,
          orderStatus: transaction.status,
          createdAt: transaction.createdAt,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
