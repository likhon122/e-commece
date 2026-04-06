import mongoose from "mongoose";
import { Order, Product, type IOrderDoc } from "@/lib/db/models";

interface ProductVariantLike {
  stock: number;
  reservedStock?: number;
}

function getReservedStock(variant: ProductVariantLike): number {
  return variant.reservedStock || 0;
}

export function getAvailableStock(variant: ProductVariantLike): number {
  return variant.stock - getReservedStock(variant);
}

async function withTransaction<T>(
  operation: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let result: T | null = null;

    try {
      await session.withTransaction(async () => {
        result = await operation(session);
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || "");
      const transactionUnsupported =
        message.includes(
          "Transaction numbers are only allowed on a replica set member or mongos",
        ) || message.includes("replica set");

      if (!transactionUnsupported) {
        throw error;
      }

      // Fallback for standalone MongoDB (no replica set / transactions).
      result = await operation(null);
    }

    if (result === null) {
      throw new Error("Transaction did not produce a result");
    }

    return result;
  } finally {
    await session.endSession();
  }
}

export async function reserveOrderStock(orderId: string): Promise<void> {
  await withTransaction(async (session) => {
    const order = session
      ? await Order.findById(orderId).session(session)
      : await Order.findById(orderId);
    if (!order || order.stockReservationStatus !== "reserved") {
      return;
    }

    for (const item of order.items) {
      const product = session
        ? await Product.findById(item.product).session(session)
        : await Product.findById(item.product);
      if (!product || !product.isActive) {
        throw new Error(`Product not found for reservation: ${item.product}`);
      }

      const variant = product.variants.find((v) => v.sku === item.variant.sku);
      if (!variant) {
        throw new Error(
          `Variant ${item.variant.sku} not found for product ${product._id}`,
        );
      }

      const available = getAvailableStock(variant);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      variant.reservedStock = getReservedStock(variant) + item.quantity;
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
    }

    order.stockReservationStatus = "reserved";
    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }
  });
}

export async function confirmReservedOrderStock(orderId: string): Promise<void> {
  await withTransaction(async (session) => {
    const order = session
      ? await Order.findById(orderId).session(session)
      : await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found while confirming stock");
    }

    if (order.stockReservationStatus === "confirmed") {
      return;
    }

    if (order.stockReservationStatus === "released") {
      throw new Error("Cannot confirm stock for released reservation");
    }

    for (const item of order.items) {
      const product = session
        ? await Product.findById(item.product).session(session)
        : await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found while confirming: ${item.product}`);
      }

      const variant = product.variants.find((v) => v.sku === item.variant.sku);
      if (!variant) {
        throw new Error(
          `Variant ${item.variant.sku} not found for product ${product._id}`,
        );
      }

      const reserved = getReservedStock(variant);
      if (reserved < item.quantity || variant.stock < item.quantity) {
        throw new Error(`Stock confirmation failed for ${product.name}`);
      }

      variant.reservedStock = reserved - item.quantity;
      variant.stock -= item.quantity;
      product.soldCount += item.quantity;
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
    }

    order.stockReservationStatus = "confirmed";
    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }
  });
}

export async function releaseReservedOrderStock(orderId: string): Promise<void> {
  await withTransaction(async (session) => {
    const order = session
      ? await Order.findById(orderId).session(session)
      : await Order.findById(orderId);
    if (!order) {
      return;
    }

    if (
      order.stockReservationStatus === "released" ||
      order.stockReservationStatus === "confirmed"
    ) {
      return;
    }

    for (const item of order.items) {
      const product = session
        ? await Product.findById(item.product).session(session)
        : await Product.findById(item.product);
      if (!product) {
        continue;
      }

      const variant = product.variants.find((v) => v.sku === item.variant.sku);
      if (!variant) {
        continue;
      }

      const reserved = getReservedStock(variant);
      variant.reservedStock = Math.max(0, reserved - item.quantity);
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
    }

    order.stockReservationStatus = "released";
    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }
  });
}

export function getOrderItemFromCartItem(cartItem: {
  product: any;
  variant: { sku: string };
  quantity: number;
}): {
  product: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  variant: {
    sku: string;
    size: string;
    color: string;
    colorCode: string;
  };
  quantity: number;
  price: number;
  total: number;
} {
  const product = cartItem.product;
  const variant = product.variants.find((v: any) => v.sku === cartItem.variant.sku);

  if (!variant) {
    throw new Error(`Variant not found for ${product.name}`);
  }

  const price = variant.price || product.salePrice || product.basePrice;
  const total = price * cartItem.quantity;

  return {
    product: product._id,
    productName: product.name,
    productImage: product.images[0]?.url || "",
    variant: {
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorCode: variant.colorCode,
    },
    quantity: cartItem.quantity,
    price,
    total,
  };
}

export function calculateOrderTotals(subtotal: number): {
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
} {
  const shippingCost = subtotal >= 5000 ? 0 : 100;
  const tax = 0;
  const discount = 0;

  return {
    shippingCost,
    tax,
    discount,
    total: subtotal + shippingCost + tax - discount,
  };
}

export async function validateAndBuildOrderItemsFromCart(
  cartItems: Array<{ product: any; variant: { sku: string }; quantity: number }>,
): Promise<{
  orderItems: IOrderDoc["items"];
  subtotal: number;
}> {
  const orderItems = [] as unknown as IOrderDoc["items"];
  let subtotal = 0;

  for (const cartItem of cartItems) {
    const product = await Product.findById(cartItem.product._id || cartItem.product);
    if (!product || !product.isActive) {
      throw new Error(`Product not found: ${cartItem.product?.name || "Unknown"}`);
    }

    const variant = product.variants.find((v) => v.sku === cartItem.variant.sku);
    if (!variant) {
      throw new Error(`Variant not found for ${product.name}`);
    }

    const available = getAvailableStock(variant);
    if (available < cartItem.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const mapped = getOrderItemFromCartItem({
      ...cartItem,
      product,
    });

    subtotal += mapped.total;
    (orderItems as any).push(mapped);
  }

  return { orderItems, subtotal };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function buildOrderItemsFromCheckoutSession(
  checkoutItems: Array<{
    product: any;
    variant: { sku: string; size: string; color: string; colorCode: string };
    quantity: number;
  }>,
  fallbackSubtotal: number,
): Promise<{
  orderItems: IOrderDoc["items"];
  subtotal: number;
}> {
  const orderItems = [] as unknown as IOrderDoc["items"];

  const totalQuantity = checkoutItems.reduce(
    (sum, item) => sum + Math.max(1, item.quantity || 1),
    0,
  );
  const averageUnitPrice =
    totalQuantity > 0 ? roundCurrency(fallbackSubtotal / totalQuantity) : 0;

  let computedSubtotal = 0;

  for (const checkoutItem of checkoutItems) {
    const productId = checkoutItem.product?._id || checkoutItem.product;
    const product = await Product.findById(productId);

    let productName = "Product unavailable";
    let productImage = "";
    let unitPrice = averageUnitPrice;

    if (product) {
      productName = product.name;
      productImage = product.images[0]?.url || "";

      const variant = product.variants.find((v) => v.sku === checkoutItem.variant.sku);
      if (variant) {
        unitPrice = variant.price || product.salePrice || product.basePrice;
      } else {
        unitPrice = product.salePrice || product.basePrice || averageUnitPrice;
      }
    }

    const itemTotal = roundCurrency(unitPrice * checkoutItem.quantity);
    computedSubtotal = roundCurrency(computedSubtotal + itemTotal);

    (orderItems as any).push({
      product: productId,
      productName,
      productImage,
      variant: checkoutItem.variant,
      quantity: checkoutItem.quantity,
      price: unitPrice,
      total: itemTotal,
    });
  }

  const roundedFallbackSubtotal = roundCurrency(fallbackSubtotal);
  const adjustment = roundCurrency(roundedFallbackSubtotal - computedSubtotal);

  if ((orderItems as any).length > 0 && Math.abs(adjustment) >= 0.01) {
    const firstItem = (orderItems as any)[0];
    firstItem.total = roundCurrency(firstItem.total + adjustment);
    firstItem.price = roundCurrency(firstItem.total / Math.max(1, firstItem.quantity));
    computedSubtotal = roundCurrency(computedSubtotal + adjustment);
  }

  return {
    orderItems,
    subtotal: roundedFallbackSubtotal || computedSubtotal,
  };
}
