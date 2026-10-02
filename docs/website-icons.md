# Website icons

Source: `public/brand/stempath-256e7993ff86-source.png`, the exact supplied 1254 × 1254 PNG (SHA-256 prefix `256e7993ff86`).

The 180, 192 and 512 pixel PNGs preserve the complete square composition. The 16, 32 and 48 pixel PNGs and multi-size `public/favicon.ico` use the square source crop `(490, 90, 910, 510)` to keep the entire skull readable. All resizing uses Pillow Lanczos; no artwork, colors, borders or corners were added or altered.

Next.js metadata uses content-versioned PNG filenames and an ICO version query. The separate header JPEG and attribution remain unchanged. There is currently no PWA manifest or service worker; these changes do not add PWA behavior. The 192/512 PNGs are available for future manifest integration.

When replacing the artwork, derive icons from the highest-quality original and change the version in filenames and metadata together. Keep `/favicon.ico` updated for clients that request the conventional path.
