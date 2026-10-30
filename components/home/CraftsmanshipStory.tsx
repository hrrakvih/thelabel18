import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function CraftsmanshipStory() {
  return (
    <section className="relative bg-[#111111] text-white py-3 sm:py-5 border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-medium mb-1.5">
            
            Behind The Label 18
          </div>
          <h2 className="font-outfit text-2xl sm:text-3xl font-light tracking-tight text-white mb-1.5">
            THE ART OF <span className="text-[#9c7d23] font-semibold">ROYAL CRAFTSMANSHIP</span>
          </h2>
          <div className="w-8 h-[1px] bg-white/30 mx-auto my-1.5" />
          <p className="text-white/70 text-[11px] sm:text-xs font-light">
            Every stitch, weave, and gemstone setting carries centuries of Indian heritage, tailored for the modern muse.
          </p>
        </div>

        {/* Dual Split Editorial */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
          {/* Card 1: Jewellery & Clothing */}
          <div className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-md border border-white/10 hover:border-[#9c7d23]/50 transition-all duration-500 flex flex-col">
            <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] w-full overflow-hidden bg-neutral-900">
              <Image
                src="/aboutusphoto.jpg"
                alt="Jewellery & Clothing by The Label 18"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#F8F6F0] text-[9px] uppercase tracking-[0.15em] font-medium">
                  Couture Spotlight
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6 relative z-10 bg-[#1A1A1A]">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9c7d23] font-semibold block mb-1">
                Handwoven Silks & Regal Embroidery
              </span>
              <h3 className="font-outfit text-base sm:text-lg lg:text-xl font-light text-white mb-2">
                Signature Sarees & Royal Lehengas
              </h3>
              <p className="text-white/70 text-[11px] sm:text-xs font-light leading-relaxed mb-3">
                Crafted from the finest natural silks, our ethnic collections feature genuine metallic zari, 
                delicate resham work, and hand-embroidered motifs that flow with regal grace.
              </p>

              <ul className="space-y-1.5 mb-4 text-[10px] sm:text-xs text-white/80 font-light">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Premium-quality fabrics – Soft, comfortable and carefully selected.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Elegant designs – Thoughtfully designed for a timeless, stylish look.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Fine detailing – Beautiful craftsmanship with attention to every detail.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Comfort-first fit – Designed to feel as good as it looks.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Skin-friendly & breathable – Gentle fabrics for all-day comfort.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Perfect finishing – Neat stitching and premium finishing throughout.</span>
                </li>
              </ul>

              <Link
                href="/shop?category=clothing"
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#9c7d23] hover:text-white transition-colors"
              >
                <span>Explore Silks & Couture</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 2: Fine Jewellery */}
          <div className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-md border border-white/10 hover:border-[#9c7d23]/50 transition-all duration-500 flex flex-col">
            <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] w-full overflow-hidden bg-neutral-900">
              <Image
                src="/aboutus.jpg"
                alt="Fine Temple Jewellery by The Label 18"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#F8F6F0] text-[9px] uppercase tracking-[0.15em] font-medium">
                  Heritage Jewellery
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6 relative z-10 bg-[#1A1A1A]">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9c7d23] font-semibold block mb-1">
                Temple Gold & Polki Diamonds
              </span>
              <h3 className="font-outfit text-base sm:text-lg lg:text-xl font-light text-white mb-2">
                Chokers & Coin Necklaces
              </h3>
              <p className="text-white/70 text-[11px] sm:text-xs font-light leading-relaxed mb-3">
                Inspired by ancient temple motifs and royal dynasties, our jewellery brings sacred coin 
                emblems (Kasumala), intricate kundan settings, and lustrous pearls into eternal harmony.
              </p>

              <ul className="space-y-1.5 mb-4 text-[10px] sm:text-xs text-white/80 font-light">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Elegant gold-tone imitation jewellery with a rich, traditional look.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Intricate detailing adds charm to every piece.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Beautifully complements sarees, lehengas and ethnic outfits.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9c7d23] shrink-0" />
                  <span>Enjoy the timeless appeal of gold at an affordable price.</span>
                </li>
              </ul>

              <Link
                href="/shop?category=jewellery"
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#9c7d23] hover:text-white transition-colors"
              >
                <span>Explore Fine Jewellery</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
