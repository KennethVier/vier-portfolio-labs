# Business Mode v1.1 — Implementation Tracker

Status: ISOLATED FEATURE BRANCH. Not part of v1.0 release approval.

| Milestone | Status | Acceptance |
| --- | --- | --- |
| B0 Proposal, scope, and boundaries | Complete (provisional) | New v1.1 proposal; v1.0 authority untouched |
| B1 Workspace choice and distinct business route | Implemented for review | Existing personal users unaffected; no salary cutoff prompt in business |
| B2 Local product/stock foundation | Implemented for review | Separate Dexie database; stock additions produce events |
| B3 Manual Cash/Coop completed sale | Implemented for review | Atomic stock decrement; snapshots; idempotency; rollback |
| B4 Client-format audit | Blocked on client sample | Sample mapping, test fixtures, reconciliation verified |
| B5 Integration/security/offline QA | Pending | Full frontend suite, E2E, backup, access and privacy decisions |
| B6 Merge/deploy | Not authorized | Separate approved PR and smoke test |

Implementation notes: B1/B2/B3 are staged on a dedicated branch. The Business route includes initial product entry, stock receiving, single-product completed-sale UI, business summary, and internal event preview. Code is provisional until repository test/QA gates pass. No claim of a production-ready private URL, payment processing, or client audit export.
