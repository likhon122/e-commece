import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-9xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-secondary-900">
        Page Not Found
      </h2>
      <p className="mt-2 text-secondary-600">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Link href="/" className="mt-8">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
