"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryTree } from "@/lib/categories";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface HeroBannerProps {
  clothingCategory?: CategoryTree;
  jewelleryCategory?: CategoryTree;
}

/**
 * Flagship Full-Width Moving Hero Banner for The Label 18
 *
 * Requirements:
 * 1. Desktop: Left-side text positioned gracefully in the vertical center as before.
 * 2. Mobile: Well-designed, bottom-aligned layout with crisp legibility,
 *    centered models, and side-by-side action buttons.
 * 3. Exactly the 4 requested elements in refined, small text size:
 *    - Title: IMPERIAL PALATIAL / ROYAL COUTURE
 *    - Description: Handcrafted Palatial Lehengas...
 *    - Buttons: EXPLORE CLOTHING + FINE JEWELLERY
 *    - Photo Scrolling: PHOTO 01 OF 02 / + ROYAL COUTURE EDITION
 */
export const heroSlides = [
  {
    id: "royal-palace-group",
    line1: "IMPERIAL PALATIAL",
    line2: "ROYAL COUTURE",
    subtitle:
      "Handcrafted Palatial Lehengas, Handloom Silks & 22K Traditional Polki Jewellery curated for royal celebrations.",
    ctaPrimary: "EXPLORE CLOTHING",
    ctaSecondary: "+ FINE JEWELLERY",
    editionLabel: "+ ROYAL COUTURE EDITION",
    desktopImage: "/bannersections1.jpeg",
    mobileImage: "/bannersections1.jpeg",
    desktopPosition: "object-[center_top]",
    mobilePosition: "object-[85%_top]",
    glow: "rgba(212, 175, 55, 0.32)",
  },
  {
    id: "lilac-palace-saree",
    line1: "ARTISANAL LILAC",
    line2: "PALACE SAREE",
    subtitle:
      "Handcrafted Lilac Embroidered Silks & Palatial Twilight Elegance.",
    ctaPrimary: "EXPLORE CLOTHING",
    ctaSecondary: "+ FINE JEWELLERY",
    editionLabel: "+ ROYAL COUTURE EDITION",
    desktopImage: "/bannersections2.png",
    mobileImage: "/bannersections2.png",
    desktopPosition: "object-[center_top]",
    mobilePosition: "object-[62%_top]",
    glow: "rgba(212, 175, 55, 0.32)",
  },
  {
    id: "azure-palace-saree",
    line1: "AZURE ELEGANCE",
    line2: "PALACE SAREE",
    subtitle:
      "Handcrafted Blue Embroidered Silks & Palatial Elegance.",
    ctaPrimary: "EXPLORE CLOTHING",
    ctaSecondary: "+ FINE JEWELLERY",
    editionLabel: "+ ROYAL COUTURE EDITION",
    desktopImage: "/hero_slide_1.jpeg",
    mobileImage: "/hero_slide_1.jpeg",
    desktopPosition: "object-[center_top]",
    mobilePosition: "object-[75%_top]",
    glow: "rgba(212, 175, 55, 0.32)",
  },
  {
    id: "crimson-royal-couture",
    line1: "CRIMSON PALATIAL",
    line2: "ROYAL COUTURE",
    subtitle:
      "Handcrafted Crimson Lehengas, Handloom Silks & 22K Traditional Polki Jewellery curated for royal celebrations.",
    ctaPrimary: "EXPLORE CLOTHING",
    ctaSecondary: "+ FINE JEWELLERY",
    editionLabel: "+ ROYAL COUTURE EDITION",
    desktopImage: "/hero_slide_4_fixed.png",
    mobileImage: "/hero_slide_4_fixed.png",
    desktopPosition: "object-[center_top]",
    mobilePosition: "object-[75%_top]",
    glow: "rgba(212, 175, 55, 0.32)",
  },
  {
    id: "amethyst-regal-gown",
    line1: "AMETHYST REGAL",
    line2: "EVENING COUTURE",
    subtitle:
      "Majestic Purple Embroideries and Regal Silks capturing the essence of twilight celebrations.",
    ctaPrimary: "EXPLORE CLOTHING",
    ctaSecondary: "+ FINE JEWELLERY",
    editionLabel: "+ ROYAL COUTURE EDITION",
    desktopImage: "/hero_slide_3.png",
    mobileImage: "/hero_slide_3.png",
    desktopPosition: "object-[center_top]",
    mobilePosition: "object-[75%_top]",
    glow: "rgba(212, 175, 55, 0.32)",
  },
];

export default function HeroBanner({ clothingCategory, jewelleryCategory }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setPreviousSlide(currentSlide);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    setPreviousSlide(currentSlide);
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [currentSlide]);

  // Dedicated 4-second automatic slide advancement
  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (document.hidden) return;
      setPreviousSlide(currentSlide);
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, [currentSlide]);

  const active = heroSlides[currentSlide];

  const primaryHref = clothingCategory
    ? `/categories/${clothingCategory.id}`
    : "/shop?category=clothing";

  const secondaryHref = jewelleryCategory
    ? `/categories/${jewelleryCategory.id}`
    : "/shop?category=jewellery";

  return (
    <section
      className="relative w-full overflow-hidden bg-[#060606] text-white border-b border-[#222] select-none
                 mt-[88px] sm:mt-[96px] lg:mt-[104px]
                 h-[480px] sm:h-[510px] md:h-[530px] lg:h-[540px] xl:h-[580px]
                 flex flex-col justify-end"
      aria-label="The Label 18 Cinematic Showcase"
    >
      {/* ========================================================================= */}
      {/* 1. FULL-WIDTH BACKGROUND CINEMATIC PHOTOS                                 */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {heroSlides.map((s, idx) => {
          const isActive = idx === currentSlide;
          // Only mount the current and previous slide for the crossfade.
          if (!isActive && idx !== previousSlide) return null;
          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
                }`}
            >
              <Image
                src={s.desktopImage}
                alt={`${s.line1} ${s.line2} — The Label 18`}
                fill
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={idx === 0 && isActive ? "high" : "auto"}
                sizes="100vw"
                className={`object-cover ${s.mobilePosition} sm:object-[center_top] transition-transform duration-[7000ms] ${isActive ? "scale-100" : "scale-105"}`}
              />

              {/* Ambient Gold Glow */}
              <div
                className="absolute -top-1/4 -right-1/4 w-[75vw] h-[75vw] max-w-[750px] max-h-[750px] rounded-full blur-[170px] opacity-40"
                style={{ background: s.glow }}
              />
            </div>
          );
        })}

        {/* GRADIENT OVERLAYS */}
        {/* Top subtle navbar blend */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#060606]/35 to-transparent z-10" />

        {/* Desktop Left-Side Scrim: Provides crisp text readability on the left, leaves right 50% sunlit & clear */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-1/2 xl:w-5/12 bg-gradient-to-r from-[#060606]/92 via-[#060606]/60 to-transparent z-10" />

        {/* Mobile Scrim: Shaded at bottom for text, clear at top for models' faces & arches */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/70 via-45% to-transparent z-10" />

        {/* Bottom edge fade */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#060606]/85 to-transparent z-10" />

        {/* Corner Filigrees (Desktop) */}
        <div className="absolute top-5 left-6 w-5 h-5 border-t border-l border-[#D4AF37]/50 pointer-events-none z-20 hidden md:block" />
        <div className="absolute top-5 right-6 w-5 h-5 border-t border-r border-[#D4AF37]/50 pointer-events-none z-20 hidden md:block" />
        <div className="absolute bottom-5 left-6 w-5 h-5 border-b border-l border-[#D4AF37]/50 pointer-events-none z-20 hidden md:block" />
        <div className="absolute bottom-5 right-6 w-5 h-5 border-b border-r border-[#D4AF37]/50 pointer-events-none z-20 hidden md:block" />
      </div>

      {/* ========================================================================= */}
      {/* 2. FOREGROUND CONTENT: LEFT SIDE ON DESKTOP, PERFECTLY TUNED ON MOBILE   */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full pb-6 sm:pb-8 lg:pb-12 pt-20">
        <div className="max-w-md lg:max-w-lg">

          {/* ELEMENT 1: TITLE (Small, refined luxury text) */}
          <h1 className="font-outfit uppercase leading-[1.12] mb-2 sm:mb-2.5">
            <span className="block text-xs sm:text-sm md:text-base font-light tracking-[0.2em] text-white/90">
              {active.line1}
            </span>
            <span className="block text-lg sm:text-xl md:text-2xl font-bold tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-[#FFF9EE] via-[#E8C766] to-[#C19623] drop-shadow-[0_2px_14px_rgba(212,175,55,0.4)] mt-0.5">
              {active.line2}
            </span>
          </h1>

          {/* ELEMENT 2: DESCRIPTION (Small, crisp text) */}
          <p className="text-white/80 text-[11px] sm:text-xs md:text-[13px] font-light tracking-wide leading-relaxed mb-3.5 sm:mb-4 max-w-sm sm:max-w-md">
            {active.subtitle}
          </p>

          {/* ELEMENT 3: BTNS (Side-by-side on mobile, compact on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 mb-3.5 sm:mb-4">
            {/* Primary Button: EXPLORE CLOTHING */}
            <Link
              href={primaryHref}
              className="group inline-flex items-center justify-center gap-1.5 py-2.5 sm:py-2.5 sm:px-5 rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-semibold text-[10px] sm:text-[11px] tracking-[0.12em] uppercase shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.55)] hover:scale-[1.02] active:scale-95 transition-all duration-300 text-center"
            >
              <span>{active.ctaPrimary}</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1 hidden sm:inline" />
            </Link>

            {/* Secondary Button: + FINE JEWELLERY */}
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center py-2.5 sm:py-2.5 sm:px-5 rounded-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#F5E6C8] hover:text-white font-medium text-[10px] sm:text-[11px] tracking-[0.12em] uppercase hover:bg-[#D4AF37]/10 active:scale-95 transition-all duration-300 shadow-sm text-center"
            >
              <span>{active.ctaSecondary}</span>
            </Link>
          </div>



        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SIDE NAVIGATION ARROWS (Perfectly centered on the edges)              */}
      {/* ========================================================================= */}
      <div className="absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between pointer-events-none px-3 sm:px-6 lg:px-10">
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37] text-white/70 hover:text-[#D4AF37] flex items-center justify-center transition-all duration-300 active:scale-90 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37] text-white/70 hover:text-[#D4AF37] flex items-center justify-center transition-all duration-300 active:scale-90 shadow-sm"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </section>
  );
}