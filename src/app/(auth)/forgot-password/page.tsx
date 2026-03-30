"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import toast from "react-hot-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    watch,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const isEmailValid = watchedEmail && !errors.email && dirtyFields.email;

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset email");
      }

      setSentToEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email",
      );
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <Mail className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-secondary-900">
            Check Your Email
          </h1>
          <p className="mt-4 text-secondary-600">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-secondary-900">
              {sentToEmail}
            </span>
          </p>
          <p className="mt-2 text-sm text-secondary-500">
            Click the link in the email to reset your password. The link expires
            in 1 hour.
          </p>

          <div className="mt-8 rounded-lg bg-secondary-100 p-4">
            <p className="text-sm text-secondary-700">
              <strong>Didn&apos;t receive the email?</strong>
              <br />
              Check your spam folder or{" "}
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-600 hover:underline"
              >
                try again
              </button>
            </p>
          </div>

          <div className="mt-6">
            <Link href="/login">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-secondary-900">
            Forgot Password?
          </h1>
          <p className="mt-2 text-secondary-600">
            No worries, we&apos;ll send you reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="relative">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              error={errors.email?.message}
              className={
                isEmailValid
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                  : errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
              }
              {...register("email")}
            />
            {dirtyFields.email && (
              <div className="absolute right-3 top-9">
                {isEmailValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : errors.email ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
