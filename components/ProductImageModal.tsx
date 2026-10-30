"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2
} from "lucide-react";

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: { src: string; color: string | null }[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  productName: string;
  productSku?: string;
}

export default function ProductImageModal({
  isOpen,
  onClose,
  images,
  activeIndex,
  onNavigate,
  productName,
  productSku,
}: ProductImageModalProps) {
  const [scale, setScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];

  // Reset zoom & pan when image changes or modal opens/closes
  const resetZoom = useCallback(() => {
    setScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  useEffect(() => {
    resetZoom();
  }, [activeIndex, isOpen, resetZoom]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const prevIndex = (activeIndex - 1 + images.length) % images.length;
    onNavigate(prevIndex);
  }, [activeIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIndex = (activeIndex + 1) % images.length;
    onNavigate(nextIndex);
  }, [activeIndex, images.length, onNavigate]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Toggle zoom on image click
  const handleImageClick = (e: React.MouseEvent) => {
    // If user was dragging, don't trigger click toggle
    if (isDragging) return;

    if (scale === 1) {
      // Zoom into clicked area
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / rect.width - 0.5;
        const clickY = (e.clientY - rect.top) / rect.height - 0.5;
        setPanPosition({
          x: -clickX * 200,
          y: -clickY * 200,
        });
      }
      setScale(2.2);
    } else {
      resetZoom();
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        handleZoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, resetZoom]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 3.5));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse pan while zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const maxPanX = (scale - 1) * 350;
      const maxPanY = (scale - 1) * 350;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanPosition({
        x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for swipe & mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (scale > 1 && isDragging) {
        const maxPanX = (scale - 1) * 350;
        const maxPanY = (scale - 1) * 350;
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        setPanPosition({
          x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
          y: Math.min(maxPanY, Math.max(-maxPanY, newY)),
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale === 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      // If horizontal swipe is prominent and > 45px
      if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 60) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    setIsDragging(false);
    touchStartRef.current = null;
  };

  if (!isOpen || !activeImage) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Controls Bar */}
      <div className="relative z-30 w-full px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-b border-[#D4AF37]/20 bg-black/60 backdrop-blur-md">
        
        {/* Product Info & Counter */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-serif text-sm sm:text-base text-[#F5E6C8] tracking-wider uppercase font-medium line-clamp-1">
              {productName}
            </span>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-white/60 uppercase tracking-[0.2em] font-outfit">
              {productSku && <span>SKU: {productSku}</span>}
              {productSku && <span className="text-[#D4AF37]/60">•</span>}
              {activeImage.color && (
                <>
                  <span className="text-[#D4AF37]">{activeImage.color}</span>
                  <span className="text-[#D4AF37]/60">•</span>
                </>
              )}
              <span className="text-white/80 font-semibold">
                {activeIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Controls & Close Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom In/Out Toolbar */}
          <div className="hidden sm:flex items-center bg-white/5 border border-[#D4AF37]/30 rounded-full px-2 py-1 gap-1">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 rounded-full hover:bg-[#D4AF37]/20 text-[#F5E6C8] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-outfit text-white/70 px-1.5 min-w-[42px] text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-1.5 rounded-full hover:bg-[#D4AF37]/20 text-[#F5E6C8] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="p-1.5 rounded-full hover:bg-[#D4AF37]/20 text-[#D4AF37] transition-all ml-1 border-l border-[#D4AF37]/20 cursor-pointer"
                title="Reset zoom (0)"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close zoomed view"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#D4AF37] border border-[#D4AF37]/40 text-[#F5E6C8] hover:text-black transition-all active:scale-95 shadow-lg group cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area with Left & Right Navigation Arrows */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2 sm:p-6"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow LEFT (<) */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-3 sm:left-6 md:left-10 z-40 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-[#D4AF37] border border-[#D4AF37]/50 text-[#F5E6C8] hover:text-black transition-all shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 group focus:outline-none cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        {/* Center Stage Image */}
        <div 
          onClick={handleImageClick}
          className={`relative max-w-full max-h-[82vh] aspect-[3/4] flex items-center justify-center transition-transform duration-200 ease-out ${
            scale > 1 
              ? (isDragging ? "cursor-grabbing" : "cursor-grab") 
              : "cursor-zoom-in"
          }`}
          style={{
            transform: `scale(${scale}) translate(${panPosition.x / scale}px, ${panPosition.y / scale}px)`,
            transformOrigin: "center center",
          }}
        >
          <Image
            src={activeImage.src}
            alt={productName}
            width={1400}
            height={1800}
            priority
            className="object-contain max-h-[78vh] w-auto h-auto rounded-lg shadow-2xl pointer-events-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Navigation Arrow RIGHT (>) */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-3 sm:right-6 md:right-10 z-40 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-[#D4AF37] border border-[#D4AF37]/50 text-[#F5E6C8] hover:text-black transition-all shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 group focus:outline-none cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {/* Mobile/Desktop Helper Toast Cue */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 border border-[#D4AF37]/30 backdrop-blur-md text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-outfit text-white/70 shadow-lg">
            <Maximize2 className="w-3 h-3 text-[#D4AF37]" />
            <span>
              {scale === 1 ? "Click image to zoom in • Drag to pan" : "Click image to reset zoom • Drag to pan"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="relative z-30 w-full py-3 sm:py-4 px-4 border-t border-[#D4AF37]/20 bg-black/60 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-thin py-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`relative w-12 h-14 sm:w-14 sm:h-18 flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
                  activeIndex === idx
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/60 scale-105 shadow-md"
                    : "border-white/20 opacity-50 hover:opacity-100 hover:border-white/50"
                }`}
                aria-label={`Jump to image ${idx + 1}`}
              >
                <Image
                  src={img.src}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 48px, 56px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}