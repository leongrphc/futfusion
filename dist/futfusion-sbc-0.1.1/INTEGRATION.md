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
