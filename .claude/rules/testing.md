---
paths:
  - "tests/**/*"
  - "**/playwright-ct.config.ts"
---

# Testing

This project uses Playwright Component Testing for end-to-end (E2E) tests across React, Vue, and Svelte.

## Directory Structure

```
tests/ct/
├── scenarios/                # Framework-agnostic shared scenarios
│   └── *.scenario.ts
├── react/
│   ├── specs/                # *.spec.tsx
│   └── playwright-ct.config.ts
├── vue/
│   ├── specs/                # *.spec.ts
│   └── playwright-ct.config.ts
└── svelte/
    ├── specs/                # *.spec.ts
    └── playwright-ct.config.ts
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run all framework tests in parallel |
| `pnpm test:ct:seq` | Run all framework tests sequentially |
| `pnpm test:ct:react` | Run React tests only |
| `pnpm test:ct:vue` | Run Vue tests only |
| `pnpm test:ct:svelte` | Run Svelte tests only |

### Browser and File Selection

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

## Authoring Tests

### Shared Scenarios

Define reusable scenarios under `tests/ct/scenarios/`:

```typescript
// tests/ct/scenarios/example.scenario.ts
import { expect, type Locator, type Page } from "@playwright/test";

export async function testFeature(component: Locator, page: Page): Promise<void> {
  await expect(component).toBeVisible();
}
```

### Framework-Specific Specs

Import shared scenarios into framework specs:

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

## Best Practices

### Locator Priority

Pick locators from the most stable source first.

| Priority | Method | Example |
|----------|--------|---------|
| 1 | Data attribute | `[data-vizel-*]` |
| 2 | ARIA role | `getByRole("button")` |
| 3 | CSS class | `.vizel-*` |
| 4 | Element type | `locator("button")` |

### Portals

Components rendered to `document.body` (portals) require `page.locator()`. Components rendered inside the mount target use `component.locator()`.

```typescript
// Inside mount target.
const button = component.locator(".vizel-button");

// Rendered to document.body.
const popup = page.locator("[data-vizel-popup]");
```

### Waiting

Prefer assertion-based waits over fixed timeouts.

```typescript
// GOOD.
await expect(element).toBeVisible();
await expect(element).toHaveText("Expected");

// AVOID.
await page.waitForTimeout(1000);
```

### Assertions

Use Playwright's auto-retrying assertions.

```typescript
await expect(element).toBeVisible();
await expect(element).toHaveClass(/active/);
await expect(element).toContainText("Hello");
```

## Cross-Framework Coverage

- Every component requires equivalent tests in React, Vue, and Svelte.
- Share scenarios under `tests/ct/scenarios/` to keep coverage consistent.
- Name spec files `ComponentName.spec.{tsx,ts}`.

### Adding a New Test

1. Create a shared scenario under `tests/ct/scenarios/`.
2. Create a spec file under each framework's `specs/` directory.
3. Import the shared scenario in each spec.
4. Run the tests for all frameworks to verify parity.

## Continuous Integration

GitHub Actions runs the E2E tests on every push and pull request.

- The runner executes the tests for React, Vue, and Svelte in parallel.
- The runner uses only Chromium for speed.
- The runner uploads Playwright reports as artifacts.
- The summary shows pass and fail counts per framework.
