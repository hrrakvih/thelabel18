"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { ProductWithPrice } from "@/lib/supabase/products";
import { CategoryTree } from "@/lib/categories";
import { ChevronDown } from "lucide-react";

const ITEMS_PER_LOAD = 40; // 8 rows × 5 columns

type Crumb = { label: string; href?: string };

function buildBreadcrumbs(
  categories: CategoryTree[],
  params: { category?: string; sub?: string; subsub?: string }
): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  if (!params.category) {
    crumbs.push({ label: "Shop" });
    return crumbs;
  }

  crumbs.push({ label: "Shop", href: "/shop" });

  const cat = categories.find((c) => c.id === params.category);
  if (!cat) return crumbs;

  const catHref = `/shop?category=${cat.id}`;
  if (!params.sub) {
    crumbs.push({ label: cat.name });
    return crumbs;
  }
  crumbs.push({ label: cat.name, href: catHref });

  const sub = cat.sub_categories.find((s) => s.id === params.sub);
  if (!sub) return crumbs;

  const subHref = `${catHref}&sub=${sub.id}`;
  if (!params.subsub) {
    crumbs.push({ label: sub.name });
    return crumbs;
  }
  crumbs.push({ label: sub.name, href: subHref });

  const leaf = sub.sub_sub_categories.find((l) => l.id === params.subsub);
  if (leaf) crumbs.push({ label: leaf.name });

  return crumbs;
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin">
      <ol className="flex items-center gap-x-2 font-outfit font-light text-[11px] tracking-[0.15em] uppercase w-max">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-x-2">
            {i > 0 && <span className="text-[#9c7d23]/50">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="text-[#1A1A1A]/60 hover:text-[#9c7d23] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[#1A1A1A] font-medium" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function ShopClient({
  products,
  total,
  categories,
  searchQuery,
  categoryId,
  subId,
  subSubId,
}: {
  products: ProductWithPrice[];
  total: number;
  categories: CategoryTree[];
  searchQuery?: string;
  categoryId?: string;
  subId?: string;
  subSubId?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;
  const remaining = products.length - visibleCount;

  const crumbs = buildBreadcrumbs(categories, {
    category: categoryId,
    sub: subId,
    subsub: subSubId,
  });

  return (
    <main className="min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pb-24 selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Luxury Dark Hero Banner Header */}
      <div className="relative w-full overflow-hidden border-b border-[#222] bg-[#0A0A0A] py-12 sm:py-16 mb-8 sm:mb-12">
        {/* Ambient Halo Glow */}
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
          {/* Hallmark Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium mb-3 shadow-md">
            <span>The Label 18 • Curated Edit</span>
          </div>

          {/* Stately 2-Line Headline */}
          <h1 className="mb-2">
            <span className="block font-outfit text-base sm:text-xl md:text-2xl font-light tracking-[0.18em] uppercase text-white/80">
              The Complete Collection
            </span>
            <span className="block font-outfit text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] mt-1">
              Shop The Edit
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-2.5" />

          <p className="font-outfit font-light text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-white/75 max-w-lg mx-auto leading-relaxed">
            Handwoven Silks • Fine Jewellery • Bespoke Bridal Couture
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[10px] font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{total} {total === 1 ? "PIECE" : "PIECES"} AVAILABLE</span>
            {searchQuery && <span>· MATCHING &quot;{searchQuery}&quot;</span>}
          </div>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Catalog Area */}
      <div className="w-full max-w-[1650px] mx-auto px-2 sm:px-4 lg:px-6">
        <Breadcrumbs crumbs={crumbs} />

        {/* Filters Top Bar */}
        <div className="mb-6 sm:mb-8 w-full">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 p-2 sm:p-3 shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
            <ProductFilters categories={categories} />
          </div>
        </div>

        {/* Results Grid */}
        <div className="w-full">
          {products.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl bg-white border border-[#D4AF37]/30 max-w-md mx-auto shadow-sm">
              <p className="font-outfit font-light text-sm tracking-[0.1em] uppercase text-[#1A1A1A]/70 mb-4">
                No products match these filters.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-[0.14em] uppercase shadow transition-all active:scale-95"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <>
              {/* All products mixed together in one flat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* View More Button */}
              {hasMore && (
                <div className="flex flex-col items-center mt-10 sm:mt-14">
                  <p className="text-[11px] sm:text-xs font-outfit text-[#1A1A1A]/50 tracking-[0.12em] uppercase mb-3">
                    Showing {visibleProducts.length} of {products.length} pieces
                  </p>
                  <button
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_LOAD)}
                    className="group inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs sm:text-sm tracking-[0.14em] uppercase shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.45)] transition-all active:scale-[0.97]"
                  >
                    <span>View More</span>
                    <span className="text-black/60 font-normal">
                      ({remaining > ITEMS_PER_LOAD ? ITEMS_PER_LOAD : remaining} more)
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                </div>
              )}

              {/* All loaded message */}
              {!hasMore && products.length > ITEMS_PER_LOAD && (
                <div className="flex items-center justify-center mt-10 sm:mt-14">
                  <p className="text-[11px] sm:text-xs font-outfit text-[#1A1A1A]/40 tracking-[0.12em] uppercase">
                    You&apos;ve seen all {products.length} pieces ✦
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
