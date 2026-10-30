"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setSearchQuery("");
      setSuggestions([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          image_url,
          product_variations (price)
        `)
        .ilike("name", `%${searchQuery}%`)
        .eq("is_visible", true)
        .limit(6);

      if (data) {
        const formattedData = data.map((item: any) => {
          const prices = item.product_variations?.map((v: any) => v.price) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          return {
            ...item,
            price: minPrice
          };
        });
        setSuggestions(formattedData);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md sm:max-w-lg bg-[#0a0a0a] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in slide-in-from-top-4 duration-300 rounded-3xl">
        <form onSubmit={handleSearch} className="relative border-b border-white/5 px-6 py-5 flex items-center bg-[#141414]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 text-[#d4af37] mr-4 opacity-80">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search our collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-outfit tracking-wider placeholder:text-white/30"
          />
          <button type="button" onClick={onClose} className="p-2 text-white/40 hover:text-[#d4af37] transition-colors ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {searchQuery.trim() === "" ? (
            <div className="py-16 text-center">
              <span className="text-white/30 font-outfit font-light text-[11px] tracking-[0.3em] uppercase">
                Discover Label 18
              </span>
            </div>
          ) : isSearching ? (
            <div className="py-16 text-center animate-pulse">
              <span className="text-[#d4af37]/70 font-outfit font-light text-[10px] tracking-[0.3em] uppercase">
                Searching...
              </span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col py-2">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(`/shop/${item.id}`);
                    onClose();
                  }}
                  className="flex items-center px-6 py-4 hover:bg-white/5 transition-all text-left group border-b border-white/5 last:border-b-0"
                >
                  {item.image_url ? (
                    <div className="relative w-14 h-[74px] overflow-hidden flex-shrink-0 bg-black/50">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-[74px] bg-white/5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-white/20 text-[9px] uppercase tracking-widest">No img</span>
                    </div>
                  )}
                  <div className="ml-5 flex-1 flex flex-col justify-center">
                    <h4 className="text-white/90 font-outfit font-light text-[12px] tracking-[0.15em] uppercase line-clamp-1 group-hover:text-white transition-colors">
                      {item.name}
                    </h4>
                    {item.price !== null && (
                      <p className="text-[#d4af37] font-outfit text-[11px] mt-2 tracking-wider">
                        ₹{item.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 text-[#d4af37]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <span className="text-white/40 font-outfit font-light text-[11px] tracking-[0.2em] uppercase">
                No products found
              </span>
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="border-t border-white/5 bg-[#050505]">
            <button
              onClick={handleSearch}
              className="w-full text-white/50 hover:text-[#d4af37] py-4 font-outfit text-[10px] tracking-[0.3em] uppercase transition-colors"
            >
              View all results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}