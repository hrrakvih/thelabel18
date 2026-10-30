"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AddressInput } from "@/lib/supabase/addresses";

export default function AddressForm({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: AddressInput) => Promise<void>;
}) {
  const [form, setForm] = useState<AddressInput>({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.phone.trim() || !form.line1.trim() ||
        !form.city.trim() || !form.state.trim() || !form.postal_code.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      setForm({
        full_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save address.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#F8F6F0] rounded-2xl shadow-xl border border-[#1A1A1A]/10 p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/40 hover:text-[#9c7d23]"
          aria-label="Close"
        >
          ✕
        </button>

        <h2
          className="text-xl uppercase tracking-[0.15em] mb-6 text-[#1A1A1A]"
        >
          Add Address
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(v) => update("full_name", v)} />
          <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} type="tel" />
          <Input label="Address Line 1" value={form.line1} onChange={(v) => update("line1", v)} />
          <Input label="Address Line 2 (optional)" value={form.line2 ?? ""} onChange={(v) => update("line2", v)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={form.city} onChange={(v) => update("city", v)} />
            <Input label="State" value={form.state} onChange={(v) => update("state", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Postal Code" value={form.postal_code} onChange={(v) => update("postal_code", v)} />
            <Input label="Country" value={form.country} onChange={(v) => update("country", v)} />
          </div>

          <label className="flex items-center gap-2 text-[12px] font-outfit font-light text-[#1A1A1A]/70">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => update("is_default", e.target.checked)}
              className="accent-[#9c7d23]"
            />
            Set as default address
          </label>

          {error && <p className="text-[12px] font-outfit text-red-600/90">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded bg-[#1A1A1A] text-[#F8F6F0] text-[11px] tracking-[0.3em] uppercase font-outfit font-medium hover:bg-[#9c7d23] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Address"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 font-outfit font-medium mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#1A1A1A]/15 rounded px-3.5 py-2.5 text-sm font-outfit font-light text-[#1A1A1A] focus:outline-none focus:border-[#9c7d23]/60"
      />
    </div>
  );
}