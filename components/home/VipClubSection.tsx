"use client";

import Link from "next/link";
import { Crown, MessageCircle } from "lucide-react";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export default function VipClubSection() {
  return (
    <section className="relative bg-[#F8F6F0] text-white py-4 sm:py-6 overflow-hidden border-t border-[#d4af37]/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/30 bg-gradient-to-br from-[#1c1810] via-black to-[#14120c] p-6 sm:p-10 lg:p-12 shadow-2xl">
          {/* Subtle gold glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/10 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column: VIP Invitation */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#e5c158] text-[11px] uppercase tracking-[0.25em] font-medium mb-3">
                <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                Private Support
              </div>

              <h2 className="font-outfit text-3xl sm:text-4xl font-light tracking-tight leading-tight text-white mb-3">
                THE <span className="text-[#d4af37] font-semibold">LABEL 18</span>
              </h2>

              <p className="text-white/70 text-xs sm:text-sm font-light leading-relaxed mb-6 max-w-lg">
Rooted in the auspicious symbolism of 18, representing manifestation, radiance, and royalty. We weave timeless Indian silk silhouettes and forge hallmarked heritage jewellery for the modern muse.
              </p>

              {/* VIP Benefits */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-white">Private Previews</h4>
                  <p className="text-[10px] text-white/50 font-light mt-0.5">Early access to exclusive drops</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <MessageCircle className="w-4 h-4 text-[#d4af37] mb-1.5" />
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-white">WhatsApp</h4>
                  <p className="text-[10px] text-white/50 font-light mt-0.5">1-on-1 virtual or in-person guidance</p>
                </div>
              </div>

              {/* Instagram Links */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-medium">Follow Us:</span>
                <a
                  href="https://www.instagram.com/thelabel_18?igsi=c3E5YW8weXNrajJo&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-white/80 hover:text-white hover:border-[#d4af37] transition-all"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>@thelabel_18</span>
                </a>
                <a
                  href="https://www.instagram.com/thelabel18_accessories?igsi=MW8yOGFlYzdwd2ZoOQ%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-white/80 hover:text-white hover:border-[#d4af37] transition-all"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>@thelabel18_accessories</span>
                </a>
              </div>
            </div>

            {/* Right Column: Direct Assistance Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-black/60 border border-[#d4af37]/30 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="font-outfit text-xl font-light text-white mb-2">
                  Personal Service
                </h3>
                <p className="text-white/60 text-xs font-light mb-6 leading-relaxed">
                  Have questions about our royal collections, custom fits, or bespoke orders? Our luxury support team is here to assist you instantly.
                </p>
              </div>

              {/* Direct WhatsApp CTA */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-white/50 block font-light">Need Immediate Assistance?</span>
                  <span className="text-sm text-white font-medium">+91 98868 23456</span>
                </div>
                <a
                  href="https://wa.me/919886823456?text=Hello%20The%20Label%2018%2C%20I%20would%20like%20to%20inquire%20about%20your%20couture%20and%20jewellery%20collections."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] text-xs font-medium tracking-wider flex items-center justify-center gap-2 hover:bg-[#25D366] hover:text-black transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Assistance</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

