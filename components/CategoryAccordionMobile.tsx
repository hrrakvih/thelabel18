"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryTree } from "@/lib/categories";

/**
 * Mobile-friendly expandable tree for the same category data,
 * meant to live inside the mobile nav dropdown in Header.
 */
export default function CategoryAccordionMobile({
  categories,
  onNavigate,
}: {
  categories: CategoryTree[];
  onNavigate?: () => void;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);

  if (!categories.length) return null;

  return (
    <div className="w-full text-left">
      {categories.map((category) => {
        const isCategoryOpen = openCategory === category.id;
        return (
          <div key={category.id} className="border-b border-white/5 last:border-0">
            <button
              onClick={() =>
                setOpenCategory(isCategoryOpen ? null : category.id)
              }
              className="w-full flex items-center justify-between py-3 text-white/95 hover:text-[#d4af37] transition-colors font-outfit font-normal text-[12px] tracking-[0.2em] uppercase"
            >
              {category.sub_categories.length > 0 ? (
                <>
                  <span>{category.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-3 h-3 transition-transform duration-300 ${
                      isCategoryOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </>
              ) : (
                <Link
                  href={`/categories/${category.id}`}
                  onClick={onNavigate}
                  className="w-full"
                >
                  {category.name}
                </Link>
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isCategoryOpen ? "max-h-[1000px] pb-2" : "max-h-0"
              }`}
            >
              {category.sub_categories.map((sub) => {
                const isSubOpen = openSubCategory === sub.id;
                return (
                  <div key={sub.id} className="pl-4">
                    <button
                      onClick={() =>
                        setOpenSubCategory(isSubOpen ? null : sub.id)
                      }
                      className="w-full flex items-center justify-between py-2 text-white/95 hover:text-[#d4af37] transition-colors font-outfit font-normal text-[11px] tracking-[0.15em] uppercase"
                    >
                      {sub.sub_sub_categories.length > 0 ? (
                        <>
                          <span>{sub.name}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`w-3 h-3 transition-transform duration-300 ${
                              isSubOpen ? "rotate-180" : ""
                            }`}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </>
                      ) : (
                        <Link
                          href={`/categories/${category.id}/${sub.id}`}
                          onClick={onNavigate}
                          className="w-full text-left"
                        >
                          {sub.name}
                        </Link>
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isSubOpen ? "max-h-96 pb-2" : "max-h-0"
                      }`}
                    >
                      {sub.sub_sub_categories.map((subSub) => (
                        <Link
                          key={subSub.id}
                          href={`/categories/${category.id}/${sub.id}/${subSub.id}`}
                          onClick={onNavigate}
                          className="block pl-4 py-1.5 text-white/95 hover:text-[#d4af37] transition-colors font-outfit font-normal text-[10.5px] tracking-[0.12em] uppercase"
                        >
                          {subSub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}