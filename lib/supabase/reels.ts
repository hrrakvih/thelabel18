// lib/supabase/reels.ts
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reels:", error.message);
    return [];
  }

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