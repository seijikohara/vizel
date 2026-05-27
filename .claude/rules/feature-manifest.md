---
paths:
  - "packages/core/src/feature-manifest.ts"
  - "packages/{react,vue,svelte}/**/*"
  - "tests/ct/scenarios/**"
  - "tests/ct/parity/**"
---

# Feature Manifest

Vizel v2 expresses cross-framework feature parity as TypeScript, not prose. The Single Source of Truth (SSOT) is `packages/core/src/feature-manifest.ts`. The full rationale lives in [ADR-0002](../../docs/adr/ADR-0002-feature-manifest-as-parity-ssot.md).

> **Status as of 2026-05-28**: this rule documents the target contract. The manifest file lands in Phase 1 alongside `scripts/check-parity.ts`. Until then, treat this rule as the design specification for that work.

## What the manifest contains

Each feature entry exports a `VizelFeatureDefinition`:

- `id` — stable kebab-case identifier (`"bubble-menu"`, `"slash-menu"`, …).
- `category` — `"menu" | "popover" | "form" | "overlay" | "extension"`.
- `specBuilder` — optional reference to the pure spec builder in `@vizel/core/builders/`.
- `controllerFactory` — optional reference to the controller in `@vizel/core/controllers/` or `@vizel/headless/`.
- `ariaContract` — declared role, labelling, and state attributes.
- `keyboardMap` — key → command bindings.
- `scenarios` — array of scenario IDs under `tests/ct/scenarios/<feature-id>/`.
- `adapters` — declared adapter symbols for React, Vue, and Svelte (component name, optional hook or composable or rune name).

## Workflow: add a feature

1. Append a `VizelFeatureDefinition` entry to `VIZEL_FEATURE_MANIFEST` in `packages/core/src/feature-manifest.ts`.
2. Implement the feature in each adapter under `packages/{react,vue,svelte}/src/`.
3. Create the scenario folder at `tests/ct/scenarios/<feature-id>/` with a typed scenario interface.
4. Create per-framework spec files under `tests/ct/{react,vue,svelte}/specs/` that invoke the scenario.
5. Run `pnpm check:parity` locally; the same script runs in `pre-push` and CI.

## Workflow: modify a feature

1. Update the manifest entry (props, ARIA, keyboard map, scenarios) in the same pull request as the adapter changes.
2. Update all three adapters in the same pull request. The parity check fails the build if any adapter drifts.
3. Update scenarios under `tests/ct/scenarios/<feature-id>/` to match the new behaviour.

## Workflow: remove a feature

1. Delete the manifest entry.
2. Delete the adapter implementations.
3. Delete the scenario folder.
4. Note the removal in `docs/guide/migration-v1-to-v2.md` (or the next major release's migration guide).

## CI verification

- `pnpm check:parity` — TypeScript-level check: every manifest entry exports a matching symbol from each adapter.
- `pnpm test:ct:parity` — Playwright-level check: every manifest entry has a scenario that runs across every framework.
- `pnpm test:ct:scenarios` — scenarios compile without errors.

The lefthook `pre-push` hook runs `pnpm check:parity`. The CI matrix runs all three.
