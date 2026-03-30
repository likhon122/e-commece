"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { useCartStore } from "@/store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } =
    useCartStore();

  const subtotal = getSubtotal();
  const shipping = subtotal >= 5000 ? 0 : 100;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto h-20 w-20 text-secondary-300" />
        <h1 className="mt-6 text-2xl font-bold text-secondary-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-secondary-600">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link href="/products">
          <Button className="mt-8">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-secondary-900">Shopping Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-secondary-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
              <span className="font-medium text-secondary-900">
                {items.length} item{items.length !== 1 && "s"}
              </span>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-secondary-100">
              {items.map((item) => {
                const price =
                  item.variant.price ||
                  item.product.salePrice ||
                  item.product.basePrice;
                const image = item.product.images[0]?.url;

                return (
                  <div
                    key={`${item.product._id}-${item.variant.sku}`}
                    className="flex gap-4 p-6"
                  >
                    {/* Image */}
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary-100 sm:h-32 sm:w-28">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-secondary-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <div>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-medium text-secondary-900 hover:text-primary-600"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-sm text-secondary-500">
                            {item.variant.color} / {item.variant.size}
                          </p>
                        </div>
                        <p className="font-semibold text-secondary-900">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4">
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
                          <span className="w-10 text-center font-medium">
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

                        {/* Remove */}
                        <button
                          onClick={() =>
                            removeItem(item.product._id, item.variant.sku)
                          }
                          className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-24 rounded-xl border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-secondary-900">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              {subtotal < 5000 && (
                <p className="text-sm text-secondary-500">
                  Add {formatPrice(5000 - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-secondary-100 pt-4">
                <div className="flex justify-between font-semibold text-secondary-900">
                  <span>Total</span>
                  <span className="text-xl">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <Link href="/checkout" className="mt-6 block">
              <Button className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/products" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 border-t border-secondary-100 pt-6">
              <p className="text-center text-xs text-secondary-500">
                Secure checkout powered by SSL
              </p>
              <div className="mt-3 flex justify-center gap-3 text-xs font-semibold text-secondary-400">
                <span>bKash</span>
                <span>VISA</span>
                <span>MasterCard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
