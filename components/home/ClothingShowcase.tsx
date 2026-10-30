"use client";

import Link from "next/link";
import Image from "next/image";
import ExpandableCategoryDescription from "@/components/ExpandableCategoryDescription";
import ProductCard from "@/components/ProductCard";
import { CategoryTree } from "@/lib/categories";
import { ProductWithPrice } from "@/lib/supabase/products";
import { ArrowRight, Layers, Tag } from "lucide-react";





interface ClothingShowcaseProps {
  category?: CategoryTree;
  products?: ProductWithPrice[];
}

export default function ClothingShowcase({ category, products }: ClothingShowcaseProps) {
  const subCategories = category?.sub_categories || [];

  const displayProducts = products || [];

  return (
    <section className="bg-white text-[#1A1A1A] py-4 sm:py-6 border-b border-neutral-200 relative">
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-[#9c7d23] mb-1.5">
            <span className="font-semibold">CLOTHING</span>
          </h2>

          <div className="w-8 sm:w-12 h-[1px] bg-[#1A1A1A]/30 mx-auto my-1.5" />

          <ExpandableCategoryDescription
            description={
              category?.description ||
              "Discover exquisite ethnic silhouettes, royal handwoven sarees, and festive wear tailored for graceful elegance."
            }
            variant="light"
          />

          {/* Luxury Sub-Categories Chips (Scrollable on all devices) */}
          {subCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full justify-start mt-3 sm:mt-5 px-1">
              <Link
                href={category?.id ? `/categories/${category.id}` : "/shop?category=clothing"}
                className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-[#9c7d23]/40 bg-[#9c7d23]/5 text-[#9c7d23] hover:bg-[#9c7d23] hover:text-white transition-colors text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold"
              >
                All {category?.name || "Collection"}
              </Link>
              {subCategories.map((sub: any, i: number) => {
                const href = category?.id ? `/categories/${category.id}/${sub.id}` : "/shop?category=clothing";
                return (
                  <Link
                    key={sub.id || i}
                    href={href}
                    className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:border-[#9c7d23] hover:text-[#9c7d23] transition-colors text-[9px] sm:text-[10px] uppercase tracking-widest font-medium shadow-sm"
                  >
                    {sub.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Featured Products Section (Product Cards) */}
        <div>
          <div className="flex items-center justify-between mb-2.5 sm:mb-4">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/80">
              Featured Products ({displayProducts.length})
            </h3>
            <Link
              href={category ? `/categories/${category.id}` : "/shop?category=clothing"}
              className="text-[10px] sm:text-xs text-[#1A1A1A]/70 hover:text-black transition-colors font-medium flex items-center gap-1 uppercase tracking-wider"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>

          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
              <p className="text-sm text-neutral-500 font-medium tracking-wide">No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
