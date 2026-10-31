import { createPublicClient } from "@/lib/supabase/public";

export type ProductVariation = {
  id: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  image_url: string | null;
  image_urls?: string[];
  stock_quantity: number;
  price: number;
  compare_at_price: number | null;
  is_visible: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  sub_category_id: string | null;
  sub_sub_category_id: string | null;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  product_variations: ProductVariation[];
};

export type ProductWithPrice = Product & {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
};

// Only what ProductCard and the filters read, since all of it is sent to the browser.
const CARD_FIELDS = `
  id, sku, name, category_id, sub_category_id, sub_sub_category_id, image_url, is_visible,
  product_variations(id, size, color, color_hex, image_url, image_urls, stock_quantity, price, compare_at_price, is_visible),
  category:categories(is_visible),
  sub_category:sub_categories(is_visible),
  sub_sub_category:sub_sub_categories(is_visible)
`;

// ProductCard only shows the first photo of each variation.
const toCardVariation = (v: any) => ({ ...v, image_urls: v.image_urls?.slice(0, 1) });

export async function getProducts(filters: {
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
}): Promise<ProductWithPrice[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("products")
    .select(CARD_FIELDS)
    .eq("is_visible", true);

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.subCategoryId) query = query.eq("sub_category_id", filters.subCategoryId);
  if (filters.subSubCategoryId) query = query.eq("sub_sub_category_id", filters.subSubCategoryId);

  const { data, error } = await query;
  if (error) throw error;

  const isVis = (cat: any, id: string | null) => {
    if (id && !cat) return false; // RLS stripped it, so it's invisible
    if (!cat) return true;
    if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
    return cat.is_visible !== false;
  };

  // Filter out products whose parent categories are invisible
  const validData = (data as any[]).filter((p) => {
    if (!isVis(p.category || p.categories, p.category_id)) return false;
    if (!isVis(p.sub_category || p.sub_categories, p.sub_category_id)) return false;
    if (!isVis(p.sub_sub_category || p.sub_sub_categories, p.sub_sub_category_id)) return false;
    return true;
  });

  return validData.map((p) => {
    const visibleVariations = (p.product_variations || []).filter((v: any) => v.is_visible);
    const prices = visibleVariations.map((v: any) => Number(v.price));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const inStock = visibleVariations.some((v: any) => v.stock_quantity > 0);
    return { ...p, product_variations: (p.product_variations || []).map(toCardVariation), minPrice, maxPrice, inStock };
  });
}

export async function getProductById(id: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *, 
      product_variations(*),
      category:categories(is_visible),
      sub_category:sub_categories(is_visible),
      sub_sub_category:sub_sub_categories(is_visible)
    `)
    .eq("id", id)
    .eq("is_visible", true)
    .single();

  // No such row, or an id that isn't a UUID, is a real 404. Throw on anything else
  // so a failed fetch keeps the last good cached page instead of caching a 404.
  if (error && error.code !== "PGRST116" && error.code !== "22P02") throw error;
  if (error || !data) return null;

  const isVis = (cat: any, id: string | null) => {
    if (id && !cat) return false; // RLS stripped it
    if (!cat) return true;
    if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
    return cat.is_visible !== false;
  };

  const raw = data as any;
  if (!isVis(raw.category || raw.categories, raw.category_id)) return null;
  if (!isVis(raw.sub_category || raw.sub_categories, raw.sub_category_id)) return null;
  if (!isVis(raw.sub_sub_category || raw.sub_sub_categories, raw.sub_sub_category_id)) return null;

  const product = raw as Product;
  // Supabase can return null here instead of [] when a product has no
  // matching rows in product_variations — normalize it before use.
  product.product_variations = (product.product_variations ?? []).filter(
    (v) => v.is_visible
  );

  return product;
}
export async function getRelatedProducts(product: Product, limit = 15) {
  const supabase = createPublicClient();

  const isVis = (cat: any, id: string | null) => {
    if (id && !cat) return false;
    if (!cat) return true;
    if (Array.isArray(cat)) return cat.length > 0 ? cat[0].is_visible !== false : true;
    return cat.is_visible !== false;
  };

  const toProductWithPrice = (p: any) => {
    const visible = (p.product_variations || []).filter((v: any) => v.is_visible);
    const prices = visible.map((v: any) => Number(v.price));
    return {
      ...p,
      product_variations: (p.product_variations || []).map(toCardVariation),
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      inStock: visible.some((v: any) => v.stock_quantity > 0),
    };
  };

  const filterVisible = (rows: any[]) =>
    rows.filter((p) => {
      if (!isVis(p.category || p.categories, p.category_id)) return false;
      if (!isVis(p.sub_category || p.sub_categories, p.sub_category_id)) return false;
      if (!isVis(p.sub_sub_category || p.sub_sub_categories, p.sub_sub_category_id)) return false;
      return true;
    });

  const selectFields = CARD_FIELDS;

  // ── Step 1: fetch from same subcategory (if product has one) ──
  let primaryResults: any[] = [];
  if (product.sub_category_id) {
    const { data } = await supabase
      .from("products")
      .select(selectFields)
      .eq("is_visible", true)
      .neq("id", product.id)
      .eq("sub_category_id", product.sub_category_id)
      .limit(limit * 3);

    primaryResults = filterVisible(data ?? []).slice(0, limit);
  }

  // ── Step 2: if still under limit, top up from other subcategories in same category ──
  const needed = limit - primaryResults.length;
  let fallbackResults: any[] = [];

  if (needed > 0) {
    const excludeIds = [product.id, ...primaryResults.map((p) => p.id)];

    let fallbackQuery = supabase
      .from("products")
      .select(selectFields)
      .eq("is_visible", true)
      .eq("category_id", product.category_id)
      .limit((needed + excludeIds.length) * 3);

    // Exclude already-fetched IDs
    for (const id of excludeIds) {
      fallbackQuery = fallbackQuery.neq("id", id);
    }

    const { data: fallbackData } = await fallbackQuery;
    fallbackResults = filterVisible(fallbackData ?? []).slice(0, needed);
  }

  return [...primaryResults, ...fallbackResults].map(toProductWithPrice);
}