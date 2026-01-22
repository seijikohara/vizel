# Testing Guidelines

## Overview

This project uses Playwright Component Testing for E2E tests across React, Vue, and Svelte frameworks.

## Directory Structure

```
tests/
└── ct/
    ├── scenarios/           # Shared test scenarios (framework-agnostic)
    │   └── *.scenario.ts
    ├── react/
    │   ├── specs/           # React test specs
    │   │   └── *.spec.tsx
    │   └── playwright.config.ts
    ├── vue/
    │   ├── specs/           # Vue test specs
    │   │   └── *.spec.ts
    │   └── playwright.config.ts
    └── svelte/
        ├── specs/           # Svelte test specs
        │   └── *.spec.ts
        └── playwright.config.ts
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run all E2E tests (all frameworks) |
| `pnpm test:ct:react` | Run React E2E tests |
| `pnpm test:ct:vue` | Run Vue E2E tests |
| `pnpm test:ct:svelte` | Run Svelte E2E tests |

### Browser Options

```bash
# Run with specific browser
pnpm test:ct:react -- --project=chromium
pnpm test:ct:react -- --project=firefox
pnpm test:ct:react -- --project=webkit

# Run in headed mode (visible browser)
pnpm test:ct:react -- --headed

# Run specific test file
pnpm test:ct:react -- tests/ct/react/specs/Editor.spec.tsx
```

## Writing Tests

### Shared Scenarios

Create reusable test scenarios in `tests/ct/scenarios/`:

```typescript
// tests/ct/scenarios/example.scenario.ts
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function testFeature(
  component: Locator,
  page: Page
): Promise<void> {
  // Test implementation
  await expect(component).toBeVisible();
}
```

### Framework-Specific Specs

Import and use shared scenarios in framework specs:

```typescript
// tests/ct/react/specs/Example.spec.tsx
import { test } from "@playwright/experimental-ct-react";
import { testFeature } from "../../scenarios/example.scenario";
import { ExampleComponent } from "@vizel/react";

test.describe("Example", () => {
  test("feature works", async ({ mount, page }) => {
    const component = await mount(<ExampleComponent />);
    await testFeature(component, page);
  });
});
```

## Best Practices

### Locator Selection

| Priority | Method | Example |
|----------|--------|---------|
| 1 | Data attributes | `[data-vizel-*]` |
| 2 | ARIA roles | `getByRole("button")` |
| 3 | CSS classes | `.vizel-*` |
| 4 | Element type | `locator("button")` |

### Popup Components

Components rendered to `document.body` (portals) require `page.locator()`:

```typescript
// Component rendered inside mount target
const button = component.locator(".vizel-button");

// Popup rendered to document.body
const popup = page.locator("[data-vizel-popup]");
```

### Waiting

Prefer explicit waits over arbitrary timeouts:

```typescript
// Good
await expect(element).toBeVisible();
await expect(element).toHaveText("Expected");

// Avoid
await page.waitForTimeout(1000);
```

### Assertions

Use Playwright's built-in assertions with auto-retry:

```typescript
await expect(element).toBeVisible();
await expect(element).toHaveClass(/active/);
await expect(element).toContainText("Hello");
```

## Cross-Framework Testing

### Requirements

- All components must have equivalent tests across React, Vue, and Svelte
- Use shared scenarios to ensure consistent test coverage
- Test files should follow the naming pattern: `ComponentName.spec.{tsx,ts}`

### Adding New Tests

1. Create shared scenario in `tests/ct/scenarios/`
2. Create spec file in each framework's `specs/` directory
3. Import and use the shared scenario
4. Run tests for all frameworks to verify

## CI Integration

E2E tests run in GitHub Actions on every push and PR:

- Tests run in parallel across React, Vue, and Svelte
- Only Chromium browser is used in CI for speed
- Playwright reports are uploaded as artifacts
- Summary shows pass/fail status per framework
