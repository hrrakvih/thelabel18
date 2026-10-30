"use client";

/**
 * contexts/GuestCartWishlistContext.tsx
 *
 * Cart & wishlist storage for NOT-logged-in visitors, entirely in
 * localStorage. Logged-in users keep using your existing Supabase-backed
 * flow in AuthContext (addToCart, toggleWishlist, isInWishlist, etc).
 *
 * Every component decides which one to call based on `user` from
 * useAuth() — see the updated MiniWishlistButton, ProductVariantSelector,
 * WishlistButton, and Header for the pattern.
 *
 * SETUP: wrap your app with this provider in app/layout.tsx, alongside
 * your existing AuthProvider (order doesn't matter):
 *
 *   <AuthProvider>
 *     <GuestCartWishlistProvider>
 *       {children}
 *     </GuestCartWishlistProvider>
 *   </AuthProvider>
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface GuestItemBase {
  productId: string;
  variationId: string | null;
  name: string;
  price: number;
  image?: string | null;
  color?: string | null;
  size?: string | null;
  slug?: string | null;
}

export interface GuestCartItem extends GuestItemBase {
  quantity: number;
}

export type GuestWishlistItem = GuestItemBase;

interface GuestCartWishlistContextType {
  cart: GuestCartItem[];
  wishlist: GuestWishlistItem[];
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
  hydrated: boolean;
  addToCart: (item: GuestItemBase, quantity?: number) => void;
  removeFromCart: (productId: string, variationId: string | null) => void;
  updateQuantity: (productId: string, variationId: string | null, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (item: GuestItemBase) => boolean; // returns new active state
  removeFromWishlist: (productId: string, variationId: string | null) => void;
  isInWishlist: (productId: string, variationId: string | null) => boolean;
  moveWishlistItemToCart: (productId: string, variationId: string | null) => void;
}

const CART_KEY = "guest_cart_v1";
const WISHLIST_KEY = "guest_wishlist_v1";

const GuestCartWishlistContext = createContext<GuestCartWishlistContextType | undefined>(undefined);

function itemKey(productId: string, variationId: string | null) {
  return `${productId}::${variationId ?? "_"}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private browsing) — fail silently.
  }
}

export function GuestCartWishlistProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<GuestCartItem[]>([]);
  const [wishlist, setWishlist] = useState<GuestWishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readStorage<GuestCartItem[]>(CART_KEY, []));
    setWishlist(readStorage<GuestWishlistItem[]>(WISHLIST_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CART_KEY, cart);
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(readStorage<GuestCartItem[]>(CART_KEY, []));
      if (e.key === WISHLIST_KEY) setWishlist(readStorage<GuestWishlistItem[]>(WISHLIST_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart: GuestCartWishlistContextType["addToCart"] = (item, quantity = 1) => {
    setCart((prev) => {
      const key = itemKey(item.productId, item.variationId);
      const existing = prev.find((i) => itemKey(i.productId, i.variationId) === key);
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.variationId) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart: GuestCartWishlistContextType["removeFromCart"] = (productId, variationId) => {
    const key = itemKey(productId, variationId);
    setCart((prev) => prev.filter((i) => itemKey(i.productId, i.variationId) !== key));
  };

  const updateQuantity: GuestCartWishlistContextType["updateQuantity"] = (productId, variationId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    const key = itemKey(productId, variationId);
    setCart((prev) =>
      prev.map((i) => (itemKey(i.productId, i.variationId) === key ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const isInWishlist: GuestCartWishlistContextType["isInWishlist"] = (productId, variationId) => {
    const key = itemKey(productId, variationId);
    return wishlist.some((i) => itemKey(i.productId, i.variationId) === key);
  };

  const toggleWishlist: GuestCartWishlistContextType["toggleWishlist"] = (item) => {
    const key = itemKey(item.productId, item.variationId);
    const currentlyIn = wishlist.some((i) => itemKey(i.productId, i.variationId) === key);
    setWishlist((prev) =>
      currentlyIn
        ? prev.filter((i) => itemKey(i.productId, i.variationId) !== key)
        : [...prev, item]
    );
    return !currentlyIn;
  };

  const removeFromWishlist: GuestCartWishlistContextType["removeFromWishlist"] = (productId, variationId) => {
    const key = itemKey(productId, variationId);
    setWishlist((prev) => prev.filter((i) => itemKey(i.productId, i.variationId) !== key));
  };

  const moveWishlistItemToCart: GuestCartWishlistContextType["moveWishlistItemToCart"] = (productId, variationId) => {
    const key = itemKey(productId, variationId);
    const found = wishlist.find((i) => itemKey(i.productId, i.variationId) === key);
    if (found) {
      addToCart(found, 1);
      removeFromWishlist(productId, variationId);
    }
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = wishlist.length;
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <GuestCartWishlistContext.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        wishlistCount,
        cartTotal,
        hydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        moveWishlistItemToCart,
      }}
    >
      {children}
    </GuestCartWishlistContext.Provider>
  );
}

export function useGuestCartWishlist() {
  const ctx = useContext(GuestCartWishlistContext);
  if (!ctx) {
    throw new Error("useGuestCartWishlist must be used within a <GuestCartWishlistProvider>");
  }
  return ctx;
}