import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { getAuthFromRequest } from "@/lib/auth";
import { User } from "@/lib/db/models";
import { addressSchema } from "@/lib/validations";

function zodErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("issues" in error)) {
    return "Invalid address data";
  }

  const issues = (error as { issues?: Array<{ message?: string }> }).issues;
  if (!Array.isArray(issues) || !issues[0]?.message) {
    return "Invalid address data";
  }

  return issues[0].message || "Invalid address data";
}

function normalizeAddresses(addresses: any[]) {
  return [...(addresses || [])]
    .map((address) => ({
      _id: String(address._id),
      type: address.type,
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: Boolean(address.isDefault),
    }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

async function getUserFromRequest(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return {
      error: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      ),
      user: null,
    };
  }

  await connectDB();

  const user = await User.findById(auth.userId).select("addresses");
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await getUserFromRequest(request);
    if (error || !user) {
      return error as NextResponse;
    }

    return NextResponse.json({
      success: true,
      data: normalizeAddresses(user.addresses as any[]),
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await getUserFromRequest(request);
    if (error || !user) {
      return error as NextResponse;
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: zodErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    const nextAddress = { ...parsed.data };
    const hasDefault = (user.addresses as any[]).some((address) => address.isDefault);

    if (nextAddress.isDefault || !hasDefault) {
      (user.addresses as any[]).forEach((address) => {
        address.isDefault = false;
      });
      nextAddress.isDefault = true;
    }

    (user.addresses as any[]).push(nextAddress);
    user.markModified("addresses");
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Address added successfully",
      data: normalizeAddresses(user.addresses as any[]),
    });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add address" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error, user } = await getUserFromRequest(request);
    if (error || !user) {
      return error as NextResponse;
    }

    const body = await request.json();
    const addressId =
      typeof body.addressId === "string" ? body.addressId.trim() : "";

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: "Address ID is required" },
        { status: 400 },
      );
    }

    const addresses = user.addresses as any[];
    const addressIndex = addresses.findIndex(
      (address) => String(address._id) === addressId,
    );

    if (addressIndex < 0) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 },
      );
    }

    if (body.setDefault === true) {
      addresses.forEach((address, index) => {
        address.isDefault = index === addressIndex;
      });

      user.markModified("addresses");
      await user.save();

      return NextResponse.json({
        success: true,
        message: "Default address updated",
        data: normalizeAddresses(addresses),
      });
    }

    const parsed = addressSchema.safeParse(body.address);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: zodErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    const updatedAddress = { ...parsed.data };
    if (updatedAddress.isDefault) {
      addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    Object.assign(addresses[addressIndex], updatedAddress);

    if (!addresses.some((address) => address.isDefault) && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    user.markModified("addresses");
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
      data: normalizeAddresses(addresses),
    });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await getUserFromRequest(request);
    if (error || !user) {
      return error as NextResponse;
    }

    const body = await request.json();
    const addressId =
      typeof body.addressId === "string" ? body.addressId.trim() : "";

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: "Address ID is required" },
        { status: 400 },
      );
    }

    const addresses = user.addresses as any[];
    const addressIndex = addresses.findIndex(
      (address) => String(address._id) === addressId,
    );

    if (addressIndex < 0) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 },
      );
    }

    const wasDefault = Boolean(addresses[addressIndex].isDefault);
    addresses.splice(addressIndex, 1);

    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    user.markModified("addresses");
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
      data: normalizeAddresses(addresses),
    });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
