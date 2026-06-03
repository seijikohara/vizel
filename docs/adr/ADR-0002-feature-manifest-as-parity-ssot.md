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

The CI script imports the manifest, then resolves each declared symbol against an adapter's statically computed export surface — it never imports built artefacts. The script parses each adapter's `src/index.ts` with the TypeScript compiler API and computes the adapter's effective export set: the adapter's own named exports unioned with the public surface of `@vizel/core`, which every adapter forwards through the mandatory `export * from "@vizel/core"`. The script resolves the Core surface by recursively walking the re-export declarations rooted at `packages/core/src/index.ts`. A manifest-declared symbol that is absent from an adapter's effective set fails the build. The script runs on `pre-push` and as a CI job before the test matrix.

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

## Update 2026-06-03: ARIA / keyboard contract gains static enforcement

The original manifest carried `ariaContract` (`role` + `requiredAttributes`) and `keyboardMap` on every feature, but no check enforced either field. The contract read as binding ("every adapter implementation must honour") while remaining advisory — a component could render any role, or none, without failing a gate.

`scripts/check-aria-contract.ts` now enforces these fields statically (Phase 1). For every feature whose `ariaContract` declares a `role` or a non-empty `requiredAttributes`, the check resolves each adapter component and asserts that the declared role and each attribute appears in the component source — as a literal or, when the component renders the value off a builder spec, through the feature's builder file under `packages/core/src/builders/`. For `keyboardMap`, the check asserts every binding key belongs to the union of the `VizelCommand` registry identifiers and the `VIZEL_KEYBOARD_COMMANDS` navigation-verb vocabulary the manifest exports, so a binding name cannot rot into a string the editor never handles. The check reads source only and runs on `pre-push` and in the `Quality + Parity` CI job, alongside `check:feature-parity`.

Runtime enforcement — axe assertions and keyboard-interaction tests on the live DOM — is **phased** (Phase 2). It is deferred to the accessibility CI follow-up, because that job currently runs on `workflow_dispatch` and does not gate pull requests. The `VizelAriaContract` and `VizelKeyboardMap` JSDoc now scopes the guarantee to static presence and drops the over-stated "must honour" wording.

Reconciling the manifest with the components surfaced five role contradictions, fixed by choosing the genuinely-correct WAI-ARIA role per case: `bubble-menu` `menu` -> `toolbar`; `toolbar-dropdown` `menu` -> `listbox`; `node-selector` `menu` -> `listbox`; `outline` `navigation` -> `tree`; `find-replace` dropped `aria-modal` from `requiredAttributes` because the panel is non-modal.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (Phase 1, R2)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0006](./ADR-0006-retire-cross-framework-rule.md), [ADR-0012](./ADR-0012-playwright-ct-three-layer-rebuild.md)
