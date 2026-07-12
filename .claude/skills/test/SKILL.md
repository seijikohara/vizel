---
name: test
description: Run Vitest Browser Mode tests for React, Vue, and Svelte, and audit test coverage.
when_to_use: Use after implementing or modifying components, before committing changes, when verifying cross-framework compatibility, when the user asks to run tests, or when the user asks about test coverage.
paths:
  - "tests/**"
  - "**/vitest.browser.config.ts"
argument-hint: "[framework]"
---

# Test Runner

This skill runs Vitest Browser Mode tests across React, Vue, and Svelte, drives the a11y, visual, Markdown round-trip, and SSR suites, and audits coverage on request.

## Quick commands

| Command                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm test:ct`            | Run all framework component tests sequentially                  |
| `pnpm test:ct:react`      | Run React component tests on all browsers                       |
| `pnpm test:ct:vue`        | Run Vue component tests on all browsers                         |
| `pnpm test:ct:svelte`     | Run Svelte component tests on all browsers                      |
| `pnpm test:a11y`          | Run all framework accessibility tests (Chromium only)           |
| `pnpm test:a11y:react`    | Run React a11y suite (Chromium only)                            |
| `pnpm test:a11y:vue`      | Run Vue a11y suite (Chromium only)                              |
| `pnpm test:a11y:svelte`   | Run Svelte a11y suite (Chromium only)                           |
| `pnpm test:visual`        | Compare screenshots against committed baselines                 |
| `pnpm test:visual:update` | Re-record visual baselines                                      |
| `pnpm test:md-roundtrip`  | Run the Markdown round-trip suite (Pillar 3)                    |
| `pnpm check:ssr`          | Confirm Core stays free of top-level browser globals (Pillar 4) |
| `pnpm check:ct-parity`    | Verify spec parity across frameworks (Pillar 1)                 |

## Scope routing

| Argument    | Action                                  |
| ----------- | --------------------------------------- |
| (none)      | Run `pnpm test:ct` for every framework. |
| `react`     | Run `pnpm test:ct:react`.               |
| `vue`       | Run `pnpm test:ct:vue`.                 |
| `svelte`    | Run `pnpm test:ct:svelte`.              |
| `a11y`      | Run `pnpm test:a11y`.                   |
| `visual`    | Run `pnpm test:visual`.                 |
| `parity`    | Run `pnpm check:ct-parity`.             |
| `roundtrip` | Run `pnpm test:md-roundtrip`.           |
| `ssr`       | Run `pnpm check:ssr`.                   |

## Supporting files

- [`reference.md`](./reference.md) — full process, pillar matrix, failure analysis, troubleshooting.
- [`examples.md`](./examples.md) — concrete invocation patterns.

The reference and examples files load on demand. The skill picks them up when the user asks for details or hits an unfamiliar failure mode.
