# ADR-0002: Feature manifest as parity SSOT

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

[ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) removes API symmetry as a binding rule but keeps feature parity. Parity requires a Single Source of Truth (SSOT) that lists every advertised feature and asserts that each adapter implements it.

v1 expressed this contract in prose under `.claude/rules/cross-framework.md` (472 lines). Prose drifts. Reviewers must read the rules and compare them with code. CI cannot enforce the link.

## Decision

The parity SSOT moves into TypeScript as `packages/core/src/feature-manifest.ts`. The manifest is a frozen array of typed feature definitions:

- Each entry carries an `id` (`"bubble-menu"`, `"slash-menu"`, etc.), a `category`, an optional spec builder reference, an optional controller factory reference, an ARIA contract, a keyboard map, and the list of test scenarios that cover it.
- Each entry also declares the expected adapter symbol for React, Vue, and Svelte (component name, optional hook or composable or rune name).
- The manifest is the authoritative parity contract. The TypeScript type system enforces structural integrity at compile time. A CI script (`scripts/check-feature-parity.ts`) enforces cross-package coverage at build time.

The CI script imports the manifest, then dynamically imports the declared symbol from each of `@vizel/react`, `@vizel/vue`, and `@vizel/svelte`. Missing entries fail the build. The script runs on `pre-push` and as a CI job before the test matrix.

## Consequences

Positive:

- Parity drift cannot land. CI fails before the matrix tests even run.
- The manifest doubles as documentation. New contributors find the feature catalogue in a single typed module.
- The manifest drives test coverage: every entry links to scenario files under `tests/ct/scenarios/v2/<feature-id>/`.

Negative:

- Adding a feature requires touching the manifest, every adapter, and the scenario folder. The cost is intentional; it prevents partial implementations from shipping.
- Manifest schema changes require coordinated updates across all adapters in the same pull request.

Follow-up:

- Implement `feature-manifest.ts` in Phase 1.
- Implement `scripts/check-feature-parity.ts` and wire it into lefthook + CI.
- Delete `.claude/rules/cross-framework.md` as part of the same pull request (see [ADR-0006](./ADR-0006-retire-cross-framework-rule.md)).

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (Phase 1, R2)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0006](./ADR-0006-retire-cross-framework-rule.md), [ADR-0012](./ADR-0012-playwright-ct-three-layer-rebuild.md)
