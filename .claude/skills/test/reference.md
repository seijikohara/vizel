# Test Skill Reference

This document holds the long-form reference for the `test` skill. The skill's `SKILL.md` keeps the trigger short; this file expands the process, the seven testing pillars, and the failure analysis flow.

## Seven testing pillars

The pillars come from `.claude/rules/testing.md`. The skill drives every pillar that ships a runnable suite today.

| Pillar                   | Status  | How to run                                        |
| ------------------------ | ------- | ------------------------------------------------- |
| 1. Framework parity      | shipped | `pnpm check:ct-parity`                            |
| 2. Behaviour tests       | shipped | `pnpm test:ct` (and the per-framework variants)   |
| 3. Markdown round-trip   | shipped | `pnpm test:md-roundtrip`                          |
| 4. SSR static-HTML smoke | shipped | `pnpm check:ssr`                                  |
| 5. Accessibility         | shipped | `pnpm test:a11y` (and the per-framework variants) |
| 6. Visual regression     | shipped | `pnpm test:visual` / `pnpm test:visual:update`    |
| 7. Coverage discipline   | shipped | reviewed at PR time against the Pillar 7 matrix   |

### Full local matrix

```bash
pnpm check:ct-parity   # Pillar 1
pnpm test:ct           # Pillar 2
pnpm test:md-roundtrip # Pillar 3
pnpm check:ssr         # Pillar 4
pnpm test:a11y         # Pillar 5
pnpm test:visual       # Pillar 6
```

### CT spec parity

`pnpm check:ct-parity` confirms that every `*.test.{tsx,ts}` file exists across `tests/ct/{react,vue,svelte}/specs/`, modulo the idiom prefix (`Use*` on React and Vue, `Create*` / `Get*` on Svelte). A non-zero exit means a spec exists in one or two frameworks but not all three.

### Markdown round-trip

`pnpm test:md-roundtrip` drives `Roundtrip.test.ts` against every sample in `tests/markdown-roundtrip/samples/index.ts` and asserts the round-tripped Markdown matches the input. Append a new sample to the relevant `<flavor>Samples` array to extend coverage.

### SSR static-HTML smoke

`pnpm check:ssr` runs `scripts/check-ssr-safety.ts`. The script performs a static lint that confirms Core contains no top-level `document` or `window` access. Lazy access inside function bodies remains permitted.

### Accessibility

`pnpm test:a11y` runs `tests/a11y/{react,vue,svelte}/` in Chromium. Each suite mounts every shipped component fixture in a Vitest browser context and asserts Web Content Accessibility Guidelines (WCAG) 2.1 AA conformance using bare `axe-core`. The shared `tests/a11y/scenarios/axe.scenario.ts` provides the `expectNoVizelA11yViolations` helper.

### Visual regression

`pnpm test:visual` compares screenshots against baselines committed under `tests/visual/specs/__screenshots__/`. Baselines are environment-specific (`<name>-chromium-<platform>.png`). Run `pnpm test:visual:update` to re-record baselines and commit the resulting PNG files.

## Process

### 1. Determine test scope

Pick the test scope based on the changed paths.

| Changed path            | Tests to run   |
| ----------------------- | -------------- |
| `packages/core/**`      | All frameworks |
| `packages/react/**`     | React only     |
| `packages/vue/**`       | Vue only       |
| `packages/svelte/**`    | Svelte only    |
| `tests/ct/scenarios/**` | All frameworks |
| `tests/ct/react/**`     | React only     |
| `tests/ct/vue/**`       | Vue only       |
| `tests/ct/svelte/**`    | Svelte only    |

### 2. Run tests

#### All frameworks (sequential)

```bash
pnpm test:ct
```

`pnpm test:ct` runs the full framework × browser matrix sequentially. Use per-framework or `--project` filtering when investigating a specific failure.

#### Single framework

```bash
pnpm test:ct:react
pnpm test:ct:vue
pnpm test:ct:svelte
```

#### Single project and browser

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium
pnpm exec vitest run --config vitest.browser.config.ts --project=react-firefox
pnpm exec vitest run --config vitest.browser.config.ts --project=react-webkit
```

Browser instances are named `<project>-<browser>` (e.g. `react-firefox`, `vue-chromium`, `svelte-webkit`).

#### Specific spec file (substring match)

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium Editor
```

### 3. Analyse results

Successful output:

```
Running X tests using Y workers

  ✓ ComponentName › test description (XXms)
  ...

  X passed (Y.Zs)
```

Failure output:

```
  ✗ ComponentName › test description (XXms)
    Error: expect(locator).toBeVisible()
    Locator: ...
    Expected: visible
    Received: hidden
```

### 4. Report

```markdown
## Test Results

### Summary

- **React**: ✅ X passed / ❌ Y failed
- **Vue**: ✅ X passed / ❌ Y failed
- **Svelte**: ✅ X passed / ❌ Y failed

### Failures

| Framework | Test                 | Error         |
| --------- | -------------------- | ------------- |
| React     | ComponentName › test | Error message |

### Next steps

- [ ] Fix the failing tests.
- [ ] Re-run the affected suite.
```

## Coverage audit

When the user asks about coverage, verify that every component and every hook, composable, or rune has a corresponding test.

### 1. List implementations

```bash
# React
ls packages/react/src/components/*.tsx | xargs -I {} basename {} .tsx
ls packages/react/src/hooks/*.ts | xargs -I {} basename {} .ts

# Vue
ls packages/vue/src/components/*.vue | xargs -I {} basename {} .vue
ls packages/vue/src/composables/*.ts | xargs -I {} basename {} .ts

# Svelte
ls packages/svelte/src/components/*.svelte | xargs -I {} basename {} .svelte
ls packages/svelte/src/runes/*.ts | xargs -I {} basename {} .ts
```

### 2. List test specs

```bash
ls tests/ct/react/specs/*.tsx tests/ct/vue/specs/*.ts tests/ct/svelte/specs/*.ts | xargs -I {} basename {}
```

### 3. Classify coverage

| Status        | Meaning                                        |
| ------------- | ---------------------------------------------- |
| ✅ Direct     | Has a dedicated spec file                      |
| ✅ Indirect   | Tested through a parent component              |
| ⚠️ Style-only | Pure styling component; may not require a spec |
| ❌ Missing    | Requires a spec                                |

### 4. Coverage report format

```markdown
## Test Coverage Report

### Components

| Component  | React | Vue | Svelte | Status |
| ---------- | :---: | :-: | :----: | ------ |
| EditorRoot |  ✅   | ✅  |   ✅   | Direct |
| BubbleMenu |  ✅   | ✅  |   ✅   | Direct |

### Hooks / Composables / Runes

| Function       | React | Vue | Svelte | Status   |
| -------------- | :---: | :-: | :----: | -------- |
| useVizelEditor |  ✅   | ✅  |   ✅   | Indirect |

### Summary

- Components: X/Y covered (Z%).
- Hooks/Composables/Runes: X/Y covered (Z%).

### Recommendations

- [ ] Add tests for the missing items.
```

## Troubleshooting

### Browser not installed

```bash
pnpm exec playwright install chromium
# Install every browser:
pnpm exec playwright install
```

### Test timeout

Increase the timeout for the affected test:

```ts
test("slow test", async () => {
  test.setTimeout(30000); // 30 seconds.
  // ...
});
```

### Narrowing a failure

When a failure is hard to isolate, run a single project on a single browser:

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium Editor
```

Use a spec name substring to limit the run to the relevant spec file.

### Element not found

Check whether the element renders to `document.body` (a portal):

```ts
// Inside the mounted fixture root.
const element = page.elementLocator(document.querySelector(".selector")!);

// Rendered to document.body (portal, slash menu, bubble menu).
const popup = page.getByRole("menu");
// or:
const popup = document.querySelector("[data-vizel-popup]");
```
