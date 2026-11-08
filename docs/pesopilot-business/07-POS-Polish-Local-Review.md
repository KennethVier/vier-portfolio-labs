# Boutique POS polish — local manual review

Date: 2026-11-08, Asia/Manila. Implementation and automated validation complete; visual/iPad acceptance pending. No tracker milestone is marked complete.

Branch: `feature/pesopilot-business-pos-polish`.

Base: locally committed `feature/pesopilot-business-pos-redesign`, `e3b9d33`.

Worktree: `C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-pos-polish`.

## Run locally

Node 24 is required by the existing project. Dependencies are installed in this worktree. In PowerShell:

```powershell
Set-Location 'C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-pos-polish\apps\pesopilot-web'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/business`. Stop any server already using 5173 first. Local records belong to the browser profile and origin; changing between `localhost`, `127.0.0.1` or ports changes which storage is visible. Back up the existing Business workspace before upgrading. Dexie v3 adds a store without rewriting any existing records; earlier builds cannot open this upgraded database.

For a fresh checkout, run `npm.cmd ci` before starting. Repeat validation with:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high
```

## Visual changes

- Scoped Business tokens, warm off-white backdrop, white navigation, soft borders, blue selected states and restrained shadows. Shared Personal components are untouched.
- Large, consistently proportioned photo/placeholder areas with seven centralized category tints, differentiated category icons, rounded cards, readable prices and whole-card keyboard/touch states. Availability states explicitly count stocked variants instead of implying every variant is stocked.
- Prominent sale title, small family photo, larger quantity/payment controls, tinted product/quantity/payment/total summary and full-width action. Existing review/confirmation, request-key retries and atomic deduction remain intact.
- Scrollable dialog with safe-area padding and visual viewport resize/offset handling for keyboard changes, with listener cleanup. Phone layout aligns the dialog as a bottom sheet. Touch controls retain at least 44px targets.
- Sample tools live in a collapsed utility disclosure. The Actual/Sample switch and explicit fictional-stock notice remain visible when samples exist.
- Audit KPI cards distinguish money and quantities. Group bands, alternating rows, aligned numeric columns, bounded horizontal/vertical scrolling and sticky headers improve scanning. Calculations and dates are unchanged.
- Inventory, history, settings and backup inherit the same scoped surfaces and touch controls.

## Product photos

Open **Inventory → Product photos**. Select **Actual photos** or **Sample photos**, then choose **Add product photo** for the family. The selected file previews immediately while saving. **Replace photo** changes it; **Remove photo** removes only the photo. One image covers every explicit variant in that family. Existing products without metadata each have their own image identity. Actual and Sample photos are independent.

JPEG, PNG and WebP input is supported up to 2 MiB. Photos are locally resized to at most 960px and compressed to JPEG, limited to 192 KiB each and 30 photos per workspace. No remote images, image services, upload backend or new dependency is used. Saved images remain in the separate Business IndexedDB database across refresh/reopen, subject to browser storage retention. Clearing site data removes them.

Business backup **format 3 / schema 3** includes photos with transactions. Strict formats 1 and 2 remain readable; owner review warns that restoring them clears current photos. All seven stores are atomically replaced, with metadata/pixel validation and stale-review checks before writes. The overall backup limit remains 10 MiB. See [backup architecture](04-Business-Backup-and-Restore.md).

## Automated validation and limits

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 413 packages; lockfile unchanged |
| `npm run test` | PASS — 115 files, 1,247 tests |
| `npm run lint` | PASS — no warnings/errors |
| `npm run build` | PASS — local production build |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

The 37 additional cases cover image absence/presence, immediate preview, add/replace/remove, type/size/decoded-dimension bounds, URL cleanup, JPEG metadata/frame validation, repository reopen, additive schema migration, family display, partial stock labels, Actual/Sample isolation, workspace photo cap, legacy-backup warning and restore, photo backup round trip, stale review, late-write rollback and viewport listener behavior. Existing sale/variant/payment/confirmation, audit/inventory and Personal Finance regressions pass.

Tests use local Vitest, happy-dom and fake-indexeddb. Image/canvas platform APIs are mocked for processing tests; they do not prove real browser codec behavior. No browser, browser automation, computer-use tool, external design site or physical iPad was used. Manual review must still check appearance, Safari image decoding/orientation/quality, Photos/Files selection, keyboard/focus/viewport behavior and a real backup recovery drill.

The sandbox initially prevented esbuild reading an ancestor directory; authorized local test/build runs outside the sandbox passed. Vite emits the same two upstream Zod purity-comment warnings as the base and builds successfully; warnings were not suppressed.

Scoped security review used OWASP Top 10:2025 and applicable ASVS 5.0 guidance: untrusted file/MIME/base64/dimension/size validation, React escaping, URL cleanup, family ownership and sample separation, atomic rollback, stale-review checks and Personal isolation. No changed-surface findings were identified; this is not a compliance certification. Storage remains device-local and unauthenticated; backups remain plaintext. No dependency was changed.

No push, deployment, merge, PR update or Vercel preview change was performed. The root worktree and its unrelated uncommitted work are preserved.
