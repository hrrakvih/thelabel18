# Current performance optimizations

The generated image variants were removed at the user's request. The `public/optimized/` folder, custom loader, manifest, generator and prebuild/predev hooks have been removed. Development and builds no longer recreate image variants.

Next Image serves source URLs in `public/` directly with `unoptimized: true`, avoiding runtime optimizer usage. The earlier 94.4% generated-image savings no longer apply to these source downloads.

The five hero banners and `DSC06680` were replaced once by hand with WebP (quality 90; hero 2560px wide, `DSC06680` 1400px wide), and `logo.jpg` was resized to 256px, reducing those six WebP sources from 31.12 MB to 2.54 MB. There is no build step; replacement banners should be exported the same way before being added to `public/`.

Remaining optimizations:

- Only current and previous hero slides mount, with a single image per slide. Rotation stops while the tab is hidden, and the unused progress timer was removed.
- Links prefetch only on hover through `components/HoverPrefetchLink.tsx`; product-card links never prefetch. Use it for navigation that should prefetch only on hover; default viewport prefetching can add requests even before a visitor clicks.
- Shop, category, product and reels pages are cached for an hour and use the cookie-free client in `lib/supabase/public.ts`. Reading cookies or `searchParams` in these pages turns the cache off. Call `revalidateStorefront()` after any new code that changes products, stock or categories.
- Search, filters, sorting and page numbers run in the browser (`lib/product-filters.ts`) and never call the server.
- Images in `public/` are cached by browsers for 30 days, so a replacement image needs a new filename.
- Inactive reels do not load video sources or metadata.
- Homepage queries fetch at most ten products per featured category and only card fields.
- New uploads requiring compression use WebP quality 78.
- The browser-tab icon was reduced from 133,112 to 4,834 bytes.

Additional review fixes:

- Six retired PNG/JPEG URLs permanently redirect to their existing WebP replacements, preserving links from cached pages without restoring the original files or generating size variants.
- Catalog queries explicitly sort newest-first. Product-card payloads exclude hidden variations, including homepage and related-product cards.
- Related-product database failures propagate, preventing an incomplete recommendation list from being stored as a successful regenerated page.
- Cached category reads distinguish an intentionally empty catalog from a database failure.
- Local credential files `envfile` and `email and password` are ignored and removed from Git tracking. Their local copies remain. Previously committed versions remain in Git history; rotate any real credentials they contained.

Validation: 39 regression tests and the webpack production build passed. A temporary local production preview returned HTTP 308 for all six retired image URLs, HTTP 200 with 30-day browser caching for the WebP destinations, and cache HIT on repeated shop/product/category requests. Product and category pages changed from MISS to HIT after the first visit.

These additional fixes have not been deployed. After deployment, check the latest 15–30 minutes of production traffic rather than historical totals. Redirects apply to deployments containing this configuration; older pinned deployment URLs require separate review. The cached shop still sends the full card catalog to support browser-side filtering; measure its payload before a future pagination redesign.
