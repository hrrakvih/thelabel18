# Current performance optimizations

The generated image variants were removed at the user's request. The `public/optimized/` folder, custom loader, manifest, generator and prebuild/predev hooks have been removed. Development and builds no longer recreate image variants.

Next Image serves source URLs in `public/` directly with `unoptimized: true`, avoiding runtime optimizer usage. The earlier 94.4% generated-image savings no longer apply to these source downloads.

The five hero banners and `DSC06680` were replaced once by hand with WebP (quality 90; hero 2560px wide, `DSC06680` 1400px wide), and `logo.jpg` was resized to 256px, reducing those six WebP sources from 31.12 MB to 2.54 MB. There is no build step; replacement banners should be exported the same way before being added to `public/`.

Remaining optimizations:

- Only current and previous hero slides mount, with a single image per slide. Rotation stops while the tab is hidden, and the unused progress timer was removed.
- Product-card links do not prefetch every product route.
- Inactive reels do not load video sources or metadata.
- Homepage queries fetch at most ten products per featured category and only card fields.
- New uploads requiring compression use WebP quality 78.
- The browser-tab icon was reduced from 133,112 to 4,834 bytes.

Production compilation previously passed using webpack, but page-data collection was blocked by missing local Supabase configuration. Production traffic and deployment have not been validated.
