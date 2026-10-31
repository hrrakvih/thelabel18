import { revalidatePath } from 'next/cache'

// Storefront pages are cached for an hour. Call this after anything that changes
// what they show (products, stock, categories) so the change appears on the next
// visit. Pages are only rebuilt when next visited, so this stays cheap.
export function revalidateStorefront() {
  revalidatePath('/shop')
  revalidatePath('/(site)/categories/[...slug]', 'page')
  revalidatePath('/(site)/product/[id]', 'page')
}
