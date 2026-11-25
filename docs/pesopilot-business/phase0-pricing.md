# Phase 0 pricing acceptance

Baseline: test/pesopilot-ipad-preview at ca3767d, deployed on pesopilot-business-pilot. This branch changes the Phase 0 POS only. The app has no account authentication. Pricing is a management page, and anyone with access to the app and its browser profile can use it. Genuine Admin-only enforcement requires authentication and authorization in a separate change.

| Route | Behavior |
| --- | --- |
| /business/pricing | Search saved products. Edit selling price and purchase cost. Save checks the original amounts in the IndexedDB transaction. Cancel discards the draft. |
| /business/inventory | Add Product offers editable preset prices. Stock receiving and adjustments stay here. Purchase cost editing moves to Pricing. |
| /business | Future sales use the selected catalog price for Solo and Set. Tawad and Set composition still work. |

The IndexedDB name, schema versions, inventory pools and sale snapshot records stay the same. Set price is per piece. Cost is determined by the physical pieces selected.

## Preview acceptance

From apps/pesopilot-web run npm ci and npm run build, then npm run preview -- --host 127.0.0.1 --strictPort. Open http://127.0.0.1:4173/business/inventory in a fresh browser profile and add only synthetic products through the form. Check Pricing search, Cancel, invalid amounts, saved amounts after reload and the matching future POS price. For Set checks use the synthetic integration-test catalog or existing separately created synthetic Set records. A preview origin has separate IndexedDB storage from the customer origin. Never restore a customer backup into the preview.

## Release approval

1. Approve a preview deployment if a hosted review is desired. Use the pricing branch commit as a Preview target only, with no production aliases.
2. After acceptance, approve merging the reviewed pricing diff into test/pesopilot-ipad-preview and releasing the resulting exact commit to pesopilot-business-pilot. The production branch can trigger a Vercel deployment on merge, so both actions require approval.
3. Before release, save a Business Backup from the existing live iPad profile and confirm the currently deployed commit. After release, verify Pricing at the same live origin and check existing inventory and receipt totals. If needed, roll the alias back to the previous Vercel deployment. Do not clear browser storage or restore a backup as part of a code rollback.
