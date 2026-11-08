# Royal boutique theme — local review

Date: 2026-11-08, Asia/Manila. Visual/iPad acceptance remains pending.

Branch: `feature/pesopilot-business-royal-theme`.

Base: `feature/pesopilot-business-pos-polish`, commit `4568c22`.

Worktree: `C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-royal-theme`.

## Run in PowerShell

Node 24 is required by the existing project. Dependencies are already installed in this worktree.

```powershell
Set-Location 'C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-royal-theme\apps\pesopilot-web'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Stop any server already using 5173, then open `http://127.0.0.1:5173/business`. Use the same browser profile, host and port as the polish build to see the same local records. Changing between `localhost` and `127.0.0.1`, or changing the port, selects a different browser origin. No data migration is introduced by this theme; Business schema 3 and backup format 3 remain unchanged.

## Changed presentation

- Deep royal navy (`#0B2347`) surrounds the content on every Business route. The navigation keeps PesoPilot branding and a restrained gold-framed POS mark; no Kingdomson name, crest or uploaded logo is placed automatically.
- Ivory (`#FFFCF5`) catalog, form, audit and modal panels use thin cream/gold borders and restrained navy shadows. Product photographs retain their existing contain-fit display and aspect ratio, with softly muted cream category backgrounds and gold details around placeholders.
- Royal blue (`#4169E1`) action fills use white labels. Smaller blue text uses darker blue ink (`#3155C2`) to preserve contrast on cream surfaces. Gold (`#D8B45D`) is reserved for dark-surface branding, active navigation, fine borders and selected-state accents; it is not used as body text on ivory.
- Plus Jakarta Sans is self-hosted, with 700-weight controls and 800-weight headings/product titles. Existing numeric typography is retained. The font binary and its OFL license are bundled under `public/fonts/business`; package version, source and SHA-256 are recorded in that directory's README. No npm dependency or lockfile changes.
- Mobile spacing, 44px touch minimums, larger modal controls, keyboard focus, photo management, sample source switching and viewport resizing behavior remain intact.
- All CSS variables and overrides are scoped to Business Mode. Shared components, Personal Finance styling and logic, product-family identities, repositories, transactions, images, backups and audit calculations are unchanged.

## Automated validation

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 413 packages; lockfile unchanged |
| `npm run test` | PASS — 115 files, 1,247 tests |
| `npm run lint` | PASS — no warnings/errors |
| `npm run build` | PASS — local production bundle |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

The existing test suite covers photos, backup/restore, sample isolation, product/variant/modal/payment selection, confirmed sales, stock and audit behavior, and Personal Finance regressions. No additional tests were added for these presentation-only changes. Build retains the two existing upstream Zod purity-comment warnings.

Programmatic sRGB contrast calculations: ivory/navy 15.23:1, gold/navy 7.88:1, muted/navy 9.64:1, muted/ivory 5.48:1, white/royal 4.85:1. Darker blue ink measures 6.39:1 on ivory and 5.76:1 on cream; it is used for small text after the initial exact royal/cream pairing measured below 4.5:1. Light helper text is limited to navy backgrounds, including excluding the ivory inventory notice. These checks are not browser or accessibility certification.

The font was acquired as a pinned npm tarball, then only its unmodified font binary and license were copied. No external design research, browser automation, computer-use tools, push, merge, deployment or Vercel preview change was performed. Existing worktrees and uncommitted work are preserved.

Scoped OWASP Top 10:2025 and applicable ASVS 5.0 review found no new injection, network, persistence or authorization surface. JSX changes add presentation classes only. The font is served locally; no new remote resource request is introduced. No findings identified in this scoped review; this is not a compliance claim.

## Manual acceptance

Review POS, Inventory, Daily Audit, Sales History and Settings on desktop, iPad portrait/landscape and a small phone. Check heading/control weight, panel contrast, uploaded photo quality, selected variants and payments, the scrollable sale modal with the on-screen keyboard, horizontal audit scrolling, focus visibility and the Actual/Sample switch. Record a sample sale and inspect its audit/history. Browser appearance, real font rendering and physical iPad behavior have not been validated by the agent.
