---
paths:
  - "tests/**/*"
  - "**/playwright-ct.config.ts"
---

# Testing

Vizel ships seven testing pillars. The design spec
(`docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md`)
is the SSOT; this file is the project-rule projection of that spec and
is what PR review uses to gate coverage.

## The Seven Pillars

| # | Pillar | Status | Surface |
|---|--------|--------|---------|
| 1 | Framework parity | shipped | `scripts/check-ct-parity.ts` + lefthook + CI |
| 2 | Behavior tests | shipped | `tests/ct/scenarios/` + `tests/ct/{react,vue,svelte}/specs/` |
| 3 | Markdown round-trip | shipped (sample-light); CI gating deferred | `tests/markdown-roundtrip/` + manual `workflow_dispatch` |
| 4 | SSR | shipped (Node smoke test) | `scripts/test-static-html.ts` |
| 5 | Accessibility | shipped (suite); CI gating deferred | `tests/a11y/{react,vue,svelte}/` + manual `workflow_dispatch` |
| 6 | Visual regression | not yet | CI-only snapshots (planned) |
| 7 | Coverage discipline | shipped (this document) | Required-test matrix below |

Pillar 6 is tracked as follow-up work. Do not block PRs on missing
visual snapshots until that suite lands. The Pillar 3 Markdown
round-trip and Pillar 5 accessibility suites are shipped and run on
demand, but their PR-gating is deferred: both are standalone Playwright
CT jobs that hang intermittently on the GitHub runner, so the
`md-roundtrip` and `a11y` jobs stay on manual `workflow_dispatch` until
the runner-side root cause is fixed (tracked follow-up). The remaining
shipped pillars (1, 2, 4, 7) gate merge through the required `Test
Summary` and `Quality + Parity` checks.

---

## Pillar 1 — Mechanical framework parity

Every Playwright CT spec must exist under all three framework
packages. The single permitted asymmetry is the idiom prefix:

| React / Vue | Svelte | Parity stem |
|-------------|--------|-------------|
| `UseEditorState.spec.{tsx,ts}` | `CreateEditorState.spec.ts` | `EditorState` |
| `UseVizelContext.spec.{tsx,ts}` | `GetVizelContext.spec.ts` | `VizelContext` |

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
   `tests/ct/{react,vue,svelte}/specs/<Feature>.spec.{tsx,ts,ts}`.
3. Each spec imports and invokes the shared scenario; framework code
   inside the spec is limited to mounting and idiom-specific wiring.

### Directory structure

```
tests/ct/
├── scenarios/                # Framework-agnostic shared scenarios
│   └── *.scenario.ts
├── react/
│   ├── specs/                # *.spec.tsx, *Fixture.tsx
│   └── playwright-ct.config.ts
├── vue/
│   ├── specs/                # *.spec.ts, *Fixture.vue
│   └── playwright-ct.config.ts
└── svelte/
    ├── specs/                # *.spec.ts, *Fixture.svelte
    └── playwright-ct.config.ts
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run all framework tests in parallel |
| `pnpm test:ct:seq` | Run all framework tests sequentially |
| `pnpm test:ct:react` | Run React tests only |
| `pnpm test:ct:vue` | Run Vue tests only |
| `pnpm test:ct:svelte` | Run Svelte tests only |

### Browser and file selection

```bash
# Choose a browser.
pnpm test:ct:react -- --project=chromium
pnpm test:ct:react -- --project=firefox
pnpm test:ct:react -- --project=webkit

# Run with a visible browser.
pnpm test:ct:react -- --headed

# Run a single spec file.
pnpm test:ct:react -- tests/ct/react/specs/Editor.spec.tsx
```

### Authoring a shared scenario

```typescript
// tests/ct/scenarios/example.scenario.ts
import { expect, type Locator, type Page } from "@playwright/test";

export async function testFeature(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeVisible();
}
```

### Authoring a framework spec

```typescript
// tests/ct/react/specs/Example.spec.tsx
import { test } from "@playwright/experimental-ct-react";
import { ExampleComponent } from "@vizel/react";
import { testFeature } from "../../scenarios/example.scenario";

test.describe("Example", () => {
  test("feature works", async ({ mount, page }) => {
    const component = await mount(<ExampleComponent />);
    await testFeature(component, page);
  });
});
```

### How to add a new behavior test

1. Create a shared scenario under `tests/ct/scenarios/`.
2. Create one spec per framework, each importing the shared scenario.
3. Use the same stem across the three specs (Pillar 1).
4. Run `pnpm test:ct` to verify parity.
5. Run `pnpm check:ct-parity` to confirm spec-name balance.

### Best practices

**Locator priority** — pick locators from the most stable source first.

| Priority | Method | Example |
|----------|--------|---------|
| 1 | Data attribute | `[data-vizel-*]` |
| 2 | ARIA role | `getByRole("button")` |
| 3 | CSS class | `.vizel-*` |
| 4 | Element type | `locator("button")` |

**Portals.** Components rendered to `document.body` use
`page.locator()`. Components rendered inside the mount target use
`component.locator()`.

```typescript
// Inside mount target.
const button = component.locator(".vizel-button");

// Rendered to document.body.
const popup = page.locator("[data-vizel-popup]");
```

**Waiting.** Prefer assertion-based waits over fixed timeouts.

```typescript
// GOOD.
await expect(element).toBeVisible();
await expect(element).toHaveText("Expected");

// AVOID.
await page.waitForTimeout(1000);
```

**Assertions.** Use Playwright's auto-retrying assertions.

```typescript
await expect(element).toBeVisible();
await expect(element).toHaveClass(/active/);
await expect(element).toContainText("Hello");
```

---

## Pillar 3 — Markdown round-trip suite

`tests/markdown-roundtrip/` drives the round-trip matrix:
every supported flavor parses and re-serializes a corpus of samples
without lossy edits.

The long-term target is 100+ samples per flavor. The
current corpus ships a representative cross-section (heading,
paragraph, list, blockquote, inline emphasis, inline code, fenced
code, image, link, plus the flavor-specific syntax). Expanding the
corpus is itself a coverage task.

### Files

| Path | Purpose |
|------|---------|
| `tests/markdown-roundtrip/samples/index.ts` | Sample buckets (one `export const` per flavor) |
| `tests/markdown-roundtrip/specs/Roundtrip.spec.tsx` | Drives every sample through Vizel |
| `tests/markdown-roundtrip/specs/Probe.spec.tsx` | Single-case diagnostic harness |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:md-roundtrip` | Run the full round-trip suite (Chromium only) |

### How to add a new flavor

1. Extend `packages/core/src/markdown/flavors/` with the flavor's
   serializer / parser.
2. Add a `<flavor>Samples: readonly VizelRoundtripSample[]` bucket
   to `tests/markdown-roundtrip/samples/index.ts`. Start with the
   ten canonical baselines plus every flavor-specific syntax form.
3. Wire the bucket into `Roundtrip.spec.tsx`.
4. Run `pnpm test:md-roundtrip` and confirm zero diffs.

### How to add a new sample to an existing flavor

1. Append an entry to the relevant `<flavor>Samples` array with a
   stable `name` and the exact input Markdown Vizel must emit on
   round-trip.
2. Run `pnpm test:md-roundtrip` to confirm the round-trip succeeds.

---

## Pillar 4 — SSR suite

Vizel's SSR contract is currently enforced by a single static lint
that keeps Core free of top-level `document` / `window` access. The
runtime SSR path is the framework's own server renderer plus Tiptap's
`generateHTML(json, extensions)` helper — consumers wire either into
their server pipeline; Vizel ships no opinionated server-HTML helper.

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

`tests/a11y/{react,vue,svelte}/` drives `@axe-core/playwright` against
every shipped component fixture and asserts WCAG 2.1 AA conformance.
The shared `tests/a11y/scenarios/axe.scenario.ts` scans the
`.vizel-root` subtree and prints the full violation list on failure
so the diff alone identifies the regression. The suite runs
Chromium-only by design: axe-core reports a single canonical
violation list, so re-running the same rule set in Firefox and WebKit
adds nothing but flake.

### Files

| Path | Purpose |
|------|---------|
| `tests/a11y/scenarios/axe.scenario.ts` | Shared `expectNoVizelA11yViolations` axe-core scan |
| `tests/a11y/{react,vue,svelte}/specs/` | Per-framework `Editor`, `Outline`, `Toolbar` fixtures and specs |
| `tests/a11y/{react,vue,svelte}/playwright-ct.config.ts` | One CT config per framework |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm test:a11y` | Run all three framework a11y suites in parallel |
| `pnpm test:a11y:react` | Run the React a11y suite (Chromium only) |
| `pnpm test:a11y:vue` | Run the Vue a11y suite (Chromium only) |
| `pnpm test:a11y:svelte` | Run the Svelte a11y suite (Chromium only) |

### CI gate

The `a11y` job in `.github/workflows/ci.yml` runs the React, Vue, and
Svelte suites in a matrix. It is gated on manual `workflow_dispatch`,
not on pull requests: the suite passes locally but hangs
intermittently on the GitHub runner (a matrix job reaches the
`timeout-minutes: 15` cap even with the reporter guards below), so
PR-gating and the `Test Summary` wiring are deferred until the
runner-side root cause is found and fixed (tracked follow-up). The
hardening is already in place: each CT config pins the HTML reporter
to `open: "never"`, and the job sets `PLAYWRIGHT_HTML_OPEN: never` as
a second guard so the reporter never opens a browser and holds the
runner's event loop open.

### Disabled rules

`axe.scenario.ts` documents a small allow-list in the `DISABLED_RULES`
JSDoc: `region`, `color-contrast`, and `aria-input-field-name`. Each
entry carries the upstream rule id and a one-line rationale tied to a
CT-fixture measurement limitation rather than a Vizel defect. Keep the
set as small as possible; prefer fixing the markup over expanding it.

---

## Pillar 6 — Visual regression

`tests/visual/` ships a Playwright snapshot suite that captures
representative `Vizel` configurations. Snapshots live in
`tests/visual/__snapshots__/` and run on `workflow_dispatch` only —
PRs that intentionally change visuals update the baselines locally
via `pnpm test:visual:update` and commit the new pngs.

### How to run

```bash
# Compare against committed baselines.
pnpm test:visual

# Re-record baselines (commit the resulting png changes).
pnpm test:visual:update
```

### Adding a snapshot

1. Pick a setup that exercises a visually meaningful surface —
   editor chrome in a theme, a menu open against a fixed selection,
   etc.
2. Add a spec under `tests/visual/specs/` that mounts a `<Vizel>`
   (or a sub-component), waits for the visible elements, masks
   transient pixels (e.g. caret) via injected CSS, and asserts
   `await expect(component).toHaveScreenshot("name.png")`.
3. Run `pnpm test:visual:update` to record the baseline, inspect
   the diff under `__snapshots__/`, and commit both the spec and
   the png.

### Coverage status (initial)

The shipped suite covers a representative slice; broader coverage
(slash menu open, bubble menu over selection, block menu, color
picker, outline, link editor, find/replace) is a
follow-up tracked against the polish milestone.

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
"follow-up" means the pillar is not yet shipped and the row will
become "required" once it lands.

### How to apply at PR time

1. Identify the feature kind from the left column.
2. For each "required" pillar, confirm a spec / scenario / sample /
   case exists in the PR diff.
3. For each "follow-up" pillar, note the future work in the PR body
   under "Follow-up" so the tracking is retained.
4. Run `pnpm check:ct-parity` and the relevant `pnpm test:*` commands
   before requesting review.

---

## Continuous integration

GitHub Actions enforces the pillars on every push and pull request:

| Job | Pillar | Notes |
|-----|--------|-------|
| `test` (matrix of framework x browser) | 2 | React, Vue, Svelte x Chromium, Firefox, WebKit |
| `a11y` (matrix of framework) | 5 | React, Vue, Svelte x Chromium; runs `pnpm test:a11y:<fw>`. On-demand (`workflow_dispatch`); PR-gating deferred (runner-hang follow-up) |
| `md-roundtrip` | 3 | Runs `pnpm test:md-roundtrip` (Chromium only). On-demand (`workflow_dispatch`); PR-gating deferred (runner-hang follow-up) |
| `ssr` | 4 | Builds packages, runs `pnpm test:ssr` |
| `ct-parity` | 1 | Runs `pnpm check:ct-parity` |
| `test-summary` | aggregator | Fails when any matrix shard failed |

The `test-summary` job aggregates the framework x browser matrix and is
the single required check. The `a11y` and `md-roundtrip` suites are
standalone Playwright CT jobs that hang intermittently on the runner;
both stay on manual `workflow_dispatch` and are excluded from
`test-summary` until the runner-side root cause is fixed (tracked
follow-up). Pillar 6 earns its own CI job when it ships.
