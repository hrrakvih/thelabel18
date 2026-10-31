import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve source images directly without the runtime image optimizer.
    unoptimized: true,
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eifqxajkreoabpeunnmx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Images in public/. Give a replacement image a new filename, or returning
        // visitors can keep seeing the old one for up to 30 days.
        source: "/:file([^/]+\\.(?:webp|jpg|jpeg|png))",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Default is 1MB. Your Lehenga image (and others) are larger than
      // that, so the dev server was resetting the connection mid-upload
      // before your action's own validation/error handling ever ran —
      // that's why you were seeing a generic "Failed to fetch" instead of
      // a message from actions.ts.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;