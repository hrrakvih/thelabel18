import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private pages, plus filter/search URLs that would multiply crawler traffic.
      disallow: ["/admin", "/api", "/login", "/cart", "/checkout", "/orders", "/wishlist", "/*?*"],
    },
  };
}
