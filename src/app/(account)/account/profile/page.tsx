"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Loader2, Shield } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/profile");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-sage" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">My Profile</h1>
        <p className="text-brand-dark/60">Manage your account settings</p>
      </div>

      {/* User Avatar Section */}
      <div className="rounded-2xl border border-brand-mint/20 bg-white p-6 shadow-lg shadow-brand-dark/5">
        <div className="flex items-center gap-5">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "Profile"}
              className="h-24 w-24 rounded-2xl border-4 border-brand-mint/20 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-forest to-brand-sage text-white shadow-lg shadow-brand-forest/25">
              <User className="h-12 w-12" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark">
              {user.name}
            </h2>
            <p className="text-brand-dark/60">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-brand-sage">
              <Shield className="h-4 w-4" />
              <span>Verified Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-brand-mint/20 bg-white p-6 shadow-lg shadow-brand-dark/5">
        <h2 className="text-lg font-semibold text-brand-dark">
          Personal Information
        </h2>

        <form className="mt-6 grid gap-6 sm:grid-cols-2">
          <Input
            label="Full Name"
            defaultValue={user.name || ""}
            placeholder="Your full name"
          />
          <Input
            label="Email"
            type="email"
            defaultValue={user.email || ""}
            disabled
            className="bg-brand-mint/5"
          />
          <Input label="Phone" type="tel" placeholder="+880 1XXX-XXXXXX" />
          <div className="sm:col-span-2">
            <Button>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-brand-mint/20 bg-white p-6 shadow-lg shadow-brand-dark/5">
        <h2 className="text-lg font-semibold text-brand-dark">
          Change Password
        </h2>

        <form className="mt-6 grid gap-6 sm:grid-cols-2">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
          />
          <div />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
          />
          <div className="sm:col-span-2">
            <Button>Update Password</Button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-2 text-sm text-red-700/80">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <Button variant="destructive" className="mt-4">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
