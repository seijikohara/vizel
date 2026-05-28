# Test Skill Examples

Concrete invocation patterns for the `test` skill.

## Run every framework in parallel

```bash
pnpm test:ct
```

Best for the default verification pass. Falls back to `--project=chromium` when the matrix flakes.

## Run a single framework

```bash
pnpm test:ct:react
pnpm test:ct:vue
pnpm test:ct:svelte
```

Use this when the change scope is limited to one adapter (e.g. `packages/react/**`).

## Run a single spec file

```bash
pnpm test:ct:react tests/ct/react/specs/Editor.spec.tsx
```

Use this when iterating on a failing test. Combine with `--headed` to see the browser.

## Reproduce a flaky CI failure locally

```bash
pnpm test:ct:seq --project=chromium
```

Sequential execution on a single browser surfaces races that parallel runs hide.

## Verify Markdown round-trip after touching `packages/core/src/markdown/`

```bash
pnpm test:md-roundtrip
```

Add a new flavour-specific sample to `tests/markdown-roundtrip/samples/<flavour>.ts` to extend coverage.

## Verify SSR after touching `@vizel/core` SSR helpers

```bash
pnpm test:ssr
```

Append a `StaticHtmlCase` to `scripts/test-static-html.ts` to cover a new SSR scenario.

## Verify framework parity after adding a component

```bash
pnpm check:ct-parity
```

The script fails when a spec file exists in one framework but not all three. Lefthook also runs this on `pre-push`.

## Audit coverage before opening a pull request

Run the coverage workflow in `reference.md` and produce the coverage report. The reviewer reads the same report when evaluating the change.
