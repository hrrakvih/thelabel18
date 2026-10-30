import { createClient } from "@/lib/supabase/client"; // adjust to your existing browser client path

export type SubSubCategory = {
  id: string;
  name: string;
  priority: number;
  image_url?: string | null;
  description?: string | null;
};

export type SubCategory = {
  id: string;
  name: string;
  priority: number;
  image_url?: string | null;
  description?: string | null;
  sub_sub_categories: SubSubCategory[];
};

export type CategoryTree = {
  id: string;
  name: string;
  priority: number;
  image_url?: string | null;
  description?: string | null;
  sub_categories: SubCategory[];
};

/**
 * Fetches the full visible category -> sub_category -> sub_sub_category tree,
 * sorted by `priority` at every level. Only rows with is_visible = true are returned.
 */
export async function getCategoriesTree(): Promise<CategoryTree[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      priority,
      is_visible,
      image_url,
      description,
      sub_categories (
        id,
        name,
        priority,
        is_visible,
        image_url,
        description,
        sub_sub_categories (
          id,
          name,
          priority,
          is_visible,
          image_url,
          description
        )
      )
    `
    )
    .eq("is_visible", true)
    .eq("sub_categories.is_visible", true)
    .eq("sub_categories.sub_sub_categories.is_visible", true)
    .order("priority", { ascending: true });

  if (error) {
    console.error("Error fetching category tree:", error);
    return [];
  }

  const tree = (data ?? []) as unknown as CategoryTree[];

  // Belt-and-suspenders sort, since Supabase doesn't guarantee nested-relation order.
  return tree
    .sort((a, b) => a.priority - b.priority)
    .map((category) => ({
      ...category,
      sub_categories: (category.sub_categories ?? [])
        .sort((a, b) => a.priority - b.priority)
        .map((sub) => ({
          ...sub,
          sub_sub_categories: (sub.sub_sub_categories ?? []).sort(
            (a, b) => a.priority - b.priority
          ),
        })),
    }));
}