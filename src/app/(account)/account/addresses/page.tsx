"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Home,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, PremiumSectionLoading } from "@/components/ui";
import type { IAddress } from "@/types";

type AddressType = "home" | "office" | "other";

type AddressPayload = Omit<IAddress, "_id">;

type AddressApiResponse = {
  success: boolean;
  data?: IAddress[];
  error?: string;
  message?: string;
};

const EMPTY_ADDRESS: AddressPayload = {
  type: "home",
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Bangladesh",
  isDefault: false,
};

const typeMeta: Record<
  AddressType,
  { label: string; icon: typeof Home; tone: string }
> = {
  home: {
    label: "Home",
    icon: Home,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  office: {
    label: "Office",
    icon: Building2,
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  other: {
    label: "Other",
    icon: Landmark,
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

async function requestAddresses(
  endpoint: string,
  init?: RequestInit,
): Promise<AddressApiResponse> {
  const response = await fetch(endpoint, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const json = (await response.json().catch(() => null)) as
    | AddressApiResponse
    | null;

  if (!response.ok || !json?.success) {
    throw new Error(json?.error || "Request failed");
  }

  return json;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressPayload>(EMPTY_ADDRESS);
  const [errorText, setErrorText] = useState("");

  const totalAddresses = addresses.length;
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault),
    [addresses],
  );

  const loadAddresses = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const json = await requestAddresses("/api/account/addresses", {
        method: "GET",
      });
      setAddresses(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load addresses";
      setErrorText(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_ADDRESS);
    setEditingAddressId(null);
    setIsFormOpen(false);
    setErrorText("");
  };

  const startCreate = () => {
    setEditingAddressId(null);
    setForm({
      ...EMPTY_ADDRESS,
      isDefault: addresses.length === 0,
    });
    setIsFormOpen(true);
    setErrorText("");
  };

  const startEdit = (address: IAddress) => {
    setEditingAddressId(address._id || null);
    setForm({
      type: address.type,
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setIsFormOpen(true);
    setErrorText("");
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setErrorText("");

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || "Bangladesh",
      };

      if (editingAddressId) {
        const json = await requestAddresses("/api/account/addresses", {
          method: "PATCH",
          body: JSON.stringify({
            addressId: editingAddressId,
            address: payload,
          }),
        });
        setAddresses(Array.isArray(json.data) ? json.data : []);
        toast.success("Address updated successfully");
      } else {
        const json = await requestAddresses("/api/account/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAddresses(Array.isArray(json.data) ? json.data : []);
        toast.success("Address added successfully");
      }

      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save address";
      setErrorText(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);

    try {
      const json = await requestAddresses("/api/account/addresses", {
        method: "PATCH",
        body: JSON.stringify({ addressId, setDefault: true }),
      });

      setAddresses(Array.isArray(json.data) ? json.data : []);
      toast.success("Default address updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set default address");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const deleteAddress = async (address: IAddress) => {
    if (!address._id) return;

    const confirmed = window.confirm("Delete this address from your account?");
    if (!confirmed) {
      return;
    }

    setDeletingId(address._id);

    try {
      const json = await requestAddresses("/api/account/addresses", {
        method: "DELETE",
        body: JSON.stringify({ addressId: address._id }),
      });

      setAddresses(Array.isArray(json.data) ? json.data : []);
      toast.success("Address deleted successfully");

      if (editingAddressId === address._id) {
        resetForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#bfe7d4] bg-[radial-gradient(circle_at_top_right,#dcf8e8_0%,transparent_58%),linear-gradient(135deg,#ffffff_0%,#f6fcf9_52%,#ebf8f1_100%)] p-6 shadow-[0_28px_55px_-46px_rgba(17,43,34,0.55)] sm:p-7">
        <div className="pointer-events-none absolute -left-16 top-4 h-44 w-44 rounded-full bg-[#B0E4CC]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-[#408A71]/15 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#285A48]/70">
              Address Book
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#091413] sm:text-3xl">
              Delivery Addresses
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#091413]/65 sm:text-base">
              Save and manage your shipping addresses for faster checkout and cleaner order tracking.
            </p>
          </div>

          <Button className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Add New Address
          </Button>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#B0E4CC]/45 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#285A48]/70">Total</p>
            <p className="mt-1 text-2xl font-bold text-[#285A48]">{totalAddresses}</p>
          </div>
          <div className="rounded-2xl border border-[#B0E4CC]/45 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#285A48]/70">Default</p>
            <p className="mt-1 text-sm font-semibold text-[#091413]">
              {defaultAddress ? defaultAddress.name : "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#B0E4CC]/45 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#285A48]/70">Security</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#285A48]">
              <ShieldCheck className="h-4 w-4" /> Verified account data
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <PremiumSectionLoading
          title="Loading your addresses"
          subtitle="Preparing saved delivery points and default preferences."
          className="min-h-[280px] flex items-center justify-center"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <section className="space-y-4">
            {!addresses.length ? (
              <div className="rounded-2xl border border-dashed border-[#B0E4CC] bg-white p-10 text-center">
                <MapPin className="mx-auto h-12 w-12 text-[#408A71]/60" />
                <h2 className="mt-4 text-xl font-semibold text-[#091413]">No addresses saved yet</h2>
                <p className="mt-2 text-sm text-[#091413]/60">
                  Add your first delivery address to speed up checkout.
                </p>
                <Button className="mt-6 gap-2" onClick={startCreate}>
                  <Plus className="h-4 w-4" /> Add Address
                </Button>
              </div>
            ) : (
              addresses.map((address) => {
                const meta = typeMeta[address.type as AddressType] || typeMeta.other;
                const TypeIcon = meta.icon;

                return (
                  <article
                    key={address._id}
                    className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_16px_38px_-30px_rgba(24,50,39,0.62)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-26px_rgba(24,50,39,0.6)] ${
                      address.isDefault
                        ? "border-[#7bbd9f] ring-2 ring-[#B0E4CC]/35"
                        : "border-[#B0E4CC]/45"
                    }`}
                  >
                    <div className="pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full bg-[#B0E4CC]/24 blur-2xl" />

                    <div className="relative flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                          {address.isDefault ? (
                            <Badge variant="success" className="gap-1">
                              <Star className="h-3.5 w-3.5" /> Default
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#091413]">
                          <UserRound className="h-4 w-4 text-[#285A48]" />
                          {address.name}
                        </p>
                        <p className="mt-1 text-sm text-[#091413]/70">{address.phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!address.isDefault ? (
                          <button
                            type="button"
                            onClick={() => address._id && makeDefault(address._id)}
                            disabled={settingDefaultId === address._id}
                            className="rounded-xl border border-[#B0E4CC]/60 bg-[#f4fbf8] px-3 py-1.5 text-xs font-semibold text-[#285A48] transition-colors hover:bg-[#eaf7f1] disabled:opacity-60"
                          >
                            {settingDefaultId === address._id ? "Setting..." : "Set Default"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => startEdit(address)}
                          className="rounded-xl border border-[#B0E4CC]/60 bg-white px-2.5 py-1.5 text-[#285A48] transition-colors hover:bg-[#f4fbf8]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(address)}
                          disabled={deletingId === address._id}
                          className="rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative mt-4 rounded-xl border border-[#B0E4CC]/40 bg-[#f8fffb] p-3 text-sm text-[#091413]/75">
                      <p>{address.street}</p>
                      <p className="mt-1">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="mt-1">{address.country}</p>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-[#B0E4CC]/45 bg-white p-5 shadow-[0_16px_38px_-30px_rgba(24,50,39,0.62)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#091413]">
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </h2>
              {isFormOpen ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-[#B0E4CC]/60 px-2 py-1 text-[#285A48] transition-colors hover:bg-[#f4fbf8]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {!isFormOpen ? (
              <div className="mt-5 rounded-xl border border-dashed border-[#B0E4CC] p-5 text-center">
                <MapPin className="mx-auto h-10 w-10 text-[#408A71]/60" />
                <p className="mt-3 text-sm text-[#091413]/60">
                  Create a new address or edit an existing one.
                </p>
                <Button className="mt-4 gap-2" onClick={startCreate}>
                  <Plus className="h-4 w-4" /> Open Address Form
                </Button>
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={saveAddress}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#091413]">Address Type</label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as AddressType,
                      }))
                    }
                    className="h-12 w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-sm text-[#091413] outline-none transition-colors hover:border-[#408A71] focus:border-[#408A71]"
                  >
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Recipient Name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Name"
                  required
                />
                <Input
                  label="Phone Number"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="01XXXXXXXXX"
                  required
                />
                <Input
                  label="Street Address"
                  value={form.street}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, street: event.target.value }))
                  }
                  placeholder="Road, area, house"
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="City"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                    required
                  />
                  <Input
                    label="State/Division"
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, state: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, postalCode: event.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, country: event.target.value }))
                    }
                    required
                  />
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#B0E4CC]/55 bg-[#f8fffb] px-3 py-2 text-sm text-[#285A48]">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isDefault: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#285A48]"
                  />
                  Set as default address
                </label>

                {errorText ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errorText}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="submit" isLoading={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {editingAddressId ? "Update Address" : "Save Address"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
