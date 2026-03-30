"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, Home, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  showHomeButton = true,
  showBackButton = false,
  showRetryButton = false,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-gray-600">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {showRetryButton && onRetry && (
          <Button onClick={onRetry} variant="primary" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {showBackButton && (
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        )}
        {showHomeButton && (
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

interface NotFoundMessageProps {
  type?: "product" | "category" | "page" | "search";
  query?: string;
}

export function NotFoundMessage({ type = "page", query }: NotFoundMessageProps) {
  const messages = {
    product: {
      title: "Product Not Found",
      message: "The product you're looking for doesn't exist or has been removed.",
      icon: ShoppingBag,
    },
    category: {
      title: "Category Not Found",
      message: "The category you're looking for doesn't exist or has been removed.",
      icon: AlertCircle,
    },
    page: {
      title: "Page Not Found",
      message: "The page you're looking for doesn't exist.",
      icon: AlertCircle,
    },
    search: {
      title: "No Results Found",
      message: query
        ? `No products found for "${query}". Try different keywords or browse our categories.`
        : "No products match your search criteria. Try adjusting your filters.",
      icon: Search,
    },
  };

  const { title, message, icon: Icon } = messages[type];

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-gray-600">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/products">
          <Button variant="primary" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
      <div className="text-6xl">📦</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-gray-500">{message}</p>
      {(actionLabel && actionHref) || onAction ? (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function LoadingError({
  message = "Failed to load data. Please try again.",
  onRetry,
}: LoadingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="mt-3 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
