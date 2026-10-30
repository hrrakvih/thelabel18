"use client";

import { useEffect, useState } from "react";
import { getCategoriesTree, CategoryTree } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { ProductWithPrice } from "@/lib/supabase/products";
import HeroBanner from "@/components/home/HeroBanner";
import BrandPhilosophy from "@/components/home/BrandPhilosophy";
import ClothingShowcase from "@/components/home/ClothingShowcase";
import CraftsmanshipStory from "@/components/home/CraftsmanshipStory";
import JewelleryShowcase from "@/components/home/JewelleryShowcase";
import VipClubSection from "@/components/home/VipClubSection";

export default function Home() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [products, setProducts] = useState<ProductWithPrice[]>([]);


  useEffect(() => {
    async function loadData() {
      try {
        const catTree = await getCategoriesTree();
        const clothing = catTree.find((c) => /cloth|ethnic|wear|dress/i.test(c.name)) || catTree[0];
        const jewellery = catTree.find((c) => /jewel|accessor/i.test(c.name)) || catTree[1];
        const categoryIds = [...new Set([clothing?.id, jewellery?.id].filter(Boolean))];
        const supabase = createClient();
        const fetchLatest = (categoryId?: string) => {
          let query = supabase.from("products")
            .select("id, sku, name, category_id, sub_category_id, sub_sub_category_id, image_url, is_visible, product_variations(id, size, color, color_hex, image_url, image_urls, stock_quantity, price, compare_at_price, is_visible)")
            .eq("is_visible", true)
            .order("created_at", { ascending: false })
            .limit(10);
          if (categoryId) query = query.eq("category_id", categoryId);
          return query;
        };
        const results = await Promise.all(
          categoryIds.length ? categoryIds.map((id) => fetchLatest(id)) : [fetchLatest()]
        );
        for (const result of results) if (result.error) throw result.error;
        const rawProducts = { data: results.flatMap((result) => result.data ?? []) };

        setCategories(catTree);

        if (rawProducts.data) {
          const formatted: ProductWithPrice[] = rawProducts.data.map((p) => {
            const variations = p.product_variations || [];
            const validPrices = variations
              .filter((v) => v.is_visible !== false && v.price != null)
              .map((v) => Number(v.price));

            const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
            const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
            const inStock = variations.filter((v) => v.is_visible !== false).some((v) => (v.stock_quantity ?? 0) > 0);

            return {
              ...p,
              description: null, // Cards do not render product descriptions.
              minPrice,
              maxPrice,
              inStock,
            };
          });

          setProducts(formatted);
        }
      } catch (err) {
        console.error("Error loading home page data:", err);
      }
    }

    loadData();
  }, []);

  const clothingCat =
    categories.find(
      (c) =>
        c.name.toLowerCase().includes("cloth") ||
        c.name.toLowerCase().includes("ethnic") ||
        c.name.toLowerCase().includes("wear") ||
        c.name.toLowerCase().includes("dress")
    ) || categories[0];

  const jewelleryCat =
    categories.find(
      (c) =>
        c.name.toLowerCase().includes("jewel") ||
        c.name.toLowerCase().includes("accessor")
    ) || categories[1];

  // Limit to 10 products (2 rows on desktop) and latest first
  const clothingProducts = clothingCat
    ? products.filter((p) => p.category_id === clothingCat.id).slice(0, 10)
    : products.slice(0, 10);

  const jewelleryProducts = jewelleryCat
    ? products.filter((p) => p.category_id === jewelleryCat.id).slice(0, 10)
    : products.slice(0, 10);

  return (
    <main className="bg-black min-h-screen text-white selection:bg-[#d4af37]/30 selection:text-white">
      {/* 1. Flagship Luxury Hero Banner */}
      <HeroBanner
        clothingCategory={clothingCat}
        jewelleryCategory={jewelleryCat}
      />

      {/* 2.  Clothing Showcase */}
      <ClothingShowcase category={clothingCat} products={clothingProducts} />

      {/* 3. Behind The Brand: Artisanal Heritage & Real Craftsmanship */}
      <CraftsmanshipStory />

      {/* 4. Fine Jewellery Showcase */}
      <JewelleryShowcase category={jewelleryCat} products={jewelleryProducts} />

      {/* 5. Brand Identity & 4 Pillars (Handcrafted Luxury, Bespoke Fitting) - Completely at the bottom */}
      <BrandPhilosophy />

      {/* 6. VIP Circle & Social Highlights */}
      <VipClubSection />

    </main>
  );
}