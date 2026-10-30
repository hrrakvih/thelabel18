"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AnnouncementTicker() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(data.map((d: any) => d.text));
        }
      });
  }, []);

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const repeated = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden w-full">
      <div
        className="flex gap-0 whitespace-nowrap"
        style={{
          animation: `ticker ${items.length * 12}s linear infinite`,
        }}
      >
        {repeated.map((text, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-8">
            <span className="text-[#d4af37]">✦</span>
            <span>{text}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
