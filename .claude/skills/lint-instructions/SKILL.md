---
name: lint-instructions
description: Detect and fix violations of the project rules under `.claude/rules/`.
when_to_use: Use before committing changes, after implementing a feature, during pull-request preparation, or when the user asks to check rule compliance.
paths:
  - "packages/**"
  - "apps/**"
  - "tests/**"
  - "docs/**"
disable-model-invocation: true
---

# Instruction Linter

This skill validates code against the project rules in `.claude/rules/`. The skill is manual-only: the maintainer invokes it explicitly when ready for a compliance pass.

## Quick checks

| Command | Purpose |
|---------|---------|
| `pnpm check` | Auto-fix Biome violations (formatting, imports, exports, naming) |
| `pnpm typecheck` | Verify type safety |
| `pnpm check:parity` | Verify cross-framework feature parity against the manifest |
| `pnpm build` | Verify the build succeeds |

## Supporting files

- [`reference.md`](./reference.md) — full process, rule taxonomy, report format, common violations.
- [`examples.md`](./examples.md) — concrete invocation patterns.

The reference and examples files load on demand. The skill picks them up when running a full compliance pass or when the user requests detail.
