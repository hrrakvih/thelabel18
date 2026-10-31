// components/reels/ReelsFeed.tsx
"use client";

import Link from "@/components/HoverPrefetchLink";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X, ExternalLink } from "lucide-react";
import type { Reel } from "@/lib/supabase/reels";

// Inline Instagram glyph
function InstagramIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Props = {
  reels: Reel[];
};

function getInstagramShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p)\/([^/?#]+)/);
  return match ? match[1] : null;
}

function ReelVideo({
  reel,
  isActive,
  muted,
}: {
  reel: Reel;
  isActive: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {
        // autoplay can be blocked until user interaction
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  if (!reel.video_url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#111]">
        <p className="font-outfit text-[11px] tracking-[0.2em] uppercase text-white/40">
          Video unavailable
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={isActive ? reel.video_url : undefined}
      loop
      muted={muted}
      playsInline
      preload="none"
      className="h-full w-full object-cover"
    />
  );
}

function ReelInstagram({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  const shortcode = reel.instagram_url
    ? getInstagramShortcode(reel.instagram_url)
    : null;

  if (!shortcode) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#111]">
        <a
          href={reel.instagram_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 font-outfit text-[12px] tracking-[0.2em] uppercase text-[#d4af37]"
        >
          <InstagramIcon size={28} />
          View on Instagram
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#111]">
      {isActive ? (
        <iframe
          key={reel.id}
          src={`https://www.instagram.com/reel/${shortcode}/embed`}
          className="h-full max-h-[85vh] w-full max-w-[420px] border-0"
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
      ) : (
        <a
          href={reel.instagram_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 font-outfit text-[12px] tracking-[0.2em] uppercase text-[#d4af37]"
        >
          <InstagramIcon size={28} />
          View on Instagram
        </a>
      )}
    </div>
  );
}

export default function ReelsFeed({ reels }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: [0.6] }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels.length]);

  if (reels.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center">
        <p className="font-outfit font-light text-[13px] tracking-[0.2em] uppercase text-white/60">
          No reels yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full bg-black">
      {/* CLOSE BUTTON (Absolute for Mobile, Clean placement for Desktop) */}
      <Link
        href="/"
        aria-label="Close reels"
        className="absolute left-5 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
      >
        <X size={18} />
      </Link>

      {/* DESKTOP PROFILE SIDEBAR (Instagram Style) */}
      <aside className="hidden lg:flex w-[380px] flex-col justify-between border-r border-white/10 p-10 bg-black text-white z-20">
        <div className="space-y-8 pt-12">
          {/* Profile Header Info */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#d4af37]/60 bg-neutral-900">
              <Image
                src="/logo.jpg"
                alt="The Label 18 Logo"
                fill
                className="object-cover"
              sizes="100vw" />
            </div>
            <div>
              <h1 className="font-outfit font-medium text-lg tracking-wide text-white">
                The Label 18
              </h1>
              <p className="font-outfit text-xs tracking-[0.15em] text-[#d4af37] uppercase mt-1">
                Jewellery
              </p>
            </div>
          </div>

          {/* Bio / Description */}
          <div className="space-y-2 text-sm text-white/70 font-outfit font-light leading-relaxed">
            <p>Curated luxury accessories and timeless pieces.</p>
          </div>

          {/* Instagram Profile Links */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-outfit">
              Official Instagrams
            </p>
            
            <a
              href="https://www.instagram.com/thelabel18_accessories?igsi=MW8yOGFlYzdwd2ZoOQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#d4af37]/60 hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-center gap-3">
                <InstagramIcon size={20} />
                <span className="font-outfit text-xs tracking-wider text-white group-hover:text-[#d4af37]">
                  @thelabel18_accessories
                </span>
              </div>
              <ExternalLink size={14} className="text-white/40 group-hover:text-[#d4af37]" />
            </a>

            <a
              href="https://www.instagram.com/thelabel_18?igsi=c3E5YW8weXNrajJo&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#d4af37]/60 hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-center gap-3">
                <InstagramIcon size={20} />
                <span className="font-outfit text-xs tracking-wider text-white group-hover:text-[#d4af37]">
                  @thelabel_18
                </span>
              </div>
              <ExternalLink size={14} className="text-white/40 group-hover:text-[#d4af37]" />
            </a>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-[10px] tracking-[0.2em] text-white/30 uppercase font-outfit">
          © {new Date().getFullYear()} The Label 18. All rights reserved.
        </div>
      </aside>

      {/* REELS SCROLL FEED CONTAINER */}
      <div className="relative flex-1 h-full w-full">
        {/* Position dots for Desktop */}
        <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-1.5 lg:flex">
          {reels.map((reel, i) => (
            <span
              key={reel.id}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === activeIndex ? "bg-[#d4af37]" : "bg-white/25"
              }`}
            />
          ))}
        </div>

        <div
          ref={containerRef}
          className="h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-black [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              data-index={index}
              className="relative flex h-full w-full snap-start snap-always items-center justify-center"
            >
              {reel.type === "upload" ? (
                <ReelVideo reel={reel} isActive={index === activeIndex} muted={muted} />
              ) : (
                <ReelInstagram reel={reel} isActive={index === activeIndex} />
              )}

              {/* Legibility gradient */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Caption */}
              {reel.caption && (
                <div className="absolute inset-x-0 bottom-0 p-6 pb-10">
                  <p className="max-w-md font-outfit font-light text-[13px] leading-relaxed tracking-wide text-white">
                    {reel.caption}
                  </p>
                </div>
              )}

              {/* Mute toggle */}
              {reel.type === "upload" && (
                <button
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
