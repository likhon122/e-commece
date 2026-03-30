"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } =
    useCartStore();

  if (!isOpen) return null;

  const subtotal = getSubtotal();

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
            <h2 className="text-lg font-semibold">
              Shopping Cart ({items.length})
            </h2>
            <button
              onClick={closeCart}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-secondary-300" />
                <p className="mt-4 text-lg font-medium text-secondary-600">
                  Your cart is empty
                </p>
                <p className="mt-2 text-sm text-secondary-500">
                  Add some items to get started
                </p>
                <Button onClick={closeCart} className="mt-6">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => {
                  const price =
                    item.variant.price ||
                    item.product.salePrice ||
                    item.product.basePrice;
                  const image = item.product.images[0]?.url;

                  return (
                    <div
                      key={`${item.product._id}-${item.variant.sku}`}
                      className="flex gap-4"
                    >
                      {/* Image */}
                      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary-100">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-secondary-400">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-secondary-900">
                              {item.product.name}
                            </h3>
                            <p className="mt-1 text-xs text-secondary-500">
                              {item.variant.color} / {item.variant.size}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              removeItem(item.product._id, item.variant.sku)
                            }
                            className="text-secondary-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          {/* Quantity */}
                          <div className="flex items-center rounded-lg border border-secondary-200">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product._id,
                                  item.variant.sku,
                                  item.quantity - 1,
                                )
                              }
                              className="p-2 text-secondary-500 hover:text-secondary-700"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product._id,
                                  item.variant.sku,
                                  item.quantity + 1,
                                )
                              }
                              className="p-2 text-secondary-500 hover:text-secondary-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="text-sm font-medium text-secondary-900">
                            {formatPrice(price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-secondary-100 p-6">
              <div className="flex items-center justify-between text-base font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-sm text-secondary-500">
                Shipping and taxes calculated at checkout
              </p>

              <div className="mt-6 space-y-3">
                <Link href="/checkout" onClick={closeCart}>
                  <Button className="w-full">Proceed to Checkout</Button>
                </Link>
                <Link href="/cart" onClick={closeCart}>
                  <Button variant="outline" className="w-full">
                    View Cart
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}
