"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategoryTree } from "@/lib/categories";

/**
 * Desktop nested flyout menu:
 * Categories (level 1) -> hover -> Sub-categories (level 2) -> hover -> Sub-sub-categories (level 3)
 *
 * Styling matches the existing header: black glass panels, thin uppercase tracked type,
 * gold (#d4af37) accent on hover/active.
 */
export default function CategoryMegaMenu({
  categories,
}: {
  categories: CategoryTree[];
}) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(
    null
  );
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => {
      setOpen(false);
      setActiveCategory(null);
      setActiveSubCategory(null);
    }, 150);
  };

  useEffect(() => () => clearCloseTimeout(), []);

  if (!categories.length) return null;

  const activeCategoryData = categories.find((c) => c.id === activeCategory);
  const activeSubCategoryData = activeCategoryData?.sub_categories.find(
    (s) => s.id === activeSubCategory
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimeout();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      {/* Trigger */}
      <button
        className="group relative flex items-center gap-1.5 text-white/70 hover:text-[#d4af37] transition-colors duration-300 font-outfit font-light text-[11px] tracking-[0.25em] uppercase py-2 whitespace-nowrap"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Categories
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-3 h-3 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-500 ease-out group-hover:w-full opacity-70"></span>
      </button>

      {/* Flyout panel */}
      <div
        className={`absolute left-0 top-[calc(100%+0.75rem)] transition-all duration-300 ease-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Level 1: Categories */}
          <ul className="w-56 py-3 border-r border-white/10">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.id}`}
                  onMouseEnter={() => {
                    setActiveCategory(category.id);
                    setActiveSubCategory(null);
                  }}
                  className={`flex items-center justify-between px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-outfit font-light transition-colors duration-200 ${
                    activeCategory === category.id
                      ? "text-[#d4af37] bg-white/5"
                      : "text-white/70 hover:text-[#d4af37] hover:bg-white/5"
                  }`}
                >
                  {category.name}
                  {category.sub_categories.length > 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3 h-3 ml-2 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Level 2: Sub-categories */}
          {activeCategoryData && activeCategoryData.sub_categories.length > 0 && (
            <ul className="w-56 py-3 border-r border-white/10">
              {activeCategoryData.sub_categories.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/categories/${activeCategoryData.id}/${sub.id}`}
                    onMouseEnter={() => setActiveSubCategory(sub.id)}
                    className={`flex items-center justify-between px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-outfit font-light transition-colors duration-200 ${
                      activeSubCategory === sub.id
                        ? "text-[#d4af37] bg-white/5"
                        : "text-white/70 hover:text-[#d4af37] hover:bg-white/5"
                    }`}
                  >
                    {sub.name}
                    {sub.sub_sub_categories.length > 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3 ml-2 shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Level 3: Sub-sub-categories */}
          {activeSubCategoryData &&
            activeSubCategoryData.sub_sub_categories.length > 0 && (
              <ul className="w-56 py-3">
                {activeSubCategoryData.sub_sub_categories.map((subSub) => (
                  <li key={subSub.id}>
                    <Link
                      href={`/categories/${activeCategoryData!.id}/${
                        activeSubCategoryData.id
                      }/${subSub.id}`}
                      className="block px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-outfit font-light text-white/70 hover:text-[#d4af37] hover:bg-white/5 transition-colors duration-200"
                    >
                      {subSub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}