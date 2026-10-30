"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Address, getAddresses, addAddress, AddressInput } from "@/lib/supabase/addresses";
import AddressForm from "@/components/AddressForm";
import {
  startCheckoutAction,
  verifyPaymentAction,
  markPaymentAbandonedAction,
} from "@/app/(site)/checkout/actions";
import toast from "react-hot-toast";
import { Sparkles, ShieldCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (res: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(!!window.Razorpay));
    script.addEventListener("error", () => {
      script.remove();
      resolve(false);
    });
    if (!existing) {
      script.src = RAZORPAY_CHECKOUT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  variation_id: string | null;
  products: { id: string; name: string; image_url: string | null } | null;
  product_variations: {
    id: string;
    price: number;
    color: string | null;
    size: string | null;
    image_url: string | null;
    image_urls: string[] | null;
    stock_quantity: number;
  } | null;
};

export default function CheckoutPage() {
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<CartRow[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Warm up the Razorpay script so the payment window opens instantly
  useEffect(() => {
    loadRazorpayCheckout();
  }, []);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: cartData, error: cartErr }, addressList] = await Promise.all([
      supabase
        .from("cart_items")
        .select(
          "id, quantity, product_id, variation_id, products(id, name, image_url), product_variations(id, price, color, size, image_url, image_urls, stock_quantity)"
        )
        .eq("user_id", user.id),
      getAddresses(user.id),
    ]);

    if (!cartErr) setItems((cartData ?? []) as unknown as CartRow[]);
    setAddresses(addressList);
    const def = addressList.find((a) => a.is_default) ?? addressList[0];
    setSelectedAddressId(def?.id ?? null);

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading, loadData]);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product_variations?.price ?? 0) * item.quantity,
    0
  );
  const total = Math.max(subtotal - discount, 0);

  async function handleAddAddress(input: AddressInput) {
    if (!user) return;
    const created = await addAddress(user.id, input);
    setAddresses((prev) => {
      const next = input.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev;
      return [created, ...next];
    });
    setSelectedAddressId(created.id);
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const code = couponInput.trim().toUpperCase();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCouponError("Invalid or inactive coupon code.");
        return;
      }

      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        setCouponError("This coupon is not yet active.");
        return;
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        setCouponError("This coupon has expired.");
        return;
      }
      if (data.min_order_value && subtotal < Number(data.min_order_value)) {
        setCouponError(`Minimum order amount is ₹${Number(data.min_order_value).toLocaleString()}`);
        return;
      }
      if (data.usage_limit != null && (data.used_count ?? 0) >= data.usage_limit) {
        setCouponError("This coupon has reached its maximum uses.");
        return;
      }

      let d = 0;
      if (data.discount_type === "percentage") {
        d = (subtotal * Number(data.discount_value)) / 100;
        if (data.max_discount_amount) {
          d = Math.min(d, Number(data.max_discount_amount));
        }
      } else {
        d = Math.min(Number(data.discount_value), subtotal);
      }

      setDiscount(Math.round(d));
      setAppliedCoupon(code);
      setCouponInput("");
      toast.success(`Coupon ${code} applied`);
    } catch (err: any) {
      setCouponError(err?.message ?? "Error verifying coupon.");
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponError(null);
  }

  function showPlaceError(message: string) {
    setPlaceError(message);
    toast.error(message);
  }

  async function handlePaymentSuccess(orderId: string, response: RazorpaySuccessResponse) {
    setVerifying(true);
    try {
      const result = await verifyPaymentAction({
        orderId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      if (!result.ok) {
        showPlaceError(result.error);
        setVerifying(false);
        setPlacing(false);
        return;
      }
      toast.success("Payment successful — order confirmed");
      router.push(`/orders/${orderId}`);
    } catch {
      showPlaceError("Could not verify payment. If money was debited, please contact support.");
      setVerifying(false);
      setPlacing(false);
    }
  }

  async function handlePlaceOrder() {
    if (!user || !selectedAddressId) return;
    setPlacing(true);
    setPlaceError(null);

    try {
      for (const item of items) {
        const stock = item.product_variations?.stock_quantity ?? 0;
        if (stock < item.quantity) {
          throw new Error(
            `"${item.products?.name}" only has ${stock} left in stock. Please adjust your cart.`
          );
        }
      }

      const [checkout, scriptLoaded] = await Promise.all([
        startCheckoutAction({ addressId: selectedAddressId, appliedCoupon }),
        loadRazorpayCheckout(),
      ]);

      if (!checkout.ok) throw new Error(checkout.error);

      if (checkout.kind === "paid") {
        toast.success("Order placed successfully");
        router.push(`/orders/${checkout.orderId}`);
        return;
      }

      if (!scriptLoaded || !window.Razorpay) {
        markPaymentAbandonedAction(checkout.orderId);
        throw new Error("Could not load the payment gateway. Please check your connection and try again.");
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: "The Label 18",
        description: `Order #${checkout.orderId.slice(0, 8).toUpperCase()}`,
        image: `${window.location.origin}/logo.jpg`,
        prefill: checkout.prefill,
        notes: { order_id: checkout.orderId },
        theme: { color: "#D4AF37" },
        handler: (response: RazorpaySuccessResponse) => handlePaymentSuccess(checkout.orderId, response),
        modal: {
          confirm_close: true,
          ondismiss: () => {
            markPaymentAbandonedAction(checkout.orderId);
            setPlacing(false);
            toast("Payment cancelled. Your cart is still saved.");
          },
        },
      });

      // Fires per failed attempt; Razorpay keeps the window open so the
      // customer can retry with another method.
      razorpay.on("payment.failed", (res) => {
        toast.error(res.error?.description ?? "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err: any) {
      showPlaceError(err?.message ?? "Failed to place order.");
      setPlacing(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-28 pb-20 px-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white border border-[#D4AF37]/35 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl uppercase tracking-[0.15em] mb-2 font-outfit font-semibold text-[#1A1A1A]">
            Sign In Required
          </h1>
          <p className="text-xs text-[#1A1A1A]/70 font-outfit mb-6">
            Please sign in to your Label 18 account to continue with your bespoke checkout.
          </p>
          <button
            onClick={openLoginModal}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-[0.15em] uppercase shadow transition-all active:scale-95"
          >
            Sign In To Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pb-24 selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-32 sm:pt-36">

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Checkout Area */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#1A1A1A]/60 font-outfit uppercase tracking-widest">Loading checkout...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 px-6 max-w-md mx-auto rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <p className="text-sm text-[#1A1A1A]/70 font-outfit mb-4">
              Your cart is empty. Please add pieces before checking out.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-wider uppercase shadow"
            >
              Explore Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Address + Items */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Address Selection */}
              <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <h2 className="text-xs tracking-[0.2em] uppercase font-outfit font-semibold text-[#1A1A1A]">
                      Shipping Address
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsAddressFormOpen(true)}
                    className="text-[10px] tracking-[0.15em] uppercase font-outfit font-semibold text-[#9c7d23] hover:text-[#1A1A1A] transition-colors"
                  >
                    + Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-[#1A1A1A]/60 font-outfit mb-3">
                      No saved addresses found. Add your shipping details to proceed.
                    </p>
                    <button
                      onClick={() => setIsAddressFormOpen(true)}
                      className="px-5 py-2 rounded-full border border-[#D4AF37] text-[#9c7d23] text-xs font-semibold uppercase tracking-wider hover:bg-[#D4AF37]/10"
                    >
                      + Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <label
                          key={addr.id}
                          className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm"
                              : "border-neutral-200 bg-[#F8F6F0]/40 hover:border-[#D4AF37]/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="address"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 accent-[#D4AF37]"
                            />
                            <div className="text-xs font-outfit">
                              <p className="font-semibold uppercase tracking-wider text-[#1A1A1A] text-[13px]">
                                {addr.full_name}
                                {addr.is_default && (
                                  <span className="ml-2 text-[9px] tracking-widest uppercase text-[#9c7d23] font-medium border border-[#9c7d23]/30 px-1.5 py-0.2 rounded-full">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-[#1A1A1A]/70 mt-1 leading-relaxed">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                                {addr.postal_code}, {addr.country}
                              </p>
                              <p className="text-[#1A1A1A]/60 mt-0.5 font-mono text-[11px]">{addr.phone}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Items Review */}
              <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-xs tracking-[0.2em] uppercase font-outfit font-semibold text-[#1A1A1A] mb-4 pb-3 border-b border-neutral-100">
                  Ensemble Items ({items.length})
                </h2>
                <div className="space-y-3">
                  {items.map((item) => {
                    const variation = item.product_variations;
                    const product = item.products;
                    const image = (variation?.image_urls && variation?.image_urls.length > 0) ? variation.image_urls[0] : (variation?.image_url || product?.image_url);
                    const price = Number(variation?.price ?? 0);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 bg-[#F8F6F0]/50 border border-neutral-100 rounded-xl p-3"
                      >
                        <div className="relative w-14 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-neutral-200">
                          {image && <Image src={image} alt={product?.name ?? ""} fill className="object-cover" sizes="100vw" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-[13px] font-outfit font-semibold uppercase tracking-wide text-[#1A1A1A] truncate">
                            {product?.name}
                          </p>
                          <p className="text-[10px] text-[#1A1A1A]/60 font-outfit mt-0.5">
                            {[variation?.color, variation?.size].filter(Boolean).join(" / ")} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm font-outfit font-bold text-[#9c7d23] whitespace-nowrap">
                          ₹{(price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Order Summary & Placement */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 shadow-sm sticky top-28 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <h2 className="text-xs uppercase tracking-[0.2em] font-outfit font-semibold text-[#1A1A1A]">
                    Payment Summary
                  </h2>
                </div>

                {/* Coupon Box */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-full px-4 py-2">
                      <span className="text-xs font-outfit font-semibold text-[#9c7d23] tracking-wide">
                        ✦ {appliedCoupon} APPLIED
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 hover:text-red-600 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter Promo / Coupon"
                        className="flex-1 bg-[#F8F6F0]/80 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-xs font-outfit uppercase tracking-wider placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponChecking || !couponInput.trim()}
                        className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#9c7d23] text-[10px] tracking-[0.2em] uppercase font-outfit font-semibold transition-all disabled:opacity-40"
                      >
                        {couponChecking ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[10px] text-red-600 font-outfit mt-1.5 pl-2">{couponError}</p>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 text-xs sm:text-sm font-outfit font-light border-t border-neutral-100 pt-3">
                  <div className="flex justify-between text-[#1A1A1A]/70">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1A1A1A]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#9c7d23] font-medium">
                      <span>Exclusive Discount</span>
                      <span>−₹{discount.toLocaleString()}</span>
                    </div>
                  )}
<div className="flex justify-between items-center text-[#1A1A1A]/70 text-xs">
  <span>Shipping Charges</span>
  <span className="text-[#9c7d23] font-medium uppercase tracking-wider text-[11px]">
    Extra
  </span>
</div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline font-outfit">
                  <span className="text-xs tracking-widest uppercase font-semibold text-[#1A1A1A]">Total Payable</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#9c7d23]">₹{total.toLocaleString()}</span>
                </div>

                {placeError && (
                  <p className="text-xs text-red-600 font-outfit">{placeError}</p>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddressId}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-bold text-xs tracking-[0.18em] uppercase shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>{placing ? "Securing Order..." : `Pay ₹${total.toLocaleString()} Securely`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-widest uppercase font-outfit text-[#1A1A1A]/50">
                  <Lock className="w-3 h-3" />
                  <span>UPI · Cards · Netbanking · Wallets via Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {verifying && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-white border border-[#D4AF37]/40 rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] font-outfit font-semibold text-[#1A1A1A]">
              Confirming Your Payment
            </p>
            <p className="text-[11px] text-[#1A1A1A]/60 font-outfit mt-2">
              Please don&apos;t close or refresh this page.
            </p>
          </div>
        </div>
      )}

      <AddressForm
        isOpen={isAddressFormOpen}
        onClose={() => setIsAddressFormOpen(false)}
        onSave={handleAddAddress}
      />
    </main>
  );
}
