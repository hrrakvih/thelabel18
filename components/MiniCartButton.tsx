"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCartWishlist } from "@/contexts/GuestCartWishlistContext";
import { toast } from "react-hot-toast";

export default function MiniCartButton({
  productId,
  variationId,
  // Needed so a guest's cart entry carries enough info to render
  // on /cart without a DB lookup. Ignored for logged-in users.
  productName,
  productPrice,
  productImage,
  color,
  size,
  inStock = true,
}: {
  productId: string;
  variationId?: string | null;
  productName?: string;
  productPrice?: number | null;
  productImage?: string | null;
  color?: string | null;
  size?: string | null;
  inStock?: boolean;
}) {
  const { user, addToCart, refreshCart } = useAuth();
  const guest = useGuestCartWishlist();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating to product page if wrapped in Link
    e.stopPropagation();

    if (!variationId || !inStock || loading) return;

    if (user) {
      setLoading(true);
      try {
        await addToCart(productId, variationId, 1);
        await refreshCart();
        setAdded(true);
        toast.success("Added to cart");
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        console.error("Add to cart failed:", err);
        toast.error("Couldn't add to cart. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guest: save locally — no login required.
    guest.addToCart(
      {
        productId,
        variationId,
        name: productName ?? "Product",
        price: productPrice ?? 0,
        image: productImage ?? null,
        color: color ?? null,
        size: size ?? null,
      },
      1
    );
    setAdded(true);
    toast.success("Added to cart");
    setTimeout(() => setAdded(false), 2000);
  }

  const disabled = !variationId || !inStock || loading;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={!inStock ? "Out of stock" : "Add to cart"}
      className={`transition-colors focus:outline-none ${
        disabled
          ? "text-[#1A1A1A]/20 cursor-not-allowed"
          : added
          ? "text-[#9c7d23]"
          : "hover:text-[#9c7d23]"
      }`}
    >
      {added ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.876-4.145 2.147-4.72.174-.373-.041-.813-.417-.813H5.106M7.5 14.25 5.106 5.272M6 21a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      )}
    </button>
  );
}