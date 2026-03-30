"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Lock,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import toast from "react-hot-toast";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password") || "";
  const watchedConfirmPassword = watch("confirmPassword");

  const isPasswordValid =
    watchedPassword && !errors.password && dirtyFields.password;
  const isConfirmPasswordValid =
    watchedConfirmPassword &&
    watchedConfirmPassword === watchedPassword &&
    !errors.confirmPassword &&
    dirtyFields.confirmPassword;

  const passwordRequirements = useMemo(() => {
    return [
      { label: "At least 8 characters", met: watchedPassword.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(watchedPassword) },
      { label: "One lowercase letter", met: /[a-z]/.test(watchedPassword) },
      { label: "One number", met: /[0-9]/.test(watchedPassword) },
    ];
  }, [watchedPassword]);

  const passwordStrength = useMemo(() => {
    const metCount = passwordRequirements.filter((r) => r.met).length;
    if (metCount === 0) return { level: 0, label: "", color: "" };
    if (metCount === 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (metCount === 2)
      return { level: 2, label: "Fair", color: "bg-orange-500" };
    if (metCount === 3)
      return { level: 3, label: "Good", color: "bg-yellow-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  }, [passwordRequirements]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setResetSuccess(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-secondary-900">
            Invalid Link
          </h1>
          <p className="mt-4 text-secondary-600">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-8">
            <Link href="/forgot-password">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-secondary-900">
            Password Reset!
          </h1>
          <p className="mt-4 text-secondary-600">
            Your password has been reset successfully. You can now sign in with
            your new password.
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Lock className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-secondary-900">
            Reset Password
          </h1>
          <p className="mt-2 text-secondary-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {/* Password Field */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="New Password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                className="pr-20"
                {...register("password")}
              />
              <div className="absolute right-3 top-9 flex items-center gap-2">
                {dirtyFields.password && (
                  <>
                    {isPasswordValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : errors.password ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {dirtyFields.password && watchedPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-secondary-200"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.level <= 1
                          ? "text-red-600"
                          : passwordStrength.level === 2
                            ? "text-orange-600"
                            : passwordStrength.level === 3
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-1.5 text-xs ${
                        req.met ? "text-green-600" : "text-secondary-500"
                      }`}
                    >
                      {req.met ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              className={
                isConfirmPasswordValid
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500 pr-20"
                  : errors.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-20"
                    : "pr-20"
              }
              {...register("confirmPassword")}
            />
            <div className="absolute right-3 top-9 flex items-center gap-2">
              {dirtyFields.confirmPassword && (
                <>
                  {isConfirmPasswordValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : errors.confirmPassword ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
