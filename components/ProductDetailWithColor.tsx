"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";
import type { Product } from "@/lib/supabase/products";

function ColorFromUrl({ product }: { product: Product }) {
  const color = useSearchParams().get("color");
  return <ProductDetailClient product={product} initialColor={color} />;
}

// The colour is read in the browser so the product page itself can be cached.
// The fallback keeps the full product in the page's HTML.
export default function ProductDetailWithColor({ product }: { product: Product }) {
  return (
    <Suspense fallback={<ProductDetailClient product={product} initialColor={null} />}>
      <ColorFromUrl product={product} />
    </Suspense>
  );
}
