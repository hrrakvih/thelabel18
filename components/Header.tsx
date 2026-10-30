"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CategoryNavItem from "@/components/CategoryNavItem";
import CategoryAccordionMobile from "@/components/CategoryAccordionMobile";
import { getCategoriesTree, CategoryTree } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import LoginModal from "@/components/LoginModal";
import SearchModal from "@/components/SearchModal";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import {
  Phone,
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  MessageCircle,
  MapPin,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    user,
    profile,
    signOut,
    cartCount: authCartCount,
    wishlistCount: authWishlistCount,
  } = useAuth();

  const guest = useGuestCartWishlist();
  const cartCount = user ? authCartCount : guest.cartCount;
  const wishlistCount = user ? authWishlistCount : guest.wishlistCount;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getCategoriesTree().then(setCategories);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll while mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const firstName =
    profile?.full_name?.trim()?.split(" ")[0] ||
    (user?.user_metadata?.full_name as string)?.trim()?.split(" ")[0] ||
    (user?.user_metadata?.name as string)?.trim()?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Account";

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 font-outfit">
      {/* 1. Top Luxury Announcement Strip — dynamic ticker */}
      <div className="bg-[#12100c] text-white/80 border-b border-[#d4af37]/20 py-1.5 text-[10px] sm:text-[11px] font-light tracking-wider overflow-hidden">
        <div className="flex items-center">
          {/* Scrolling Ticker — full width */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <AnnouncementTicker />
          </div>

          {/* Right: WhatsApp + Boutique — always visible on md+ */}
          <div className="hidden md:flex items-center gap-4 text-white/90 px-4 shrink-0 border-l border-[#d4af37]/15 ml-2">
            <a
              href="https://wa.me/919886823456?text=Hello%20The%20Label%2018%2C%20I%20would%20like%20to%20inquire%20about%20your%20couture%20and%20jewellery%20collections."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-white transition-colors font-medium whitespace-nowrap"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp: +91 98868 23456</span>
            </a>
            <span className="text-white/30">•</span>
            <span className="text-white/60 whitespace-nowrap">Jayanagar, Bengaluru</span>
          </div>
        </div>
      </div>

      {/* 2. Main Luxury Header Bar */}
      <div
        className={`w-full bg-black/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all duration-300 ${
          scrolled ? "py-2.5 sm:py-3" : "py-3 sm:py-4"
        }`}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          
          {/* Left: Brand Identity & Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-[#d4af37]/40 bg-black p-0.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.jpg"
                  alt="The Label 18"
                  fill
                  priority
                  sizes="(max-width: 640px) 36px, 44px"
                  className="object-contain p-0.5"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-outfit text-base sm:text-xl font-light tracking-[0.22em] uppercase text-white leading-tight">
                  THE LABEL <span className="font-semibold text-[#d4af37]">18</span>
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.28em] text-[#d4af37]/90 font-medium">
                  Jewellery & Clothing
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-11">
            <Link
              href="/"
              className="group relative text-white/90 hover:text-[#d4af37] transition-colors duration-300 font-outfit font-medium text-[11px] tracking-[0.22em] uppercase py-2 whitespace-nowrap"
            >
              Home
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-300 ease-out group-hover:w-full opacity-80" />
            </Link>

            {/* Dynamic Categories Dropdown */}
            {categories.slice(0, 4).map((category) => (
              <CategoryNavItem key={category.id} category={category} />
            ))}

            <Link
              href="/shop"
              className="group relative text-white/90 hover:text-[#d4af37] transition-colors duration-300 font-outfit font-medium text-[11px] tracking-[0.22em] uppercase py-2 whitespace-nowrap"
            >
              Shop
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-300 ease-out group-hover:w-full opacity-80" />
            </Link>

            <Link
              href="/video"
              className="group relative text-white/90 hover:text-[#d4af37] transition-colors duration-300 font-outfit font-medium text-[11px] tracking-[0.22em] uppercase py-2 whitespace-nowrap"
            >
              Reels
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-300 ease-out group-hover:w-full opacity-80" />
            </Link>

            <Link
              href="/about"
              className="group relative text-white/90 hover:text-[#d4af37] transition-colors duration-300 font-outfit font-medium text-[11px] tracking-[0.22em] uppercase py-2 whitespace-nowrap"
            >
              About
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4af37] transition-all duration-300 ease-out group-hover:w-full opacity-80" />
            </Link>
          </nav>

          {/* Right: Actions (Search, Wishlist, Cart, Account, Mobile Hamburger) */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 text-white">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search Catalog"
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-[#d4af37] transition-all duration-300"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist Button (Accessible on Mobile & Desktop) */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-[#d4af37] transition-all duration-300"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#d4af37] text-black text-[9px] font-bold shadow-md">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button (Accessible on Mobile & Desktop) */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-[#d4af37] transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.876-4.145 2.147-4.72.174-.373-.041-.813-.417-.813H5.106M7.5 14.25 5.106 5.272M6 21a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#d4af37] text-black text-[9px] font-bold shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop User Account / Sign In */}
            {user ? (
              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
                >
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-[10px] tracking-[0.15em] uppercase font-medium max-w-[80px] truncate">
                    {firstName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>

                <div
                  className={`absolute right-0 top-[calc(100%+0.5rem)] w-48 bg-black/95 backdrop-blur-2xl border border-[#d4af37]/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-200 origin-top-right ${
                    isUserMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <Link
                    href="/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-5 py-3 text-white/80 hover:text-[#d4af37] hover:bg-white/5 transition-colors text-[11px] tracking-[0.18em] uppercase"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-5 py-3 text-white/80 hover:text-red-400 hover:bg-white/5 transition-colors text-[11px] tracking-[0.18em] uppercase border-t border-white/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37] text-white hover:text-black transition-all text-[11px] tracking-[0.15em] uppercase font-medium"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="lg:hidden p-1.5 text-white hover:text-[#d4af37] transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. Mobile Navigation Drawer (Off-Canvas) */}
      <div
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`lg:hidden fixed top-0 right-0 z-[120] h-[100dvh] w-[86%] max-w-[360px] bg-[#0c0c0c] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-500 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141414]">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center gap-2">
            <div className="relative w-8 h-8 rounded border border-[#d4af37]/40 bg-black overflow-hidden">
              <Image src="/logo.jpg" alt="The Label 18" fill sizes="32px" className="object-contain p-0.5" />
            </div>
            <span className="font-outfit text-sm tracking-[0.2em] uppercase font-light text-white">
              THE LABEL <span className="font-semibold text-[#d4af37]">18</span>
            </span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="p-1.5 text-white/60 hover:text-[#d4af37] transition-colors rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col space-y-4">
          {/* Quick Search */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsSearchOpen(true);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 flex items-center text-white/60 text-[11px] tracking-wider hover:border-[#d4af37] transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-2.5 text-[#d4af37]" />
            <span>Search silk sarees, jewellery...</span>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col text-xs uppercase tracking-[0.18em]">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light"
            >
              Home
            </Link>

            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light"
            >
              Shop All
            </Link>

            {/* Categories Accordion */}
            <div className="border-b border-white/5 py-1">
              <CategoryAccordionMobile
                categories={categories}
                onNavigate={() => setIsMenuOpen(false)}
              />
            </div>

            <Link
              href="/video"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light"
            >
              Reels & Videos
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light"
            >
              About Us
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light flex items-center justify-between"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-bold text-[10px]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/5 text-white/90 hover:text-[#d4af37] transition-colors font-light flex items-center justify-between"
            >
              <span>Shopping Bag</span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-bold text-[10px]">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* WhatsApp Direct Assistance */}
          <div className="pt-2">
            <a
              href="https://wa.me/919886823456?text=Hello%20The%20Label%2018%2C%20I%20would%20like%20to%20inquire%20about%20your%20couture%20and%20jewellery%20collections."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] text-xs font-medium tracking-wide shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex-1" />

          {/* Account / User Section */}
          <div className="pt-4 border-t border-white/10">
            {user ? (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Signed in as {firstName}
                </span>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs uppercase tracking-[0.18em] text-[#d4af37] font-medium py-1"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="text-left text-xs uppercase tracking-[0.18em] text-white/50 hover:text-red-400 py-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] text-black font-bold text-xs uppercase tracking-[0.18em] rounded-full py-3 shadow-md"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}