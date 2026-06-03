# ADR-0012: Playwright Component Tests rebuilt in three layers

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

The v1 Playwright Component Tests (CT) layout shares 32 `.scenario.ts` files across React, Vue, and Svelte. The shared scenarios bake in API-symmetry assumptions: identical event names, identical prop shapes, identical ref patterns. [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) drops symmetry, so the v1 scenario contract no longer fits.

Patching the v1 scenarios to handle per-framework variation would erode the value of "shared" scenarios while keeping the maintenance cost. A clean rebuild is cheaper than a series of compromises.

## Decision

Rebuild the Playwright CT in three layers:

- **`tests/ct/scenarios/v2/<feature-id>/`** — framework-neutral assertions driven by `VIZEL_FEATURE_MANIFEST`. Each scenario describes *what* a feature must deliver: DOM nodes, ARIA attributes, keyboard interactions, Markdown round-trip outputs, focus transitions. Per-framework spec files call into these scenarios via a framework-specific mount helper and an interaction helper. Scenario assertions live at the rendered-DOM level, not the API-shape level.
- **`tests/ct/<framework>/specs/<feature-id>.spec.{tsx,ts}`** — framework-idiomatic harness. The harness mounts the component using the framework's idiomatic API (`v-model` for Vue, `bind:markdown` for Svelte, hooks plus refs for React) and runs the shared scenario. The harness also asserts API-shape correctness for that framework (e.g. `defineModel<string>("markdown")` round-trips, Svelte's `onclose` fires, React's selector subscription skips re-renders on irrelevant transactions).
- **`tests/ct/parity/check-scenarios.ts`** — manifest-driven parity check. It reads `VIZEL_FEATURE_MANIFEST`, asserts every entry has a scenario folder under `tests/ct/scenarios/v2/` on every framework, and fails CI on drift. The companion `scripts/check-ct-parity.ts` asserts the per-framework spec files stay in lockstep.

The v1 `tests/ct/scenarios/*.scenario.ts` files are removed, not migrated. The v1 file list serves only as a behavioural reference for which DOM/ARIA outcomes the v2 scenarios must cover.

## Update (2026-06-03)

The Decision above stands as the immutable record of intent. The shipped implementation supersedes two of its clauses. This Update governs the current contract.

Superseded clauses:

1. The clause mandating one scenario folder per feature under `tests/ct/scenarios/v2/<feature-id>/`. The `tests/ct/scenarios/v2/` tree shipped as 23 stub folders whose `run()` returned `Promise.reject("pending")`; the stubs verified no behaviour. The tree is deleted.
2. The clause "The v1 `tests/ct/scenarios/*.scenario.ts` files are removed, not migrated." The flat `tests/ct/scenarios/*.scenario.ts` files are the real behavioral coverage. They are retained, not removed.

Shipped flat-scenario contract:

- Each `tests/ct/scenarios/<feature>.scenario.ts` exports one or more `test*` functions that assert rendered DOM, ARIA, and interaction outcomes. The functions are framework-neutral; they receive a Playwright `Locator` and `Page`.
- Each per-framework spec under `tests/ct/{react,vue,svelte}/specs/` imports the scenario through the literal specifier `../../scenarios/<feature>.scenario` and invokes its `test*` functions inside Playwright `test(...)` blocks. Spec filenames differ across frameworks (the `Use*`/`Create*`/`Get*` idiom), so coverage is matched by import specifier, never by filename.

`pnpm check:scenarios` (`tests/ct/parity/check-scenarios.ts`) now proves invoked-test coverage rather than folder presence. For every flat scenario it asserts (1) the scenario exports at least one `test*` function and (2) each framework's spec layer imports the scenario specifier and invokes at least one of its `test*` exports. The check exits non-zero with a precise message when a scenario exposes no `test*` export, or when a framework stops importing or invoking it. The companion `scripts/check-ct-parity.ts` still asserts per-framework spec-name balance.

## Consequences

Positive:

- Per-framework spec files own the framework-idiomatic harness. Shared scenarios focus on what a feature must deliver, not how each framework calls into it.
- Parity stays observable. The `parity/` layer fails CI if a framework omits a feature.
- Adapter rewrites in Phase 3 plug into the scenarios cleanly because the scenarios assert rendered behaviour, not API shape.

Negative:

- Existing v1 spec files do not migrate as-is. Phase 3a, 3b, and 3c rewrite each adapter's spec layer against the new scenarios.
- The CT directory grows a third layer. The rule file `.claude/rules/testing.md` is rewritten to explain the three-layer split.

Follow-up:

- Phase 1.5 lands the scenario foundation before any adapter rewrite consumes it.
- Phase 3a, 3b, and 3c rewrite each adapter's spec files against the scenarios.
- Phase 5 runs `pnpm check:scenarios` and `pnpm check:ct-parity` in the `Quality + Parity` CI job.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R9, Phase 1.5)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md)
