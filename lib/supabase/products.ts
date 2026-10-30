import { createClient } from "@/lib/supabase/server";

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

export type ProductFilters = {
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  page?: number;
  pageSize?: number;
};

export type ProductWithPrice = Product & {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
};

export async function getProducts(filters: ProductFilters) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  let query = supabase
    .from("products")
    .select(`
      *, 
      product_variations(*),
      category:categories(is_visible),
      sub_category:sub_categories(is_visible),
      sub_sub_category:sub_sub_categories(is_visible)
    `)
    .eq("is_visible", true);

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.subCategoryId) query = query.eq("sub_category_id", filters.subCategoryId);
  if (filters.subSubCategoryId) query = query.eq("sub_sub_category_id", filters.subSubCategoryId);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

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

  let items: ProductWithPrice[] = validData.map((p) => {
    const visibleVariations = (p.product_variations || []).filter((v: any) => v.is_visible);
    const prices = visibleVariations.map((v: any) => Number(v.price));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const inStock = visibleVariations.some((v: any) => v.stock_quantity > 0);
    return { ...p, minPrice, maxPrice, inStock };
  });

  // Price filter (done in JS since price lives on the child table)
  if (filters.minPrice != null) {
    items = items.filter((p) => p.minPrice != null && p.minPrice >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    items = items.filter((p) => p.minPrice != null && p.minPrice <= filters.maxPrice!);
  }

  // Sort
  switch (filters.sort) {
    case "price_asc":
      items.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      break;
    case "price_desc":
      items.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
      break;
    case "name_asc":
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // "newest" — relies on created_at already being returned; re-fetch order isn't guaranteed
      // without an explicit order() call above, so sort defensively if present.
      break;
  }

  const total = items.length;

  // If page is provided, do server-side pagination (used by other pages)
  if (filters.page) {
    const start = (filters.page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);
    return { items: paged, total, page: filters.page, pageSize };
  }

  // Otherwise return all items (shop page uses client-side "View More")
  return { items, total, page: 1, pageSize: total };
}

export async function getProductById(id: string) {
  const supabase = await createClient();

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
  const supabase = await createClient();

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

  const selectFields = `
    *,
    product_variations(*),
    category:categories(is_visible),
    sub_category:sub_categories(is_visible),
    sub_sub_category:sub_sub_categories(is_visible)
  `;

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