import { notFound } from "next/navigation";
import { getCategoriesTreeOrThrow } from "@/lib/categories";
import { getProducts } from "@/lib/supabase/products";
import CategoryClient from "./CategoryClient";

// Cached for an hour. Admin edits and sales refresh it through revalidateStorefront.
export const revalidate = 3600;

// An empty list means each category page is built on its first visit, then cached.
export async function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  if (!slug || slug.length === 0 || slug.length > 3) notFound();

  const [categoryId, subCategoryId, subSubCategoryId] = slug;

  const categories = await getCategoriesTreeOrThrow();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) notFound();

  const subCategory = subCategoryId
    ? category.sub_categories.find((s) => s.id === subCategoryId)
    : undefined;
  if (subCategoryId && !subCategory) notFound();

  const subSubCategory = subSubCategoryId
    ? subCategory?.sub_sub_categories.find((s) => s.id === subSubCategoryId)
    : undefined;
  if (subSubCategoryId && !subSubCategory) notFound();

  const products = await getProducts({
    categoryId: category.id,
    subCategoryId: subCategory?.id,
    subSubCategoryId: subSubCategory?.id,
  });

  return (
    <CategoryClient
      slug={slug}
      categories={categories}
      category={category}
      subCategory={subCategory}
      subSubCategory={subSubCategory}
      products={products}
    />
  );
}
