---
paths:
  - "tests/**/*"
  - "**/vitest.browser.config.ts"
---

# Testing

Vizel ships seven testing pillars. The design spec
(`docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md`)
is the Single Source of Truth (SSOT); this file is the project-rule projection
of that spec and is what PR review uses to gate coverage.

The browser test runner is **Vitest 4.x Browser Mode** with the
`@vitest/browser-playwright` provider. The `playwright` package stays
as the browser driver; the removed pieces are
`@playwright/experimental-ct-react`, `@playwright/experimental-ct-vue`,
`@playwright/experimental-ct-svelte`, `@playwright/test`,
`@axe-core/playwright`, `c8`, every `playwright-ct.config.ts`, and the
`tests/*/playwright/index.*` style-loading entries.

## The Seven Pillars

| # | Pillar | Status | Surface |
|---|--------|--------|---------|
| 1 | Framework parity | shipped | `scripts/check-ct-parity.ts` + lefthook + CI |
| 2 | Behavior tests | shipped | `tests/ct/scenarios/` + `tests/ct/{react,vue,svelte}/specs/` |
| 3 | Markdown round-trip | shipped (sample-light); CI gating deferred | `tests/markdown-roundtrip/` + manual `workflow_dispatch` |
| 4 | SSR | shipped (Node smoke test) | `scripts/test-static-html.ts` |
| 5 | Accessibility | shipped (suite); CI gating deferred | `tests/a11y/{react,vue,svelte}/` + manual `workflow_dispatch` |
| 6 | Visual regression | shipped; `workflow_dispatch`-gated | `tests/visual/` + committed baselines |
| 7 | Coverage discipline | shipped (this document) | Required-test matrix below |

The Pillar 3 Markdown round-trip and Pillar 5 accessibility suites run on
demand. Their PR-gating is deferred as a conservative default after the
Vitest Browser Mode migration (the prior Playwright CT runner hang no longer
applies); promoting them to PR-gating is a tracked follow-up. The Pillar 6
visual suite stays `workflow_dispatch`-gated because baselines are
environment-specific (`<name>-chromium-<platform>.png`). The remaining
shipped pillars (1, 2, 4, 7) gate merge through the required `Test
Summary` and `Quality + Parity` checks.

---

## Pillar 1 — Mechanical framework parity

Every Vitest Browser Mode spec must exist under all three framework
packages. The single permitted asymmetry is the idiom prefix:

| React / Vue | Svelte | Parity stem |
|-------------|--------|-------------|
| `UseEditorState.test.{tsx,ts}` | `CreateEditorState.test.ts` | `EditorState` |
| `UseVizelContext.test.{tsx,ts}` | `GetVizelContext.test.ts` | `VizelContext` |

The `Use*` to `Create*` / `Get*` mapping mirrors the symbol parity
rules in `scripts/check-ct-parity.ts`.

### How to verify

```bash
pnpm check:ct-parity
```

Lefthook runs the same check on `pre-push`; the `ct-parity` GitHub
Actions job blocks merge.

### How to add a parity exception

Spec parity has **no** exception catalog. If a component genuinely
does not exist on one framework (rare; the feature manifest in
`packages/core/src/feature-manifest.ts` and `.claude/rules/feature-manifest.md`
already forbid this), revisit the component before adding a spec asymmetry.

---

## Pillar 2 — Behavior tests for every shipped feature

Every shipped feature (builders, controllers, commands, block
operations, static view modes, etc.) receives:

1. A shared scenario at `tests/ct/scenarios/<feature>.scenario.ts`.
2. Three per-framework specs at
   `tests/ct/{react,vue,svelte}/specs/<Feature>.test.{tsx,ts}`.
3. Each spec imports and invokes the shared scenario; framework code
   inside the spec is limited to mounting and idiom-specific wiring.

### Directory structure

```
tests/ct/
├── scenarios/                # Framework-agnostic shared scenarios
│   ├── _vitest-context.ts    # Exports page, userEvent, MOD_KEY, pressKeyChord, isFirefox, isWebkit, VizelBcScenario
│   └── *.scenario.ts
├── parity/                   # Parity harness scripts
├── react/
│   └── specs/                # *.test.tsx, *Fixture.tsx
├── vue/
│   └── specs/                # *.test.ts, *Fixture.vue
└── svelte/
    └── specs/                # *.test.ts, *Fixture.svelte
tests/a11y/
├── scenarios/
│   └── axe.scenario.ts       # Shared expectNoVizelA11yViolations scan
├── react/specs/
├── vue/specs/
└── svelte/specs/
tests/visual/
├── specs/
│   ├── Editor.test.tsx
│   └── __screenshots__/      # Committed environment-specific baselines
tests/markdown-roundtrip/
└── specs/
    └── Roundtrip.test.ts
vitest.browser.config.ts      # Single config; test.projects defines all suites
```

### Single config and projects

`vitest.browser.config.ts` uses `test.projects` to define one project
per suite and framework:

| Project name | Suite | Browsers |
|--------------|-------|---------|
| `react`, `vue`, `svelte` | Component behavior | Chromium, Firefox, WebKit |
| `a11y-react`, `a11y-vue`, `a11y-svelte` | Accessibility | Chromium only |
| `visual` | Visual regression | Chromium only |
| `roundtrip` | Markdown round-trip | Chromium only |

Each browser instance is named `<project>-<browser>` (e.g. `react-firefox`).
Every project sets `testTimeout` and `hookTimeout` to 30 000 ms,
`fileParallelism: false` (one spec file per browser tab at a time, to avoid
contention flake), and `retry: 2` (absorbs floating-ui timing flakiness,
especially on Firefox).

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run all framework component tests sequentially |
| `pnpm test:ct:react` | Run React component tests on all browsers |
| `pnpm test:ct:vue` | Run Vue component tests on all browsers |
| `pnpm test:ct:svelte` | Run Svelte component tests on all browsers |
| `pnpm test:a11y` | Run all framework accessibility tests |
| `pnpm test:a11y:react` | Run the React a11y suite (Chromium only) |
| `pnpm test:a11y:vue` | Run the Vue a11y suite (Chromium only) |
| `pnpm test:a11y:svelte` | Run the Svelte a11y suite (Chromium only) |
| `pnpm test:visual` | Compare against committed baselines |
| `pnpm test:visual:update` | Re-record baselines (commit the png changes) |
| `pnpm test:md-roundtrip` | Run the full round-trip suite (Chromium only) |

### Browser and file selection

```bash
# Run one project on one browser.
pnpm exec vitest run --config vitest.browser.config.ts --project=react-firefox

# Run one project on one browser, filtered to a spec name substring.
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium Editor
```

### Cross-browser notes

The component matrix passes on Chromium, Firefox, and WebKit. Two
engine-specific limitations gate a small set of cases:

- **Firefox** ignores the `clipboardData` of a constructed `ClipboardEvent`,
  so five synthetic-clipboard cases skip via `test.skipIf(isFirefox)`: the
  three `BlockClipboard` tests and two Unicode `EdgeCases` tests. They run on
  Chromium and WebKit.
- **WebKit** (the WebKitGTK build Playwright drives on Linux CI) does not
  complete a synthesized HTML5 drag-and-drop, so the four `DragHandle` reorder
  cases skip via `test.skipIf(isWebkit)`. They run on Chromium and Firefox.
  The keyboard-driven block-move cases run on every engine.

`isFirefox` and `isWebkit` are exported from `_vitest-context.ts`.

### Authoring a shared scenario

Scenario functions are exported `const test* = async (...) => {}` arrows
typed `VizelBcScenario`. Do not use `function` declarations.

```typescript
// tests/ct/scenarios/example.scenario.ts
import { expect } from "vitest";
import { page } from "./_vitest-context";
import type { VizelBcScenario } from "./_vitest-context";

export const testFeature: VizelBcScenario = async (root) => {
  await expect.element(root.getByRole("textbox")).toBeVisible();
};
```

### Authoring a framework spec

React mounts are `async` (`await render(...)`). Vue and Svelte mounts are
synchronous (`render(...)`). The render library auto-cleans between tests;
call `render()` once per `test()`.

```typescript
// tests/ct/react/specs/Example.test.tsx
import { render } from "vitest-browser-react";
import { page } from "../../scenarios/_vitest-context";
import { testFeature } from "../../scenarios/example.scenario";
import { ExampleFixture } from "./ExampleFixture";

test("feature works", async () => {
  await render(<ExampleFixture />);
  await testFeature(page.elementLocator(document.body));
});
```

### How to add a new behavior test

1. Create a shared scenario under `tests/ct/scenarios/` as an exported
   `const test* : VizelBcScenario` arrow.
2. Create one spec per framework, each importing and invoking the shared
   scenario.
3. Use the same stem across the three specs (Pillar 1).
4. Run `pnpm test:ct` to confirm parity.
5. Run `pnpm check:ct-parity` to confirm spec-name balance.

### Best practices

**Locator priority** — pick locators from the most stable source first.

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Data attribute | `page.getByTestId(...)` / `[data-vizel-*]` |
| 2 | ARIA role | `page.getByRole("button", { name: "Bold" })` |
| 3 | CSS class | `page.elementLocator(el)` scoped by `.vizel-*` |
| 4 | Element type | direct `document.querySelector` |

**Portals.** Components rendered to `document.body` use
`page.getByRole(...)` or `document.querySelector(portalSel)`.
Components rendered inside the mounted fixture use
`page.elementLocator(domNode)` scoped to the fixture root.

```typescript
// Inside the mounted fixture root.
const button = page.elementLocator(document.querySelector(".vizel-button")!);

// Rendered to document.body (portal, slash menu, bubble menu).
const popup = page.getByRole("menu");
// or:
const popup = document.querySelector("[data-vizel-popup]");
```

**Waiting.** Use auto-retrying assertions instead of fixed timeouts.

```typescript
// GOOD.
await expect.element(locator).toBeVisible();
await expect.element(locator).toHaveTextContent("Expected");

// AVOID.
await new Promise((r) => setTimeout(r, 1000));
```

**Assertions.** Use `expect.element(locator)` for auto-retrying DOM
assertions.

```typescript
await expect.element(locator).toBeVisible();
await expect.element(locator).toHaveClass(/active/);
await expect.element(locator).toHaveTextContent("Hello");
```

**Interactions.** Use `userEvent` from `_vitest-context` for clicks,
typing, and keyboard chords.

```typescript
import { userEvent, pressKeyChord } from "../../scenarios/_vitest-context";

await userEvent.click(button);
await userEvent.type(input, "hello");
await pressKeyChord("Mod", "b");   // bold
```

**Visual assertions.**

```typescript
await expect(page.elementLocator(root)).toMatchScreenshot("editor-default");
```

---

## Pillar 3 — Markdown round-trip suite

`tests/markdown-roundtrip/specs/Roundtrip.test.ts` drives the round-trip
matrix: every supported flavor parses and re-serializes a corpus of samples
without lossy edits. The spec imports `assertMarkdownRoundtrip` directly
from `@vizel/core` and does not depend on any framework render library.

The long-term target is 100+ samples per flavor. The current corpus ships a
representative cross-section (heading, paragraph, list, blockquote, inline
emphasis, inline code, fenced code, image, link, plus the flavor-specific
syntax). Expanding the corpus is itself a coverage task.

### Files

| Path | Purpose |
|------|---------|
| `tests/markdown-roundtrip/samples/index.ts` | Sample buckets (one `export const` per flavor) |
| `tests/markdown-roundtrip/specs/Roundtrip.test.ts` | Drives every sample through Vizel |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:md-roundtrip` | Run the full round-trip suite (Chromium only) |

### How to add a new flavor

1. Extend `packages/core/src/markdown/flavors/` with the flavor's
   serializer and parser.
2. Add a `<flavor>Samples: readonly VizelRoundtripSample[]` bucket
   to `tests/markdown-roundtrip/samples/index.ts`. Start with the
   ten canonical baselines plus every flavor-specific syntax form.
3. Wire the bucket into `Roundtrip.test.ts`.
4. Run `pnpm test:md-roundtrip` and confirm zero diffs.

### How to add a new sample to an existing flavor

1. Append an entry to the relevant `<flavor>Samples` array with a
   stable `name` and the exact input Markdown Vizel must emit on
   round-trip.
2. Run `pnpm test:md-roundtrip` to confirm the round-trip succeeds.

---

## Pillar 4 — SSR suite

Vizel's Server-Side Rendering (SSR) contract is enforced by a static lint
that keeps Core free of top-level `document` and `window` access. The
runtime SSR path is the framework's own server renderer plus Tiptap's
`generateHTML(json, extensions)` helper. Consumers wire either into their
server pipeline; Vizel ships no opinionated server-HTML helper.

### Files

| Path | Purpose |
|------|---------|
| `scripts/check-ssr-safety.ts` | Static lint for top-level `document` / `window` access |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm check:ssr` | Confirm Core stays free of top-level browser globals |

`pnpm check:ssr` runs on `pre-push` and CI to guarantee Core never
references `document` or `window` at module scope. Lazy access
inside function bodies remains permitted.

---

## Pillar 5 — Accessibility suite

`tests/a11y/{react,vue,svelte}/` mounts every shipped component fixture
in a Vitest browser context and asserts Web Content Accessibility
Guidelines (WCAG) 2.1 AA conformance using the bare `axe-core` library.
The shared `tests/a11y/scenarios/axe.scenario.ts` calls
`axe.run(document.querySelector(".vizel-root"), {...})` and prints the
full violation list on failure so the diff alone identifies the regression.
The suite runs Chromium-only by design: axe-core reports a single canonical
violation list, so re-running the same rule set in Firefox and WebKit adds
nothing but flake.

### Files

| Path | Purpose |
|------|---------|
| `tests/a11y/scenarios/axe.scenario.ts` | Shared `expectNoVizelA11yViolations` axe-core scan |
| `tests/a11y/{react,vue,svelte}/specs/` | Per-framework `Editor`, `Outline`, `Toolbar` fixtures and specs |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:a11y` | Run all three framework a11y suites |
| `pnpm test:a11y:react` | Run the React a11y suite (Chromium only) |
| `pnpm test:a11y:vue` | Run the Vue a11y suite (Chromium only) |
| `pnpm test:a11y:svelte` | Run the Svelte a11y suite (Chromium only) |

### CI gate

The `a11y` job in `.github/workflows/ci.yml` stays on manual
`workflow_dispatch` as a conservative default after the Vitest Browser Mode
migration. Promoting the suite to PR-gating is a tracked follow-up.

### Disabled rules

`axe.scenario.ts` documents a small allow-list in the `DISABLED_RULES`
JSDoc: `region`, `color-contrast`, and `aria-input-field-name`. Each
entry carries the upstream rule id and a one-line rationale tied to a
fixture measurement limitation rather than a Vizel defect. Keep the
set as small as possible; prefer fixing the markup over expanding the
allow-list.

---

## Pillar 6 — Visual regression

`tests/visual/specs/Editor.test.tsx` captures representative `Vizel`
configurations. Baselines are committed under
`tests/visual/specs/__screenshots__/` and are environment-specific:
each file is named `<name>-chromium-<platform>.png`. The suite runs
on `workflow_dispatch` only. PRs that intentionally change visuals
update the baselines locally via `pnpm test:visual:update` and commit
the new PNG files.

### How to run

```bash
# Compare against committed baselines.
pnpm test:visual

# Re-record baselines (commit the resulting png changes).
pnpm test:visual:update
```

### Adding a snapshot

1. Pick a setup that exercises a visually meaningful surface — editor
   chrome in a theme, a menu open against a fixed selection, etc.
2. Add a spec under `tests/visual/specs/` that renders a `<Vizel>`
   (or a sub-component), waits for visible elements, masks transient
   pixels (e.g. caret) via injected CSS, and asserts
   `await expect(page.elementLocator(root)).toMatchScreenshot("name")`.
3. Run `pnpm test:visual:update` to record the baseline, inspect the
   diff under `__screenshots__/`, and commit both the spec and the PNG.

### Coverage status (initial)

The shipped suite covers a representative slice; broader coverage
(slash menu open, bubble menu over selection, block menu, color picker,
outline, link editor, find/replace) is a follow-up tracked against the
polish milestone.

---

## Pillar 7 — Coverage discipline

Every new feature checks in the rows of the table below before
merge. PR review verifies the rows are filled in or that the row
explicitly marks the test type as not applicable.

| Feature kind | Pillar 1 (parity) | Pillar 2 (behavior) | Pillar 3 (round-trip) | Pillar 4 (SSR) | Pillar 5 (a11y) | Pillar 6 (visual) |
|--------------|:-----------------:|:-------------------:|:---------------------:|:--------------:|:---------------:|:-----------------:|
| New component or controller | required | required | n/a | required | required | follow-up |
| New hook / composable / rune | required | required | n/a | required | n/a | n/a |
| New command or block operation | required | required | n/a | n/a | n/a | n/a |
| New Markdown extension or flavor | required | required | required | required | n/a | n/a |
| New static view mode | required | required | n/a | required | required | follow-up |
| Pure refactor (no behavior change) | required | n/a | n/a | n/a | n/a | n/a |

"n/a" means the pillar does not apply to that feature kind.
"follow-up" means the pillar applies once the visual suite gains broader
coverage; note the future work in the PR body so tracking is retained.

### How to apply at PR time

1. Identify the feature kind from the left column.
2. For each "required" pillar, confirm a spec, scenario, sample, or
   case exists in the PR diff.
3. For each "follow-up" pillar, note the future work in the PR body
   under "Follow-up" so tracking is retained.
4. Run `pnpm check:ct-parity` and the relevant `pnpm test:*` commands
   before requesting review.

---

## Continuous integration

GitHub Actions enforces the pillars on every push and pull request:

| Job | Pillar | Notes |
|-----|--------|-------|
| `test` (matrix of framework × browser) | 2 | React, Vue, Svelte × Chromium, Firefox, WebKit; runs Vitest Browser Mode |
| `a11y` (matrix of framework) | 5 | React, Vue, Svelte × Chromium; runs `pnpm test:a11y:<fw>`. On-demand (`workflow_dispatch`); PR-gating is a tracked follow-up |
| `md-roundtrip` | 3 | Runs `pnpm test:md-roundtrip` (Chromium only). On-demand (`workflow_dispatch`); PR-gating is a tracked follow-up |
| `visual` | 6 | Runs `pnpm test:visual` (Chromium only). On-demand (`workflow_dispatch`); baselines are environment-specific |
| `ssr` | 4 | Builds packages, runs `pnpm check:ssr` |
| `ct-parity` | 1 | Runs `pnpm check:ct-parity` |
| `test-summary` | aggregator | Fails when any matrix shard failed |

The `test-summary` job aggregates the framework × browser matrix and is
the single required check. The `a11y`, `md-roundtrip`, and `visual` suites
stay on manual `workflow_dispatch`; promoting any of them to PR-gating is a
tracked follow-up.
