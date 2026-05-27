# ADR-0012: Playwright Component Tests rebuilt in three layers

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

The v1 Playwright Component Tests (CT) layout shares 32 `.scenario.ts` files across React, Vue, and Svelte. The shared scenarios bake in API-symmetry assumptions: identical event names, identical prop shapes, identical ref patterns. [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) drops symmetry, so the v1 scenario contract no longer fits.

Patching the v1 scenarios to handle per-framework variation would erode the value of "shared" scenarios while keeping the maintenance cost. A clean rebuild is cheaper than a series of compromises.

## Decision

Rebuild the Playwright CT in three layers:

- **`tests/ct/scenarios/<feature-id>/`** — framework-neutral assertions driven by `VIZEL_FEATURE_MANIFEST`. Each scenario describes *what* a feature must deliver: DOM nodes, ARIA attributes, keyboard interactions, Markdown round-trip outputs, focus transitions. Per-framework spec files call into these scenarios via a framework-specific mount helper and an interaction helper. Scenario assertions live at the rendered-DOM level, not the API-shape level.
- **`tests/ct/<framework>/<feature-id>.spec.{tsx,ts}`** — framework-idiomatic harness. The harness mounts the component using the framework's idiomatic API (`v-model` for Vue, `bind:markdown` for Svelte, hooks plus refs for React) and runs the shared scenario. The harness also asserts API-shape correctness for that framework (e.g. `defineModel<string>("markdown")` round-trips, Svelte's `onclose` fires, React's selector subscription skips re-renders on irrelevant transactions).
- **`tests/ct/parity/<feature-id>.parity.ts`** — manifest-driven parity check. Reads `VIZEL_FEATURE_MANIFEST`, asserts every entry has scenario coverage on every framework, fails CI on drift.

The v1 `tests/ct/scenarios/*.scenario.ts` files are removed, not migrated. The v1 file list serves only as a behavioural reference for which DOM/ARIA outcomes the v2 scenarios must cover.

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
- Phase 5 adds a CI job for `pnpm test:ct:parity`.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R9, Phase 1.5)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md)
