"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type GalleryImage = {
  src: string;
  color: string | null; // which color this image belongs to, if any
};

export default function ProductGallery({
  images,
  selectedColor,
  productName,
}: {
  images: GalleryImage[];
  selectedColor: string | null;
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // When the selected color changes, jump the gallery to that color's photo
  useEffect(() => {
    if (!selectedColor) return;
    const matchIndex = images.findIndex((img) => img.color === selectedColor);
    if (matchIndex !== -1) setActiveIndex(matchIndex);
  }, [selectedColor, images]);

  // Clamp if the image list itself changes (e.g. fewer variations than before)
  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0);
  }, [images, activeIndex]);

  const active = images[activeIndex];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  function openLightbox() {
    setZoomLevel(1);
    setLightboxOpen(true);
  }

  function handleWheelZoom(e: React.WheelEvent) {
    e.preventDefault();
    setZoomLevel((z) => Math.min(3, Math.max(1, z - e.deltaY * 0.001)));
  }

  if (!active) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-[11px] uppercase tracking-widest">
        No Image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image with hover-zoom lens */}
      <div
        ref={frameRef}
        onMouseEnter={() => setShowLens(true)}
        onMouseLeave={() => setShowLens(false)}
        onMouseMove={handleMouseMove}
        onClick={openLightbox}
        className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-zoom-in group"
      >
        <Image src={active.src} alt={productName} fill priority loading="eager" className="object-cover" sizes="100vw" />

        {/* Magnifier lens (desktop hover only) */}
        {showLens && (
          <div
            aria-hidden
            className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat"
            style={{
              backgroundImage: `url(${active.src})`,
              backgroundSize: "220%",
              backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
            }}
          />
        )}

        <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white/70 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Click to zoom
        </span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={img.src + i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
              className={`relative aspect-square rounded-xl overflow-hidden bg-white/5 border transition-colors duration-200 ${
                i === activeIndex
                  ? "border-[#d4af37]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image src={img.src} alt={`${productName} ${i + 1}`} fill className="object-cover" sizes="100vw" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen zoom lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom view"
            className="absolute top-6 right-6 text-white/60 hover:text-[#d4af37] transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/50 text-[10px] tracking-[0.2em] uppercase font-outfit font-light">
            <span>Scroll to zoom</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{Math.round(zoomLevel * 100)}%</span>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheelZoom}
            className="relative w-[90vw] h-[85vh] overflow-hidden"
          >
            <div
              className="relative w-full h-full transition-transform duration-150 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <Image src={active.src} alt={productName} fill className="object-contain" sizes="100vw" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
