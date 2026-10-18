# PesoPilot Self-Hosted Font Provenance and License Documentation

This directory contains the self-hosted font assets for the PesoPilot web application. These assets are bundled locally to ensure offline capability, eliminate external runtime network requests to third-party CDNs, and preserve user privacy.

## Font Inventory, Metadata, and Provenance

| Filename | Font Family & Configuration | Binary Version | Verified SHA-256 Checksum | Upstream Origin | Copyright Holder (from binary metadata) | License | Purpose in PesoPilot |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `inter-latin.woff2` | **Inter** (Variable Latin, weights 400–700) | `Version 4.001;git-66647c0bb` | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` | [rsms/inter](https://github.com/rsms/inter) | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL Open Font License 1.1 ([`OFL-1.1.txt`](./OFL-1.1.txt)) | Primary body text and UI interface typography (`font-sans`) |
| `ibm-plex-sans-latin.woff2` | **IBM Plex Sans** (Latin, weights 600–700) | `Version 3.201` | `e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470` | [IBM/plex](https://github.com/IBM/plex) | Copyright 2019 IBM Corp. All rights reserved. (Reserved Font Name "Plex") | SIL Open Font License 1.1 ([`OFL-1.1.txt`](./OFL-1.1.txt)) | Section headers, card titles, and high-emphasis display text (`font-headline`) |
| `jetbrains-mono-latin.woff2` | **JetBrains Mono** (Latin, weight 500) | `Version 2.211` | `cb182feeed4d798ff6961d3c79f7026279448fca0676438aaecb21f3fc39553a` | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL Open Font License 1.1 ([`OFL-1.1.txt`](./OFL-1.1.txt)) | Numerical tables, financial figures, currency amounts, and date stamps (`font-mono`) |
| `material-symbols-outlined.woff2` | **Material Symbols Outlined 24pt** (Variable icon font, weights 100–700) | `Version 2.975` | `8a5104d7ad4d43c4ec1da4e632d990bb523966fcff487d773ff75e75901ca828` | [google/material-design-icons](https://github.com/google/material-design-icons) | Copyright 2026 Google LLC. All Rights Reserved. | Apache License 2.0 ([`APACHE-2.0.txt`](./APACHE-2.0.txt)) | Navigation, action buttons, category markers, and indicator icons (`material-symbols-outlined`) |

## Provenance and Verification Notes

- **Binary Metadata Source of Truth**: All copyright notices, versions, and unique IDs recorded above are extracted directly from the internal OpenType `name` table of each local `.woff2` asset.
- **SHA-256 Checksums**: Checksums are computed directly over the distributed `.woff2` binaries in this directory.
- **Intermediate Acquisition Pipeline**: The exact transient acquisition pipeline (e.g. specific CDN subsetting scripts or release tarballs) is not independently known beyond the verified binary metadata and SHA-256 hashes. No synthetic download URLs or speculative acquisition commit hashes are fabricated.
- **License Texts**:
  - [`OFL-1.1.txt`](./OFL-1.1.txt) reproduces the verbatim upstream SIL Open Font License 1.1, including exact condition 3 language ("explicit written permission").
  - [`APACHE-2.0.txt`](./APACHE-2.0.txt) reproduces the complete verbatim upstream Apache License 2.0, including the full official Appendix.
- **Distribution**: All notice and license files reside within `public/fonts/` and are copied directly into `dist/fonts/` during production builds (`npm run build`), ensuring they accompany the distributed application at all times.
