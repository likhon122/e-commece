import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Category } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const parent = searchParams.get("parent");
    const tree = searchParams.get("tree") === "true";

    let query: Record<string, unknown> = { isActive: true };

    if (parent === "null" || parent === "") {
      query.parent = null;
    } else if (parent) {
      const parentCategory = await Category.findOne({ slug: parent });
      if (parentCategory) {
        query.parent = parentCategory._id;
      }
    }

    if (tree) {
      // Get all categories and build tree structure
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      const buildTree = (parentId: string | null): typeof categories => {
        return categories
          .filter((cat) => {
            const catParent = cat.parent?.toString() || null;
            return catParent === parentId;
          })
          .map((cat) => ({
            ...cat,
            children: buildTree(cat._id.toString()),
          }));
      };

      const categoryTree = buildTree(null);

      return NextResponse.json({
        success: true,
        data: categoryTree,
      });
    }

    const categories = await Category.find(query)
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
