import Link from "next/link";
import Image from "next/image";
import { getCategoriesTree } from "@/lib/categories";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Gem,
  Truck,
  ArrowUpRight,
  MessageCircle,
  Award,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}


export default async function Footer() {
  const categories = await getCategoriesTree();
  const featuredCategories = categories.slice(0, 4);

  const menuLinks = [
    ["Home", "/"],
    ["Shop", "/shop"],
    ["About Us", "/about"],
    ["All Categories", "/navigation"],
  ];

  return (
    <footer className="relative z-10 bg-gradient-to-b from-[#14120e] via-[#0d0c0a] to-[#080806] text-white font-outfit border-t border-[#d4af37]/30 overflow-hidden">
      {/* Background Decorative Gold Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#d4af37]/5 blur-[120px] pointer-events-none rounded-full" />



      {/* 2. Main Luxury Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-14 pb-8 sm:pb-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/10">

          {/* Col 1 (Span 4): Brand Essence */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#d4af37]/40 p-0.5 bg-black">
                  <Image
                    src="/logo.jpg"
                    alt="The Label 18 Logo"
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="font-outfit text-lg tracking-[0.25em] uppercase font-light text-white block">
                    THE LABEL <span className="font-bold text-[#d4af37]">18</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37]/80 block font-medium">
                    Jewellery & Clothing
                  </span>
                </div>
              </Link>

              <p className="text-white/70 text-xs leading-relaxed font-light mb-5 max-w-sm">
                Rooted in the auspicious symbolism of 18, representing manifestation, radiance, and royalty.
                We weave timeless Indian silk silhouettes and forge hallmarked heritage jewellery for the modern muse.
              </p>
            </div>

            {/* Social Channels */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold block">
                Official Boutiques on Instagram
              </span>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="https://www.instagram.com/thelabel_18?igsi=c3E5YW8weXNrajJo&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37] hover:bg-[#d4af37]/10 text-xs text-white/80 hover:text-white transition-all duration-300"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-[11px]">@thelabel_18 (Clothing)</span>
                </a>
                <a
                  href="https://www.instagram.com/thelabel18_accessories?igsi=MW8yOGFlYzdwd2ZoOQ%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37] hover:bg-[#d4af37]/10 text-xs text-white/80 hover:text-white transition-all duration-300"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-[11px]">@thelabel18_accessories</span>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2 (Span 3): Menu */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-outfit text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37] flex items-center gap-2">
              <span>Menu</span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/30 to-transparent" />
            </h3>
            <ul className="space-y-3">
              {menuLinks.map(([title, url]) => (
                <li key={title}>
                  <Link
                    href={url}
                    className="group relative inline-block font-outfit font-light text-white/80 hover:text-[#d4af37] transition-colors duration-300 text-[12.5px] tracking-[0.1em] uppercase"
                  >
                    {title}
                    <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-[#d4af37] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 (Span 2): Curations / Categories */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-outfit text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37] flex items-center gap-2">
              <span>Curations</span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/30 to-transparent" />
            </h3>
            {featuredCategories.length === 0 ? (
              <p className="text-white/40 text-[12px] font-light">Categories coming soon.</p>
            ) : (
              <ul className="space-y-4">
                {featuredCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categories/${cat.id}`}
                      className="block font-outfit font-light text-white/90 hover:text-[#d4af37] transition-colors duration-300 text-[12.5px] tracking-[0.1em] uppercase mb-2"
                    >
                      {cat.name}
                    </Link>
                    {cat.sub_categories && cat.sub_categories.length > 0 && (
                      <ul className="space-y-1.5 border-l border-[#d4af37]/40 pl-3">
                        {cat.sub_categories.slice(0, 3).map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/categories/${cat.id}/${sub.id}`}
                              className="block font-outfit font-light text-white/60 hover:text-[#d4af37] transition-colors duration-300 text-[11px] tracking-[0.08em] uppercase"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/navigation"
              className="inline-block mt-4 text-[10.5px] tracking-[0.2em] uppercase font-outfit font-light text-[#d4af37] hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>

          {/* Col 4 (Span 3): Flagship Boutique & Atelier */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-outfit text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37] flex items-center gap-2">
              <span>Flagship Boutique</span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/30 to-transparent" />
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <p className="text-white/70 leading-relaxed font-light">
                  #15 Elements Building, 4th Floor,<br />
                  32nd Cross, Jayanagar 7th Block,<br />
                  Bengaluru, Karnataka 560070
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="tel:+919886823456" className="text-white/80 hover:text-[#d4af37] transition-colors">
                  +91 98868 23456
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="mailto:contact@thelabel18.com" className="text-white/80 hover:text-[#d4af37] transition-colors">
                  contact@thelabel18.com
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="text-white/60 font-light">
                  Mon – Sat: 10:30 AM – 8:00 PM
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Legal & Credits Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50 font-light">
          <div>
            &copy; {new Date().getFullYear()} <span className="text-white font-medium">The Label 18</span>. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#d4af37] transition-colors">
              Privacy Policy
            </Link>
            <span className="w-1 h-1 rounded-full bg-[#d4af37]/60" />
            <Link href="/terms" className="hover:text-[#d4af37] transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="flex items-center gap-2 text-white/40">
            <span>Developed by</span>
            <a
              href="https://rakvih.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:text-white transition-colors font-medium"
            >
              Rakvih Solutions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}