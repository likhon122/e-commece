"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Truck,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCartStore } from "@/store";
import { formatPrice } from "@/lib/utils";

type Step = "shipping" | "payment" | "review";

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ApiResult {
  success?: boolean;
  error?: string;
  data?: {
    order?: {
      _id?: string;
      orderNumber?: string;
    };
    bkashURL?: string;
    gatewayUrl?: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<
    "sslcommerz" | "bkash" | "cod"
  >("sslcommerz");
  const [shippingData, setShippingData] = useState<ShippingFormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
  });
  const [error, setError] = useState<string>("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { items, getSubtotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();
  const shipping = subtotal >= 5000 ? 0 : 100;
  const total = subtotal + shipping;

  const updateShippingField = (
    field: keyof ShippingFormData,
    value: string,
  ) => {
    setShippingData((prev) => ({ ...prev, [field]: value }));
  };

  const validateShipping = (): boolean => {
    if (
      !shippingData.name.trim() ||
      !shippingData.email.trim() ||
      !shippingData.phone.trim() ||
      !shippingData.street.trim() ||
      !shippingData.city.trim() ||
      !shippingData.state.trim() ||
      !shippingData.postalCode.trim()
    ) {
      setError("Please fill in all required shipping fields.");
      return false;
    }

    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(shippingData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleContinueToPayment = () => {
    setError("");
    if (!validateShipping()) {
      return;
    }
    setStep("payment");
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (!validateShipping()) {
      setStep("shipping");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const readJsonSafely = async (response: Response): Promise<ApiResult> => {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return response.json();
        }

        return {
          success: false,
          error: "Unexpected server response. Please retry.",
        };
      };

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            type: "home",
            name: shippingData.name.trim(),
            phone: shippingData.phone.trim(),
            street: shippingData.street.trim(),
            city: shippingData.city.trim(),
            state: shippingData.state.trim(),
            postalCode: shippingData.postalCode.trim(),
            country: shippingData.country,
          },
          paymentMethod,
          items: items.map((item) => ({
            product: item.product._id,
            variant: item.variant,
            quantity: item.quantity,
          })),
        }),
      });

      const orderJson = await readJsonSafely(orderResponse);

      if (orderResponse.status === 401) {
        setError(
          orderJson.error ||
            "Your login session is missing or expired. Please sign in and try placing the order again.",
        );
        return;
      }

      if (!orderResponse.ok || !orderJson.success) {
        setError(orderJson.error || "Failed to create order.");
        return;
      }

      if (paymentMethod === "cod") {
        const createdOrder = orderJson.data?.order;
        const orderNumber = createdOrder?.orderNumber;
        if (!orderNumber) {
          setError("Order was created but missing order details.");
          return;
        }

        clearCart();
        router.push(`/account/orders?placed=${orderNumber}`);
        return;
      }

      const createdOrder = (orderJson.data as any)?.order;
      const orderId = createdOrder?._id;
      const checkoutSessionId = (orderJson.data as any)?.checkoutSession?._id;

      if (paymentMethod === "sslcommerz" && !checkoutSessionId) {
        setError("Checkout session was not created. Please try again.");
        return;
      }

      if (paymentMethod === "bkash" && !orderId) {
        setError("Order was created but missing order details.");
        return;
      }

      const paymentEndpoint =
        paymentMethod === "bkash"
          ? "/api/payments/bkash/create"
          : "/api/payments/sslcommerz/init";

      const paymentResponse = await fetch(paymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          paymentMethod === "sslcommerz" ? { checkoutSessionId } : { orderId },
        ),
      });

      const paymentJson = await readJsonSafely(paymentResponse);

      if (paymentResponse.status === 401) {
        setError(
          paymentJson.error ||
            "Authentication failed while starting payment. Please sign in again and retry.",
        );
        return;
      }

      if (!paymentResponse.ok || !paymentJson.success) {
        setError(paymentJson.error || "Failed to initialize payment.");
        return;
      }

      const redirectUrl =
        paymentMethod === "bkash"
          ? paymentJson.data?.bkashURL
          : paymentJson.data?.gatewayUrl;

      if (!redirectUrl) {
        setError("Payment gateway URL was not provided.");
        return;
      }

      window.location.href = redirectUrl;
    } catch (placeOrderError) {
      console.error("Place order error:", placeOrderError);
      setError(
        "Could not place order. Please login again and retry from checkout.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto h-20 w-20 text-secondary-300" />
        <h1 className="mt-6 text-2xl font-bold text-secondary-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-secondary-600">
          Add some items before checkout.
        </p>
        <Link href="/products">
          <Button className="mt-8">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/cart"
            className="text-secondary-500 hover:text-secondary-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {["shipping", "payment", "review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s
                    ? "bg-primary-600 text-white"
                    : i < ["shipping", "payment", "review"].indexOf(step)
                      ? "bg-green-500 text-white"
                      : "bg-secondary-200 text-secondary-600"
                }`}
              >
                {i + 1}
              </div>
              <span className="hidden text-sm font-medium capitalize sm:inline">
                {s}
              </span>
              {i < 2 && <div className="h-px w-8 bg-secondary-300 sm:w-16" />}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-secondary-200 bg-white p-6">
              {/* Shipping Form */}
              {step === "shipping" && (
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Shipping Address
                  </h2>
                  <form className="mt-6 grid gap-6 sm:grid-cols-2">
                    <Input
                      id="shipping-name"
                      label="Full Name"
                      placeholder="Your full name"
                      className="sm:col-span-2"
                      value={shippingData.name}
                      onChange={(event) =>
                        updateShippingField("name", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-email"
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={shippingData.email}
                      onChange={(event) =>
                        updateShippingField("email", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-phone"
                      label="Phone"
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      value={shippingData.phone}
                      onChange={(event) =>
                        updateShippingField("phone", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-street"
                      label="Address"
                      placeholder="Street address"
                      className="sm:col-span-2"
                      value={shippingData.street}
                      onChange={(event) =>
                        updateShippingField("street", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-city"
                      label="City"
                      placeholder="City"
                      value={shippingData.city}
                      onChange={(event) =>
                        updateShippingField("city", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-state"
                      label="Division"
                      placeholder="Division"
                      value={shippingData.state}
                      onChange={(event) =>
                        updateShippingField("state", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-postal-code"
                      label="Postal Code"
                      placeholder="Postal code"
                      value={shippingData.postalCode}
                      onChange={(event) =>
                        updateShippingField("postalCode", event.target.value)
                      }
                    />
                    <Input
                      id="shipping-country"
                      label="Country"
                      value={shippingData.country}
                      disabled
                    />
                  </form>
                  {error ? (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </p>
                  ) : null}
                  <div className="mt-8 flex justify-end">
                    <Button onClick={handleContinueToPayment}>
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Selection */}
              {step === "payment" && (
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Payment Method
                  </h2>
                  <div className="mt-6 space-y-4">
                    {/* SSLCommerz */}
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                        paymentMethod === "sslcommerz"
                          ? "border-primary-500 bg-primary-50"
                          : "border-secondary-200 hover:border-secondary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="sslcommerz"
                        checked={paymentMethod === "sslcommerz"}
                        onChange={() => setPaymentMethod("sslcommerz")}
                        className="sr-only"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                        <CreditCard className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-secondary-900">
                          Card / Mobile Banking
                        </p>
                        <p className="text-sm text-secondary-500">
                          Pay with Visa, MasterCard, Nagad, Rocket
                        </p>
                      </div>
                      <div className="text-xs text-secondary-400">
                        Powered by SSLCommerz
                      </div>
                    </label>

                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.sslcommerz.com/"
                      title="SSLCommerz"
                      aria-label="SSLCommerz Trust Payment"
                      className="block rounded-lg border border-secondary-200 bg-white p-3 transition-colors hover:border-primary-300"
                    >
                      <img
                        style={{ width: "300px", height: "auto" }}
                        src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-05.png"
                        alt="SSLCommerz"
                      />
                    </a>

                    {/* bKash */}
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                        paymentMethod === "bkash"
                          ? "border-primary-500 bg-primary-50"
                          : "border-secondary-200 hover:border-secondary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="bkash"
                        checked={paymentMethod === "bkash"}
                        onChange={() => setPaymentMethod("bkash")}
                        className="sr-only"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                        <Smartphone className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-secondary-900">bKash</p>
                        <p className="text-sm text-secondary-500">
                          Pay with your bKash wallet
                        </p>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                        paymentMethod === "cod"
                          ? "border-primary-500 bg-primary-50"
                          : "border-secondary-200 hover:border-secondary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="sr-only"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                        <Truck className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-secondary-900">
                          Cash on Delivery
                        </p>
                        <p className="text-sm text-secondary-500">
                          Pay when you receive your order
                        </p>
                      </div>
                    </label>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep("shipping")}
                    >
                      Back
                    </Button>
                    <Button onClick={() => setStep("review")}>
                      Review Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Order Review */}
              {step === "review" && (
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Review Your Order
                  </h2>

                  {/* Shipping Summary */}
                  <div className="mt-6 rounded-lg bg-secondary-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-secondary-900">
                        Shipping Address
                      </h3>
                      <button
                        onClick={() => setStep("shipping")}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-secondary-600">
                      {shippingData.name || "-"}
                      <br />
                      {shippingData.street || "-"}
                      <br />
                      {shippingData.city || "-"}, {shippingData.state || "-"}{" "}
                      {shippingData.postalCode || "-"}
                      <br />
                      {shippingData.phone || "-"}
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-4 rounded-lg bg-secondary-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-secondary-900">
                        Payment Method
                      </h3>
                      <button
                        onClick={() => setStep("payment")}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-secondary-600 capitalize">
                      {paymentMethod === "sslcommerz"
                        ? "Card / Mobile Banking (SSLCommerz)"
                        : paymentMethod}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="mt-6">
                    <h3 className="font-medium text-secondary-900">
                      Order Items
                    </h3>
                    <div className="mt-4 space-y-4">
                      {items.map((item) => (
                        <div
                          key={`${item.product._id}-${item.variant.sku}`}
                          className="flex gap-4"
                        >
                          <div className="relative h-16 w-14 overflow-hidden rounded-lg bg-secondary-100">
                            {item.product.images[0]?.url && (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-secondary-900">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {item.variant.color} / {item.variant.size} ×{" "}
                              {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-secondary-900">
                            {formatPrice(
                              (item.variant.price ||
                                item.product.salePrice ||
                                item.product.basePrice) * item.quantity,
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {error ? (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep("payment")}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      isLoading={isPlacingOrder}
                      disabled={isPlacingOrder}
                    >
                      Place Order - {formatPrice(total)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="sticky top-24 rounded-xl border border-secondary-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-secondary-900">
                Order Summary
              </h2>

              <div className="mt-6 max-h-60 space-y-4 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.product._id}-${item.variant.sku}`}
                    className="flex gap-3"
                  >
                    <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden rounded bg-secondary-100">
                      {item.product.images[0]?.url ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="mx-auto mt-3 h-6 w-6 text-secondary-400" />
                      )}
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-600 text-xs text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900 line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {item.variant.color} / {item.variant.size}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-secondary-900">
                      {formatPrice(
                        (item.variant.price ||
                          item.product.salePrice ||
                          item.product.basePrice) * item.quantity,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-secondary-100 pt-6">
                <div className="flex justify-between text-sm text-secondary-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-secondary-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-secondary-100 pt-3 font-semibold text-secondary-900">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
