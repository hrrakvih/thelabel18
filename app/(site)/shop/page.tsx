import { getCategoriesTree, type CategoryTree } from "@/lib/categories";
import { getProducts } from "@/lib/supabase/products";
import ShopClient from "./ShopClient";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const categories = await getCategoriesTree();

  // Safely parse params: if category is a string like "jewellery", try to resolve its UUID or convert to search
  const isUUID = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  let resolvedCategoryId = params.category;
  let resolvedSearch = params.q;

  if (resolvedCategoryId && !isUUID(resolvedCategoryId)) {
    const foundCat = categories.find((c) => c.name.toLowerCase() === resolvedCategoryId?.toLowerCase());
    if (foundCat) {
      resolvedCategoryId = foundCat.id;
    } else {
      resolvedSearch = resolvedSearch ? `${resolvedSearch} ${resolvedCategoryId}` : resolvedCategoryId;
      resolvedCategoryId = undefined;
    }
  }

  const resolvedSub = isUUID(params.sub) ? params.sub : undefined;
  const resolvedSubSub = isUUID(params.subsub) ? params.subsub : undefined;

  const { items, total } = await getProducts({
    categoryId: resolvedCategoryId,
    subCategoryId: resolvedSub,
    subSubCategoryId: resolvedSubSub,
    search: resolvedSearch,
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    sort: (params.sort as any) ?? "newest",
  });

  return (
    <ShopClient
      products={items}
      total={total}
      categories={categories}
      searchQuery={params.q}
      categoryId={resolvedCategoryId}
      subId={resolvedSub}
      subSubId={resolvedSubSub}
    />
  );
}