import { createClient } from "@supabase/supabase-js";

// Anonymous client for public storefront data. It reads no cookies, so pages
// that use it can be cached and served without running a function per visit.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
