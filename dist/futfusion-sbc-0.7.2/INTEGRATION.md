# Integration findings

## Examined sources

FutFox `src/page/fut-adapter.js` supplies club and storage item DTOs, loaded challenge entities, formation slots, brick indices, parsed requirements and EA chemistry. `src/page/panel.js:solveSquad` invokes `src/core/solver.js`, then retains item IDs and slot indices with the result. The solver uses a seeded simulated annealing search; its output is a feasible candidate, not a proof of the globally cheapest solution. The original extension deliberately never writes the squad.

AutoPilot v1.12.3 `page/ea-data-bridge.js:applySolutionToChallenge` resolves IDs to EA item DTOs, handles pile moves, builds a slot list, calls `setPlayers`, saves through `services.SBC.saveChallenge`, reloads the challenge and notifies data changes. Its broader implementation includes duplicate remapping, retries, full-set and sequence automation. None of these runtime behaviors was observed in a live account during this integration; these are source-code findings.

## Chosen boundary

Retain FutFox as the planning/UI host. Add `src/page/squad-apply.js` after the FutFox adapter in the MAIN-world manifest script order. Its input is the existing solver result, with `challengeId`, `required`, `rules`, `feasible` and `squad[index].player.id`. Use owned item instance IDs, never definition IDs, for placement. Preserve nonrequired slots and the explicit solver slot order.

Before any writes, check the open challenge, supported constraints, required slot set, ownership, concept status, duplicate selection and API availability. Hydrate the challenge, recheck navigation, move selected storage items to club, set players, save, reload (DAO when available) and verify each required slot ID. Notify the original squad object to preserve UI bindings. An apply lock prevents overlapping operations.

## Error semantics and limitations

A failed save restores the local display and reports uncertainty; it does not claim a server rollback. Successful storage moves are not reversed. Failed verification does not issue a second save. Navigation after an in-flight save cannot cancel that save. A fallback `loadChallenge` can depend on EA caching when no DAO method is available. Item inventory comes from FutFox’s loaded cache, so EA remains authoritative when a card was used elsewhere after planning.

Storage duplicate conflicts are surfaced as EA errors rather than running AutoPilot’s full remapping pipeline. The project does not embed AutoPilot’s GLPK solver or background worker. Version 0.1.1 also applies points SBC picks through the current Work Area view model. Following AutoPilot applyPointsSelection, it registers the item entity, score and source tab, then calls selectItem. It replaces the current selection, verifies IDs and total score, and attempts to restore the previous selection on failure. It does not save or submit a points SBC.

## Validation boundary

Node tests exercise the existing planner suite and the new integration against mocked EA observables. They verify ordering and failures, not compatibility with a logged-in FC27 Web App. The installation package contains the complete JavaScript used by the extension. Real account validation remains outstanding.


## Gallery ledger, v0.2.0

New modules: `src/core/gallery-trades.js` and `src/page/gallery-trades.js`. The planner and set matcher remain unchanged. The set page supplies its existing grade plan; the ledger deduplicates by card definition plus foil state, excludes remembered cards and loans, and counts distinct compatible missing sets. Set counts are captured when added, not an optimal global completion plan. No price feed or account-changing EA method was added.

The ledger has its own versioned localStorage key scoped by selectedPersona. It never marks existing Gallery slots as picked or complete. Seeing the card in galleryCards is displayed as an observation, not proof of EA Gallery registration. Registration and sale are manually confirmed. Cost fields start unknown rather than inventing prices; the adjustable 5% default is explicitly a tax assumption. Unknown costs are omitted with a visible count. Corrupt JSON is reported without overwriting it; storage write failures do not claim success. Ledger data is not part of the existing Gallery export.

Regression tests cover distinct set contribution, card-version and foil identity, duplicate plans, stale completed targets, unknown costs, tax arithmetic, account separation, explicit Gallery confirmation, persistence failures and UI state transitions. Live Web App verification of the new ledger remains outstanding.


## Explicit Gallery purchasing, v0.3.0

`src/page/gallery-market.js` adapts AutoPilot's transfer market search / bid / club move APIs. User search does not bid. Bisection uses maxBuy existence queries (first page) to improve the current observed minimum within 15M coins, with 500ms spacing and at most 25 refinement requests. Matching is strict by definition, rating, rarity and foil state. The UI labels the result as a found minimum rather than a permanent global price guarantee.

Quotes are account-scoped, in-memory and valid for 60 seconds. A Buy click passes the displayed price, searches the exact price again and requires the same trade ID before bidding once. There are no buy retries or higher-price substitutions. The UI persists a pending marker before purchase, merges results into the latest ledger, records the successful amount and separately reports club move errors. An uncertain response retains the pending marker across page reloads until the user explicitly resolves it. Selling and SBC submission remain outside this module.

Tests verify cheaper listings beyond initial results, no buy during find, exact-price and same-trade validation, expiry, account changes, version/foil rejection, concurrency, uncertain outcomes, successful buys with failed moves, and UI persistence. Tests use mocked EA services. No live account purchase was executed during development.


## Sequential bulk operations and listing, v0.4.0

`src/page/gallery-batch.js` owns a cancellable sequential queue. The UI snapshots each displayed per-card buy cap on the bulk purchase click, uses buyAtMost to refresh old previews without increasing the cap, and persists per-item pending markers before writes. Actual prices and purchased item IDs are retained. Missing offers can fail individually; uncertain outcomes, account changes and EA request failures stop the queue. A persistence failure after an accepted write is treated as uncertain, never automatically retried.

Listing requires explicit Gallery confirmation, a valid EA price step, a recorded purchased item ID, ownership match, tradeability, and no prior listing state. The exact item is moved to the Transfer pile and passed to services.Item.list(item, buy, buy, 3600). Both prices equal that item's purchase amount. Server range errors are surfaced rather than changing the reviewed price. A successful response records listed, never sold; pending or uncertain listings require manual resolution. Old records can be explicitly bound only to a unique owned tradable copy of the exact version. No duplicate-copy remapping, quick selling or discarding occurs.

The Item.list signature was cross-checked against the author's published transfer-market implementation at https://openuserjs.org/scripts/ckalgos/FUT_21_Autobuyer_Menu_with_TamperMonkey/source. That older source is API-reference evidence, not live FC27 validation. Current server acceptance of the listing arguments still needs the user's Web App trial.

The UI preserves FutFusion's violet/lime palette, isolates style selectors within the ledger, uses a compact three-stage workflow, a price/count/tax strip, collapsible card rows and a visible queue status. Cost details are collapsed. New tests cover capped bulk purchases, cancellation, storage failure, uncertain writes, exact owned item listing, confirmation gates, legacy ambiguity, and separate listed/sold states. A Playwright smoke test uses synthetic inventory with the real renderer and queue in Brave, exercises all three batch steps, and checks no horizontal overflow at 360px. No real purchases or listings were made by the development tests.


## Optional public EasySBC source, v0.5.0

Observed public endpoints: GET https://api-fc27.easysbc.io/gallery/sets returns category/set metadata with platform market grade summaries; GET /gallery/solutions/1 returns a source=market OGC Nice solution with per-grade item resource IDs and player data. GET /gallery/sets/ligue-1/ogc-nice corroborates the set ID and required 15 cards. These were fetched without login. The client bundle index-Dhfro0H2.js contains the corresponding Gallery request routes and the Platform header convention.

REA parent evidence ev_97a08af60ccc3981d219589b7e43531388f56540c5c3e5566ad0dc390ac2bc5d and summary ev_62d10b63a1911bae6858545c71c7f1ff9f5ad9b111683cbf62fb0cc9f4fe5361 retain a partial static analysis. Analysis of the 3MB bundle reached its 45-second limit; it does not establish complete application coverage or observed execution. Focused source inspection identified route strings and the cheapest-token ranking (tax loss / cumulative token reward), and independent public GETs plus the browser check validated the endpoints actually used by the adapter. No claim is made about unrelated/private endpoints.

New core module easysbc-gallery.js decodes the public schema, keeps resourceId as EA definition ID and assetId as base player ID, validates rarity, rating, foil identity and required card count, rejects first-owner assumptions, and skips cards based on the local account's memory rather than trusting source collected flags. Source prices remain referencePrice, never actual buy amounts or live market quotes. Imported set IDs are namespaced easysbc:<id> and merged additively into the separate ledger. Existing purchases and native Gallery state remain intact.

The only new host permission is api-fc27.easysbc.io. An isolated content script relays fixed catalog/solution messages to the service worker, which permits only GETs to those fixed paths from EA Web App senders. Credentials are omitted, redirects rejected, IDs validated and requests bounded. There is no arbitrary URL proxy, account token access or club upload. MAIN-world rendering uses the result as data and never executes remote application code.

Public-response fixtures exercise the decoder, exact identity, history skip, duplicates, malformed/private solutions and status-preserving imports. Worker tests check sender/path validation, GET-only and omitted credentials. The installed-extension check in a clean Brave profile successfully exercised the real worker/content bridge, fetched the current public catalog and OGC Nice S solution, imported all 15 cards into a fixture ledger, and verified no duplicates on repeated import. Its EA document was replaced with a local fixture; no real EA account or purchases were used.


## Manual normal-SBC editor and club-rule fixes, v0.6.0

New squad-editor.js evaluates an edited assignment without solving replacements. Removing a card leaves that required slot null; selecting an owned candidate replaces only the chosen slot and records a manualFixed assignment. The panel recalculates requirements, cost, rating and chemistry immediately and prefers EA chemistry when available. A separate re-solve action passes only manualFixed cards to the solver. Unsupported or incomplete assignments remain ineligible for automatic apply.

The inline picker searches the existing clubPool, filters by card-level requirements and optional position, excludes players already elsewhere in the squad, and offers an explicit opt-in to include protected cards. Protected filters are not silently disabled. Locked brick slots and points SBCs are not editable by this normal-SBC editor. Existing Change behavior remains available.

Specific CLUB_ID checks now use the raw card teamId, with clubId fallback for older objects, rather than the linked chemistry club. Chemistry and other grouping behavior stay separate. Solver neighbors now directly sample candidates matching unmet specific club/nation/league/quality constraints, making rare required-team players less dependent on random uniform sampling. Player uniqueness is based on base playerId when available, preventing two different versions of one player; apply preflight mirrors this check with databaseId. These changes improve constraint handling but cannot supply an eligible player absent from the permitted pool.

Unit tests cover removal without replacement, targeted additions, actual versus linked club IDs, OR-team requirements, protected manual fixed cards, EA chemistry revalidation, locked slots, duplicates and rare team candidates. The real panel browser check uses synthetic inventory and exercises the unmet-club case, removal, protected-card opt-in, manual selection, rule update and re-solving with the manual card retained. No real EA squad was modified in development.


## Partial normal-SBC drafts, v0.6.1

Supersedes the earlier normal-SBC apply feasibility gate: the user's explicit request permits applying draft squads with unmet/unsupported requirements or unfilled slots. Only actual selected club/storage DTOs are placed, preserving slot indices; nulls and generic market templates remain empty. Wrong challenge, unusable/missing owned items and duplicate players are still rejected. A zero-player draft does not clear the game squad. Reload verification also checks that intended empty slots did not retain old players. Results return count, empty, appliedSlots and partial status so the UI never marks an unfilled slot placed or implies the SBC is eligible for submission.

Added adapter tests for infeasible/unsupported drafts, missing first slot without compaction, market-template holes and zero-player no-op. The real panel browser test now removes one player, applies ten players despite the club-rule failure, checks the saved draft, then manually fills the gap and re-solves with the chosen player fixed. EA services are mocked; this is not a live EA account test. Points SBC behavior is unchanged.


## Native listing correction and single-click workflow, v0.7.0

Current shipped EA FC27 compiled_3.js (build query 11414) contains UTQuickListPanelView.setPriceLimits, setBidValue and setBuyNowValue. The native controls keep bid below Buy Now with UTCurrencyInputControl.getIncrementBelowVal / getIncrementAboveVal, and the controller sends Item.list(item, bidAmount, buyAmount, duration). The previous adapter sent equal bid and Buy Now values. This was a concrete mismatch with the native UI, inferred to explain the user's report of transfer-only outcomes; no logged-in failing transaction was observed during development. The extracted native controller excerpt and byte-source provenance were analyzed statically under REA parent ev_b514f79c41ce81ab66bfb81aebc44212f74dd07a436c725bc8071002e9719dc5 / summary ev_38601633b5a9cc2a91700d89044ed89d1c2e1699506ed1aec1014ac35f0c457b. Coverage is limited to the selected excerpt; dynamic service implementations remain outside that analysis.

The market adapter now loads missing native price limits, obtains the fresh transfer DTO, sets the starting bid to the correct tier below the unchanged purchase-price BIN, calls list once, and reads requestTransferItems up to three times to require an active selling state, exact owned item ID, nonempty trade ID and expected BIN. A transfer-only or ambiguous response never returns listed success and is not automatically retried. Native error.code is preserved in messages.

The new all queue mode accepts an explicit total purchase budget and optional existing per-card price caps. For each entry it searches, buys within the remaining cap, persists the owned item identity and actual cost, verifies the exact instance in Club.search, records it in FutFox's local club/Gallery memory, then opens and verifies the listing. No per-card confirmation is required in this explicitly invoked workflow. Club presence is the chosen registration criterion from the user's stated Gallery behavior; it does not claim a separate Gallery reward API acknowledgement. Previously bought cards resume without another buy. Old unverified listed markers are reconciled against fresh active/inactive transfer state; only verified active records are skipped. Duplicate ownership is never resolved arbitrarily.

listingVerified distinguishes old request-only markers from confirmed active listings. Pending and uncertain writes remain persistent across page reloads. Total spent counts confirmed buys, does not recycle unreceived sale proceeds, and halts on an uncertain write. The UI prominently exposes the total budget and Tümünü yap button, while keeping separate controls available. An explicit note explains lower starting bids, unchanged BIN, auction risk and tax.

Unit coverage now includes native price-tier boundaries, successful list responses without active auctions, exact club-entry reads, budget-limited one-click processing, continuation of old buys, recovery of inactive legacy listings, no duplicate active listing, and uncertain outcome stops. The real renderer/queue Brave smoke test completes all four synthetic cards from one workflow click without manual Gallery approval, with existing buys resumed and the 3,700-coin budget respected. No real EA purchase or listing was performed by the tests.


## Current fetched-team isolation, v0.7.1

The ledger now stores an explicit activeBatch with an ID, exact card keys, target ID and display name. addPlan replaces this scope instead of unioning it with history; source set memberships are never used to broaden it. Already purchased historical entries are excluded from a new team's keys, while newly bought cards remain inside the current frozen batch until its sale steps finish. No implicit batch is inferred from legacy records. Old entries remain preserved for bookkeeping.

All bulk controls and the default rows use activeEntries; history is read-only. Changing EasySBC's set/grade/platform or requesting a fresh solution invalidates the old active batch before showing new results. Explicit import activates the newly reviewed missing cards. New batches reset old purchase budgets. The queue snapshots current keys, checks the active batch ID before further entry reads, and never discovers additional old entries after the selected team is complete. In-flight results can still be saved into history, but a changed group stops further operations.

Regression tests cover old compatible players not being selected, prior bought copies not adopted by a new team, current-batch resumption, legacy no-auto-run, and budget reset. The browser smoke fixture contains two current players and two old purchased players; only the current two are bought/listed and both historical players remain unchanged.


## Market search robustness and visible failures, v0.7.2

The user's image establishes a stopped first-item search but does not expose its original EA code. The exact live cause cannot be proven from that screenshot. Two concrete request handling defects were corrected: bisection formerly sent arbitrary integer maxBuy bounds, including below the 200-coin BIN floor; and the observable wrapper treated error=false/0 as non-null errors despite success=true. Price refinement now floors midpoints to valid native tiers and terminates when no lower legal tier exists. Refinement queries are spaced by one second. Only explicit real errors reject otherwise successful responses.

The final batch summary preserves the failing player and actual error message as a separate visible line, including rate-limit/session hints for known codes. Tests enforce discrete search bounds, minimum-price termination, benign error fields, and error visibility after progress is replaced by a completion summary. The browser mock additionally verifies that a 429 result stays visible with the player's name. No logged-in EA failing request was captured; the release improves request validity and diagnosis without claiming a verified live ban/rate-limit resolution.
