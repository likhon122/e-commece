"use client";

import { useMemo } from "react";
import { Bell, Lock, Palette, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const settings = [
  {
    icon: ShieldCheck,
    title: "Security Mode",
    description: "Two-layer admin authentication and session monitoring enabled.",
    value: "Enabled",
  },
  {
    icon: Bell,
    title: "Operational Alerts",
    description: "Payment failure, low stock, and fraud-risk notifications.",
    value: "Real-time",
  },
  {
    icon: Lock,
    title: "Data Protection",
    description: "Sensitive customer fields are protected in admin views.",
    value: "Protected",
  },
  {
    icon: Palette,
    title: "Admin Theme",
    description: "Premium modern visual system for better executive readability.",
    value: "Premium",
  },
];

export default function AdminSettingsPageClient() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">Settings Center</h1>
        <p className="mt-1 text-sm text-secondary-600">Platform-grade defaults for operations, security, and style.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <Card key={item.title} className="border-[#285A48]/20 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <item.icon className="h-4 w-4 text-[#285A48]" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-600">{item.description}</p>
              <p className="mt-3 text-sm font-semibold text-secondary-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardContent className="p-5 text-sm text-secondary-600">
          Mythium Admin System Configuration v{year}. For advanced integration settings, next step is connecting payment/webhook and email provider controls.
        </CardContent>
      </Card>
    </div>
  );
}
