"use client";

import { useState, useMemo, useEffect } from "react";
import { ProductVariation } from "@/lib/supabase/products";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { toast } from "react-hot-toast";
import WishlistButton from "@/components/WishlistButton";
import { ShoppingBag, CheckCircle2, Truck, BadgeCheck, Tag } from "lucide-react";

export default function ProductVariantSelector({
  productId,
  productName,
  productImage,
  variations = [],
  selectedColorProp,
  onColorChange,
  onVariantChange,
  onRequireLogin,
}: {
  productId: string;
  productName?: string;
  productImage?: string | null;
  variations?: ProductVariation[];
  selectedColorProp?: string | null;
  onColorChange?: (color: string | null) => void;
  onVariantChange?: (variant: ProductVariation | null) => void;
  onRequireLogin?: (reason?: string) => void;
}) {
  const { user, addToCart, refreshCart } = useAuth();
  const guest = useGuestCartWishlist();

  const sizes = useMemo(
    () => [...new Set(variations.map((v) => v.size).filter(Boolean))] as string[],
    [variations]
  );

  const colors = useMemo(
    () =>
      [
        ...new Map(
          variations
            .filter((v) => v.color)
            .map((v) => [v.color, v.color_hex])
        ).entries(),
      ] as [string, string | null][],
    [variations]
  );

  const initialVariation = useMemo(() => {
    return variations.find((v) => v.stock_quantity >= 0) ?? variations[0] ?? null;
  }, [variations]);

  const [selectedSize, setSelectedSize] = useState<string | null>(initialVariation?.size ?? sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(selectedColorProp ?? initialVariation?.color ?? colors[0]?.[0] ?? null);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedColorProp !== undefined && selectedColorProp !== selectedColor) {
      setSelectedColor(selectedColorProp);
    }
  }, [selectedColorProp, selectedColor]);

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    onColorChange?.(color);
    const matchingSizeForColor = variations.find(
      (v) => v.color === color && v.size === selectedSize && v.stock_quantity > 0
    );
    if (!matchingSizeForColor) {
      const alternative = variations.find((v) => v.color === color && v.stock_quantity > 0);
      if (alternative?.size) setSelectedSize(alternative.size);
    }
  }

  const activeVariation = useMemo(() => {
    let match = variations.find((v) => v.size === selectedSize && v.color === selectedColor);
    if (match) return match;
    if (selectedColor) {
      match = variations.find((v) => v.color === selectedColor);
      if (match) return match;
    }
    if (selectedSize) {
      match = variations.find((v) => v.size === selectedSize);
      if (match) return match;
    }
    return variations[0] ?? null;
  }, [variations, selectedSize, selectedColor]);

  useEffect(() => {
    onVariantChange?.(activeVariation ?? null);
  }, [activeVariation, onVariantChange]);

  const inStock = (activeVariation?.stock_quantity ?? 0) > 0;

  const priceRange = useMemo(() => {
    const prices = variations.map((v) => Number(v.price)).filter((p) => Number.isFinite(p));
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [variations]);

  function isSizeAvailable(size: string) {
    if (selectedColor) return variations.some((v) => v.size === size && v.color === selectedColor && v.stock_quantity > 0);
    return variations.some((v) => v.size === size && v.stock_quantity > 0);
  }

  function isColorAvailable(color: string) {
    if (selectedSize) return variations.some((v) => v.color === color && v.size === selectedSize && v.stock_quantity > 0);
    return variations.some((v) => v.color === color && v.stock_quantity > 0);
  }

  const displayPrice = activeVariation?.price ? Number(activeVariation.price) : null;
  const displayComparePrice = activeVariation?.compare_at_price ? Number(activeVariation.compare_at_price) : null;
  const discountPercent =
    displayComparePrice && displayPrice && displayComparePrice > displayPrice
      ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
      : null;

  async function handleAddToCart() {
    if (!activeVariation || !inStock) return;

    if (user) {
      setCartError(null);
      setAdding(true);
      try {
        await addToCart(productId, activeVariation.id, 1);
        await refreshCart();
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        console.error("Add to cart failed:", err);
        setCartError("Couldn't add to cart. Please try again.");
      } finally {
        setAdding(false);
      }
      return;
    }

    guest.addToCart(
      {
        productId,
        variationId: activeVariation.id,
        name: productName ?? "Product",
        price: displayPrice ?? 0,
        image: productImage ?? null,
        color: selectedColor,
        size: selectedSize,
      },
      1
    );
    setAdded(true);
    toast.success("Added to cart");
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-0">

      {/* ── Price Block ── */}
      <div className="pb-5 border-b border-[#D4AF37]/20">
        <div className="flex flex-wrap items-end gap-3">
          {displayPrice !== null && !isNaN(displayPrice) ? (
            <>
              <span className="font-serif text-4xl sm:text-5xl text-[#9c7d23] font-normal tracking-tight leading-none">
                ₹{displayPrice.toLocaleString("en-IN")}
              </span>
              {displayComparePrice !== null && displayComparePrice > displayPrice && (
                <span className="text-lg text-[#1A1A1A]/35 line-through font-outfit font-light mb-0.5">
                  ₹{displayComparePrice.toLocaleString("en-IN")}
                </span>
              )}
              {discountPercent !== null && (
                <span className="mb-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] tracking-widest uppercase font-bold">
                  <Tag className="w-2.5 h-2.5" />
                  {discountPercent}% OFF
                </span>
              )}
            </>
          ) : priceRange ? (
            <span className="font-serif text-4xl sm:text-5xl text-[#9c7d23] font-normal tracking-tight leading-none">
              {priceRange.min === priceRange.max
                ? `₹${priceRange.min.toLocaleString("en-IN")}`
                : `₹${priceRange.min.toLocaleString("en-IN")} – ₹${priceRange.max.toLocaleString("en-IN")}`}
            </span>
          ) : (
            <span className="font-serif text-3xl text-[#9c7d23] font-normal">Select Options</span>
          )}
        </div>
        <p className="mt-1.5 text-[10px] font-outfit text-[#1A1A1A]/40 tracking-[0.15em] uppercase">
          Inclusive of all taxes • Free shipping
        </p>
      </div>

      {/* ── Stock Status ── */}
      <div className="py-4 border-b border-[#D4AF37]/15">
        {activeVariation ? (
          inStock ? (
            activeVariation.stock_quantity <= 5 ? (
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-outfit font-semibold tracking-[0.15em] uppercase text-amber-700">
                  Only {activeVariation.stock_quantity} left — Order soon
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-outfit font-semibold tracking-[0.15em] uppercase text-emerald-700">
                  In Stock • Ready to Dispatch
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              <span className="text-[11px] font-outfit font-semibold tracking-[0.15em] uppercase text-rose-700">
                Currently Sold Out
              </span>
            </div>
          )
        ) : (
          <span className="text-[11px] font-outfit text-[#1A1A1A]/45 tracking-widest uppercase">
            Please select an option
          </span>
        )}
      </div>

      {/* ── Color Selector ── */}
      {colors.length > 0 && (
        <div className="py-5 border-b border-[#D4AF37]/15">
          <div className="flex items-center justify-between mb-3.5">
            <label className="text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/50 font-outfit font-semibold">
              Colour
            </label>
            <span className="text-[11px] font-outfit font-medium text-[#9c7d23] tracking-wide">
              {selectedColor ?? "Select"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map(([color, hex]) => {
              const available = isColorAvailable(color);
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  className={`w-9 h-9 rounded-full border-2 transition-all duration-200 relative flex-shrink-0 ${
                    isSelected
                      ? "border-[#9c7d23] ring-2 ring-[#D4AF37]/50 ring-offset-2 ring-offset-white scale-110 shadow-lg"
                      : "border-transparent hover:border-[#D4AF37]/50 hover:scale-105"
                  } ${!available ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                  style={{ backgroundColor: hex ?? "#EAE5D9" }}
                  disabled={!available}
                >
                  {isSelected && (
                    <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Size Selector ── */}
      {sizes.length > 0 && (
        <div className="py-5 border-b border-[#D4AF37]/15">
          <div className="flex items-center justify-between mb-3.5">
            <label className="text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/50 font-outfit font-semibold">
              Size
            </label>
            <span className="text-[11px] font-outfit font-medium text-[#9c7d23] tracking-wide">
              {selectedSize ?? "Select"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => available && setSelectedSize(size)}
                  className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-[10px] tracking-[0.2em] uppercase font-outfit font-semibold transition-all duration-200 ${
                    isSelected
                      ? "bg-[#1A1A1A] text-white border border-[#1A1A1A] shadow-md"
                      : available
                      ? "bg-white border border-[#D4AF37]/40 text-[#1A1A1A]/70 hover:border-[#9c7d23] hover:text-[#9c7d23]"
                      : "bg-white border border-dashed border-[#1A1A1A]/15 text-[#1A1A1A]/25 line-through cursor-not-allowed"
                  }`}
                  disabled={!available}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cartError && (
        <p className="text-[11px] font-outfit text-red-600 tracking-wide pt-1">{cartError}</p>
      )}

      {/* ── Add to Cart + Wishlist ── */}
      <div className="pt-5 flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!activeVariation || !inStock || adding}
          className={`flex-1 h-14 rounded-2xl text-[11px] font-bold tracking-[0.25em] uppercase font-outfit transition-all duration-300 flex items-center justify-center gap-2.5 ${
            activeVariation && inStock
              ? "bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#C59B27] text-black shadow-[0_6px_24px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_32px_rgba(212,175,55,0.5)] hover:brightness-105 active:scale-[0.98]"
              : "bg-[#1A1A1A]/8 text-[#1A1A1A]/30 cursor-not-allowed"
          } ${adding ? "opacity-70 cursor-wait" : ""}`}
        >
          {added ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Added To Bag ✓</span>
            </>
          ) : !activeVariation || !inStock ? (
            <span>Sold Out</span>
          ) : adding ? (
            <span>Adding...</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add To Bag</span>
            </>
          )}
        </button>

        <WishlistButton
          productId={productId}
          variationId={activeVariation?.id ?? null}
          productName={productName}
          productPrice={displayPrice}
          productImage={productImage}
          onRequireLogin={onRequireLogin}
        />
      </div>

      {/* ── Trust Badges ── */}
      <div className="pt-5 grid grid-cols-3 gap-2">
        {[
          { icon: Truck, label: "Free Shipping" },
          { icon: BadgeCheck, label: "100% Authentic" },
          { icon: BadgeCheck, label: "Certified Genuine" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-[#F8F6F0] border border-[#D4AF37]/20 text-center"
          >
            <Icon className="w-4 h-4 text-[#9c7d23]" />
            <span className="text-[9px] font-outfit uppercase tracking-[0.15em] text-[#1A1A1A]/60 font-semibold leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}