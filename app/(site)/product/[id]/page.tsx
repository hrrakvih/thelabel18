import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById, getRelatedProducts } from "@/lib/supabase/products";
import { getCategoriesTree } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";
import ProductDetailClient from "@/components/ProductDetailClient";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const initialColor = sp.color || null;

  const product = await getProductById(id);
  if (!product) notFound();

  const [categories, related] = await Promise.all([
    getCategoriesTree(),
    getRelatedProducts(product, 15),
  ]);

  const category = categories.find((c) => c.id === product.category_id);
  const subCategory = category?.sub_categories.find((s) => s.id === product.sub_category_id);
  const subSubCategory = subCategory?.sub_sub_categories.find(
    (s) => s.id === product.sub_sub_category_id
  );

  return (
    <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pb-24 selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Sleek Breadcrumb Header */}
      <div className="relative w-full border-b border-[#222] bg-[#0A0A0A] py-4 sm:py-5 mb-8 sm:mb-10 text-white shadow-sm">
        <div className="relative z-10 px-4 max-w-7xl mx-auto flex items-center justify-between">
          {/* Luxury Breadcrumb Bar */}
          <nav className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-outfit text-white/60 flex-wrap">
            <Link href="/" className="hover:text-[#F5E6C8] transition-colors">Home</Link>
            <span className="text-[#D4AF37]/60">/</span>
            <Link href="/shop" className="hover:text-[#F5E6C8] transition-colors">Shop</Link>
            {category && (
              <>
                <span className="text-[#D4AF37]/60">/</span>
                <Link href={`/categories/${category.id}`} className="hover:text-[#F5E6C8] transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            {subCategory && (
              <>
                <span className="text-[#D4AF37]/60">/</span>
                <span className="text-[#F5E6C8]/80">{subCategory.name}</span>
              </>
            )}
            <span className="text-[#D4AF37]/60">/</span>
            <span className="text-[#F5E6C8] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Catalog Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Product Details, Image Gallery & Variations Client Component */}
        <ProductDetailClient product={product} initialColor={initialColor} />

        {/* Related Products Section ("You May Also Like") */}
        {related.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#D4AF37]/25">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#9c7d23] text-[9.5px] tracking-[0.25em] uppercase font-outfit font-semibold mb-3">
                
                <span>The Label 18 • Complete The Ensemble</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A] tracking-wider uppercase font-normal">
                YOU MAY ALSO <span className="text-[#9c7d23]">LIKE</span>
              </h2>
              <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-3" />
              <p className="text-xs tracking-[0.2em] uppercase font-outfit text-[#1A1A1A]/60">
                Curated royal couture to accompany this piece
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}