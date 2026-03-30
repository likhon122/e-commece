"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

type GateState = "checking" | "allowed";

async function isAdminFromCustomAuth(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return payload?.data?.user?.role === "admin";
  } catch {
    return false;
  }
}

async function isAdminFromNextAuthSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return payload?.user?.role === "admin";
  } catch {
    return false;
  }
}

export default function AdminAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GateState>("checking");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const [customAdmin, nextAuthAdmin] = await Promise.all([
        isAdminFromCustomAuth(),
        isAdminFromNextAuthSession(),
      ]);

      if (!mounted) {
        return;
      }

      if (customAdmin || nextAuthAdmin) {
        setState("allowed");
        return;
      }

      const redirectTarget = encodeURIComponent(pathname || "/admin");
      router.replace(`/login?redirect=${redirectTarget}`);
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (state !== "allowed") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-secondary-200 bg-white">
        <div className="flex items-center gap-3 text-secondary-600">
          <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
          <span>Verifying admin access...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
