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
