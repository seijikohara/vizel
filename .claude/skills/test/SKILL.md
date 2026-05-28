---
name: test
description: Run Playwright Component Tests for React, Vue, and Svelte, and audit test coverage.
when_to_use: Use after implementing or modifying components, before committing changes, when verifying cross-framework compatibility, when the user asks to run tests, or when the user asks about test coverage.
paths:
  - "tests/**"
  - "**/playwright-ct.config.ts"
argument-hint: "[framework]"
---

# Test Runner

This skill runs Playwright Component Tests across React, Vue, and Svelte, drives the Markdown round-trip and SSR smoke suites, and audits coverage on request.

## Quick commands

| Command | Description |
|---------|-------------|
| `pnpm test:ct` | Run every framework in parallel |
| `pnpm test:ct:seq` | Run every framework sequentially |
| `pnpm test:ct:react` | Run React tests only |
| `pnpm test:ct:vue` | Run Vue tests only |
| `pnpm test:ct:svelte` | Run Svelte tests only |
| `pnpm test:md-roundtrip` | Run the Markdown round-trip suite (Pillar 3) |
| `pnpm test:ssr` | Run the SSR static-HTML smoke test (Pillar 4) |
| `pnpm check:ct-parity` | Verify CT spec parity across frameworks (Pillar 1) |

## Scope routing

| Argument | Action |
|----------|--------|
| (none) | Run `pnpm test:ct` for every framework. |
| `react` | Run `pnpm test:ct:react`. |
| `vue` | Run `pnpm test:ct:vue`. |
| `svelte` | Run `pnpm test:ct:svelte`. |
| `parity` | Run `pnpm check:ct-parity`. |
| `roundtrip` | Run `pnpm test:md-roundtrip`. |
| `ssr` | Run `pnpm test:ssr`. |

## Supporting files

- [`reference.md`](./reference.md) — full process, pillar matrix, failure analysis, troubleshooting.
- [`examples.md`](./examples.md) — concrete invocation patterns.

The reference and examples files load on demand. The skill picks them up when the user asks for details or hits an unfamiliar failure mode.
