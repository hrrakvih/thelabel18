// lib/supabase/reels.ts
import { createPublicClient } from "@/lib/supabase/public";

export type ReelType = "upload" | "instagram";

export type Reel = {
  id: string;
  type: ReelType;
  video_url: string | null;
  storage_path: string | null;
  instagram_url: string | null;
  caption: string | null;
  created_at: string;
};

/**
 * Fetches all reels, newest first.
 * If a row has type "upload" and no video_url but does have a storage_path,
 * we resolve the public URL from the "reels" storage bucket.
 * Rename STORAGE_BUCKET below if your bucket is named differently.
 */
const STORAGE_BUCKET = "reels";

export async function getReels(): Promise<Reel[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false });

  // Throw so the cache keeps the last good page instead of an empty feed.
  if (error) throw new Error(`Error fetching reels: ${error.message}`);

  return (data ?? []).map((reel) => {
    if (reel.type === "upload" && !reel.video_url && reel.storage_path) {
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(reel.storage_path);
      return { ...reel, video_url: publicUrlData.publicUrl };
    }
    return reel as Reel;
  });
}