import { createClient } from "@/lib/supabase/client";

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  variation_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_variations?: {
    id: string;
    size: string | null;
    color: string | null;
    price: number;
    image_url: string | null;
    image_urls: string[] | null;
    stock_quantity: number;
    products?: { id: string; name: string; sku: string; image_url: string | null };
  } | null;
};

export async function getCart(userId: string): Promise<CartItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, product_variations(*, products(id, name, sku, image_url))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addToCart(
  userId: string,
  productId: string,
  variationId: string,
  quantity = 1
) {
  const supabase = createClient();

  // If it already exists, bump the quantity instead of erroring on the unique constraint
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("variation_id", variationId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    variation_id: variationId,
    quantity,
  });
  if (error) throw error;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = createClient();
  if (quantity <= 0) return removeFromCart(cartItemId);
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);
  if (error) throw error;
}

export async function removeFromCart(cartItemId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

export async function getCartCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}