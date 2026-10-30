"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CategoryTree } from "@/lib/categories";

export default function ProductFilters({
  categories,
  initialCategoryId,
  initialSubCategoryId,
  initialSubSubCategoryId,
  basePath,
  hideCategoryDropdown
}: {
  categories: CategoryTree[];
  initialCategoryId?: string;
  initialSubCategoryId?: string;
  initialSubSubCategoryId?: string;
  basePath?: string;
  hideCategoryDropdown?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = initialCategoryId || searchParams.get("category") || "";
  const subCategoryId = initialSubCategoryId || searchParams.get("sub") || "";
  const subSubCategoryId = initialSubSubCategoryId || searchParams.get("subsub") || "";
  const search = searchParams.get("q") ?? "";
  const minPrice = searchParams.get("min") ?? "";
  const maxPrice = searchParams.get("max") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const [searchVal, setSearchVal] = useState(search);
  const [minVal, setMinVal] = useState(minPrice);
  const [maxVal, setMaxVal] = useState(maxPrice);

  useEffect(() => {
    setSearchVal(searchParams.get("q") ?? "");
    setMinVal(searchParams.get("min") ?? "");
    setMaxVal(searchParams.get("max") ?? "");
  }, [searchParams]);

  const hasActiveFilters =
    !!searchVal ||
    (!initialCategoryId && !!categoryId) ||
    !!subCategoryId ||
    !!subSubCategoryId ||
    !!minVal ||
    !!maxVal ||
    sort !== "newest";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    if (basePath) {
      const newCat = next.category !== undefined ? next.category : categoryId;
      const newSub = next.sub !== undefined ? next.sub : (next.category !== undefined ? null : subCategoryId);
      const newSubSub = next.subsub !== undefined ? next.subsub : (next.sub !== undefined || next.category !== undefined ? null : subSubCategoryId);

      let newPath = basePath;
      if (newCat && !basePath.includes(newCat)) newPath += `/${newCat}`;
      if (newCat && newSub) newPath += `/${newSub}`;
      if (newCat && newSub && newSubSub) newPath += `/${newSubSub}`;

      params.delete("page");
      for (const [key, value] of Object.entries(next)) {
        if (key === 'category' || key === 'sub' || key === 'subsub') continue;
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`${newPath}?${params.toString()}`);
      return;
    }

    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAllFilters() {
    setSearchVal("");
    setMinVal("");
    setMaxVal("");

    // If on a specific category page (e.g. Jewellery / Clothing), reset to the base category URL
    if (initialCategoryId) {
      router.push(`/categories/${initialCategoryId}`);
      return;
    }

    // If on the bare "/categories" root with no specific category, redirect to /shop
    if (pathname === "/categories") {
      router.push("/shop");
      return;
    }

    // On /shop or other pages, stay on the current pathname without query params
    router.push(pathname);
  }

  const inputClass =
    "bg-white border border-[#D4AF37]/40 rounded-full px-3.5 py-2 text-[#1A1A1A] text-[11px] font-outfit font-medium tracking-[0.05em] uppercase placeholder:text-[#1A1A1A]/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all cursor-pointer appearance-none shadow-sm shrink-0";

  return (
    <div className="w-full">
      {/* Single Row Container with Horizontal Scroll Support */}
      <div className="flex items-center justify-start lg:justify-center gap-2 sm:gap-3 w-full overflow-x-auto flex-nowrap scrollbar-none py-1">

        {/* Search */}
        <div className="relative shrink-0 w-36 sm:w-48">
          <input
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              updateParams({ q: e.target.value || null });
            }}
            placeholder="Search..."
            className={`${inputClass} w-full pl-9`}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {/* Category */}
        {!hideCategoryDropdown && (
          <select
            value={categoryId}
            onChange={(e) => updateParams({ category: e.target.value || null, sub: null, subsub: null })}
            className={`${inputClass} w-36 sm:w-44`}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Sub Category */}
        {categoryId && (
          <select
            value={subCategoryId}
            onChange={(e) => updateParams({ sub: e.target.value || null, subsub: null })}
            className={`${inputClass} w-36 sm:w-44`}
          >
            <option value="">All Sub-categories</option>
            {categories.find(c => c.id === categoryId)?.sub_categories.map((sub: any) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        )}

        {/* Sub-Sub Category */}
        {categoryId && subCategoryId && (
          <select
            value={subSubCategoryId}
            onChange={(e) => updateParams({ subsub: e.target.value || null })}
            className={`${inputClass} w-36 sm:w-44`}
          >
            <option value="">All Deep Categories</option>
            {categories
              .find(c => c.id === categoryId)
              ?.sub_categories.find((s: any) => s.id === subCategoryId)
              ?.sub_sub_categories?.map((subSub: any) => (
                <option key={subSub.id} value={subSub.id}>{subSub.name}</option>
              ))}
          </select>
        )}

        {/* Price Range */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            value={minVal}
            onChange={(e) => {
              setMinVal(e.target.value);
              updateParams({ min: e.target.value || null });
            }}
            placeholder="Min ₹"
            className={`${inputClass} w-20 sm:w-24 text-center px-2`}
          />
          <span className="text-[#D4AF37] font-semibold text-xs">-</span>
          <input
            type="number"
            value={maxVal}
            onChange={(e) => {
              setMaxVal(e.target.value);
              updateParams({ max: e.target.value || null });
            }}
            placeholder="Max ₹"
            className={`${inputClass} w-20 sm:w-24 text-center px-2`}
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className={`${inputClass} w-36 sm:w-44`}
        >
          <option value="newest">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
        </select>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="shrink-0 inline-flex items-center gap-1 text-[#9c7d23] hover:text-[#1A1A1A] text-[11px] font-outfit font-medium tracking-[0.08em] uppercase transition-all px-2.5 py-2 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

      </div>
    </div>
  );
}