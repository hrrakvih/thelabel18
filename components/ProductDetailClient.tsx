"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import ProductVariantSelector from "@/components/ProductVariantSelector";
import { Product, ProductVariation } from "@/lib/supabase/products";
import { useAuth } from "@/contexts/AuthContext";

import { CheckCircle2, Shield, Award, Scissors, Share2, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import ProductImageModal from "@/components/ProductImageModal";

export default function ProductDetailClient({ product, initialColor }: { product: Product, initialColor?: string | null }) {
  const { openLoginModal } = useAuth();

  const variations = product.product_variations ?? [];

  const firstColor = initialColor || (variations.find((v) => v.color)?.color ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(firstColor);

  const initialVariation = useMemo(() => {
    if (initialColor) {
      const match = variations.find(v => v.color === initialColor);
      if (match) return match;
    }
    return variations[0] ?? null;
  }, [initialColor, variations]);

  const [activeVariation, setActiveVariation] = useState<ProductVariation | null>(initialVariation);

  // Group variations by color/variation so the left-side ONLY shows distinct variations (1 cover photo per variation)
  const variationGroups = useMemo(() => {
    const groups: {
      key: string;
      variation: ProductVariation;
      color: string | null;
      color_hex: string | null;
      primaryImage: string;
      images: string[];
    }[] = [];

    const seenKeys = new Set<string>();

    for (const v of variations as ProductVariation[]) {
      const groupKey = v.color ? v.color.trim().toLowerCase() : v.id;
      const allUrls = v.image_urls && v.image_urls.length > 0
        ? v.image_urls
        : (v.image_url ? [v.image_url] : []);

      if (v.color && seenKeys.has(groupKey)) {
        const existing = groups.find(g => g.key === groupKey);
        if (existing) {
          for (const u of allUrls) {
            if (!existing.images.includes(u)) {
              existing.images.push(u);
            }
          }
        }
      } else {
        seenKeys.add(groupKey);
        const primary = allUrls[0] || v.image_url || product.image_url || "";
        groups.push({
          key: groupKey,
          variation: v,
          color: v.color,
          color_hex: v.color_hex,
          primaryImage: primary,
          images: allUrls.length > 0 ? allUrls : (primary ? [primary] : []),
        });
      }
    }

    if (groups.length === 0 && product.image_url) {
      groups.push({
        key: 'default',
        variation: {} as ProductVariation,
        color: null,
        color_hex: null,
        primaryImage: product.image_url,
        images: [product.image_url],
      });
    }

    return groups;
  }, [product, variations]);

  // Find active variation group
  const activeGroup = useMemo(() => {
    if (selectedColor) {
      const match = variationGroups.find(
        g => g.color && g.color.trim().toLowerCase() === selectedColor.trim().toLowerCase()
      );
      if (match) return match;
    }
    if (activeVariation) {
      const match = variationGroups.find(g => g.variation.id === activeVariation.id);
      if (match) return match;
    }
    return variationGroups[0] ?? null;
  }, [selectedColor, activeVariation, variationGroups]);

  // Multiple photos belonging ONLY to the currently active variation/color
  const activePhotos = useMemo(() => {
    if (activeGroup?.images && activeGroup.images.length > 0) {
      return activeGroup.images;
    }
    if (product.image_url) return [product.image_url];
    return [];
  }, [activeGroup, product.image_url]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGroupSelect = useCallback((group: typeof variationGroups[0]) => {
    if (group.color) {
      setSelectedColor(group.color);
    }
    if (group.variation?.id) {
      setActiveVariation(group.variation);
    }
    setActivePhotoIndex(0);
  }, []);

  const handlePrevPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev - 1 + activePhotos.length) % activePhotos.length);
  }, [activePhotos.length]);

  const handleNextPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev + 1) % activePhotos.length);
  }, [activePhotos.length]);

  const handleColorChange = useCallback((color: string | null) => {
    setSelectedColor((prev) => (prev === color ? prev : color));
    setActivePhotoIndex(0);
  }, []);

  const handleVariantChange = useCallback((variant: ProductVariation | null) => {
    setActiveVariation((prev) => (prev === variant ? prev : variant));
    if (variant?.color) {
      setSelectedColor((prev) => (prev === variant.color ? prev : variant.color));
    }
    setActivePhotoIndex(0);
  }, []);

  // --- Share Logic ---
  const handleShare = async () => {
    const url = new URL(window.location.href);
    if (selectedColor) {
      url.searchParams.set("color", selectedColor);
    } else {
      url.searchParams.delete("color");
    }
    const shareUrl = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share canceled or failed", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const hasNoVariations = variations.length === 0;
  const currentBigImage = activePhotos[activePhotoIndex] || activeGroup?.primaryImage || product.image_url;

  return (
    <div className="w-full space-y-6">
      {/* Top Section: Gallery & Variant Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* Left Column: Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Mobile Title & SKU (Visible on mobile/tablet) */}
          <div className="block lg:hidden mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#9c7d23] text-[9.5px] tracking-[0.25em] uppercase font-outfit font-semibold">
                
                <span>SKU: {product.sku}</span>
              </div>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full bg-white border border-[#D4AF37]/30 text-[#9c7d23] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all shadow-sm active:scale-95 cursor-pointer"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl tracking-wide uppercase text-[#1A1A1A] font-normal leading-tight">
              {product.name}
            </h1>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-4 items-start">

            {/* Left-Side Thumbnails Column (Only Distinct Variations / Colors, NO multi-photos) */}
            {variationGroups.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[580px] max-w-full pb-2 sm:pb-0 scrollbar-thin">
                {variationGroups.map((group, idx) => {
                  const isSelected = activeGroup?.key === group.key;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => handleGroupSelect(group)}
                      className={`relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer group/thumb ${
                        isSelected
                          ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/60 shadow-md scale-[1.02]"
                          : "border-[#D4AF37]/25 opacity-65 hover:opacity-100 hover:border-[#D4AF37]/60"
                      }`}
                      aria-label={`Select variation ${group.color || idx + 1}`}
                    >
                      {group.primaryImage ? (
                        <Image
                          src={group.primaryImage}
                          alt={group.color ? `${product.name} in ${group.color}` : `${product.name} option ${idx + 1}`}
                          fill
                          sizes="(max-width: 640px) 64px, 80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-[10px] text-stone-400">
                          No photo
                        </div>
                      )}

                      {/* Color label pill */}
                      {group.color && (
                        <div className="absolute bottom-1.5 left-1 right-1 z-10 px-1 py-0.5 rounded bg-black/80 backdrop-blur-xs border border-[#D4AF37]/30 text-[8px] sm:text-[9px] uppercase tracking-wider text-[#F5E6C8] truncate text-center font-outfit">
                          {group.color}
                        </div>
                      )}

                      {/* Multi-photo indicator count if this variation has multiple photos */}
                      {group.images.length > 1 && (
                        <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-full bg-black/85 border border-[#D4AF37]/50 text-[8.5px] font-bold text-[#D4AF37] shadow">
                          {group.images.length}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Big Image Container with Pop & Zoom Click */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className="relative flex-1 aspect-[3/4] max-h-[640px] w-full rounded-2xl overflow-hidden bg-white border border-[#D4AF37]/35 shadow-[0_8px_30px_rgba(212,175,55,0.08)] group cursor-zoom-in select-none"
            >

              {/* Pop & Zoom Button Badge (Top Right) */}
              <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[10px] uppercase tracking-[0.15em] font-outfit shadow-md transition-all group-hover:scale-105 group-hover:border-[#D4AF37] pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Click to Zoom</span>
              </div>

              {/* Navigation Arrow LEFT (<) on Main Image */}
              {activePhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-[#D4AF37] border border-[#D4AF37]/40 text-[#F5E6C8] hover:text-black opacity-85 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-sm hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Navigation Arrow RIGHT (>) on Main Image */}
              {activePhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-[#D4AF37] border border-[#D4AF37]/40 text-[#F5E6C8] hover:text-black opacity-85 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-sm hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {currentBigImage ? (
                <>
                  <Image
                    src={currentBigImage}
                    alt={product.name}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover transition-all duration-500 ease-out group-hover:scale-[1.02]"
                  />
                  
                  {/* Inside Big Photo: Down Right Corner Multi-Photo Gallery Strip */}
                  {activePhotos.length > 1 && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 max-w-[calc(100%-24px)]"
                    >
                      <div className="bg-black/80 backdrop-blur-md border border-[#D4AF37]/50 px-2.5 py-2 rounded-2xl shadow-2xl flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-outfit text-white/70">
                          <span className="flex items-center gap-1.5 text-[#F5E6C8] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                            Photos ({activePhotoIndex + 1}/{activePhotos.length})
                          </span>
                          <span className="text-[8.5px] text-[#D4AF37]/80 hidden sm:inline">Select View</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 max-w-[260px] sm:max-w-[320px]">
                          {activePhotos.map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIndex(pIdx);
                              }}
                              aria-label={`View photo ${pIdx + 1}`}
                              className={`relative w-11 h-14 sm:w-13 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                                activePhotoIndex === pIdx
                                  ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/80 shadow-lg scale-105"
                                  : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/60"
                              }`}
                            >
                              <Image
                                src={photoUrl}
                                alt={`${product.name} angle ${pIdx + 1}`}
                                fill
                                sizes="(max-width: 640px) 44px, 52px"
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtle expand cue at bottom left when multi-photo dock is on the right */}
                  <div className="absolute bottom-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-sm border border-[#D4AF37]/35 text-white/90 text-[9px] tracking-[0.2em] uppercase font-outfit shadow-md">
                      <span>Click to Pop &amp; Zoom</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#1A1A1A]/40 text-xs uppercase tracking-[0.3em]">
                  No Image Available
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Product Info Card */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">

          {/* Dark Header: Title + SKU + Share */}
          <div className="bg-[#2C1810] px-6 sm:px-8 py-6 sm:py-7 relative overflow-hidden">
            {/* Subtle gold glow */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#D4AF37]/8 blur-[60px] pointer-events-none" />

            {/* Desktop only */}
            <div className="hidden lg:block relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#F5E6C8] text-[9px] tracking-[0.3em] uppercase font-outfit font-medium">
                  SKU: {product.sku}
                </div>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-white/70 text-[10px] font-outfit uppercase tracking-wider hover:bg-white/10 hover:text-white hover:border-white/30 transition-all active:scale-95"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl tracking-wide uppercase text-white font-normal leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-2.5 mt-3">
                <div className="w-6 h-[1px] bg-gradient-to-r from-[#D4AF37]/60 to-transparent" />
                <span className="text-[9px] text-[#D4AF37]/50 tracking-[0.3em] uppercase font-serif">The Label 18</span>
              </div>
            </div>

            {/* Mobile only */}
            <div className="block lg:hidden relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#F5E6C8] text-[9px] tracking-[0.3em] uppercase font-outfit font-medium">
                  SKU: {product.sku}
                </div>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/[0.06] border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                  aria-label="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl tracking-wide uppercase text-white font-normal leading-snug">
                {product.name}
              </h1>
            </div>
          </div>

          {/* Cream Body: Variant Selector */}
          <div className="bg-[#FDFBF7] px-6 sm:px-8 py-6 sm:py-7 flex-1">
            {hasNoVariations ? (
              <p className="text-xs tracking-[0.2em] uppercase font-outfit font-light text-[#1A1A1A]/50 py-4">
                This product has no purchasable options currently.
              </p>
            ) : (
              <ProductVariantSelector
                productId={product.id}
                productName={product.name}
                productImage={product.image_url}
                variations={variations}
                selectedColorProp={selectedColor}
                onColorChange={handleColorChange}
                onVariantChange={handleVariantChange}
                onRequireLogin={openLoginModal}
              />
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section: Description & SKU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Description */}
        {product.description && (
          <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-sm">
            <div className="bg-[#2C1810] px-6 py-4 flex items-center gap-3">
              <div className="w-1 h-5 bg-gradient-to-b from-[#F5E6C8] to-[#C59B27] rounded-full" />
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-outfit font-semibold text-[#F5E6C8]">
                Atelier Narrative & Craftsmanship
              </h2>
            </div>
            <div className="bg-white px-6 sm:px-8 py-4 sm:py-5">
              <p className="text-[#1A1A1A]/80 font-outfit font-light text-sm sm:text-[15px] leading-[2.1] tracking-wide whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* SKU Reference */}
        <div className={`space-y-4 ${product.description ? "lg:col-span-4" : "lg:col-span-12"}`}>
          <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-sm">
            <div className="bg-[#2C1810] px-5 py-3.5 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#F5E6C8] to-[#C59B27] rounded-full" />
              <span className="text-[9px] uppercase tracking-[0.3em] font-outfit font-semibold text-[#F5E6C8]/70">
                Atelier Reference
              </span>
            </div>
            <div className="bg-white px-5 py-4 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] uppercase font-outfit font-medium text-[#1A1A1A]/50">
                SKU
              </span>
              <span className="text-xs tracking-[0.2em] uppercase font-outfit font-bold text-[#9c7d23]">
                {(activeVariation as any)?.sku || product.sku}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox Pop-up Zoom & Fullscreen Viewer Modal */}
      <ProductImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={activePhotos.map((url) => ({
          src: url,
          color: activeGroup?.color || null,
        }))}
        activeIndex={activePhotoIndex}
        onNavigate={setActivePhotoIndex}
        productName={product.name}
        productSku={(activeVariation as any)?.sku || product.sku}
      />
    </div>
  );
}