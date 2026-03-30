"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Database,
  Globe,
  Key,
  Lock,
  Mail,
  Palette,
  Save,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

type SettingsSection = "general" | "security" | "notifications" | "payments" | "shipping" | "appearance";

type GeneralSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  timezone: string;
  language: string;
};

type SecuritySettings = {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  ipWhitelist: string;
  passwordExpiry: number;
  maxLoginAttempts: number;
};

type NotificationSettings = {
  orderConfirmation: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  newCustomerAlert: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

type PaymentSettings = {
  sslcommerz: boolean;
  sslcommerzStoreId: string;
  sslcommerzStorePassword: string;
  bkash: boolean;
  bkashAppKey: string;
  nagad: boolean;
  nagadMerchantId: string;
  codEnabled: boolean;
  codMinOrder: number;
  codMaxOrder: number;
};

type ShippingSettings = {
  freeShippingThreshold: number;
  defaultShippingCost: number;
  expressShippingCost: number;
  estimatedDeliveryDays: number;
  enableLocalPickup: boolean;
  pickupAddress: string;
  enableInternational: boolean;
  internationalShippingCost: number;
};

type AppearanceSettings = {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  showAnnouncement: boolean;
  announcementText: string;
  announcementColor: string;
};

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-[#285A48]/20 ${
        checked ? "bg-[#285A48]" : "bg-secondary-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-100 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#285A48]/10">
          <Icon className="h-5 w-5 text-[#285A48]" />
        </div>
        <div>
          <h4 className="font-medium text-secondary-900">{title}</h4>
          <p className="text-sm text-secondary-500">{description}</p>
        </div>
      </div>
      <div className="ml-14 sm:ml-0">{children}</div>
    </div>
  );
}

export default function AdminSettingsPageClient() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [general, setGeneral] = useState<GeneralSettings>({
    storeName: "Mythium",
    storeEmail: "contact@mythium.com",
    storePhone: "+880 1234-567890",
    storeAddress: "Dhaka, Bangladesh",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    language: "en",
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: true,
    sessionTimeout: 30,
    loginNotifications: true,
    ipWhitelist: "",
    passwordExpiry: 90,
    maxLoginAttempts: 5,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderConfirmation: true,
    orderShipped: true,
    orderDelivered: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    newCustomerAlert: true,
    dailyReport: false,
    weeklyReport: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [payments, setPayments] = useState<PaymentSettings>({
    sslcommerz: true,
    sslcommerzStoreId: "",
    sslcommerzStorePassword: "",
    bkash: true,
    bkashAppKey: "",
    nagad: false,
    nagadMerchantId: "",
    codEnabled: true,
    codMinOrder: 500,
    codMaxOrder: 50000,
  });

  const [shipping, setShipping] = useState<ShippingSettings>({
    freeShippingThreshold: 3000,
    defaultShippingCost: 120,
    expressShippingCost: 250,
    estimatedDeliveryDays: 3,
    enableLocalPickup: true,
    pickupAddress: "Shop #123, Gulshan-2, Dhaka",
    enableInternational: false,
    internationalShippingCost: 2500,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: "light",
    primaryColor: "#285A48",
    accentColor: "#B0E4CC",
    logoUrl: "",
    faviconUrl: "",
    showAnnouncement: false,
    announcementText: "Free shipping on orders over ৳3000!",
    announcementColor: "#285A48",
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.general) setGeneral(parsed.general);
        if (parsed.security) setSecurity(parsed.security);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.shipping) setShipping(parsed.shipping);
        if (parsed.appearance) setAppearance(parsed.appearance);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage for persistence
      const settings = { general, security, notifications, payments, shipping, appearance };
      localStorage.setItem("adminSettings", JSON.stringify(settings));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sections: Array<{ id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "general", label: "General", icon: Store },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Premium Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#f7fbf8] via-[#f8f4e8]/50 to-[#eef8f3]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-96 w-96 rounded-full bg-[#408A71]/10 blur-[100px]" />
      <div className="pointer-events-none fixed -right-40 top-40 h-96 w-96 rounded-full bg-[#B0E4CC]/30 blur-[100px]" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-[#285A48]/10 bg-white/80 p-6 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.15)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-secondary-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Settings Center
              </h1>
              <p className="mt-2 text-sm text-secondary-600">
                Configure your store settings, security, and integrations
              </p>
            </div>
            <Button
              variant="primary"
              className="gap-2 rounded-xl shadow-lg"
              onClick={handleSave}
              isLoading={saving}
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {saved && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Settings saved successfully!
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <Card className="h-fit border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardContent className="p-3">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-[#285A48] to-[#408A71] text-white shadow-lg"
                        : "text-secondary-700 hover:bg-secondary-100"
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* General Settings */}
            {activeSection === "general" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-[#285A48]" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Store Name"
                      value={general.storeName}
                      onChange={(e) => setGeneral({ ...general, storeName: e.target.value })}
                    />
                    <Input
                      label="Contact Email"
                      type="email"
                      value={general.storeEmail}
                      onChange={(e) => setGeneral({ ...general, storeEmail: e.target.value })}
                    />
                    <Input
                      label="Phone Number"
                      value={general.storePhone}
                      onChange={(e) => setGeneral({ ...general, storePhone: e.target.value })}
                    />
                    <Input
                      label="Store Address"
                      value={general.storeAddress}
                      onChange={(e) => setGeneral({ ...general, storeAddress: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Currency</label>
                      <select
                        value={general.currency}
                        onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      >
                        <option value="BDT">BDT (৳)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Timezone</label>
                      <select
                        value={general.timezone}
                        onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      >
                        <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">America/New_York (GMT-5)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Language</label>
                      <select
                        value={general.language}
                        onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeSection === "security" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-[#285A48]" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <SettingRow
                    icon={ShieldCheck}
                    title="Two-Factor Authentication"
                    description="Require 2FA for admin login"
                  >
                    <ToggleSwitch
                      checked={security.twoFactorAuth}
                      onChange={(checked) => setSecurity({ ...security, twoFactorAuth: checked })}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Bell}
                    title="Login Notifications"
                    description="Get notified on new admin logins"
                  >
                    <ToggleSwitch
                      checked={security.loginNotifications}
                      onChange={(checked) => setSecurity({ ...security, loginNotifications: checked })}
                    />
                  </SettingRow>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Password Expiry (days)</label>
                      <input
                        type="number"
                        value={security.passwordExpiry}
                        onChange={(e) => setSecurity({ ...security, passwordExpiry: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Max Login Attempts</label>
                      <input
                        type="number"
                        value={security.maxLoginAttempts}
                        onChange={(e) => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-secondary-700">IP Whitelist (comma-separated)</label>
                    <input
                      value={security.ipWhitelist}
                      onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })}
                      placeholder="192.168.1.1, 10.0.0.1"
                      className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeSection === "notifications" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-[#285A48]" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="mb-6 rounded-2xl border border-[#285A48]/10 bg-[#f7fff9] p-4">
                    <h4 className="mb-3 font-medium text-secondary-900">Notification Channels</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={notifications.emailNotifications}
                          onChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                        />
                        <Mail className="h-4 w-4 text-secondary-500" />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={notifications.smsNotifications}
                          onChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                        />
                        <Smartphone className="h-4 w-4 text-secondary-500" />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>

                  <h4 className="font-medium text-secondary-900">Order Notifications</h4>
                  <SettingRow
                    icon={Check}
                    title="Order Confirmation"
                    description="Notify when new order is placed"
                  >
                    <ToggleSwitch
                      checked={notifications.orderConfirmation}
                      onChange={(checked) => setNotifications({ ...notifications, orderConfirmation: checked })}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Truck}
                    title="Order Shipped"
                    description="Notify when order is shipped"
                  >
                    <ToggleSwitch
                      checked={notifications.orderShipped}
                      onChange={(checked) => setNotifications({ ...notifications, orderShipped: checked })}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Check}
                    title="Order Delivered"
                    description="Notify when order is delivered"
                  >
                    <ToggleSwitch
                      checked={notifications.orderDelivered}
                      onChange={(checked) => setNotifications({ ...notifications, orderDelivered: checked })}
                    />
                  </SettingRow>

                  <h4 className="mt-6 font-medium text-secondary-900">Inventory & Customers</h4>
                  <SettingRow
                    icon={Database}
                    title="Low Stock Alert"
                    description="Alert when product stock is low"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={notifications.lowStockThreshold}
                        onChange={(e) => setNotifications({ ...notifications, lowStockThreshold: Number(e.target.value) })}
                        className="h-10 w-20 rounded-lg border border-secondary-200 px-3 text-sm"
                        placeholder="10"
                      />
                      <ToggleSwitch
                        checked={notifications.lowStockAlert}
                        onChange={(checked) => setNotifications({ ...notifications, lowStockAlert: checked })}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={User}
                    title="New Customer Alert"
                    description="Notify when new customer registers"
                  >
                    <ToggleSwitch
                      checked={notifications.newCustomerAlert}
                      onChange={(checked) => setNotifications({ ...notifications, newCustomerAlert: checked })}
                    />
                  </SettingRow>

                  <h4 className="mt-6 font-medium text-secondary-900">Reports</h4>
                  <SettingRow
                    icon={Mail}
                    title="Daily Report"
                    description="Receive daily sales summary"
                  >
                    <ToggleSwitch
                      checked={notifications.dailyReport}
                      onChange={(checked) => setNotifications({ ...notifications, dailyReport: checked })}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Mail}
                    title="Weekly Report"
                    description="Receive weekly analytics digest"
                  >
                    <ToggleSwitch
                      checked={notifications.weeklyReport}
                      onChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                    />
                  </SettingRow>
                </CardContent>
              </Card>
            )}

            {/* Payment Settings */}
            {activeSection === "payments" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-[#285A48]" />
                    Payment Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* SSLCommerz */}
                  <div className="rounded-2xl border border-secondary-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">SSLCommerz</h4>
                          <p className="text-sm text-secondary-500">Accept card & mobile banking</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={payments.sslcommerz}
                        onChange={(checked) => setPayments({ ...payments, sslcommerz: checked })}
                      />
                    </div>
                    {payments.sslcommerz && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Store ID"
                          value={payments.sslcommerzStoreId}
                          onChange={(e) => setPayments({ ...payments, sslcommerzStoreId: e.target.value })}
                          placeholder="your_store_id"
                        />
                        <Input
                          label="Store Password"
                          type="password"
                          value={payments.sslcommerzStorePassword}
                          onChange={(e) => setPayments({ ...payments, sslcommerzStorePassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    )}
                  </div>

                  {/* bKash */}
                  <div className="rounded-2xl border border-secondary-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                          <Smartphone className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">bKash</h4>
                          <p className="text-sm text-secondary-500">Mobile financial service</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={payments.bkash}
                        onChange={(checked) => setPayments({ ...payments, bkash: checked })}
                      />
                    </div>
                    {payments.bkash && (
                      <div className="mt-4">
                        <Input
                          label="App Key"
                          value={payments.bkashAppKey}
                          onChange={(e) => setPayments({ ...payments, bkashAppKey: e.target.value })}
                          placeholder="your_bkash_app_key"
                        />
                      </div>
                    )}
                  </div>

                  {/* Nagad */}
                  <div className="rounded-2xl border border-secondary-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                          <Smartphone className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">Nagad</h4>
                          <p className="text-sm text-secondary-500">Digital payment platform</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={payments.nagad}
                        onChange={(checked) => setPayments({ ...payments, nagad: checked })}
                      />
                    </div>
                    {payments.nagad && (
                      <div className="mt-4">
                        <Input
                          label="Merchant ID"
                          value={payments.nagadMerchantId}
                          onChange={(e) => setPayments({ ...payments, nagadMerchantId: e.target.value })}
                          placeholder="your_nagad_merchant_id"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cash on Delivery */}
                  <div className="rounded-2xl border border-secondary-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                          <Truck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">Cash on Delivery</h4>
                          <p className="text-sm text-secondary-500">Pay when you receive</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={payments.codEnabled}
                        onChange={(checked) => setPayments({ ...payments, codEnabled: checked })}
                      />
                    </div>
                    {payments.codEnabled && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-secondary-700">Min Order (BDT)</label>
                          <input
                            type="number"
                            value={payments.codMinOrder}
                            onChange={(e) => setPayments({ ...payments, codMinOrder: Number(e.target.value) })}
                            className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-secondary-700">Max Order (BDT)</label>
                          <input
                            type="number"
                            value={payments.codMaxOrder}
                            onChange={(e) => setPayments({ ...payments, codMaxOrder: Number(e.target.value) })}
                            className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Settings */}
            {activeSection === "shipping" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-[#285A48]" />
                    Shipping Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Free Shipping Threshold (BDT)</label>
                      <input
                        type="number"
                        value={shipping.freeShippingThreshold}
                        onChange={(e) => setShipping({ ...shipping, freeShippingThreshold: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                      />
                      <p className="mt-1 text-xs text-secondary-500">Set to 0 to disable free shipping</p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Default Shipping Cost (BDT)</label>
                      <input
                        type="number"
                        value={shipping.defaultShippingCost}
                        onChange={(e) => setShipping({ ...shipping, defaultShippingCost: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Express Shipping Cost (BDT)</label>
                      <input
                        type="number"
                        value={shipping.expressShippingCost}
                        onChange={(e) => setShipping({ ...shipping, expressShippingCost: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Estimated Delivery (days)</label>
                      <input
                        type="number"
                        value={shipping.estimatedDeliveryDays}
                        onChange={(e) => setShipping({ ...shipping, estimatedDeliveryDays: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                      />
                    </div>
                  </div>

                  <SettingRow
                    icon={Store}
                    title="Local Pickup"
                    description="Allow customers to pick up orders"
                  >
                    <ToggleSwitch
                      checked={shipping.enableLocalPickup}
                      onChange={(checked) => setShipping({ ...shipping, enableLocalPickup: checked })}
                    />
                  </SettingRow>

                  {shipping.enableLocalPickup && (
                    <Input
                      label="Pickup Address"
                      value={shipping.pickupAddress}
                      onChange={(e) => setShipping({ ...shipping, pickupAddress: e.target.value })}
                      placeholder="Store address for pickup"
                    />
                  )}

                  <SettingRow
                    icon={Globe}
                    title="International Shipping"
                    description="Ship orders outside Bangladesh"
                  >
                    <ToggleSwitch
                      checked={shipping.enableInternational}
                      onChange={(checked) => setShipping({ ...shipping, enableInternational: checked })}
                    />
                  </SettingRow>

                  {shipping.enableInternational && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">International Shipping Cost (BDT)</label>
                      <input
                        type="number"
                        value={shipping.internationalShippingCost}
                        onChange={(e) => setShipping({ ...shipping, internationalShippingCost: Number(e.target.value) })}
                        className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings */}
            {activeSection === "appearance" && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardHeader className="border-b border-secondary-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5 text-[#285A48]" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-secondary-700">Theme</label>
                    <div className="flex flex-wrap gap-3">
                      {(["light", "dark", "system"] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setAppearance({ ...appearance, theme })}
                          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium capitalize transition-all ${
                            appearance.theme === theme
                              ? "bg-gradient-to-r from-[#285A48] to-[#408A71] text-white shadow-lg"
                              : "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                          }`}
                        >
                          {theme === "light" && "☀️"}
                          {theme === "dark" && "🌙"}
                          {theme === "system" && "💻"}
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Primary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                          className="h-12 w-12 cursor-pointer rounded-xl border-2 border-secondary-200"
                        />
                        <input
                          type="text"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                          className="h-12 flex-1 rounded-xl border-2 border-[#B0E4CC] bg-white px-4 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary-700">Accent Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={appearance.accentColor}
                          onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                          className="h-12 w-12 cursor-pointer rounded-xl border-2 border-secondary-200"
                        />
                        <input
                          type="text"
                          value={appearance.accentColor}
                          onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                          className="h-12 flex-1 rounded-xl border-2 border-[#B0E4CC] bg-white px-4 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Logo URL"
                      value={appearance.logoUrl}
                      onChange={(e) => setAppearance({ ...appearance, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <Input
                      label="Favicon URL"
                      value={appearance.faviconUrl}
                      onChange={(e) => setAppearance({ ...appearance, faviconUrl: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>

                  <SettingRow
                    icon={Bell}
                    title="Announcement Banner"
                    description="Show announcement on storefront"
                  >
                    <ToggleSwitch
                      checked={appearance.showAnnouncement}
                      onChange={(checked) => setAppearance({ ...appearance, showAnnouncement: checked })}
                    />
                  </SettingRow>

                  {appearance.showAnnouncement && (
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                      <Input
                        label="Announcement Text"
                        value={appearance.announcementText}
                        onChange={(e) => setAppearance({ ...appearance, announcementText: e.target.value })}
                        placeholder="Your announcement message..."
                      />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-secondary-700">Color</label>
                        <input
                          type="color"
                          value={appearance.announcementColor}
                          onChange={(e) => setAppearance({ ...appearance, announcementColor: e.target.value })}
                          className="h-12 w-12 cursor-pointer rounded-xl border-2 border-secondary-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {appearance.showAnnouncement && (
                    <div
                      className="rounded-xl p-3 text-center text-sm font-medium text-white"
                      style={{ backgroundColor: appearance.announcementColor }}
                    >
                      {appearance.announcementText || "Your announcement preview"}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-white/80 px-6 py-4 text-sm backdrop-blur-sm">
          <p className="text-secondary-500">
            Settings are saved locally. For production, connect to your backend API.
          </p>
          <Button
            variant="primary"
            className="gap-2 rounded-xl"
            onClick={handleSave}
            isLoading={saving}
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Settings Saved!" : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
