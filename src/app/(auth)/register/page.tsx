"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Check,
  X,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedPassword = watch("password") || "";
  const watchedConfirmPassword = watch("confirmPassword");

  // Check if fields are valid
  const isNameValid =
    watchedName && watchedName.length >= 2 && !errors.name && dirtyFields.name;
  const isEmailValid = watchedEmail && !errors.email && dirtyFields.email;
  const isPasswordValid =
    watchedPassword && !errors.password && dirtyFields.password;
  const isConfirmPasswordValid =
    watchedConfirmPassword &&
    watchedConfirmPassword === watchedPassword &&
    !errors.confirmPassword &&
    dirtyFields.confirmPassword;

  // Password strength requirements
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
      return { level: 3, label: "Good", color: "bg-brand-sage" };
    return { level: 4, label: "Strong", color: "bg-brand-forest" };
  }, [passwordRequirements]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // Show success state
      setRegisteredEmail(data.email);
      setRegistrationSuccess(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed",
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  // Success state after registration
  if (registrationSuccess) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-3xl border border-brand-mint/20 bg-white p-8 text-center shadow-2xl shadow-brand-dark/10 md:p-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-forest to-brand-sage shadow-lg shadow-brand-forest/25"
            >
              <Mail className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="mt-6 font-display text-3xl font-bold text-brand-dark">
              Check Your Email
            </h1>
            <p className="mt-4 text-brand-dark/60">
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-brand-sage">
                {registeredEmail}
              </span>
            </p>
            <p className="mt-2 text-sm text-brand-dark/50">
              Click the link in the email to verify your account and complete
              registration.
            </p>

            <div className="mt-8 rounded-xl bg-brand-mint/10 p-4">
              <p className="text-sm text-brand-dark/70">
                <strong>Didn&apos;t receive the email?</strong>
                <br />
                Check your spam folder or{" "}
                <button
                  onClick={() => setRegistrationSuccess(false)}
                  className="font-medium text-brand-sage transition-colors hover:text-brand-forest hover:underline"
                >
                  try registering again
                </button>
              </p>
            </div>

            <div className="mt-6">
              <Link href="/login">
                <Button variant="outline" className="w-full border-2 border-brand-mint/30 py-5">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Premium Card */}
        <div className="rounded-3xl border border-brand-mint/20 bg-white p-8 shadow-2xl shadow-brand-dark/10 md:p-10">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-forest to-brand-sage shadow-lg shadow-brand-forest/25"
            >
              <UserPlus className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-brand-dark">
              Create Account
            </h1>
            <p className="mt-2 text-brand-dark/60">
              Join Mythium for exclusive access to our collection
            </p>
          </div>

          {/* Google Sign In */}
          <div className="mt-8">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 border-2 border-brand-mint/30 py-6 transition-all hover:border-brand-sage hover:bg-brand-mint/5"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-mint/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-brand-dark/40">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Name Field */}
            <div className="relative">
              <Input
                id="name"
                type="text"
                label="Full Name"
                placeholder="Your full name"
                error={errors.name?.message}
                className={
                  isNameValid
                    ? "border-brand-sage focus:border-brand-sage focus:ring-brand-sage"
                    : errors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                }
                {...register("name")}
              />
              {dirtyFields.name && (
                <div className="absolute right-3 top-9">
                  {isNameValid ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-sage" />
                  ) : errors.name ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="relative">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                error={errors.email?.message}
                className={
                  isEmailValid
                    ? "border-brand-sage focus:border-brand-sage focus:ring-brand-sage"
                    : errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                }
                {...register("email")}
              />
              {dirtyFields.email && (
                <div className="absolute right-3 top-9">
                  {isEmailValid ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-sage" />
                  ) : errors.email ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Create a strong password"
                  error={errors.password?.message}
                  className="pr-20"
                  {...register("password")}
                />
                <div className="absolute right-3 top-9 flex items-center gap-2">
                  {dirtyFields.password && (
                    <>
                      {isPasswordValid ? (
                        <CheckCircle2 className="h-5 w-5 text-brand-sage" />
                      ) : errors.password ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : null}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-brand-dark/40 transition-colors hover:text-brand-sage"
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
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : "bg-brand-mint/30"
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
                                ? "text-brand-sage"
                                : "text-brand-forest"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    )}
                  </div>

                  {/* Requirements List */}
                  <div className="grid grid-cols-2 gap-1">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1.5 text-xs ${
                          req.met ? "text-brand-sage" : "text-brand-dark/40"
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
                </motion.div>
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
                    ? "border-brand-sage focus:border-brand-sage focus:ring-brand-sage pr-20"
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
                      <CheckCircle2 className="h-5 w-5 text-brand-sage" />
                    ) : errors.confirmPassword ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-brand-dark/40 transition-colors hover:text-brand-sage"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 h-4 w-4 rounded border-brand-mint/50 text-brand-sage focus:ring-brand-sage"
                required
              />
              <label htmlFor="terms" className="text-sm text-brand-dark/60">
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-brand-sage transition-colors hover:text-brand-forest hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-brand-sage transition-colors hover:text-brand-forest hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full py-6" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-brand-dark/60">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-sage transition-colors hover:text-brand-forest hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
