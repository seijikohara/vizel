# Test Skill Examples

Concrete invocation patterns for the `test` skill.

## Run every framework sequentially

```bash
pnpm test:ct
```

Best for the default verification pass before opening a pull request.

## Run a single framework

```bash
pnpm test:ct:react
pnpm test:ct:vue
pnpm test:ct:svelte
```

Use this when the change scope is limited to one adapter (e.g. `packages/react/**`).

## Run a single project on a single browser

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium
```

Use this to run the React suite on Chromium only. Browser instances are named `<project>-<browser>` (e.g. `react-firefox`, `vue-webkit`, `svelte-chromium`).

## Run a specific spec by name substring

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium Editor
```

The trailing argument filters by spec name substring. Use this when iterating on a single failing spec.

## Reproduce a flaky CI failure locally

```bash
pnpm exec vitest run --config vitest.browser.config.ts --project=react-chromium
```

Running a single project on a single browser surfaces races that the full matrix run hides.

## Verify Markdown round-trip after touching `packages/core/src/markdown/`

```bash
pnpm test:md-roundtrip
```

Add a new flavor-specific sample to `tests/markdown-roundtrip/samples/index.ts` to extend coverage.

## Verify SSR after touching `@vizel/core` SSR helpers

```bash
pnpm check:ssr
```

The script performs a static lint that confirms Core contains no top-level `document` or `window` access.

## Run the accessibility suite

```bash
pnpm test:a11y
```

The suite mounts every shipped component fixture in Chromium and asserts WCAG 2.1 AA conformance using bare `axe-core`. Run a single framework variant with `pnpm test:a11y:react`, `pnpm test:a11y:vue`, or `pnpm test:a11y:svelte`.

## Compare or update visual baselines

```bash
# Compare against committed baselines.
pnpm test:visual

# Re-record baselines (commit the resulting PNG files).
pnpm test:visual:update
```

## Verify framework parity after adding a component

```bash
pnpm check:ct-parity
```

The script fails when a `*.test.{tsx,ts}` spec file exists in one framework but not all three. Lefthook also runs this check on `pre-push`.

## Audit coverage before opening a pull request

Run the coverage workflow in `reference.md` and produce the coverage report. The reviewer reads the same report when evaluating the change.
