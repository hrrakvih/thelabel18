"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Tag } from "lucide-react";
import { ProductWithPrice } from "@/lib/supabase/products";
import MiniWishlistButton from "./MiniWishlistButton";
import MiniCartButton from "./MiniCartButton";

export default function ProductCard({ product }: { product: ProductWithPrice }) {
  const defaultImage = product.image_url || product.product_variations[0]?.image_urls?.[0] || product.product_variations[0]?.image_url;

  // Extract unique colors that have an associated image or hex code
  const colorVariations = useMemo(() => {
    if (!product.product_variations) return [];
    const uniqueColors = new Map<string, { hex: string; img: string | null }>();

    product.product_variations.forEach(v => {
      if (v.color && v.color_hex && !uniqueColors.has(v.color)) {
        uniqueColors.set(v.color, {
          hex: v.color_hex,
          img: (v.image_urls && v.image_urls.length > 0) ? v.image_urls[0] : (v.image_url || null)
        });
      }
    });

    return Array.from(uniqueColors.entries()).map(([color, data]) => ({
      color,
      hex: data.hex,
      img: data.img
    }));
  }, [product.product_variations]);

  const sizeVariations = useMemo(() => {
    if (!product.product_variations) return [];
    // Only extract sizes if there are no colors
    if (colorVariations.length > 0) return [];

    const uniqueSizes = new Set<string>();
    product.product_variations.forEach(v => {
      if (v.size) uniqueSizes.add(v.size);
    });

    return Array.from(uniqueSizes);
  }, [product.product_variations, colorVariations]);

  const [activeColor, setActiveColor] = useState<string | null>(null);

  // Determine current image based on selected color
  const currentImage = useMemo(() => {
    if (activeColor) {
      const match = colorVariations.find(c => c.color === activeColor);
      if (match && match.img) return match.img;
    }
    return defaultImage;
  }, [activeColor, colorVariations, defaultImage]);

  // Price, original price (MRP) and discount for the selected color.
  // Uses `compare_at_price` (same column as the product detail page).
  const { currentPrice, originalPrice, discountPercent } = useMemo(() => {
    const vars = (product.product_variations ?? []).filter(
      v => v.price != null && (!activeColor || v.color === activeColor)
    );

    if (vars.length === 0) {
      return { currentPrice: product.minPrice, originalPrice: null as number | null, discountPercent: 0 };
    }

    // Cheapest variation among the matches
    const cheapest = vars.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
    const price = Number(cheapest.price);
    const rawOriginal = cheapest.compare_at_price;
    const original = rawOriginal != null ? Number(rawOriginal) : null;

    const percent =
      original && original > price ? Math.round((1 - price / original) * 100) : 0;

    return {
      currentPrice: price,
      originalPrice: percent > 0 ? original : null,
      discountPercent: percent,
    };
  }, [activeColor, product.product_variations, product.minPrice]);

  // Active variation now includes stock info so the cart button knows availability
  const activeVariation = useMemo(() => {
    if (!product.product_variations || product.product_variations.length === 0) return null;
    const matchingVars = activeColor
      ? product.product_variations.filter(v => v.color === activeColor)
      : product.product_variations;

    if (matchingVars.length === 0) return null;

    // Prefer an in-stock variation among the matches, fall back to the first
    return matchingVars.find(v => v.stock_quantity > 0) ?? matchingVars[0];
  }, [activeColor, product.product_variations]);

  const activeVariationId = activeVariation?.id ?? null;
  const activeVariationInStock = (activeVariation?.stock_quantity ?? 0) > 0;

  const productUrl = activeColor
    ? `/product/${product.id}?color=${encodeURIComponent(activeColor)}`
    : `/product/${product.id}`;

  return (
    <div className="group flex flex-col rounded-xl sm:rounded-2xl border border-[#1A1A1A]/10 bg-white hover:border-[#9c7d23]/40 hover:shadow-xl hover:shadow-[#9c7d23]/5 transition-all duration-500 overflow-hidden h-full w-full">
      {/* Image Container */}
      <Link prefetch={false} href={productUrl} className="relative aspect-[4/5] bg-[#F8F6F0] overflow-hidden block w-full">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs uppercase tracking-widest font-light">
            No Image
          </div>
        )}

        {!product.inStock && (
          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#1A1A1A]/80 backdrop-blur-sm text-white text-[8px] sm:text-[9px] tracking-[0.2em] uppercase px-2.5 py-0.5 sm:py-1 font-medium rounded-full shadow-sm">
            Sold Out
          </span>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        {/* Title and Price */}
        <div className="flex flex-col gap-0.5 sm:gap-1 mb-2 sm:mb-2.5">
          <Link prefetch={false} href={productUrl} className="hover:text-[#9c7d23] transition-colors">
            <h3 className="font-outfit font-medium text-[11px] sm:text-[13px] tracking-wide text-[#1A1A1A] line-clamp-1 uppercase">
              {product.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <p className="font-outfit font-bold text-[11px] sm:text-sm text-[#9c7d23]">
              {currentPrice != null
                ? `₹${currentPrice.toLocaleString("en-IN")}`
                : "N/A"}
            </p>

            {originalPrice && (
              <p className="font-outfit font-light text-[9px] sm:text-xs text-[#1A1A1A]/35 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </p>
            )}

            {discountPercent > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[7px] sm:text-[8px] tracking-widest uppercase font-bold">
                <Tag className="w-2 h-2" />
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Variations Swatches */}
        {colorVariations.length > 0 ? (
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5 pb-1">
            {colorVariations.map(variant => (
              <button
                key={variant.color}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(variant.color);
                }}
                title={variant.color}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all ${activeColor === variant.color
                  ? "border-[#9c7d23] ring-1 ring-[#9c7d23]/30 scale-110"
                  : "border-[#1A1A1A]/20 hover:border-[#1A1A1A]/60"
                  }`}
                style={{ backgroundColor: variant.hex }}
              />
            ))}
          </div>
        ) : sizeVariations.length > 0 ? (
          <div className="mt-0.5 sm:mt-1 flex flex-wrap gap-1 pb-1">
            {sizeVariations.map(size => (
              <span key={size} className="px-1 sm:px-1.5 py-0.5 border border-[#1A1A1A]/10 rounded text-[8px] sm:text-[9px] text-[#1A1A1A]/60 font-outfit uppercase">
                {size}
              </span>
            ))}
          </div>
        ) : null}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 mt-auto border-t border-[#1A1A1A]/10">
          <Link
            prefetch={false}
            href={productUrl}
            className="flex items-center gap-1 text-[#1A1A1A]/60 hover:text-[#9c7d23] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 sm:w-3.5 h-3 sm:h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span className="text-[8px] sm:text-[9px] tracking-[0.12em] font-medium uppercase">Details</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[#1A1A1A]/60">
            <MiniWishlistButton
              productId={product.id}
              variationId={activeVariationId}
              productName={product.name}
              productPrice={currentPrice}
              productImage={currentImage}
            />
            <MiniCartButton
              productId={product.id}
              variationId={activeVariationId}
              productName={product.name}
              productPrice={currentPrice}
              productImage={currentImage}
              color={activeColor}
              inStock={activeVariationInStock}
            />
          </div>
        </div>
      </div>
    </div>
  );
}