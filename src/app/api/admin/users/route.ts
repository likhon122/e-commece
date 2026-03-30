import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth";
import dbConnect from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import Order from "@/lib/db/models/Order";

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken -verificationToken -resetPasswordToken")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get order counts for each user
    const userIds = users.map((u: any) => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    const orderCountMap: Record<string, { orderCount: number; totalSpent: number }> = {};
    orderCounts.forEach((item: any) => {
      orderCountMap[item._id.toString()] = {
        orderCount: item.orderCount,
        totalSpent: item.totalSpent,
      };
    });

    const usersWithStats = users.map((user: any) => ({
      ...user,
      id: user._id,
      orderCount: orderCountMap[user._id.toString()]?.orderCount || 0,
      totalSpent: orderCountMap[user._id.toString()]?.totalSpent || 0,
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
