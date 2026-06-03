---
paths:
  - "packages/core/src/feature-manifest.ts"
  - "packages/{react,vue,svelte}/**/*"
  - "tests/ct/scenarios/**"
  - "tests/ct/parity/**"
---

# Feature Manifest

Vizel expresses cross-framework feature parity as TypeScript, not prose. The Single Source of Truth (SSOT) is `packages/core/src/feature-manifest.ts`. The full rationale lives in [ADR-0002](../../docs/adr/ADR-0002-feature-manifest-as-parity-ssot.md). `scripts/check-feature-parity.ts` verifies coverage against the manifest.

## What the manifest contains

Each feature entry exports a `VizelFeatureDefinition`:

- `id` — stable kebab-case identifier (`"bubble-menu"`, `"slash-menu"`, …).
- `category` — `"menu" | "popover" | "form" | "overlay" | "extension"`.
- `specBuilder` — optional reference to the pure spec builder in `@vizel/core/builders/`.
- `controllerFactory` — optional reference to the controller in `@vizel/core/controllers/` or `@vizel/headless/`.
- `ariaContract` — declared role, labelling, and state attributes.
- `keyboardMap` — key → command bindings.
- `scenarios` — array of scenario IDs whose behaviour the flat scenarios under `tests/ct/scenarios/<feature>.scenario.ts` cover.
- `adapters` — declared adapter symbols for React, Vue, and Svelte (component name, optional hook or composable or rune name).

## Workflow: add a feature

1. Append a `VizelFeatureDefinition` entry to `VIZEL_FEATURE_MANIFEST` in `packages/core/src/feature-manifest.ts`.
2. Implement the feature in each adapter under `packages/{react,vue,svelte}/src/`.
3. Create the flat scenario at `tests/ct/scenarios/<feature>.scenario.ts` exporting one or more `test*` functions.
4. Create per-framework spec files under `tests/ct/{react,vue,svelte}/specs/` that import the scenario through `../../scenarios/<feature>.scenario` and invoke its `test*` functions.
5. Run `pnpm check:feature-parity` locally; the same script runs in `pre-push` and CI.

## Workflow: modify a feature

1. Update the manifest entry (props, ARIA, keyboard map, scenarios) in the same pull request as the adapter changes.
2. Update all three adapters in the same pull request. The parity check fails the build if any adapter drifts.
3. Update the flat scenario at `tests/ct/scenarios/<feature>.scenario.ts` to match the new behaviour.

## Workflow: remove a feature

1. Delete the manifest entry.
2. Delete the adapter implementations.
3. Delete the flat scenario `tests/ct/scenarios/<feature>.scenario.ts` and its per-framework specs.
4. Note the removal in `docs/guide/migration-v1-to-v2.md` (or the next major release's migration guide).

## ARIA and keyboard contract: static now, runtime later

The manifest's `ariaContract` (`role` + `requiredAttributes`) and `keyboardMap` are enforced in two phases.

- **Phase 1 (static, enforced now).** `pnpm check:aria-contract` (`scripts/check-aria-contract.ts`) reads source only. For every feature whose `ariaContract` declares a `role` or a non-empty `requiredAttributes`, the check resolves each adapter component under `packages/<fw>/src/components/` and asserts that the declared role and each attribute appears in the component source — as a literal attribute or, when the component renders the value off a builder spec (`role={spec.root.role}`), through the feature's builder file under `packages/core/src/builders/`. For `keyboardMap`, the check asserts every binding key belongs to the union of the `VizelCommand` identifiers parsed from `packages/core/src/commands/registry/*.ts` and the `VIZEL_KEYBOARD_COMMANDS` navigation-verb vocabulary the manifest exports. Companion-only features (no adapter `component`) carry no component source; the check skips them with a logged advisory note rather than passing silently. The check verifies presence in source, not the rendered Document Object Model (DOM).
- **Phase 2 (runtime, planned).** Axe assertions and keyboard-interaction tests on the live DOM are deferred to the accessibility CI follow-up. The JSDoc for `VizelAriaContract` and `VizelKeyboardMap` records this split; do not restore "must honour" wording that overstates the current static guarantee.

When you change a feature's `ariaContract` or `keyboardMap`, run `pnpm check:aria-contract` locally; the same check runs on `pre-push` and in CI. If a component and the manifest disagree on a role, fix whichever side is genuinely wrong under WAI-ARIA — do not relax the check.

## CI verification

- `pnpm check:feature-parity` — static export-surface check. The script parses each adapter's `src/index.ts` with the TypeScript compiler API and computes its effective export set: the adapter's own named exports unioned with the `@vizel/core` surface that the mandatory `export * from "@vizel/core"` forwards. The Core surface is resolved by recursively walking the re-export declarations rooted at `packages/core/src/index.ts`. The check reads source only — it imports no built artefacts — and fails when any adapter omits a manifest-declared component or companion symbol.
- `pnpm check:aria-contract` — static ARIA / keyboard contract check (Phase 1). See the section above for the resolution rules and the static-versus-runtime split.
- `pnpm check:ct-parity` — Playwright-level check: every manifest entry has a scenario that runs across every framework.
- `pnpm check:scenarios` — flat-scenario coverage check (`tests/ct/parity/check-scenarios.ts`). For every `tests/ct/scenarios/<feature>.scenario.ts`, the check asserts the scenario exports at least one `test*` function and that each framework's spec layer imports the scenario through `../../scenarios/<feature>.scenario` and invokes at least one of its `test*` exports. The check matches the import specifier, not the spec filename, so the `Use*`/`Create*` idiom does not break detection.

The lefthook `pre-push` hook and the `Quality + Parity` CI job run these checks.
