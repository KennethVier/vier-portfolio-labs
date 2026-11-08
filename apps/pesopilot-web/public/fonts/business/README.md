# Business Mode typography

Business Mode uses two self-hosted Latin, normal-style variable fonts. Each family loads one WOFF2 file, with no separate static-weight files, italics or unused language subsets. Fonts are served from the application origin for offline use; there are no remote font requests or added npm dependencies.

## Plus Jakarta Sans — functional UI

`plus-jakarta-sans-latin-wght-normal.woff2` is the unmodified font from `@fontsource-variable/plus-jakarta-sans@5.3.0`. The binary supports weights 200–800; the Business CSS selects only 400–800. It is used for headings (800), product names (700), amounts (800), controls/navigation (700), body text (500) and normal-weight helper text (400). Numeric text retains tabular figures and now uses this family, too.

- Acquisition: `npm pack @fontsource-variable/plus-jakarta-sans@5.3.0`; extracted `package/files/plus-jakarta-sans-latin-wght-normal.woff2` and the package's `LICENSE`.
- Package URL: `https://registry.npmjs.org/@fontsource-variable/plus-jakarta-sans/-/plus-jakarta-sans-5.3.0.tgz`.
- Font SHA-256: `153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79`.
- Package metadata: family Plus Jakarta Sans; upstream source `https://github.com/google/fonts`; attribution Copyright 2020 The Plus Jakarta Sans Project Authors (`https://github.com/tokotype/PlusJakartaSans`).
- License: SIL Open Font License 1.1. The exact package notice and full license text accompany the font in `PLUS-JAKARTA-SANS-OFL.txt`.

## Cinzel — decorative branding only

`cinzel-latin-wght-normal.woff2` is the unmodified font from `@fontsource-variable/cinzel@5.3.0`. The binary supports weights 400–900; the Business CSS selects only 600–700. The wordmark uses 700 with 0.015em letter spacing; the decorative POS eyebrow uses 600 with 0.04em spacing. Cinzel is a visual approximation of the reference's royal aesthetic, not a claimed identification or reconstruction of the Kingdomson logo lettering. Functional headings, product names, labels, buttons, amounts and tables remain Plus Jakarta Sans.

- Acquisition: `npm pack @fontsource-variable/cinzel@5.3.0`; extracted `package/files/cinzel-latin-wght-normal.woff2` and `package/LICENSE`.
- Package URL: `https://registry.npmjs.org/@fontsource-variable/cinzel/-/cinzel-5.3.0.tgz`.
- Font SHA-256: `09941fb1c169c38fd414536b37690057fc01b3117a5c63dd6571186540c8f370`.
- Package attribution: Copyright 2020 The Cinzel Project Authors (`https://github.com/NDISCOVER/Cinzel`).
- License: SIL Open Font License 1.1. The package's exact copyright notice and full license text accompany the font in `CINZEL-OFL.txt`.

`business.css` owns reusable Business-scoped font/weight tokens plus the `business-wordmark`, `business-boutique-heading`, `business-product-name` and `business-amount` classes. No global body or Personal Finance typography rule is changed.

These files are copied into `dist/fonts/business` by Vite's public asset handling. Existing Personal Finance font assets and CSS remain unchanged.
