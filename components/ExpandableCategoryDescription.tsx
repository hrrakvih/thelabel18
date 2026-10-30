"use client";

import { useState } from "react";

export default function ExpandableCategoryDescription({
  description,
  variant = "light",
  className = "",
}: {
  description: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = description.length > 130;

  const textColor = variant === "dark" ? "text-white/80" : "text-[#1A1A1A]/70";
  const btnColor =
    variant === "dark"
      ? "text-[#d4af37] hover:text-white"
      : "text-[#9c7d23] hover:text-[#1A1A1A]";

  return (
    <div className={`flex flex-col items-center max-w-xl mx-auto ${className}`}>
      <p
        className={`font-outfit font-light text-xs md:text-sm ${textColor} text-center leading-relaxed transition-all ${
          !isExpanded && isLong ? "line-clamp-2" : ""
        }`}
      >
        {description}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-1.5 text-[10px] md:text-[11px] font-outfit font-medium ${btnColor} tracking-wider uppercase underline underline-offset-4 transition-colors cursor-pointer`}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
