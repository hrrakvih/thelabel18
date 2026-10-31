import type { ProductWithPrice } from "@/lib/supabase/products";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export type ProductFilterValues = {
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
};

// Runs in the browser so filtering, searching and sorting never call the server.
export function filterProducts(products: ProductWithPrice[], filters: ProductFilterValues) {
  let items = products;

  if (filters.categoryId) items = items.filter((p) => p.category_id === filters.categoryId);
  if (filters.subCategoryId) items = items.filter((p) => p.sub_category_id === filters.subCategoryId);
  if (filters.subSubCategoryId) items = items.filter((p) => p.sub_sub_category_id === filters.subSubCategoryId);

  if (filters.search) {
    const search = filters.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(search));
  }

  if (filters.minPrice != null) {
    items = items.filter((p) => p.minPrice != null && p.minPrice >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    items = items.filter((p) => p.minPrice != null && p.minPrice <= filters.maxPrice!);
  }

  switch (filters.sort) {
    case "price_asc":
      return [...items].sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    case "price_desc":
      return [...items].sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
    case "name_asc":
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    default:
      return items;
  }
}
