import { getCategoriesTree } from "@/lib/categories";
import { CategoryDirectory } from "@/components/category-directory";

export const revalidate = 300; // ISR: refresh every 5 min

export default async function NavigationPage() {
  const categories = await getCategoriesTree();

  return <CategoryDirectory categories={categories} />;
}