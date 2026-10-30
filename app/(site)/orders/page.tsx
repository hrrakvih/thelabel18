"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Package, Lock, ArrowRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { id: string }[];
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

export default function OrdersPage() {
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: ordersErr } = await supabase
        .from("orders")
        .select("id, status, total, created_at, order_items(id)")
        .eq("user_id", user.id)
        // Hide checkout attempts that were never paid (NULL = placed before online payments)
        .or("payment_status.is.null,payment_status.eq.paid")
        .order("created_at", { ascending: false });

      if (ordersErr) {
        setError(ordersErr.message);
        setLoading(false);
        return;
      }

      setOrders((data ?? []) as unknown as Order[]);
      setLoading(false);
    })();
  }, [authLoading, user, supabase]);

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
            Please sign in to view your bespoke purchase history and active order dispatches.
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
            
            <span>The Label 18 • Portal</span>
          </div>

          <h1 className="mb-2">
            <span className="block font-outfit text-base sm:text-xl md:text-2xl font-light tracking-[0.18em] uppercase text-white/80">
              Your Atelier Purchases
            </span>
            <span className="block font-outfit text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] mt-1">
              Order History
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-2.5" />

          <p className="font-outfit font-light text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-white/75 max-w-lg mx-auto">
            Track Your Bespoke Couture &amp; Fine Jewellery Dispatches
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[10px] font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{orders.length} {orders.length === 1 ? "ORDER" : "ORDERS"} RECORDED</span>
          </div>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading || authLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="text-center py-16 px-6 max-w-md mx-auto rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <p className="text-xs text-red-600/90 font-outfit mb-4">{error}</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-wider uppercase shadow"
            >
              Explore Catalog
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 px-6 max-w-md mx-auto rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-base uppercase tracking-[0.15em] font-outfit font-semibold text-[#1A1A1A] mb-2">
              No Orders Found Yet
            </h2>
            <p className="text-xs text-[#1A1A1A]/70 font-outfit mb-6">
              You have not placed any orders yet. Discover our artisanal sarees and fine jewellery collections.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-bold text-xs tracking-[0.16em] uppercase shadow-[0_4px_20px_rgba(212,175,55,0.35)]"
            >
              <span>Explore The Atelier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {orders.map((order) => {
              const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const itemCount = order.order_items?.length ?? 0;
              const orderTotal = Number(order.total ?? 0);
              const statusCfg = STATUS_CONFIG[order.status.toLowerCase()] ?? {
                label: order.status,
                bg: "bg-black/5",
                text: "text-black/70",
                border: "border-black/10",
                icon: Clock,
              };
              const StatusIcon = statusCfg.icon;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white border border-[#D4AF37]/35 rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:border-[#D4AF37] transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Order ID & Date */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-outfit font-bold text-xs sm:text-sm tracking-widest uppercase text-[#1A1A1A]">
                          ORDER #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-outfit font-semibold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusCfg.label}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#1A1A1A]/60 font-outfit font-light">
                        Placed on {orderDate} · {itemCount} {itemCount === 1 ? "Piece" : "Pieces"}
                      </p>
                    </div>

                    {/* Right: Price & Navigation Arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1A1A1A]/10">
                      <div className="text-left sm:text-right">
                        <span className="block text-[9px] uppercase tracking-[0.2em] font-outfit text-[#1A1A1A]/50">
                          Total Amount
                        </span>
                        <span className="font-serif text-xl sm:text-2xl text-[#9c7d23] font-normal">
                          ₹{orderTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#9c7d23] group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-sm">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}