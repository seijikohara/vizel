# Test Skill Reference

This document holds the long-form reference for the `test` skill. The skill's `SKILL.md` keeps the trigger short; this file expands the process, the seven testing pillars, and the failure analysis flow.

## Seven testing pillars

The pillars come from `.claude/rules/testing.md`. The skill drives every pillar that ships a runnable suite today.

| Pillar | Status | How to run |
|--------|--------|------------|
| 1. Framework parity | shipped | `pnpm check:ct-parity` |
| 2. Behaviour tests | shipped | `pnpm test:ct` (and the per-framework variants) |
| 3. Markdown round-trip | shipped | `pnpm test:md-roundtrip` |
| 4. SSR static-HTML smoke | shipped | `pnpm test:ssr` |
| 5. Accessibility | not yet | `tests/a11y/` is tracked as follow-up |
| 6. Visual regression | not yet | CI-only suite tracked as follow-up |
| 7. Coverage discipline | shipped | reviewed at PR time against the Pillar 7 matrix |

### Full local matrix

```bash
pnpm check:ct-parity   # Pillar 1
pnpm test:ct           # Pillar 2
pnpm test:md-roundtrip # Pillar 3
pnpm test:ssr          # Pillar 4
```

### CT spec parity

`pnpm check:ct-parity` confirms that every `*.spec.{tsx,ts}` file exists across `tests/ct/{react,vue,svelte}/specs/`, modulo the idiom prefix (`Use*` on React and Vue, `Create*` / `Get*` on Svelte). A non-zero exit means a spec exists in one or two frameworks but not all three.

### Markdown round-trip

`pnpm test:md-roundtrip` drives `generateVizelStaticHtml` against every sample in `tests/markdown-roundtrip/samples/index.ts` and asserts the round-tripped Markdown matches the input. Append a new sample to the relevant `<flavor>Samples` array to extend coverage.

### SSR static-HTML smoke

`pnpm test:ssr` runs `scripts/test-static-html.ts`. The script boots the Core SSR path in Node, renders fixed Markdown samples, and asserts the produced HTML contains the expected DOM markers. Append a `StaticHtmlCase` entry to the same script to cover a new case.

### Accessibility (planned)

`tests/a11y/` will run `@axe-core/playwright` against every component. The directory and dependency are tracked as follow-up work. The skill will gain a `pnpm test:a11y` command once the suite lands.

### Visual regression (planned)

A CI-only visual-snapshot suite covering ~20 essential views is planned. Local execution stays skipped to avoid OS-level rendering noise. The skill will gain a `pnpm test:visual` (CI-only) command once the suite lands.

## Process

### 1. Determine test scope

Pick the test scope based on the changed paths.

| Changed path | Tests to run |
|--------------|--------------|
| `packages/core/**` | All frameworks |
| `packages/react/**` | React only |
| `packages/vue/**` | Vue only |
| `packages/svelte/**` | Svelte only |
| `tests/ct/scenarios/**` | All frameworks |
| `tests/ct/react/**` | React only |
| `tests/ct/vue/**` | Vue only |
| `tests/ct/svelte/**` | Svelte only |

### 2. Run tests

#### All frameworks (parallel)

```bash
pnpm test:ct
```

Parallel runs across all frameworks and all browsers can hit timeouts. Use `--project=chromium` for a faster, more reliable parallel run when investigating a failure.

#### All frameworks (sequential)

```bash
pnpm test:ct:seq
```

#### Single framework

```bash
pnpm test:ct:react
pnpm test:ct:vue
pnpm test:ct:svelte
```

#### Specific browser

```bash
pnpm test:ct:react --project=chromium
pnpm test:ct:react --project=firefox
pnpm test:ct:react --project=webkit
```

#### Specific test file

```bash
pnpm test:ct:react tests/ct/react/specs/Editor.spec.tsx
```

#### Headed mode (visible browser)

```bash
pnpm test:ct:react --headed
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

| Framework | Test | Error |
|-----------|------|-------|
| React | ComponentName › test | Error message |

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

| Status | Meaning |
|--------|---------|
| ✅ Direct | Has a dedicated spec file |
| ✅ Indirect | Tested through a parent component |
| ⚠️ Style-only | Pure styling component; may not require a spec |
| ❌ Missing | Requires a spec |

### 4. Coverage report format

```markdown
## Test Coverage Report

### Components

| Component | React | Vue | Svelte | Status |
|-----------|:-----:|:---:|:------:|--------|
| EditorRoot | ✅ | ✅ | ✅ | Direct |
| BubbleMenu | ✅ | ✅ | ✅ | Direct |

### Hooks / Composables / Runes

| Function | React | Vue | Svelte | Status |
|----------|:-----:|:---:|:------:|--------|
| useVizelEditor | ✅ | ✅ | ✅ | Indirect |

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
test("slow test", async ({ mount, page }) => {
  test.setTimeout(30000); // 30 seconds.
  // ...
});
```

### Parallel execution timeout

Parallel runs across all frameworks and all browsers can fail with messages like:

```
browserContext.newPage: Test timeout of 10000ms exceeded
```

Mitigations:

1. Use a single browser: `pnpm test:ct --project=chromium`.
2. Run sequentially: `pnpm test:ct:seq`.
3. Reduce the worker count in the config (currently 50% CPU).

### Element not found

Check whether the element renders to `document.body` (a portal):

```ts
// Inside the mount target.
const element = component.locator(".selector");

// Rendered to document.body.
const popup = page.locator(".selector");
```
