import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function CategoryNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-8xl">🔍</div>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Category Not Found</h1>
      <p className="mt-3 max-w-md text-gray-600">
        The category you're looking for doesn't exist or may have been moved.
        Please check the URL or browse our available categories.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/categories">
          <Button variant="primary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Categories
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
