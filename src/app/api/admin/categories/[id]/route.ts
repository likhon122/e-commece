import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Category, Product } from "@/lib/db/models";
import { hasAdminAccess } from "@/lib/auth";
import { updateCategorySchema } from "@/lib/validations";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await connectDB();

    const body = await request.json();
    const validationResult = updateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const updates = validationResult.data;
    const hasParentField = Object.prototype.hasOwnProperty.call(
      updates,
      "parent",
    );
    const normalizedParent = hasParentField
      ? updates.parent && updates.parent.trim() !== ""
        ? updates.parent
        : null
      : undefined;

    if (normalizedParent && normalizedParent === String(category._id)) {
      return NextResponse.json(
        { success: false, error: "Category cannot be its own parent" },
        { status: 400 },
      );
    }

    if (normalizedParent) {
      const parentCategory = await Category.findById(normalizedParent);
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: "Parent category not found" },
          { status: 400 },
        );
      }
    }

    if (
      updates.name &&
      updates.name.trim().toLowerCase() !== category.name.trim().toLowerCase()
    ) {
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: `^${updates.name}$`, $options: "i" },
        parent: hasParentField ? normalizedParent : category.parent,
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Category with same name already exists" },
          { status: 400 },
        );
      }
    }

    const previousParent = category.parent ? String(category.parent) : null;

    if (updates.name !== undefined) category.name = updates.name;
    if (updates.description !== undefined)
      category.description = updates.description;
    if (updates.image !== undefined) category.image = updates.image;
    if (updates.seoTitle !== undefined) category.seoTitle = updates.seoTitle;
    if (updates.seoDescription !== undefined)
      category.seoDescription = updates.seoDescription;
    if (updates.isActive !== undefined) category.isActive = updates.isActive;
    if (updates.sortOrder !== undefined) category.sortOrder = updates.sortOrder;
    if (hasParentField) {
      category.set("parent", normalizedParent ?? null);
    }

    await category.save();

    const nextParent = category.parent ? String(category.parent) : null;
    if (previousParent !== nextParent) {
      if (previousParent) {
        await Category.findByIdAndUpdate(previousParent, {
          $pull: { children: category._id },
        });
      }

      if (nextParent) {
        await Category.findByIdAndUpdate(nextParent, {
          $addToSet: { children: category._id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Admin categories update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const [hasChildren, hasProducts] = await Promise.all([
      Category.exists({ parent: category._id }),
      Product.exists({ category: category._id }),
    ]);

    if (hasChildren) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete category with child categories",
        },
        { status: 400 },
      );
    }

    if (hasProducts) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete category with linked products",
        },
        { status: 400 },
      );
    }

    const parentId = category.parent ? String(category.parent) : null;
    await category.deleteOne();

    if (parentId) {
      await Category.findByIdAndUpdate(parentId, {
        $pull: { children: category._id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Admin categories delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
