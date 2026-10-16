# Combat workbench — first reference slice

Open `/combat` from the sidebar. This is a working first slice of the proposed platform, not completion of the full master specification.

## Run and verify

Use Node 22 and pnpm. Run `pnpm install --frozen-lockfile`, `pnpm dev`, then open `http://localhost:3000/combat`. Run `pnpm test:combat` for the numerical suite and `pnpm build` for production. No API credentials are needed for this page. Existing wish and account features retain their original requirements.

## Architecture and canonical data

- `src/lib/combat/data.js`: explicit ruleset, provenance, supported attacks, fresh default project factory.
- `src/lib/combat/engine.js`: pure stat, damage, resonance, and chronological action simulation functions. UI and comparison share this engine.
- `src/lib/combat/project.js`: strict bounded import boundary; copies known fields only. Versions and unsupported actions fail closed.
- `src/routes/combat.svelte`: editor, result breakdown, party conditions, timeline, combat log, comparison capture, local persistence, import preview, export.
- `tests/combat.test.js`: independent arithmetic cases, boundary tests, feasibility and input-validation tests.

Project schema v1 includes `ruleset`, `name`, aggregate `build` stats, `enemy` mitigation, four `party` IDs, explicit `reaction`, `initialEnergy`, a manual `buff` window, an ordered `actions` list, and `cycles`. Percentages are stored as percent points (50 means 50%). Times use seconds. Values are validated before calculation. External adapters must normalize into a supported schema and preserve provenance; unsupported payloads must not be guessed into compatibility.

The next schema should separate CharacterBuild (identity, level/ascension/talents/constellation), WeaponInstance (level/refinement and passive state), five ArtifactInstances (slot, set, main/substats), BuffDefinition/Instance (source, predicates, stacking, duration, scope), and RotationAction (actor, action ID, timing overrides). It must introduce a migration rather than silently reinterpret v1 inputs.

## Sources and integration strategy

References inspected 2026-10-16:

- Paimon.moe source: https://github.com/MadeBaruna/paimon-moe — SvelteKit/Tailwind, MIT code. Existing game art retains its upstream rights; the MIT license does not independently license HoYoverse assets. No account-data API is inferred from this repository.
- Formula: https://library.keqingmains.com/combat-mechanics/damage/damage-formula
- Amber: https://library.keqingmains.com/characters/pyro/amber — level 90 base ATK 223, ascension ATK 24%; talent-9 charged multiplier 2.108, N1 0.6636, full burst 8.5925; burst cost 40, cooldown 12s, A1 CRIT bonus 10 percentage points.
- Resonance: https://library.keqingmains.com/combat-mechanics/elemental-effects/elemental-resonance — Pyro ATK bonus 25%, requires a full party.

KQM pages are mechanic references, not account APIs. Only workbench JSON is an implemented import adapter. GOOD file support and documented Enka public showcase access are candidates requiring separate schema/API/license review. Akasha, Genshin Center, Lunaris, Seelie, HoYoLAB and other requested services are not integrated or claimed to expose inventory APIs. No private-account scraping, sign-in, or remote upload occurs on this page. Local save uses a distinct browser storage key.

## Calculation pipeline

Base character + supplied weapon ATK → ascension/equipment/resonance/manual buff percentages → flat ATK → attack talent → matching damage bonus → defense → resistance → supplied charged-shot amplification → clamped expected CRIT. Burst adds A1 CRIT and snapshots the manual buff at action start. Intermediates are displayed without rounding the calculation.

## Accuracy boundaries

The data is a reviewed legacy subset, not pinned to a verified complete current game patch. Numerical tests validate implementation arithmetic, not an in-game damage capture or independent full-calculator parity benchmark.

The supported character is Amber at 90/A6/C0/talent 9. Weapon base ATK and aggregate artifact/weapon contributions are manually supplied, with sample values clearly marked. There is no equipment catalog, automatic passive computation, five-slot artifact editor, or automatic main/substat legality check. Burst uses the reference total rather than multiplying rounded per-wave values.

Charged-shot and N1 action durations derive from 96 and 26 frames at 60 fps. The modeled burst window is explicitly approximate at 3.2 seconds. All damage is posted at action end; buffs are sampled at action start. Short-range shots, all hits connecting, no weak points, stationary enemy, and no cancellations are assumed. The damage curve interpolates action endpoints, not individual hit times. Shared enemy resistance must match both elements when mixing physical and Pyro attacks.

Manual Melt/Vaporize assumes aura exists for every charged shot. Aura consumption, ICD, enemy motion, particle generation, ER/funneling, skill summons and teammate damage are absent. No reactions are applied to burst waves. Energy and cooldown persist across cycles; failed actions produce zero damage and make the sequence infeasible. No optimizer or sustained team-DPS claim is made. Other resonances, Hexerei and Lunar mechanics remain unsupported.

## Prioritized continuation

1. Pin licensed game-data revision and add independently verified calculation fixtures and actual game comparison evidence.
2. Add typed five-slot equipment/build schemas and validated GOOD adapter, preserving originals through import previews.
3. Add hit-event scheduling, skill snapshots, particles/energy recharge, aura/ICD, and source-based buff lifecycles with regression cases.
4. Expand one character module at a time; enable team damage only for supported mechanics.
5. Add constrained candidate search using the same simulator, including availability, energy and repeatability checks.
6. Implement documented external adapters with rate limiting, consent, provenance and graceful failures; verify version-specific mechanics independently.
