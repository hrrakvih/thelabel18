"use client";

/**
 * components/WishlistButton.tsx
 *
 * INFERRED from how ProductVariantSelector calls this component — you
 * didn't paste the real file, so please compare this against yours and
 * let me know if the props/markup differ. The guest-fallback pattern
 * below (branch on `user`, use GuestCartWishlistContext when signed out)
 * is what matters; swap it into your real file if the styling differs.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { toast } from "react-hot-toast";

export default function WishlistButton({
  productId,
  variationId,
  productName,
  productPrice,
  productImage,
  onRequireLogin,
  className,
}: {
  productId: string;
  variationId?: string | null;
  productName?: string;
  productPrice?: number | null;
  productImage?: string | null;
  onRequireLogin?: (reason?: string) => void;
  className?: string;
}) {
  const { user, toggleWishlist, isInWishlist, refreshWishlist } = useAuth();
  const guest = useGuestCartWishlist();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      isInWishlist(productId).then(setActive).catch(() => {});
    } else {
      setActive(guest.isInWishlist(productId, variationId ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId, variationId, guest.wishlist]);

  async function handleClick() {
    if (user) {
      setLoading(true);
      try {
        const nowActive = await toggleWishlist(productId, variationId ?? null);
        setActive(nowActive);
        await refreshWishlist();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guest: save locally — no login required.
    const nowActive = guest.toggleWishlist({
      productId,
      variationId: variationId ?? null,
      name: productName ?? "Product",
      price: productPrice ?? 0,
      image: productImage ?? null,
    });
    setActive(nowActive);
    toast(nowActive ? "Saved to wishlist" : "Removed from wishlist");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      title={active ? "Saved in wishlist" : "Add to wishlist"}
      className={
        className ??
        `flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-300 ${
          active
            ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            : "border-[#D4AF37]/35 text-[#1A1A1A]/70 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 bg-white shadow-sm"
        } ${loading ? "opacity-70 cursor-wait" : "active:scale-95"}`
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        fill={active ? "currentColor" : "none"}
        className="w-5 h-5 transition-transform group-hover:scale-110"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}