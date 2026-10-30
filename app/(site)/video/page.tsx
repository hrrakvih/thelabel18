// app/(site)/reels/page.tsx
import ReelsFeed from "@/components/ReelsFeed";
import { getReels } from "@/lib/supabase/reels";

// Always fetch fresh so new reels show up without a redeploy.
export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const reels = await getReels();

  return (
    <>
      {/* 
        1. Hide the global footer just for this specific page so it stops overlapping.
        2. Ensure the background behind the header stays dark if there's any gap.
      */}
      <style>{`
        footer { display: none !important; }
        body { background-color: #000 !important; }
      `}</style>

      {/* 
        Use top-20 (80px) or top-16 (64px) to precisely match your header's height. 
        bottom-0 locks it to the bottom of the screen.
      */}
      <main className="fixed top-20 bottom-0 left-0 right-0 z-40 bg-black overflow-hidden">
        <ReelsFeed reels={reels} />
      </main>
    </>
  );
}