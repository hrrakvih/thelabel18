"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CategoryTree, SubCategory } from "@/lib/categories";

const ACCENTS = ["#9c7d23", "#5B7B6B", "#7A5B87", "#B0682E"];

// ---- image helper: turns a stored path into a full Supabase Storage URL ----
function getSupabaseImageUrl(path?: string | null, bucketName: string = "category-images") {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ---- big rectangular photo, with a colored initials panel as fallback ----
function PhotoBlock({
  name,
  imageUrl,
  bucket,
  accent,
  height = 160,
}: {
  name: string;
  imageUrl?: string | null;
  bucket: string;
  accent: string;
  height?: number;
}) {
  const src = getSupabaseImageUrl(imageUrl, bucket);
  return (
    <div className="relative w-full bg-[#EAE5D9]" style={{ height }}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, 300px"
          className="object-cover"
          unoptimized={src.startsWith("http")}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `${accent}14` }}
        >
          <span
            style={{ color: accent }}
            className="text-3xl italic"
          >
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  );
}

function SmallThumb({
  name,
  imageUrl,
  bucket,
  accent,
  size = 44,
}: {
  name: string;
  imageUrl?: string | null;
  bucket: string;
  accent: string;
  size?: number;
}) {
  const src = getSupabaseImageUrl(imageUrl, bucket);
  return (
    <div
      className="relative shrink-0 rounded-md overflow-hidden bg-[#EAE5D9]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized={src.startsWith("http")}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-[10px] tracking-[0.05em] font-outfit font-medium"
          style={{ background: `${accent}14`, color: accent }}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}

// ---- search: keep a category if it, or any descendant, matches ----
function filterTree(categories: CategoryTree[], query: string): CategoryTree[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  return categories
    .map((cat) => {
      const catMatches = cat.name.toLowerCase().includes(q);
      const subs = cat.sub_categories
        .map((sub) => {
          const subMatches = sub.name.toLowerCase().includes(q);
          const leaves = sub.sub_sub_categories.filter((leaf) =>
            leaf.name.toLowerCase().includes(q)
          );
          if (catMatches || subMatches) return sub;
          if (leaves.length > 0) return { ...sub, sub_sub_categories: leaves };
          return null;
        })
        .filter((s): s is SubCategory => s !== null);

      if (catMatches || subs.length > 0) {
        return { ...cat, sub_categories: catMatches ? cat.sub_categories : subs };
      }
      return null;
    })
    .filter((c): c is CategoryTree => c !== null);
}

function hrefFor(catId: string, subId?: string, leafId?: string) {
  if (leafId && subId) return `/categories/${catId}/${subId}/${leafId}`;
  if (subId) return `/categories/${catId}/${subId}`;
  return `/categories/${catId}`;
}

function countAll(categories: CategoryTree[]) {
  let subCount = 0;
  let leafCount = 0;
  for (const cat of categories) {
    subCount += cat.sub_categories.length;
    for (const sub of cat.sub_categories) leafCount += sub.sub_sub_categories.length;
  }
  return { catCount: categories.length, subCount, leafCount };
}

export function CategoryDirectory({ categories }: { categories: CategoryTree[] }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => filterTree(categories, query), [categories, query]);
  const { catCount, subCount, leafCount } = useMemo(() => countAll(categories), [categories]);
  const active = filtered.find((c) => c.id === activeId) ?? null;

  return (
    <main className="min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-32 md:pt-40 pb-24 px-6 lg:px-16 selection:bg-[#9c7d23]/30 selection:text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="font-outfit font-light text-[10px] tracking-[0.5em] uppercase text-[#9c7d23] mb-4 block">
            Directory &amp; Index
          </span>
          <h1
            className="font-normal text-4xl md:text-6xl text-[#1A1A1A] tracking-widest uppercase"
          >
            All{" "}
            <span
              className="text-[#9c7d23] font-normal tracking-normal uppercase"
            >
              Categories
            </span>
          </h1>
          <p className="font-outfit font-light text-[12px] tracking-[0.2em] uppercase text-[#1A1A1A]/40 mt-5">
            {catCount} categories · {subCount} sub-categories · {leafCount} sub-sub-categories
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveId(null);
              }}
              placeholder="Search categories…"
              className="w-full bg-white border border-[#1A1A1A]/10 rounded-full pl-5 pr-11 py-3 text-[13px] tracking-[0.05em] font-outfit text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#9c7d23]/60 transition-colors"
            />
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c7d23]/60 pointer-events-none"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 font-outfit text-[13px] tracking-[0.15em] uppercase text-[#1A1A1A]/40">
            No categories match "{query}"
          </div>
        ) : (
          <>
            {/* Big photo card grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {filtered.map((cat, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                const isActive = activeId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveId(isActive ? null : cat.id)}
                    className="text-left rounded-xl overflow-hidden bg-white transition-shadow"
                    style={{
                      border: isActive ? `2px solid ${accent}` : "0.5px solid rgba(26,26,26,0.1)",
                      boxShadow: isActive ? "0 8px 20px -8px rgba(26,26,26,0.18)" : "none",
                    }}
                  >
                    <PhotoBlock
                      name={cat.name}
                      imageUrl={cat.image_url}
                      bucket="category-images"
                      accent={accent}
                      height={150}
                    />
                    <div className="px-4 py-3.5">
                      <div className="text-[13px] md:text-[14px] tracking-[0.1em] uppercase font-outfit font-medium text-[#1A1A1A]">
                        {cat.name}
                      </div>
                      <div className="text-[11px] tracking-[0.08em] uppercase font-outfit font-light text-[#1A1A1A]/40 mt-1">
                        {cat.sub_categories.length} sub-categories
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected category detail panel */}
            {active && (
              <div
                className="mt-6 rounded-xl bg-white overflow-hidden"
                style={{ border: "0.5px solid rgba(26,26,26,0.1)" }}
              >
                <div
                  className="h-[3px]"
                  style={{ background: ACCENTS[filtered.findIndex((c) => c.id === active.id) % ACCENTS.length] }}
                />
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/5">
                  <span
                    className="text-xl italic text-[#1A1A1A]"
                  >
                    {active.name}
                  </span>
                  <Link
                    href={hrefFor(active.id)}
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase font-outfit font-medium text-[#9c7d23] hover:text-[#1A1A1A] transition-colors"
                  >
                    Explore all
                    <span>→</span>
                  </Link>
                </div>

                <div className="p-6 grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  {active.sub_categories.map((sub) => {
                    const accent =
                      ACCENTS[filtered.findIndex((c) => c.id === active.id) % ACCENTS.length];
                    return (
                      <div key={sub.id} className="flex items-start gap-3">
                        <SmallThumb
                          name={sub.name}
                          imageUrl={sub.image_url}
                          bucket="subcategory-images"
                          accent={accent}
                          size={44}
                        />
                        <div className="min-w-0">
                          <Link
                            href={hrefFor(active.id, sub.id)}
                            className="text-[12px] tracking-[0.08em] uppercase font-outfit font-medium text-[#1A1A1A] hover:text-[#9c7d23] transition-colors"
                          >
                            {sub.name}
                          </Link>
                          {sub.sub_sub_categories.length > 0 && (
                            <div className="flex flex-wrap gap-x-1 gap-y-1 mt-1.5">
                              {sub.sub_sub_categories.map((leaf, i) => (
                                <span key={leaf.id} className="flex items-center">
                                  <Link
                                    href={hrefFor(active.id, sub.id, leaf.id)}
                                    className="text-[11px] font-outfit font-light text-[#1A1A1A]/55 hover:text-[#9c7d23] transition-colors"
                                  >
                                    {leaf.name}
                                  </Link>
                                  {i < sub.sub_sub_categories.length - 1 && (
                                    <span className="text-[#1A1A1A]/20 mx-1.5 text-[11px]">·</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}