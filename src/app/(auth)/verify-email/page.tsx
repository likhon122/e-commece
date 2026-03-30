"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const hasVerifiedRef = useRef(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    if (hasVerifiedRef.current) {
      return;
    }
    hasVerifiedRef.current = true;

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const contentType = response.headers.get("content-type") || "";

        let result: { error?: string; message?: string } = {};
        if (contentType.includes("application/json")) {
          result = await response.json();
        } else {
          const text = await response.text();
          if (text) {
            result.error = "Unexpected server response during verification.";
          }
        }

        if (!response.ok) {
          throw new Error(result.error || "Verification failed");
        }

        setStatus("success");
        setMessage("Your email has been verified successfully!");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Verification failed",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-3xl border border-brand-mint/20 bg-white p-8 text-center shadow-2xl shadow-brand-dark/10 md:p-10">
          {status === "loading" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-forest to-brand-sage shadow-lg shadow-brand-forest/25"
              >
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </motion.div>
              <h1 className="mt-6 font-display text-3xl font-bold text-brand-dark">
                Verifying Email
              </h1>
              <p className="mt-4 text-brand-dark/60">
                Please wait while we verify your email...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-forest to-brand-sage shadow-lg shadow-brand-forest/25"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="mt-6 font-display text-3xl font-bold text-brand-dark">
                Email Verified!
              </h1>
              <p className="mt-4 text-brand-dark/60">{message}</p>
              <p className="mt-2 text-sm text-brand-dark/50">
                Your account is now active. You can sign in and start shopping!
              </p>
              <div className="mt-8">
                <Link href="/login">
                  <Button className="w-full py-6">Sign In to Your Account</Button>
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 shadow-lg shadow-red-500/20"
              >
                <XCircle className="h-10 w-10 text-red-600" />
              </motion.div>
              <h1 className="mt-6 font-display text-3xl font-bold text-brand-dark">
                Verification Failed
              </h1>
              <p className="mt-4 text-brand-dark/60">{message}</p>
              <div className="mt-8 flex flex-col space-y-3">
                <Link href="/register">
                  <Button className="w-full py-5">Register Again</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full border-2 border-brand-mint/30 py-5">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
