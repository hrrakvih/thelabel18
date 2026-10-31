import { getCategoriesTreeOrThrow } from "@/lib/categories";
import { getProducts } from "@/lib/supabase/products";
import ShopClient from "./ShopClient";

// Cached for an hour. Admin edits and sales refresh it through revalidateStorefront.
export const revalidate = 3600;

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getCategoriesTreeOrThrow(),
    getProducts({}),
  ]);

  return <ShopClient products={products} categories={categories} />;
}
