"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategoryTree } from "@/lib/categories";

/**
 * One top-level category rendered directly in the nav bar.
 * Hovering the category name shows its sub_categories in a dropdown below.
 * Hovering a sub_category shows its sub_sub_categories in a flyout to the right.
 */
export default function CategoryNavItem({
  category,
}: {
  category: CategoryTree;
}) {
  const [open, setOpen] = useState(false);
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
      setActiveSubCategory(null);
    }, 150);
  };

  useEffect(() => () => clearCloseTimeout(), []);

  const hasSubCategories = category.sub_categories.length > 0;
  const activeSub = category.sub_categories.find(
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
      <Link
        href={`/categories/${category.id}`}
        className="group relative flex items-center gap-1 text-white hover:text-[#d4af37] transition-colors duration-300 font-outfit font-medium text-[11px] tracking-[0.25em] uppercase py-2 whitespace-nowrap"
      >
        {category.name}
        {hasSubCategories && (
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
        )}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-500 ease-out group-hover:w-full opacity-80"></span>
      </Link>

      {/* Dropdown: sub-categories, with sub-sub-categories flyout on hover */}
      {hasSubCategories && (
        <div
          className={`absolute left-0 top-[calc(100%+0.75rem)] transition-all duration-300 ease-out ${
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Sub-categories */}
            <ul className="w-56 py-3 border-r border-white/10">
              {category.sub_categories.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/categories/${category.id}/${sub.id}`}
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

            {/* Sub-sub-categories flyout */}
            {activeSub && activeSub.sub_sub_categories.length > 0 && (
              <ul className="w-56 py-3">
                {activeSub.sub_sub_categories.map((subSub) => (
                  <li key={subSub.id}>
                    <Link
                      href={`/categories/${category.id}/${activeSub.id}/${subSub.id}`}
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
      )}
    </div>
  );
}