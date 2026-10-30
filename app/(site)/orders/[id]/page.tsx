"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import OrderItemPhoto, { type OrderPhotoSource } from "@/components/OrderItemPhoto";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  MapPin,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Package,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type Order = {
  id: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  payment_method?: string | null;
  payment_status?: string | null;
  razorpay_payment_id?: string | null;
  ship_full_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string | null;
  ship_city: string;
  ship_state: string;
  ship_postal_code: string;
  ship_country: string;
  tracking_number?: string | null;
  courier_name?: string | null;
  tracking_url?: string | null;
  shiprocket_order_id?: string | null;
  shipping_address?: {
    full_name?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
};

type TrackingActivity = {
  date: string;
  activity: string;
  location: string;
  "sr-status"?: string;
};

type TrackingData = {
  tracked: boolean;
  status: string;
  tracking_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  etd: string | null;
  activities: TrackingActivity[];
  error?: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  variation_id: string | null;
  product_name: string;
  variation_label?: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  products?: OrderPhotoSource["products"];
  product_variations?: { image_url: string | null; image_urls: string[] | null; color?: string; size?: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500/30",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  shipped: {
    label: "Shipped",
    bg: "bg-blue-500/10",
    text: "text-blue-700",
    border: "border-blue-500/30",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/15",
    text: "text-emerald-800",
    border: "border-emerald-600/40",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-500/30",
    icon: AlertCircle,
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  async function fetchTracking(id: string) {
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/tracking?orderId=${id}`);
      const data = await res.json();
      setTracking(data);
    } catch {
      // silently ignore; tracking is optional
    } finally {
      setTrackingLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user || !orderId) {
      if (!authLoading && !user) setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);

      const [{ data: orderData, error: orderErr }, { data: itemsData, error: itemsErr }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase
          .from("order_items")
          .select("id, product_id, variation_id, product_name, variation_label, unit_price, quantity, line_total, product_variations(image_url, image_urls, color, size), products(image_url, product_variations(image_url, image_urls))")
          .eq("order_id", orderId),
      ]);

      if (orderErr || !orderData) {
        setError("Order details could not be found.");
        setLoading(false);
        return;
      }
      if (itemsErr) {
        setError(itemsErr.message);
      }

      setOrder(orderData as Order);
      setItems((itemsData ?? []) as unknown as OrderItem[]);
      setLoading(false);

      // Auto-fetch tracking for shipped/delivered orders
      const status = (orderData as Order).status?.toLowerCase();
      if (status === "shipped" || status === "delivered" || status === "out_for_delivery") {
        fetchTracking(orderId);
      }
    })();
  }, [authLoading, user, orderId, supabase]);

  if (!authLoading && !user) {
    return (
      <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 sm:p-10 bg-white border border-[#D4AF37]/35 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-5 text-[#D4AF37]">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl uppercase tracking-[0.15em] mb-2 font-outfit font-semibold text-[#1A1A1A]">
            Atelier Sign In
          </h1>
          <p className="text-xs text-[#1A1A1A]/70 font-outfit mb-6">
            Sign in to view this order confirmation and dispatch details.
          </p>
          <button
            onClick={openLoginModal}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-[0.18em] uppercase shadow transition-all active:scale-95"
          >
            Sign In To Account
          </button>
        </div>
      </main>
    );
  }

  if (loading || authLoading) {
    return (
      <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="text-center max-w-sm p-8 bg-white border border-[#D4AF37]/35 rounded-2xl shadow-sm">
          <p className="text-xs text-red-600/90 font-outfit mb-6">
            {error ?? "Order not found."}
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-7 py-3 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-wider uppercase shadow"
          >
            View All Orders
          </Link>
        </div>
      </main>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const orderTotal = Number(order.total ?? 0);
  const statusCfg = STATUS_CONFIG[order.status.toLowerCase()] ?? {
    label: order.status,
    bg: "bg-black/5",
    text: "text-black/70",
    border: "border-black/10",
    icon: Clock,
  };
  const StatusIcon = statusCfg.icon;

  // Shipping Address resolution (from structured shipping_address JSON or individual ship_ fields)
  const shipAddr = order.shipping_address;
  const fullName = shipAddr?.full_name || order.ship_full_name || "Valued Patron";
  const phone = shipAddr?.phone || order.ship_phone;
  const line1 = shipAddr?.address_line1 || order.ship_line1;
  const line2 = shipAddr?.address_line2 || order.ship_line2;
  const city = shipAddr?.city || order.ship_city;
  const state = shipAddr?.state || order.ship_state;
  const postal = shipAddr?.postal_code || order.ship_postal_code;
  const country = shipAddr?.country || order.ship_country || "India";

  return (
    <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pb-24 selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Luxury Dark Hero Banner Header */}
      <div className="relative w-full overflow-hidden border-b border-[#222] bg-[#0A0A0A] py-12 sm:py-16 mb-8 sm:mb-12 text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full blur-[140px] bg-[#D4AF37]/12" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium mb-3 shadow-md">
            
            <span>The Label 18 • Bespoke Confirmation</span>
          </div>

          <h1 className="mb-2">
            <span className="block font-outfit text-base sm:text-xl md:text-2xl font-light tracking-[0.18em] uppercase text-white/80">
              Thank You For Your Patronage
            </span>
            <span className="block font-outfit text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] mt-1">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-2.5" />

          <p className="font-outfit font-light text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-white/75 max-w-lg mx-auto">
            Placed on {orderDate} · Insured Express Global Delivery
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1 rounded-full bg-white/[0.08] border border-[#D4AF37]/40 text-[#F5E6C8] text-[10px] font-mono tracking-widest">
            <StatusIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>STATUS: {statusCfg.label.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Items & Shipping Address */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Ordered Items Card */}
            <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#D4AF37]/25">
                
                <h2 className="text-xs uppercase tracking-[0.25em] font-outfit font-semibold text-[#9c7d23]">
                  Handcrafted Pieces in Order
                </h2>
              </div>

              <div className="divide-y divide-[#D4AF37]/15">
                {items.map((item) => {
                  const itemPrice = Number(item.line_total ?? (Number(item.unit_price ?? 0) * item.quantity));
                  const variantInfo = [
                    item.product_variations?.color,
                    item.product_variations?.size,
                    item.variation_label,
                  ].filter(Boolean).join(" · ");

                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                      <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-[#D4AF37]/30 shadow-sm">
                        <OrderItemPhoto item={item} name={item.product_name} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product_id}`}
                          className="text-xs sm:text-sm font-outfit font-medium uppercase tracking-wide hover:text-[#9c7d23] transition-colors line-clamp-2"
                        >
                          {item.product_name}
                        </Link>
                        {variantInfo && (
                          <p className="text-[11px] text-[#1A1A1A]/60 font-outfit mt-0.5">
                            {variantInfo}
                          </p>
                        )}
                        <p className="text-[10px] text-[#1A1A1A]/50 font-outfit mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-serif text-base sm:text-lg text-[#9c7d23] font-normal whitespace-nowrap">
                          ₹{itemPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shiprocket Live Tracking Card */}
            {(order.tracking_number || order.status === "shipped" || order.status === "delivered") && (
              <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D4AF37]/25">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#9c7d23]" />
                    <h2 className="text-xs uppercase tracking-[0.25em] font-outfit font-semibold text-[#9c7d23]">
                      Shipment Tracking
                    </h2>
                  </div>
                  <button
                    onClick={() => fetchTracking(orderId)}
                    disabled={trackingLoading}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#9c7d23] hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${trackingLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                {trackingLoading && !tracking && (
                  <div className="py-6 text-center">
                    <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-outfit">
                      Fetching live tracking…
                    </p>
                  </div>
                )}

                {!trackingLoading && !tracking && (
                  <div className="text-center py-4">
                    <button
                      onClick={() => fetchTracking(orderId)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4AF37]/50 text-[#9c7d23] text-[11px] uppercase tracking-wider font-semibold hover:bg-[#D4AF37]/10 transition-all"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Load Live Tracking
                    </button>
                  </div>
                )}

                {tracking && (
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="grid grid-cols-2 gap-3">
                      {tracking.tracking_number && (
                        <div className="bg-[#F8F6F0] rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-outfit mb-1">AWB / Tracking No</p>
                          <p className="text-xs font-mono font-semibold text-[#1A1A1A] break-all">{tracking.tracking_number}</p>
                        </div>
                      )}
                      {tracking.courier_name && (
                        <div className="bg-[#F8F6F0] rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-outfit mb-1">Courier Partner</p>
                          <p className="text-xs font-semibold text-[#1A1A1A]">{tracking.courier_name}</p>
                        </div>
                      )}
                      {tracking.etd && (
                        <div className="bg-[#F8F6F0] rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-outfit mb-1">Estimated Delivery</p>
                          <p className="text-xs font-semibold text-[#9c7d23]">
                            {new Date(tracking.etd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      )}
                      {tracking.tracking_url && (
                        <div className="bg-[#F8F6F0] rounded-xl p-3 flex items-center">
                          <a
                            href={tracking.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9c7d23] hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Track on Courier Site
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Activity timeline */}
                    {tracking.activities.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-outfit mb-3">Shipment Events</p>
                        <div className="space-y-0 relative">
                          {tracking.activities.map((act, idx) => (
                            <div key={idx} className="flex gap-3 relative">
                              {/* Timeline line */}
                              {idx < tracking.activities.length - 1 && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#D4AF37]/25" />
                              )}
                              <div className="flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 border-[#D4AF37] bg-white mt-1 z-10" />
                              <div className="flex-1 pb-4">
                                <p className="text-[11px] font-outfit font-semibold text-[#1A1A1A]">{act.activity}</p>
                                {act.location && (
                                  <p className="text-[10px] text-[#1A1A1A]/60 font-outfit flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {act.location}
                                  </p>
                                )}
                                <p className="text-[10px] text-[#1A1A1A]/40 font-mono mt-0.5">{act.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tracking.activities.length === 0 && tracking.tracked && (
                      <p className="text-[11px] text-[#1A1A1A]/60 font-outfit text-center py-2">
                        Tracking events will appear once the courier scans your package.
                      </p>
                    )}

                    {!tracking.tracked && tracking.tracking_number && (
                      <p className="text-[11px] text-amber-700 font-outfit text-center py-2 bg-amber-50 rounded-lg">
                        Could not fetch live status. AWB: {tracking.tracking_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shipping Address Card */}
            <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#D4AF37]/25">
                <MapPin className="w-4 h-4 text-[#9c7d23]" />
                <h2 className="text-xs uppercase tracking-[0.25em] font-outfit font-semibold text-[#9c7d23]">
                  Insured Delivery Destination
                </h2>
              </div>

              <div className="text-xs sm:text-sm font-outfit text-[#1A1A1A]/80 space-y-1">
                <p className="font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  {fullName}
                </p>
                {line1 && <p>{line1}</p>}
                {line2 && <p>{line2}</p>}
                <p>
                  {[city, state, postal].filter(Boolean).join(", ")}
                </p>
                <p className="uppercase tracking-wider text-[11px] text-[#1A1A1A]/60">{country}</p>
                {phone && (
                  <p className="pt-2 text-[11px] text-[#1A1A1A]/60 font-mono">
                    Contact: {phone}
                  </p>
                )}
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] font-outfit flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#9c7d23]" />
                  Need Bespoke Alterations or Advice?
                </p>
                <p className="text-[11px] text-[#1A1A1A]/60 font-outfit">
                  Connect directly with our master atelier stylist on WhatsApp quoting Order #{order.id.slice(0, 8).toUpperCase()}.
                </p>
              </div>
              <a
                href={`https://wa.me/919886823456?text=Hello%20The%20Label%2018%2C%20I%20have%20an%20inquiry%20regarding%20my%20order%20%23${order.id.slice(0, 8).toUpperCase()}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-4 py-2 rounded-full border border-[#D4AF37] text-[#9c7d23] hover:bg-[#D4AF37] hover:text-black transition-all text-[10.5px] uppercase tracking-wider font-semibold font-outfit"
              >
                Chat Support
              </a>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#D4AF37]/35 rounded-2xl p-6 sm:p-8 shadow-sm sticky top-28 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/25">
                <h2 className="text-xs uppercase tracking-[0.25em] font-outfit font-semibold text-[#9c7d23]">
                  Order Financial Summary
                </h2>
                <div className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-outfit font-semibold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  {statusCfg.label}
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-outfit">
                <div className="flex justify-between text-[#1A1A1A]/70">
                  <span>Subtotal ({items.length} {items.length === 1 ? "Piece" : "Pieces"})</span>
                  <span className="font-medium text-[#1A1A1A]">₹{Number(order.subtotal || orderTotal).toLocaleString()}</span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-[#9c7d23]">
                    <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                    <span>−₹{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}

<div className="flex justify-between items-center text-[#1A1A1A]/70 text-xs">
  <span>Shipping Charges</span>
  <span className="text-[#9c7d23] font-medium uppercase tracking-wider text-[11px]">
    Extra
  </span>
</div>

                {order.payment_status === "paid" && (
                  <div className="flex justify-between text-[#1A1A1A]/70">
                    <span>Payment</span>
                    <span className="text-emerald-700 font-medium text-right">
                      PAID{order.payment_method === "razorpay" ? " · RAZORPAY" : ""}
                      {order.razorpay_payment_id && (
                        <span className="block font-mono text-[10px] text-[#1A1A1A]/50 font-normal">
                          {order.razorpay_payment_id}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {(order.payment_status === "pending" || order.payment_status === "failed") && (
                  <div className="flex justify-between text-[#1A1A1A]/70">
                    <span>Payment</span>
                    <span className="text-rose-700 font-medium">NOT COMPLETED</span>
                  </div>
                )}

                <div className="pt-4 border-t border-[#D4AF37]/25 flex justify-between items-baseline">
                  <span className="font-outfit font-semibold text-xs tracking-wider uppercase text-[#1A1A1A]">
                    {order.payment_status === "pending" || order.payment_status === "failed" ? "Total" : "Total Paid"}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl text-[#9c7d23] font-normal">
                    ₹{orderTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href="/shop"
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-bold text-xs tracking-[0.18em] uppercase shadow-[0_4px_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/orders"
                  className="w-full py-3.5 rounded-full border border-[#D4AF37]/40 text-[#1A1A1A] hover:border-[#D4AF37] hover:text-[#9c7d23] hover:bg-[#D4AF37]/5 transition-all text-xs tracking-[0.18em] uppercase font-semibold font-outfit text-center block shadow-sm"
                >
                  View All Orders
                </Link>
              </div>

              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-outfit text-[#1A1A1A]/60">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9c7d23]" />
                <span>Authentic Handcrafted Luxury Guaranteed</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}