"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { toast } from "react-hot-toast";

export default function MiniWishlistButton({
  productId,
  variationId,
  // Needed so a guest's wishlist entry carries enough info to render
  // on /wishlist without a DB lookup. Ignored for logged-in users.
  productName,
  productPrice,
  productImage,
}: {
  productId: string;
  variationId?: string | null;
  productName?: string;
  productPrice?: number | null;
  productImage?: string | null;
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

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating to product page if wrapped in Link

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
      className={`transition-colors focus:outline-none ${active ? "text-[#9c7d23]" : "hover:text-[#9c7d23]"}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </button>
  );
}