"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { createClient } from "@/lib/supabase/client";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";
import { ArrowRight, ShoppingBag, ShieldCheck, Truck } from "lucide-react";

type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  variation_id: string | null;
  products: {
    id: string;
    name: string;
    sku: string;
    image_url: string | null;
  } | null;
  product_variations: {
    id: string;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    sku: string;
    image_url: string | null;
    image_urls: string[] | null;
  } | null;
};

type DisplayCartItem = {
  key: string;
  productId: string;
  variationId: string | null;
  quantity: number;
  name: string;
  image: string | null;
  color: string | null;
  size: string | null;
  sku: string | null;
  price: number;
  stockQuantity: number | null;
};

export default function CartPage() {
  const {
    user,
    loading: authLoading,
    updateCartQuantity,
    removeFromCart,
    refreshCart,
  } = useAuth();
  const guest = useGuestCartWishlist();
  const supabase = createClient();
  const router = useRouter();

  const [rows, setRows] = useState<CartRow[]>([]);
  const [guestDisplayItems, setGuestDisplayItems] = useState<DisplayCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const redirectToCheckoutRef = useRef(false);

  const loadCart = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id, quantity, product_id, variation_id, 
        products(
          id, name, sku, image_url, is_visible,
          category_id, sub_category_id, sub_sub_category_id,
          category:categories(is_visible),
          sub_category:sub_categories(is_visible),
          sub_sub_category:sub_sub_categories(is_visible)
        ), 
        product_variations(id, size, color, color_hex, price, compare_at_price, stock_quantity, sku, image_url, image_urls)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      const isVis = (cat: any, id: string | null) => {
        if (id && !cat) return false;
        if (!cat) return true;
        if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
        return cat.is_visible !== false;
      };

      const validData = (data ?? []).filter((item) => {
        const p = item.products as any;
        if (!p || p.is_visible === false) return false;
        if (!isVis(p.category, p.category_id)) return false;
        if (!isVis(p.sub_category, p.sub_category_id)) return false;
        if (!isVis(p.sub_sub_category, p.sub_sub_category_id)) return false;
        return true;
      });

      setRows(validData as unknown as CartRow[]);
    }
    setLoading(false);
  }, [user, supabase]);

  const loadGuestCart = useCallback(async () => {
    if (guest.cart.length === 0) {
      setGuestDisplayItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const productIds = [...new Set(guest.cart.map((i) => i.productId))];
    const variationIds = guest.cart
      .map((i) => i.variationId)
      .filter((id): id is string => !!id);

    const [{ data: productsData }, { data: variationsData }] = await Promise.all([
      supabase.from("products").select("id, name, sku, image_url").in("id", productIds),
      variationIds.length > 0
        ? supabase
            .from("product_variations")
            .select("id, size, color, price, stock_quantity, sku, image_url, image_urls")
            .in("id", variationIds)
        : Promise.resolve({ data: [] }),
    ]);

    const productsMap = new Map((productsData ?? []).map((p) => [p.id, p]));
    const variationsMap = new Map((variationsData ?? []).map((v) => [v.id, v]));

    const display: DisplayCartItem[] = guest.cart.map((item) => {
      const dbProduct = productsMap.get(item.productId);
      const dbVar = item.variationId ? variationsMap.get(item.variationId) : null;
      return {
        key: `${item.productId}-${item.variationId ?? "none"}`,
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
        name: dbProduct?.name ?? item.name,
        image: (dbVar?.image_urls && dbVar?.image_urls.length > 0) ? dbVar.image_urls[0] : (dbVar?.image_url ?? dbProduct?.image_url ?? item.image ?? null),
        color: dbVar?.color ?? item.color ?? null,
        size: dbVar?.size ?? item.size ?? null,
        sku: dbVar?.sku ?? dbProduct?.sku ?? null,
        price: Number(dbVar?.price ?? item.price),
        stockQuantity: dbVar?.stock_quantity ?? null,
      };
    });

    setGuestDisplayItems(display);
    setLoading(false);
  }, [guest.cart, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadCart();
    } else {
      loadGuestCart();
    }
  }, [authLoading, user, loadCart, loadGuestCart]);

  useEffect(() => {
    if (user && redirectToCheckoutRef.current) {
      redirectToCheckoutRef.current = false;
      setIsLoginOpen(false);
      router.push("/checkout");
    }
  }, [user, router]);

  function setPending(key: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  const displayItems: DisplayCartItem[] = useMemo(() => {
    if (user) {
      return rows.map((item) => {
        const variation = item.product_variations;
        const product = item.products;
        return {
          key: item.id,
          productId: item.product_id,
          variationId: item.variation_id,
          quantity: item.quantity,
          name: product?.name ?? "Product",
          image: (variation?.image_urls && variation?.image_urls.length > 0) ? variation.image_urls[0] : (variation?.image_url || product?.image_url || null),
          color: variation?.color ?? null,
          size: variation?.size ?? null,
          sku: variation?.sku ?? null,
          price: Number(variation?.price ?? 0),
          stockQuantity: variation?.stock_quantity ?? null,
        };
      });
    }
    return guestDisplayItems;
  }, [user, rows, guestDisplayItems]);

  async function handleQuantityChange(item: DisplayCartItem, next: number) {
    if (next < 1) return;
    setPending(item.key, true);
    try {
      if (user) {
        await updateCartQuantity(item.key, next);
        await loadCart();
        await refreshCart();
      } else {
        guest.updateQuantity(item.productId, item.variationId, next);
        setGuestDisplayItems((prev) => 
          prev.map((i) => (i.key === item.key ? { ...i, quantity: next } : i))
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Couldn't update quantity.");
    } finally {
      setPending(item.key, false);
    }
  }

  async function handleRemove(item: DisplayCartItem) {
    setPending(item.key, true);
    try {
      if (user) {
        await removeFromCart(item.key);
        await loadCart();
        await refreshCart();
      } else {
        guest.removeFromCart(item.productId, item.variationId);
        setGuestDisplayItems((prev) => prev.filter((i) => i.key !== item.key));
      }
      toast.success("Removed from cart");
    } catch (err: any) {
      const msg = err?.message ?? "Couldn't remove item.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(item.key, false);
    }
  }

  function handleCheckout() {
    if (!user) {
      redirectToCheckoutRef.current = true;
      setIsLoginOpen(true);
      return;
    }
    router.push("/checkout");
  }

  const subtotal = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasOutOfStockItem = displayItems.some((item) => (item.stockQuantity ?? 1) <= 0);

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
            
            <span>The Label 18 • Shopping Bag</span>
          </div>

          <h1 className="mb-2">
            <span className="block font-outfit text-base sm:text-xl md:text-2xl font-light tracking-[0.18em] uppercase text-white/80">
              Your Curated Bag
            </span>
            <span className="block font-outfit text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] mt-1">
              Shopping Cart
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-2.5" />

<p className="font-outfit font-light text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-white/75 max-w-lg mx-auto">
  Shipping Charges Are Extra On All Exclusive Orders
</p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[10px] font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{displayItems.length} {displayItems.length === 1 ? "PIECE" : "PIECES"} IN CART</span>
          </div>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Cart Area */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        {error && (
          <p className="text-xs font-outfit text-red-600/90 mb-6 text-center">{error}</p>
        )}

        {authLoading || loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#1A1A1A]/60 font-outfit uppercase tracking-widest">Loading cart...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-20 px-6 max-w-md mx-auto rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="font-outfit text-sm text-[#1A1A1A]/70 mb-6">
              Your shopping bag is currently empty. Discover our new arrivals and curated collections.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-[0.15em] uppercase shadow hover:shadow-md transition-all active:scale-95"
            >
              <span>Explore The Edit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {displayItems.map((item) => {
                const isPending = pendingIds.has(item.key);
                const outOfStock = (item.stockQuantity ?? 1) <= 0;

                return (
                  <div
                    key={item.key}
                    className="flex gap-4 sm:gap-5 bg-white border border-[#D4AF37]/35 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:border-[#D4AF37]/60"
                  >
                    <div className="relative w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-[#F8F6F0] border border-neutral-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="100vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-widest text-neutral-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            className="text-xs sm:text-sm md:text-base font-outfit font-medium uppercase tracking-wide text-[#1A1A1A] hover:text-[#9c7d23] transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => handleRemove(item)}
                            disabled={isPending}
                            className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#1A1A1A]/50 font-outfit tracking-wide mt-0.5">
                          {[item.color, item.size].filter(Boolean).join(" / ") || item.sku}
                        </p>
                        {outOfStock && (
                          <p className="text-[9px] uppercase tracking-widest text-red-600 font-outfit font-semibold mt-1">
                            Out of stock
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
                        {/* Quantity Pill */}
                        <div className="flex items-center border border-[#D4AF37]/40 rounded-full bg-[#F8F6F0]/60 overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isPending || item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center text-[#1A1A1A]/70 hover:text-[#9c7d23] disabled:opacity-30 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-outfit font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isPending}
                            className="w-7 h-7 flex items-center justify-center text-[#1A1A1A]/70 hover:text-[#9c7d23] disabled:opacity-30 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm sm:text-base font-outfit font-bold text-[#9c7d23]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 shadow-sm sticky top-28 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                  
                  <h2 className="text-xs uppercase tracking-[0.2em] font-outfit font-semibold text-[#1A1A1A]">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-2 text-xs sm:text-sm font-outfit font-light">
                  <div className="flex justify-between text-[#1A1A1A]/70">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1A1A1A]">₹{subtotal.toLocaleString()}</span>
                  </div>
<div className="flex justify-between items-center text-[#1A1A1A]/70 text-xs">
  <span>Shipping Charges</span>
  <span className="text-[#9c7d23] font-medium uppercase tracking-wider text-[11px]">
    Extra
  </span>
</div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline font-outfit">
                  <span className="text-xs tracking-widest uppercase font-medium text-[#1A1A1A]">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#9c7d23]">₹{subtotal.toLocaleString()}</span>
                </div>

                {hasOutOfStockItem && (
                  <p className="text-[11px] text-red-600 font-outfit font-medium">
                    Remove out-of-stock items before checkout.
                  </p>
                )}

                {!user && (
                  <p className="text-[10px] text-[#1A1A1A]/60 font-outfit">
                    You will be prompted to sign in to secure your order.
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={hasOutOfStockItem}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-bold text-xs tracking-[0.15em] uppercase shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>{user ? "Proceed To Checkout" : "Sign In To Checkout"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

             </div>
            </div>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          redirectToCheckoutRef.current = false;
        }}
      />
    </main>
  );
}
