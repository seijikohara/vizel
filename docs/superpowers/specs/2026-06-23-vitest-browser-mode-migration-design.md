# Vitest Browser Mode migration design

- Date: 2026-06-23
- Status: Approved (brainstorming)
- Supersedes (on completion): ADR-0012 (Playwright Component Tests rebuilt in three layers)

## Context

Vizel runs every browser-level test on Playwright's experimental Component
Testing (CT) runner: component behavior (`tests/ct/`), accessibility
(`tests/a11y/`), visual regression (`tests/visual/`), and the Markdown
round-trip suite (`tests/markdown-roundtrip/`). Each suite ships a
`playwright-ct.config.ts`, and the component suite spans 35 shared scenarios
across React, Vue, and Svelte plus a parity harness.

The Playwright CT runner is experimental and constrains the toolchain. The
`@playwright/experimental-ct-svelte` package lags the Playwright release line
(latest 1.58.2, no 1.59+), which caps the entire Playwright family at 1.58.2
and blocks routine dependency updates (Renovate #626). Vitest Browser Mode is
now a first-class feature (Vitest 4.x) with official framework render
libraries and a Playwright automation provider, so it removes the experimental
CT dependency while keeping real-browser fidelity.

## Goals

- Replace the Playwright CT runner with Vitest Browser Mode across all four
  browser suites (component, a11y, visual, Markdown round-trip).
- Preserve the cross-framework parity guarantee (ADR-0001, ADR-0002): one
  shared scenario per behavior, executed identically on React, Vue, and Svelte.
- Keep real-browser execution on Chromium, Firefox, and WebKit through the
  Playwright provider.
- Remove `@playwright/experimental-ct-*` and the `playwright test` runner from
  the test pipeline, unblocking the Playwright-family dependency cap.
- Migrate visual regression to Vitest's `toMatchScreenshot`.

## Non-goals

- Rewriting test behavior. Each migrated scenario asserts the same outcome as
  its Playwright predecessor.
- Removing the `playwright` library itself. Vitest Browser Mode drives browsers
  through the Playwright provider (`@vitest/browser-playwright`); the change
  removes the Playwright **test runner / CT**, not Playwright automation.
- Changing product code under `packages/`. The migration touches `tests/`,
  configuration, CI, and docs only.

## Approach

Approach A — preserve the three-layer architecture and swap only the runner.
The shared scenarios, per-framework specs, and parity harness stay; the
Playwright CT runner becomes Vitest Browser Mode and the scenario API is ported
to Vitest's interaction primitives. This keeps the parity invariant intact and
limits churn to the runner boundary. Alternatives B (relax the shared-scenario
layer for idiomatic per-framework tests) and C (operate only on the global
`page`, dropping the component-vs-page distinction) were rejected: B weakens the
parity guarantee, and C loses portal scoping.

## Target architecture

### Runner and providers

- Vitest 4.x with `@vitest/browser-playwright`. The Browser Mode config sets
  `test.browser.provider: playwright()` and one `instances` entry per browser.
- Component suite runs Chromium, Firefox, and WebKit. The a11y, visual, and
  Markdown round-trip suites run Chromium only, matching the current matrix.
- The exact Vitest and provider versions are pinned in Phase 0 and recorded in
  the new ADR.

### Layout and scenario contract

- Shared scenarios stay framework-neutral under `tests/ct/scenarios/*.scenario.ts`.
- Per-framework specs mount a fixture with the official render library
  (`vitest-browser-react`, `vitest-browser-vue`, `vitest-browser-svelte`) and
  call the shared scenario.
- The scenario signature changes from Playwright's `(component: Locator, page:
  Page)` to a Vitest-neutral contract built on `render()`'s returned `screen`
  plus the `page` and `userEvent` globals from `@vitest/browser/context`.
  Assertions use `expect.element(...)`. Phase 0 fixes the exact signature; the
  remaining phases follow it verbatim.
- Interaction maps as: `page.keyboard.type` -> `userEvent.type` /
  `userEvent.keyboard`; `component.locator(sel)` -> `screen` locator queries
  scoped to the mounted root; `page.locator(portalSel)` -> `page.getBy*` on the
  document for portals.

### Per-suite handling

- Component (`tests/ct/`): the bulk of the work — 35 scenarios x 3 frameworks
  plus fixtures.
- Accessibility (`tests/a11y/`): replace `@axe-core/playwright` with `axe-core`
  run inside the Vitest browser context against the mounted subtree.
- Visual (`tests/visual/`): replace Playwright `toHaveScreenshot` with Vitest
  `toMatchScreenshot`. Baselines are re-recorded; this is the highest-risk
  phase (see Risks).
- Markdown round-trip (`tests/markdown-roundtrip/`): runs the round-trip matrix;
  evaluate whether it needs the browser at all or can run as a node Vitest suite.
- Coverage: replace `c8` with Vitest's built-in V8 coverage.

### Parity harness

- `check:scenarios` and `check:ct-parity` stay as the parity guarantee. Both
  adapt to the new spec filenames and import specifiers. The
  shared-scenario-imported-and-invoked-by-every-framework contract is unchanged.

### Continuous integration

- The `.github/actions/test` composite action and the workflow jobs switch from
  `playwright test` to `vitest run` (Browser Mode). The framework x browser
  matrix shape is preserved.

### Dependencies

- Add: `vitest`, `@vitest/browser-playwright`, `vitest-browser-react`,
  `vitest-browser-vue`, `vitest-browser-svelte`, `axe-core`, the Vitest V8
  coverage provider.
- Remove (final phase): `@playwright/experimental-ct-react`,
  `@playwright/experimental-ct-vue`, `@playwright/experimental-ct-svelte`,
  `c8`, every `playwright-ct.config.ts`, and the `playwright test` scripts.
  `playwright` stays as the Vitest browser provider dependency.

### Decision record

A new ADR supersedes ADR-0012. It records the runner choice, the provider, the
version pins, and the preserved three-layer parity model.

## Phased rollout

Each phase is an independent pull request with its own implementation plan.

- Phase 0 — PoC. Migrate one or two React component scenarios (for example the
  editor scenario) to Vitest Browser Mode. Establish the config, fixture render,
  scenario contract, parity-harness adaptation, and CI wiring. Both runners may
  coexist during this phase.
- Phase 1 — All React component scenarios on Vitest.
- Phase 2 — Vue and Svelte component scenarios on Vitest; restore full parity.
- Phase 3 — Accessibility suite on Vitest with `axe-core`.
- Phase 4 — Visual suite on `toMatchScreenshot` and the Markdown round-trip
  suite.
- Phase 5 — Remove the Playwright CT runner, configs, scripts, and
  `@playwright/experimental-ct-*`; update CI, the new ADR, and docs
  (`.claude/rules/testing.md`, ADR index).

## Phase 0 (PoC) scope and exit criteria

Scope:

- Add Vitest Browser Mode config for the React component suite.
- Port the editor scenario (and its fixture) to the Vitest scenario contract.
- Run it on Chromium, Firefox, and WebKit.
- Adapt the parity harness to recognize the new spec, or scope the harness so
  both runners pass during coexistence.

Exit criteria:

- The ported scenario passes on all three browsers locally and in CI.
- The scenario contract and fixture pattern are documented well enough for
  Phases 1-4 to copy without redesign.
- `pnpm typecheck`, `pnpm lint`, and the parity checks pass.

## Risks and mitigations

- Visual baselines (highest). `toMatchScreenshot` baselines differ from
  Playwright snapshots and must be re-recorded; cross-environment rendering
  drift can cause flakiness. Mitigation: isolate visual to Phase 4, re-record
  baselines in the CI environment, and keep the suite `workflow_dispatch`-gated
  (its current status) until stable.
- Svelte 5 support in `vitest-browser-svelte`. Mitigation: verify Svelte 5
  rendering in an early spike during Phase 0/2; if unsupported, raise it as a
  blocking decision before Phase 2.
- Interaction-API differences. `userEvent` semantics differ from Playwright's
  `page.keyboard`. Mitigation: the editor relies on input rules and shortcuts;
  validate these in Phase 0 and encode the mapping in the scenario contract.
- CI runner stability. The a11y and md-roundtrip suites already hang
  intermittently on the GitHub runner. Mitigation: keep them `workflow_dispatch`
  during migration and re-evaluate gating after the runner-side cause is fixed.
- Provider API drift between Vitest 3 and 4. Mitigation: pin exact versions in
  Phase 0 and target the latest stable line.

## Verification of the migration

- Each phase keeps `pnpm typecheck`, `pnpm lint`, and the parity checks green.
- Migrated scenarios assert the same outcomes as the Playwright originals; the
  diff is runner and API, not behavior.
- CI runs the framework x browser matrix per suite as today.

## Open items (resolved during Phase 0)

- Exact Vitest and `@vitest/browser-playwright` version pins.
- Final spec filename convention and the parity-harness import specifier.
- The exact `toMatchScreenshot` options and baseline storage layout (Phase 4).
