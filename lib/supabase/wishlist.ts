import { createClient } from "@/lib/supabase/client";

export type WishlistItem = {
  id: string;
  user_id: string;
  product_id: string;
  variation_id: string | null;
  created_at: string;
};

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, products(id, name, sku, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleWishlist(
  userId: string,
  productId: string,
  variationId: string | null
): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
    if (error) throw error;
    return false; // now removed
  }

  const { error } = await supabase.from("wishlist_items").insert({
    user_id: userId,
    product_id: productId,
    variation_id: variationId,
  });
  if (error) throw error;
  return true; // now added
}

export async function getWishlistCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}