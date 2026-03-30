"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validations";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");

  const isEmailValid = watchedEmail && !errors.email && dirtyFields.email;
  const isPasswordValid = watchedPassword && !errors.password && dirtyFields.password;

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Login successful!");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl });
    } catch (error) {
      toast.error("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-3xl border border-[#B0E4CC]/30 bg-white p-8 shadow-2xl md:p-10">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-[#091413]">
              Welcome Back
            </h1>
            <p className="mt-2 text-[#091413]/60">
              Sign in to your account to continue shopping
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                {error === "CredentialsSignin"
                  ? "Invalid email or password"
                  : error === "OAuthAccountNotLinked"
                    ? "This email is already registered with a different sign-in method"
                    : "An error occurred during sign in"}
              </p>
            </motion.div>
          )}

          <div className="mt-8">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 py-6"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#B0E4CC]/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-[#091413]/50">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="relative">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              {dirtyFields.email && (
                <div className="absolute right-3 top-9">
                  {isEmailValid ? (
                    <CheckCircle2 className="h-5 w-5 text-[#408A71]" />
                  ) : errors.email ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
                className="pr-20"
                {...register("password")}
              />
              <div className="absolute right-3 top-9 flex items-center gap-2">
                {dirtyFields.password && (
                  <>
                    {isPasswordValid ? (
                      <CheckCircle2 className="h-5 w-5 text-[#408A71]" />
                    ) : errors.password ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#091413]/40 transition-colors hover:text-[#408A71]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#B0E4CC] text-[#408A71] focus:ring-[#408A71]"
                />
                <span className="text-sm text-[#091413]/60">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#408A71] transition-colors hover:text-[#285A48] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full py-6" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[#091413]/60">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#408A71] transition-colors hover:text-[#285A48] hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
