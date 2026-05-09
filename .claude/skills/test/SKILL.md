---
name: test
description: Run E2E tests for React, Vue, and Svelte. Use when testing components, verifying changes, or before committing.
---

# Test Runner

This skill runs Playwright Component Tests across the React, Vue, and Svelte frameworks. It also audits test coverage on request.

## When to Use

- After implementing or modifying components.
- Before committing changes.
- When verifying cross-framework compatibility.
- When the user asks to run tests.
- When the user asks about test coverage.

## Quick Commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run all framework tests in parallel |
| `pnpm test:ct:seq` | Run all framework tests sequentially |
| `pnpm test:ct:react` | Run React tests only |
| `pnpm test:ct:vue` | Run Vue tests only |
| `pnpm test:ct:svelte` | Run Svelte tests only |

## Process

### 1. Determine Test Scope

Pick the test scope based on the changed paths.

| Changed Path | Tests to Run |
|--------------|--------------|
| `packages/core/**` | All frameworks |
| `packages/react/**` | React only |
| `packages/vue/**` | Vue only |
| `packages/svelte/**` | Svelte only |
| `tests/ct/scenarios/**` | All frameworks |
| `tests/ct/react/**` | React only |
| `tests/ct/vue/**` | Vue only |
| `tests/ct/svelte/**` | Svelte only |

### 2. Run Tests

#### All Frameworks (Parallel)

```bash
pnpm test:ct
```

> Parallel runs can hit timeouts when all browsers run together. Use `--project=chromium` for a faster, more reliable parallel run.

#### All Frameworks (Sequential)

```bash
pnpm test:ct:seq
```

#### Single Framework

```bash
pnpm test:ct:react
pnpm test:ct:vue
pnpm test:ct:svelte
```

#### Specific Browser

```bash
pnpm test:ct:react --project=chromium
pnpm test:ct:react --project=firefox
pnpm test:ct:react --project=webkit
```

#### Specific Test File

```bash
pnpm test:ct:react tests/ct/react/specs/Editor.spec.tsx
```

#### Headed Mode (Visible Browser)

```bash
pnpm test:ct:react --headed
```

### 3. Analyze Results

#### Success Output

```
Running X tests using Y workers

  ✓ ComponentName › test description (XXms)
  ...

  X passed (Y.Zs)
```

#### Failure Output

```
  ✗ ComponentName › test description (XXms)
    Error: expect(locator).toBeVisible()
    Locator: ...
    Expected: visible
    Received: hidden
```

### 4. Report Format

```markdown
## Test Results

### Summary
- **React**: ✅ X passed / ❌ Y failed
- **Vue**: ✅ X passed / ❌ Y failed
- **Svelte**: ✅ X passed / ❌ Y failed

### Failures (if any)

| Framework | Test | Error |
|-----------|------|-------|
| React | ComponentName › test | Error message |

### Next Steps
- [ ] Fix failing tests.
- [ ] Re-run the affected suite.
```

## Coverage Audit

When the user asks about coverage, verify that every component and every hook, composable, or rune has a corresponding test.

### 1. List Implementations

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

### 2. List Test Specs

```bash
ls tests/ct/react/specs/*.tsx tests/ct/vue/specs/*.ts tests/ct/svelte/specs/*.ts | xargs -I {} basename {}
```

### 3. Classify Coverage

| Status | Meaning |
|--------|---------|
| ✅ Direct | Has a dedicated spec file |
| ✅ Indirect | Tested through a parent component |
| ⚠️ Style-only | Pure styling component; may not require a spec |
| ❌ Missing | Requires a spec |

### 4. Coverage Report Format

```markdown
## Test Coverage Report

### Components

| Component | React | Vue | Svelte | Status |
|-----------|:-----:|:---:|:------:|--------|
| EditorRoot | ✅ | ✅ | ✅ | Direct |
| BubbleMenu | ✅ | ✅ | ✅ | Direct |
| SlashMenu | ✅ | ✅ | ✅ | Direct |

### Hooks / Composables / Runes

| Function | React | Vue | Svelte | Status |
|----------|:-----:|:---:|:------:|--------|
| useVizelEditor | ✅ | ✅ | ✅ | Indirect |
| useVizelEditorState | ❌ | ❌ | ❌ | Missing |

### Summary
- Components: X/Y covered (Z%).
- Hooks/Composables/Runes: X/Y covered (Z%).

### Recommendations
- [ ] Add tests for missing items.
- [ ] Decide whether style-only components require tests.
```

## Troubleshooting

### Browser Not Installed

```bash
pnpm exec playwright install chromium
# or install all browsers
pnpm exec playwright install
```

### Test Timeout

Increase the timeout for the affected test:

```typescript
test("slow test", async ({ mount, page }) => {
  test.setTimeout(30000); // 30 seconds
  // ...
});
```

### Parallel Execution Timeout

Parallel runs across all frameworks and all browsers can fail with messages like:

```
browserContext.newPage: Test timeout of 10000ms exceeded
```

Mitigation:

1. Use a single browser: `pnpm test:ct --project=chromium`.
2. Use sequential execution: `pnpm test:ct:seq`.
3. Reduce the worker count in the config (currently 50% CPU).

### Element Not Found

Check whether the element renders to `document.body` (a portal):

```typescript
// Inside the mount target.
const element = component.locator(".selector");

// Rendered to document.body.
const popup = page.locator(".selector");
```

## Common Patterns

### Run Tests for Changed Files

```bash
# List changed files.
git diff --name-only HEAD~1

# Run the relevant suite.
pnpm test:ct:react  # if React files changed
```

### Pre-commit Verification

```bash
# Quick parallel check with a single browser.
pnpm test:ct --project=chromium

# Or a sequential check with a single browser.
pnpm test:ct:seq --project=chromium
```

### Full CI-like Verification

```bash
# All frameworks in parallel, all browsers.
pnpm test:ct

# All frameworks sequentially, all browsers (more stable).
pnpm test:ct:seq
```
