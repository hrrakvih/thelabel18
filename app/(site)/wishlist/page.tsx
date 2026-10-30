"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { ArrowRight, Heart } from "lucide-react";

type WishlistRow = {
  id: string;
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
    price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    color: string | null;
    size: string | null;
    image_url: string | null;
    image_urls: string[] | null;
  } | null;
};

type DisplayWishlistItem = {
  key: string;
  productId: string;
  variationId: string | null;
  name: string;
  image: string | null;
  color: string | null;
  size: string | null;
  price: number | null;
  stockQuantity: number | null;
};

export default function WishlistPage() {
  const {
    user,
    loading: authLoading,
    addToCart,
    refreshWishlist,
    refreshCart,
  } = useAuth();
  const guest = useGuestCartWishlist();
  const supabase = createClient();

  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [guestDisplayItems, setGuestDisplayItems] = useState<DisplayWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [movedIds, setMovedIds] = useState<Set<string>>(new Set());

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("wishlist")
      .select(`
        id, product_id, variation_id, 
        products(
          id, name, sku, image_url, is_visible,
          category_id, sub_category_id, sub_sub_category_id,
          category:categories(is_visible),
          sub_category:sub_categories(is_visible),
          sub_sub_category:sub_sub_categories(is_visible)
        ), 
        product_variations(id, price, compare_at_price, stock_quantity, color, size, image_url, image_urls)
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

      setRows(validData as unknown as WishlistRow[]);
    }
    setLoading(false);
  }, [user, supabase]);

  const loadGuestWishlist = useCallback(async () => {
    if (guest.wishlist.length === 0) {
      setGuestDisplayItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const productIds = [...new Set(guest.wishlist.map((i) => i.productId))];
    const variationIds = guest.wishlist
      .map((i) => i.variationId)
      .filter((id): id is string => !!id);

    const [{ data: productsData }, { data: variationsData }] = await Promise.all([
      supabase.from("products").select("id, name, image_url").in("id", productIds),
      variationIds.length > 0
        ? supabase
            .from("product_variations")
            .select("id, price, color, size, stock_quantity, image_url, image_urls")
            .in("id", variationIds)
        : Promise.resolve({ data: [] }),
    ]);

    const productsMap = new Map((productsData ?? []).map((p) => [p.id, p]));
    const variationsMap = new Map((variationsData ?? []).map((v) => [v.id, v]));

    const display: DisplayWishlistItem[] = guest.wishlist.map((item) => {
      const dbProduct = productsMap.get(item.productId);
      const dbVar = item.variationId ? variationsMap.get(item.variationId) : null;
      return {
        key: `${item.productId}-${item.variationId ?? "none"}`,
        productId: item.productId,
        variationId: item.variationId,
        name: dbProduct?.name ?? item.name ?? "Product",
        image: (dbVar?.image_urls && dbVar?.image_urls.length > 0) ? dbVar.image_urls[0] : (dbVar?.image_url ?? dbProduct?.image_url ?? item.image ?? null),
        color: dbVar?.color ?? item.color ?? null,
        size: dbVar?.size ?? item.size ?? null,
        price: dbVar?.price != null ? Number(dbVar.price) : item.price ?? null,
        stockQuantity: dbVar?.stock_quantity ?? null,
      };
    });

    setGuestDisplayItems(display);
    setLoading(false);
  }, [guest.wishlist, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadWishlist();
    } else {
      loadGuestWishlist();
    }
  }, [authLoading, user, loadWishlist, loadGuestWishlist]);

  function setPending(key: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  const displayItems: DisplayWishlistItem[] = useMemo(() => {
    if (user) {
      return rows.map((item) => {
        const product = item.products;
        const variation = item.product_variations;
        return {
          key: item.id,
          productId: item.product_id,
          variationId: item.variation_id,
          name: product?.name ?? "Product",
          image: (variation?.image_urls && variation?.image_urls.length > 0) ? variation.image_urls[0] : (variation?.image_url || product?.image_url || null),
          color: variation?.color ?? null,
          size: variation?.size ?? null,
          price: variation?.price != null ? Number(variation.price) : null,
          stockQuantity: variation?.stock_quantity ?? null,
        };
      });
    }
    return guestDisplayItems;
  }, [user, rows, guestDisplayItems]);

  async function handleRemove(item: DisplayWishlistItem) {
    setPending(item.key, true);
    try {
      if (user) {
        const { error: delError } = await supabase.from("wishlist").delete().eq("id", item.key);
        if (delError) throw delError;
        await loadWishlist();
        await refreshWishlist();
      } else {
        guest.removeFromWishlist(item.productId, item.variationId);
        setGuestDisplayItems((prev) => prev.filter((i) => i.key !== item.key));
      }
      toast.success("Removed from wishlist");
    } catch (err: any) {
      const msg = err?.message ?? "Couldn't remove item.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(item.key, false);
    }
  }

  async function handleMoveToCart(item: DisplayWishlistItem) {
    if (!item.variationId) return;
    setPending(item.key, true);
    try {
      if (user) {
        await addToCart(item.productId, item.variationId, 1);
        await refreshCart();
      } else {
        guest.addToCart(
          {
            productId: item.productId,
            variationId: item.variationId,
            name: item.name,
            price: item.price ?? 0,
            image: item.image,
            color: item.color,
            size: item.size,
          },
          1
        );
      }
      setMovedIds((prev) => new Set(prev).add(item.key));
      toast.success("Moved to cart");
    } catch (err: any) {
      const msg = err?.message ?? "Couldn't add to cart.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(item.key, false);
    }
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
            
            <span>The Label 18 • Private Edit</span>
          </div>

          <h1 className="mb-2">
            <span className="block font-outfit text-base sm:text-xl md:text-2xl font-light tracking-[0.18em] uppercase text-white/80">
              Curated Favorites
            </span>
            <span className="block font-outfit text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] mt-1">
              Your Wishlist
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-2.5" />

          <p className="font-outfit font-light text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-white/75 max-w-lg mx-auto">
            Saved Pieces &amp; Bespoke Silks Awaiting You
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[10px] font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{displayItems.length} {displayItems.length === 1 ? "PIECE" : "PIECES"} SAVED</span>
          </div>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Items Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {error && (
          <p className="text-xs font-outfit text-red-600/90 mb-6 text-center">{error}</p>
        )}

        {authLoading || loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#1A1A1A]/60 font-outfit uppercase tracking-widest">Loading wishlist...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-20 px-6 max-w-md mx-auto rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
              <Heart className="w-5 h-5" />
            </div>
            <p className="font-outfit text-sm text-[#1A1A1A]/70 mb-6">
              Your wishlist is currently empty. Explore our curated collections to add your favorites.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayItems.map((item) => {
              const isPending = pendingIds.has(item.key);
              const outOfStock = item.stockQuantity != null ? item.stockQuantity <= 0 : false;
              const moved = movedIds.has(item.key);

              return (
                <div
                  key={item.key}
                  className="group flex flex-col rounded-2xl border border-[#D4AF37]/35 bg-white hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 overflow-hidden"
                >
                  <Link href={`/product/${item.productId}`} className="relative aspect-[4/5] bg-[#F8F6F0] overflow-hidden block w-full">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs uppercase tracking-widest font-light">
                        No Image
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item);
                      }}
                      disabled={isPending}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:text-red-600 hover:border-red-200 shadow-sm transition-all active:scale-90"
                    >
                      ✕
                    </button>
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    <Link
                      href={`/product/${item.productId}`}
                      className="font-outfit font-medium text-xs sm:text-[13px] tracking-wide text-[#1A1A1A] line-clamp-1 uppercase hover:text-[#9c7d23] transition-colors"
                    >
                      {item.name}
                    </Link>

                    {(item.color || item.size) && (
                      <p className="text-[10px] text-[#1A1A1A]/50 font-outfit uppercase tracking-wider mt-0.5">
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                      </p>
                    )}

                    {item.price !== null && (
                      <p className="font-outfit font-bold text-sm text-[#9c7d23] mt-1.5">
                        ₹{item.price.toLocaleString()}
                      </p>
                    )}

                    {outOfStock && (
                      <p className="text-[9px] uppercase tracking-widest text-red-600 font-outfit font-semibold mt-1">
                        Out of stock
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-neutral-100">
                      {item.variationId ? (
                        <button
                          onClick={() => handleMoveToCart(item)}
                          disabled={isPending || outOfStock || moved}
                          className="w-full py-2.5 rounded-full text-[10px] tracking-[0.18em] uppercase font-outfit font-semibold bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                        >
                          {moved ? "Added ✓" : outOfStock ? "Unavailable" : "Move to Cart"}
                        </button>
                      ) : (
                        <Link
                          href={`/product/${item.productId}`}
                          className="block w-full py-2.5 rounded-full text-[10px] tracking-[0.18em] uppercase font-outfit font-semibold bg-[#1A1A1A] text-white hover:bg-[#9c7d23] transition-all text-center active:scale-95"
                        >
                          Select Options
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}