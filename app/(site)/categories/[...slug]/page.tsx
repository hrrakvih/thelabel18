import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoriesTree } from "@/lib/categories";
import { getProducts } from "@/lib/supabase/products";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import ExpandableCategoryDescription from "@/components/ExpandableCategoryDescription";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  if (!slug || slug.length === 0 || slug.length > 3) notFound();

  const [categoryId, subCategoryId, subSubCategoryId] = slug;

  const categories = await getCategoriesTree();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) notFound();

  const subCategory = subCategoryId
    ? category.sub_categories.find((s) => s.id === subCategoryId)
    : undefined;
  if (subCategoryId && !subCategory) notFound();

  const subSubCategory = subSubCategoryId
    ? subCategory?.sub_sub_categories.find((s) => s.id === subSubCategoryId)
    : undefined;
  if (subSubCategoryId && !subSubCategory) notFound();

  const PAGE_SIZE = 40; // 8 rows × 5 columns
  const page = sp.page ? parseInt(sp.page) : 1;
  const { items, total, pageSize } = await getProducts({
    categoryId: category.id,
    subCategoryId: subCategory?.id,
    subSubCategoryId: subSubCategory?.id,
    search: sp.q,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    sort: (sp.sort as any) ?? "newest",
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentCategoryNode = subSubCategory ?? subCategory ?? category;
  const currentName = currentCategoryNode.name;
  const currentImage = currentCategoryNode.image_url;
  const currentDescription = currentCategoryNode.description;

  return (
    <main className="min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pb-24 selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Luxury Dark Hero Banner Header */}
      {currentImage ? (
        <div className="relative w-full h-[40vh] min-h-[320px] md:h-[48vh] flex items-center justify-center mb-8 sm:mb-12 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-90"
            style={{ backgroundImage: `url(${currentImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#F8F6F0] via-black/55 to-black/70" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium mb-3 shadow-md">
              
              <span>The Label 18 • Collection</span>
            </div>

            <h1 className="font-outfit font-light text-3xl sm:text-5xl md:text-6xl text-white tracking-widest uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27]">
                {currentName}
              </span>
            </h1>

            {currentDescription && (
              <ExpandableCategoryDescription
                description={currentDescription}
                variant="dark"
                className="mt-3"
              />
            )}

            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 text-[10px] font-mono tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>{total} {total === 1 ? "PIECE" : "PIECES"} AVAILABLE</span>
              {sp.q && <span>· MATCHING &quot;{sp.q}&quot;</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden border-b border-[#222] bg-[#0A0A0A] py-12 sm:py-16 mb-8 sm:mb-12">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full blur-[140px] bg-[#D4AF37]/12" />
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
              
              <span>The Label 18 • Category</span>
            </div>

            <h1 className="font-outfit text-3xl sm:text-5xl md:text-6xl font-light text-white tracking-widest uppercase mb-2">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27]">
                {currentName}
              </span>
            </h1>

            {currentDescription && (
              <ExpandableCategoryDescription
                description={currentDescription}
                variant="dark"
                className="mt-2"
              />
            )}

            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[10px] font-mono tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>{total} {total === 1 ? "PIECE" : "PIECES"} AVAILABLE</span>
              {sp.q && <span>· MATCHING &quot;{sp.q}&quot;</span>}
            </div>
          </div>
        </div>
      )}

      {/* 2. DUAL COMPOSITION: Warm Cream & Gold Luxury Catalog Area */}
      <div className="w-full max-w-[1650px] mx-auto px-2 sm:px-4 lg:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin">
          <ol className="flex items-center gap-x-2 font-outfit font-light text-[11px] tracking-[0.15em] uppercase w-max">
            <li className="flex items-center gap-x-2">
              <Link href="/" className="text-[#1A1A1A]/60 hover:text-[#9c7d23] transition-colors">Home</Link>
            </li>
            <li className="flex items-center gap-x-2">
              <span className="text-[#9c7d23]/50">/</span>
              <Link
                href={`/categories/${category.id}`}
                className={`hover:text-[#9c7d23] transition-colors ${
                  !subCategory ? "text-[#1A1A1A] font-medium" : "text-[#1A1A1A]/60"
                }`}
              >
                {category.name}
              </Link>
            </li>
            {subCategory && (
              <li className="flex items-center gap-x-2">
                <span className="text-[#9c7d23]/50">/</span>
                <Link
                  href={`/categories/${category.id}/${subCategory.id}`}
                  className={`hover:text-[#9c7d23] transition-colors ${
                    !subSubCategory ? "text-[#1A1A1A] font-medium" : "text-[#1A1A1A]/60"
                  }`}
                >
                  {subCategory.name}
                </Link>
              </li>
            )}
            {subSubCategory && (
              <li className="flex items-center gap-x-2">
                <span className="text-[#9c7d23]/50">/</span>
                <span className="text-[#1A1A1A] font-medium">{subSubCategory.name}</span>
              </li>
            )}
          </ol>
        </nav>

        {/* Filters Top Bar */}
        <div className="mb-6 sm:mb-8 w-full">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 p-2 sm:p-3 shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
            <ProductFilters
              categories={categories}
              initialCategoryId={category.id}
              initialSubCategoryId={subCategory?.id}
              initialSubSubCategoryId={subSubCategory?.id}
              basePath="/categories"
              hideCategoryDropdown={true}
            />
          </div>
        </div>

        {/* Results */}
        <div className="w-full">
          {items.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl bg-white border border-[#D4AF37]/30 max-w-md mx-auto shadow-sm">
              <p className="font-outfit font-light text-sm tracking-[0.1em] uppercase text-[#1A1A1A]/70 mb-4">
                No products found in this category.
              </p>
              <Link
                href={`/categories/${category.id}`}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-semibold text-xs tracking-[0.14em] uppercase shadow transition-all active:scale-95"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (() => {
            // Build visible page numbers with ellipsis
            const delta = 2;
            const pages: (number | "...")[] = [];
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i);
              } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
              }
            }
            const prevQp = new URLSearchParams({ ...sp, page: String(page - 1) } as any);
            const nextQp = new URLSearchParams({ ...sp, page: String(page + 1) } as any);
            return (
              <div className="flex items-center justify-center gap-1.5 mt-14 sm:mt-16 flex-wrap">
                {/* Prev */}
                {page > 1 ? (
                  <Link
                    href={`/categories/${slug.join("/")}?${prevQp.toString()}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-white text-[#1A1A1A]/70 hover:border-[#D4AF37] hover:text-black text-xs font-outfit tracking-wider transition-all"
                  >
                    ← Prev
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#D4AF37]/10 bg-white/50 text-[#1A1A1A]/25 text-xs font-outfit tracking-wider cursor-not-allowed select-none">
                    ← Prev
                  </span>
                )}

                {/* Page numbers */}
                {pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-[#1A1A1A]/40 text-xs">
                      …
                    </span>
                  ) : (
                    (() => {
                      const qp = new URLSearchParams({ ...sp, page: String(p) } as any);
                      const isActive = p === page;
                      return (
                        <Link
                          key={p}
                          href={`/categories/${slug.join("/")}?${qp.toString()}`}
                          className={`text-xs font-outfit font-medium w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-[#F5E6C8] to-[#D4AF37] text-black font-bold shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                              : "text-[#1A1A1A]/70 hover:text-black border border-[#D4AF37]/30 bg-white hover:border-[#D4AF37]"
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })()
                  )
                )}

                {/* Next */}
                {page < totalPages ? (
                  <Link
                    href={`/categories/${slug.join("/")}?${nextQp.toString()}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-white text-[#1A1A1A]/70 hover:border-[#D4AF37] hover:text-black text-xs font-outfit tracking-wider transition-all"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#D4AF37]/10 bg-white/50 text-[#1A1A1A]/25 text-xs font-outfit tracking-wider cursor-not-allowed select-none">
                    Next →
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </main>
  );
}