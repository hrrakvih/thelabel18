"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

interface SignUpParams {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  cartCount: number;
  wishlistCount: number;

  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  refreshCounts: () => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;

  addToCart: (productId: string, variationId: string, quantity?: number) => Promise<void>;
  updateCartQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;

  isInWishlist: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string, variationId: string | null) => Promise<boolean>;

  isLoginOpen: boolean;
  loginPrompt: string | null;
  openLoginModal: (reason?: string | unknown) => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      return true;
    }
    return false;
  };

  const refreshCart = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setCartCount(0);
      return;
    }

    const { data } = await supabase
      .from("cart_items")
      .select(`
        id,
        products(
          is_visible,
          category_id,
          sub_category_id,
          sub_sub_category_id,
          category:categories(is_visible),
          sub_category:sub_categories(is_visible),
          sub_sub_category:sub_sub_categories(is_visible)
        )
      `)
      .eq("user_id", currentUser.id);

    const isVis = (cat: any, id: string | null) => {
      if (id && !cat) return false;
      if (!cat) return true;
      if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
      return cat.is_visible !== false;
    };

    const count = (data ?? []).filter((item) => {
      const p = item.products as any;
      if (!p || p.is_visible === false) return false;
      if (!isVis(p.category || p.categories, p.category_id)) return false;
      if (!isVis(p.sub_category || p.sub_categories, p.sub_category_id)) return false;
      if (!isVis(p.sub_sub_category || p.sub_sub_categories, p.sub_sub_category_id)) return false;
      return true;
    }).length;

    setCartCount(count);
  };

  const refreshWishlist = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setWishlistCount(0);
      return;
    }

    const { data } = await supabase
      .from("wishlist")
      .select(`
        id,
        products(
          is_visible,
          category_id,
          sub_category_id,
          sub_sub_category_id,
          category:categories(is_visible),
          sub_category:sub_categories(is_visible),
          sub_sub_category:sub_sub_categories(is_visible)
        )
      `)
      .eq("user_id", currentUser.id);

    const isVis = (cat: any, id: string | null) => {
      if (id && !cat) return false;
      if (!cat) return true;
      if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
      return cat.is_visible !== false;
    };

    const count = (data ?? []).filter((item) => {
      const p = item.products as any;
      if (!p || p.is_visible === false) return false;
      if (!isVis(p.category || p.categories, p.category_id)) return false;
      if (!isVis(p.sub_category || p.sub_categories, p.sub_category_id)) return false;
      if (!isVis(p.sub_sub_category || p.sub_sub_categories, p.sub_sub_category_id)) return false;
      return true;
    }).length;

    setWishlistCount(count);
  };

  const refreshCounts = async () => {
    await Promise.all([refreshCart(), refreshWishlist()]);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isCustomer = await fetchProfile(session.user.id);
        if (isCustomer) {
          setUser(session.user);
          refreshCounts();
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isCustomer = await fetchProfile(session.user.id);
        if (isCustomer) {
          setUser(session.user);
          refreshCounts();
        } else {
          setUser(null);
          setProfile(null);
          setCartCount(0);
          setWishlistCount(0);
        }
      } else {
        setUser(null);
        setProfile(null);
        setCartCount(0);
        setWishlistCount(0);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const syncGuestData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    try {
      const cartRaw = window.localStorage.getItem("guest_cart_v1");
      const wishlistRaw = window.localStorage.getItem("guest_wishlist_v1");

      const guestCart = cartRaw ? JSON.parse(cartRaw) : [];
      const guestWishlist = wishlistRaw ? JSON.parse(wishlistRaw) : [];

      if (guestCart.length === 0 && guestWishlist.length === 0) return;

      // Sync Cart
      for (const item of guestCart) {
        try {
          const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", currentUser.id)
            .eq("variation_id", item.variationId)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("cart_items")
              .update({ quantity: existing.quantity + item.quantity })
              .eq("id", existing.id);
          } else {
            await supabase.from("cart_items").insert({
              user_id: currentUser.id,
              product_id: item.productId,
              variation_id: item.variationId,
              quantity: item.quantity,
            });
          }
        } catch (e) { console.error(e); }
      }

      // Sync Wishlist
      for (const item of guestWishlist) {
        try {
          const { data: existing } = await supabase
            .from("wishlist")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("product_id", item.productId)
            .maybeSingle();

          if (!existing) {
            await supabase.from("wishlist").insert({
              user_id: currentUser.id,
              product_id: item.productId,
              variation_id: item.variationId,
            });
          }
        } catch (e) { console.error(e); }
      }

      // Clear guest data
      window.localStorage.removeItem("guest_cart_v1");
      window.localStorage.removeItem("guest_wishlist_v1");

      // Dispatch storage event so GuestCartWishlistProvider updates
      window.dispatchEvent(new Event("storage"));

      await refreshCounts();
    } catch (err) {
      console.error("Error syncing guest data", err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await syncGuestData();
      setIsLoginOpen(false);
    }
    return { error: error ? error.message : null };
  };

  const signUp = async ({ fullName, phone, email, password }: SignUpParams) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });
    if (!error) {
      await syncGuestData();
      setIsLoginOpen(false);
    }
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ---------- Cart ----------

  const addToCart = async (productId: string, variationId: string, quantity = 1) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { data: existing, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", currentUser.id)
      .eq("variation_id", variationId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: currentUser.id,
        product_id: productId,
        variation_id: variationId,
        quantity,
      });
      if (error) throw error;
    }

    await refreshCart();
  };

  const updateCartQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(cartItemId);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId);
    if (error) throw error;
    await refreshCart();
  };

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
    if (error) throw error;
    await refreshCart();
  };

  // ---------- Wishlist ----------

  const isInWishlist = async (productId: string) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return false;

    const { data } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("product_id", productId)
      .maybeSingle();

    return !!data;
  };

  const toggleWishlist = async (productId: string, variationId: string | null) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { data: existing, error: fetchError } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    let nowActive: boolean;

    if (existing) {
      const { error } = await supabase.from("wishlist").delete().eq("id", existing.id);
      if (error) throw error;
      nowActive = false;
    } else {
      const { error } = await supabase.from("wishlist").insert({
        user_id: currentUser.id,
        product_id: productId,
        variation_id: variationId,
      });
      if (error) throw error;
      nowActive = true;
    }

    await refreshWishlist();
    if (nowActive) {
      toast.success("Added to your wishlist", { icon: "🤍" });
    } else {
      toast("Removed from your wishlist", { icon: "💔" });
    }
    return nowActive;
  };

  // ---------- Shared login modal ----------

  const openLoginModal = (reason?: string | unknown) => {
    setLoginPrompt(typeof reason === "string" ? reason : null);
    setIsLoginOpen(true);
  };
  const closeLoginModal = () => {
    setIsLoginOpen(false);
    setLoginPrompt(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        cartCount,
        wishlistCount,
        signIn,
        signUp,
        signOut,
        refreshCounts,
        refreshCart,
        refreshWishlist,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        isInWishlist,
        toggleWishlist,
        isLoginOpen,
        loginPrompt,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}