# Vitest Browser Mode migration — Phase 0 (PoC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Vitest Browser Mode (Playwright provider) can run Vizel's React component scenarios on Chromium, Firefox, and WebKit, and lock the scenario contract, fixture render, config, and CI pattern that Phases 1–4 will copy.

**Architecture:** Keep the three-layer test model (shared scenarios + per-framework specs + parity harness) from ADR-0012. Add Vitest Browser Mode beside the existing Playwright CT runner (coexistence) so the PoC ships without removing anything. Port a small, representative slice of `editor.scenario.ts` to a framework-neutral Vitest contract.

**Tech Stack:** Vitest 4.x, `@vitest/browser-playwright` (Playwright provider), `vitest-browser-react`, `@vitejs/plugin-react`, TypeScript, pnpm.

## Global Constraints

- Node.js >= 24; package manager pnpm; invoke scripts with `pnpm <script>` (ADR-0015, CLAUDE.md).
- Browser provider is `@vitest/browser-playwright`; do NOT remove the `playwright` library (it is the provider). Do NOT remove any `@playwright/experimental-ct-*` in Phase 0 — both runners coexist.
- Preserve the parity invariant: shared scenarios stay framework-neutral under `tests/ct/scenarios/`; product code under `packages/` is untouched.
- `@vizel/*` resolve to source via Vite aliases: `@vizel/core` → `packages/core/src`, `@vizel/headless` → `packages/headless/src`, `@vizel/react` → `packages/react/src`.
- Browser instances for the component suite: `chromium`, `firefox`, `webkit`.
- The no-`let` rule applies to `tests/ct/scenarios/**/*.ts` and React spec files; use `const`.
- Conventional Commits; commit messages in English; no AI attribution.

---

## File Structure

- `vitest.browser.config.ts` (create, repo root) — Vitest Browser Mode config for the React PoC: React plugin, `@vizel/*` aliases, `test.browser` with the Playwright provider and three instances, glob limited to the new spec(s).
- `tests/ct/scenarios/_vitest-context.ts` (create) — re-exports the Vitest browser context (`page`, `userEvent`) and shared types so scenarios import from one neutral module; documents the scenario contract.
- `tests/ct/scenarios/editor-bc.scenario.ts` (create) — the ported slice of `editor.scenario.ts` in the Vitest contract (`testEditorRenders`, `testBulletList`, `testListMarkersSurviveHostReset`). `bc` = browser-component (temporary name during coexistence).
- `tests/ct/react/specs-bc/EditorFixture.tsx` (create) — React fixture, identical component tree to `tests/ct/react/specs/EditorFixture.tsx`, mounted by `vitest-browser-react`.
- `tests/ct/react/specs-bc/Editor.bc.test.tsx` (create) — React Vitest Browser spec: renders the fixture and invokes the ported scenarios.
- `package.json` (modify) — add Vitest dev deps and a coexisting `test:bc:react` script.
- `.github/workflows/ci.yml` and/or `.github/actions/test` (modify) — add a coexisting Vitest Browser job for React.
- `tests/ct/parity/check-scenarios.ts` (read only in Phase 0) — confirm the `*-bc.scenario.ts` slice does not break the existing parity check; if it does, scope the check to exclude `*-bc.scenario.ts` during coexistence.

---

### Task 1: Toolchain spike — install Vitest Browser Mode and confirm the API on three browsers

**Files:**
- Modify: `package.json` (devDependencies)
- Create: `vitest.browser.config.ts`
- Create: `tests/ct/react/specs-bc/smoke.bc.test.tsx`

**Interfaces:**
- Produces: a working `pnpm test:bc:react` script; confirmed import paths (`vitest/browser` for `page`/`userEvent`), the `render()` return shape from `vitest-browser-react`, and that `locator.element()` returns a DOM `Element`. Later tasks rely on these.

- [ ] **Step 1: Install Vitest Browser Mode toolchain (exact, latest 4.x)**

Run (resolve the latest 4.x at install time; pin the resolved exact versions afterward):

```bash
pnpm add -D -w vitest @vitest/browser-playwright vitest-browser-react @vitejs/plugin-react
```

Expected: the four packages appear in root `devDependencies`. Record the resolved exact versions in the PR description and the new ADR.

- [ ] **Step 2: Add the coexisting script**

In `package.json` `scripts`, add:

```json
"test:bc:react": "vitest run --config vitest.browser.config.ts"
```

- [ ] **Step 3: Create the Vitest Browser config**

Create `vitest.browser.config.ts`:

```ts
import { resolve } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@vizel/core": resolve(import.meta.dirname, "packages/core/src"),
      "@vizel/headless": resolve(import.meta.dirname, "packages/headless/src"),
      "@vizel/react": resolve(import.meta.dirname, "packages/react/src"),
    },
  },
  test: {
    include: ["tests/ct/react/specs-bc/**/*.bc.test.{ts,tsx}"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
    },
  },
});
```

- [ ] **Step 4: Write the smoke test**

Create `tests/ct/react/specs-bc/smoke.bc.test.tsx`:

```tsx
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test } from "vitest";

function Hello() {
  return <button type="button">Vitest Browser</button>;
}

test("renders a button across browsers", async () => {
  const screen = render(<Hello />);
  await expect.element(screen.getByRole("button", { name: "Vitest Browser" })).toBeVisible();
  // Confirm raw DOM access used by computed-style scenarios later.
  const el = screen.getByRole("button").element();
  expect(el).toBeInstanceOf(Element);
});
```

- [ ] **Step 5: Run the smoke test on all three browsers**

Run: `pnpm exec playwright install --with-deps` (once, to ensure browsers), then `pnpm test:bc:react`
Expected: PASS on `chromium`, `firefox`, `webkit` (three instances). If an import path or `render`/`element()` shape differs from the snippet, fix the snippet to the actual 4.x API and note the correction (this is the spike's purpose).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.browser.config.ts tests/ct/react/specs-bc/smoke.bc.test.tsx
git commit -m "test(ct): add Vitest Browser Mode toolchain spike for react"
```

---

### Task 2: Scenario context module and `testEditorRenders` port

**Files:**
- Create: `tests/ct/scenarios/_vitest-context.ts`
- Create: `tests/ct/scenarios/editor-bc.scenario.ts`
- Create: `tests/ct/react/specs-bc/EditorFixture.tsx`
- Create: `tests/ct/react/specs-bc/Editor.bc.test.tsx`

**Interfaces:**
- Produces: the scenario contract `(root: Locator) => Promise<void>` where `root` is the rendered fixture locator and scenarios import `page`/`userEvent` from `_vitest-context`. `VizelBcScenario` type. `testEditorRenders` export.
- Consumes: confirmed API from Task 1.

- [ ] **Step 1: Write the context module**

Create `tests/ct/scenarios/_vitest-context.ts`:

```ts
// Single neutral entry point for the Vitest Browser context so scenarios stay
// framework-agnostic. `root` is the mounted fixture locator returned by each
// framework's render(); scenarios query within it for component-scoped nodes
// and use `page` for portals (menus rendered to document.body).
import type { Locator } from "vitest/browser";
import { page, userEvent } from "vitest/browser";

export { page, userEvent };
export type { Locator };

export type VizelBcScenario = (root: Locator) => Promise<void>;
```

- [ ] **Step 2: Write the failing React spec for rendering**

Create `tests/ct/react/specs-bc/EditorFixture.tsx` (mirror of the Playwright fixture):

```tsx
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export function EditorFixture() {
  const editor = useVizelEditor({
    placeholder: "Type something...",
    features: { content: { mathematics: true } },
  });
  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu />
    </VizelProvider>
  );
}
```

Create `tests/ct/react/specs-bc/Editor.bc.test.tsx`:

```tsx
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { describe, test } from "vitest";
import { testEditorRenders } from "../../scenarios/editor-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor (Vitest Browser) - React", () => {
  test("renders and is editable", async () => {
    render(<EditorFixture />);
    await testEditorRenders(page.elementLocator(document.body));
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test:bc:react`
Expected: FAIL — `editor-bc.scenario` has no `testEditorRenders` export yet.

- [ ] **Step 4: Implement `testEditorRenders`**

Create `tests/ct/scenarios/editor-bc.scenario.ts`:

```ts
import { expect } from "vitest";
import type { VizelBcScenario } from "./_vitest-context";

export const testEditorRenders: VizelBcScenario = async (root) => {
  const editor = root.getByRole("textbox");
  await expect.element(editor).toBeVisible();
  expect(editor.element().getAttribute("contenteditable")).toBe("true");
};
```

- [ ] **Step 5: Run to verify it passes on three browsers**

Run: `pnpm test:bc:react`
Expected: PASS on chromium/firefox/webkit. If `.vizel-editor` is not exposed as role `textbox`, fall back to `page.elementLocator(document.querySelector(".vizel-editor")!)` and assert visibility; record the chosen selector strategy in `_vitest-context.ts`.

- [ ] **Step 6: Commit**

```bash
git add tests/ct/scenarios/_vitest-context.ts tests/ct/scenarios/editor-bc.scenario.ts tests/ct/react/specs-bc/EditorFixture.tsx tests/ct/react/specs-bc/Editor.bc.test.tsx
git commit -m "test(ct): port editor render scenario to Vitest Browser contract"
```

---

### Task 3: Port an interactive scenario (`testBulletList`)

**Files:**
- Modify: `tests/ct/scenarios/editor-bc.scenario.ts`
- Modify: `tests/ct/react/specs-bc/Editor.bc.test.tsx`

**Interfaces:**
- Produces: `testBulletList` export. Establishes the `userEvent.type` / focus mapping for input rules.

- [ ] **Step 1: Add the failing spec invocation**

In `Editor.bc.test.tsx`, add inside the describe block:

```tsx
  test("creates bullet list", async () => {
    render(<EditorFixture />);
    await testBulletList(page.elementLocator(document.body));
  });
```

And extend the import: `import { testBulletList, testEditorRenders } from "../../scenarios/editor-bc.scenario";`

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:bc:react`
Expected: FAIL — no `testBulletList` export.

- [ ] **Step 3: Implement `testBulletList`**

In `editor-bc.scenario.ts`, add:

```ts
import { page, userEvent } from "./_vitest-context";

export const testBulletList: VizelBcScenario = async (root) => {
  const editor = root.getByRole("textbox");
  await userEvent.click(editor);
  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  const list = root.getByRole("list").first();
  await expect.element(list).toBeVisible();
  const items = root.getByRole("listitem");
  await expect.element(items.first()).toBeVisible();
  expect(document.querySelectorAll(".vizel-editor li").length).toBe(2);
};
```

- [ ] **Step 4: Run to verify it passes on three browsers**

Run: `pnpm test:bc:react`
Expected: PASS. If `userEvent.type` does not fire the Markdown input rule, switch the typing to `userEvent.keyboard` with literal text and a trailing space, and record the working interaction mapping in `_vitest-context.ts`.

- [ ] **Step 5: Commit**

```bash
git add tests/ct/scenarios/editor-bc.scenario.ts tests/ct/react/specs-bc/Editor.bc.test.tsx
git commit -m "test(ct): port bullet-list scenario to Vitest Browser"
```

---

### Task 4: Port a computed-style scenario under a host reset (`testListMarkersSurviveHostReset`)

**Files:**
- Modify: `tests/ct/scenarios/editor-bc.scenario.ts`
- Modify: `tests/ct/react/specs-bc/Editor.bc.test.tsx`

**Interfaces:**
- Produces: `testListMarkersSurviveHostReset` export and an `injectHostReset()` helper. Establishes stylesheet injection and `getComputedStyle` via `locator.element()` — the pattern the visual/CSS scenarios depend on.

- [ ] **Step 1: Add the failing spec invocation**

In `Editor.bc.test.tsx`, add:

```tsx
  test("keeps list markers under a host CSS reset", async () => {
    render(<EditorFixture />);
    await testListMarkersSurviveHostReset(page.elementLocator(document.body));
  });
```

Extend the import to include `testListMarkersSurviveHostReset`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:bc:react`
Expected: FAIL — no such export.

- [ ] **Step 3: Implement the scenario with a reset-injection helper**

In `editor-bc.scenario.ts`, add:

```ts
// Reproduce a Tailwind Preflight-like layered reset (see #666). A <style>
// appended to document.head mirrors Playwright's page.addStyleTag.
const injectHostReset = (): void => {
  const style = document.createElement("style");
  style.textContent = "@layer base { ol, ul, menu { list-style: none; } }";
  document.head.appendChild(style);
};

export const testListMarkersSurviveHostReset: VizelBcScenario = async (root) => {
  injectHostReset();
  const editor = root.getByRole("textbox");
  await userEvent.click(editor);
  await userEvent.type(editor, "- Bullet item");
  await userEvent.keyboard("{Enter}{Enter}");
  await userEvent.type(editor, "1. Ordered item");

  const bullet = document.querySelector<HTMLElement>(".vizel-editor ul:not([data-type='taskList'])");
  const ordered = document.querySelector<HTMLElement>(".vizel-editor ol");
  if (bullet === null || ordered === null) throw new Error("expected content lists");
  expect(getComputedStyle(bullet).listStyleType).toBe("disc");
  expect(getComputedStyle(ordered).listStyleType).toBe("decimal");
};
```

- [ ] **Step 4: Run to verify it passes on three browsers**

Run: `pnpm test:bc:react`
Expected: PASS — the unlayered `@vizel/core` CSS keeps `disc`/`decimal` under the layered reset. This confirms stylesheet injection and computed-style reads work in Vitest Browser.

- [ ] **Step 5: Commit**

```bash
git add tests/ct/scenarios/editor-bc.scenario.ts tests/ct/react/specs-bc/Editor.bc.test.tsx
git commit -m "test(ct): port host-reset marker scenario to Vitest Browser"
```

---

### Task 5: Parity-harness coexistence and documentation of the contract

**Files:**
- Modify: `tests/ct/parity/check-scenarios.ts` (only if it flags the `*-bc.scenario.ts` slice)
- Modify: `tests/ct/scenarios/_vitest-context.ts` (contract docs)

**Interfaces:**
- Produces: a green `pnpm check:scenarios` during coexistence and a documented scenario contract for Phases 1–4.

- [ ] **Step 1: Run the parity check**

Run: `pnpm check:scenarios`
Expected: It may FAIL because `editor-bc.scenario.ts` exports `test*` functions but no Vue/Svelte spec invokes them yet (coexistence).

- [ ] **Step 2: Scope the check to exclude the coexistence slice**

In `tests/ct/parity/check-scenarios.ts`, change the scenario discovery filter to ignore `*-bc.scenario.ts` while the migration runs. Locate `listScenarioBasenames()` and add a suffix guard:

```ts
.filter((entry) => entry.endsWith(SCENARIO_SUFFIX) && !entry.endsWith("-bc.scenario.ts"))
```

Add a comment: `// '-bc' scenarios are mid-migration to Vitest Browser; excluded until every framework adopts them (see the migration spec).`

- [ ] **Step 3: Run the parity check again**

Run: `pnpm check:scenarios`
Expected: PASS (the 35 Playwright scenarios still covered; the `-bc` slice excluded).

- [ ] **Step 4: Document the contract**

Append to `tests/ct/scenarios/_vitest-context.ts` a doc comment block recording: the `VizelBcScenario` signature, that `root` is `page.elementLocator(document.body)` for now (component-scoped vs `page` for portals), the confirmed interaction mapping from Tasks 3–4, and the selector fallbacks chosen.

- [ ] **Step 5: Commit**

```bash
git add tests/ct/parity/check-scenarios.ts tests/ct/scenarios/_vitest-context.ts
git commit -m "test(ct): exclude in-migration bc scenarios from parity, document contract"
```

---

### Task 6: CI coexistence and final gates

**Files:**
- Modify: `.github/workflows/ci.yml` (add a coexisting Vitest Browser job for React)

**Interfaces:**
- Produces: a CI job that runs `pnpm test:bc:react` on the three browsers beside the existing Playwright jobs.

- [ ] **Step 1: Add the CI job**

In `.github/workflows/ci.yml`, add a job mirroring the existing test job but running the new script. Read the current `test` job first, then add (adjust to the repo's setup/action style):

```yaml
  test-bc-react:
    name: Vitest Browser (react)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
      - uses: pnpm/action-setup@v6
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:bc:react
```

- [ ] **Step 2: Validate workflow YAML locally**

Run: `pnpm exec playwright install --with-deps >/dev/null 2>&1; node -e "require('js-yaml')" 2>/dev/null || true`
Then confirm syntax by re-reading the file. (No untrusted input is interpolated into `run:`; the job uses only static commands.)

- [ ] **Step 3: Run the full local gate**

Run: `pnpm test:bc:react && pnpm typecheck && pnpm lint && pnpm check:scenarios`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run Vitest Browser react suite beside Playwright CT"
```

- [ ] **Step 5: Open the PoC pull request**

Push the branch and open a PR titled `test(ct): Vitest Browser Mode PoC for react component scenarios`. Body: link the design spec, list the ported scenarios, the confirmed contract, the resolved Vitest version pins, and the coexistence note (nothing removed yet).

---

## Self-Review

**Spec coverage:** Phase 0 exit criteria from the spec — Vitest config for React (Task 1/2), port editor scenario + fixture (Tasks 2–4), run on three browsers (Tasks 1–4 run steps), adapt/scope parity (Task 5), CI (Task 6), typecheck/lint/parity green (Task 6 Step 3). Contract documented (Task 5 Step 4). Covered.

**Placeholder scan:** Each code step contains complete code. The only intentional discovery points are Task 1's API confirmation and the explicit fallbacks (selector role, interaction mapping) — each has a concrete default plus a recorded-correction instruction, not a "TBD".

**Type consistency:** `VizelBcScenario = (root: Locator) => Promise<void>` is defined in `_vitest-context.ts` (Task 2) and used by every scenario (Tasks 2–4) and every spec invocation (`page.elementLocator(document.body)`). `page`/`userEvent` import from `vitest/browser`, re-exported via `_vitest-context`. Consistent.

## Notes for later phases (not Phase 0)

- Rename `*-bc.scenario.ts` / `specs-bc/` to the final convention and re-enable full parity once all three frameworks adopt Vitest (Phase 2).
- Visual `toMatchScreenshot` baselines and the a11y `axe-core` integration are Phases 3–4; the contract and config established here carry forward.
