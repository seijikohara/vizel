---
name: lint-instructions
description: Detect and fix violations of the project rules under .claude/rules/. Use before committing changes, after implementing a feature, or when the user asks to check rule compliance.
---

# Instruction Linter

This skill validates code against the project rules in `.claude/rules/`.

## When to Use

- Before committing changes.
- After implementing a feature.
- During pull request preparation.
- When the user asks to check rule compliance.

## Process

### 1. Load the Rules

Each rule under `.claude/rules/` declares a `paths:` frontmatter that scopes its automatic loading. This skill performs full compliance checks across the project, so it reads every rule file explicitly regardless of the current file scope.

Read all rule files:

- `.claude/rules/code-style.md`
- `.claude/rules/cross-framework.md`
- `.claude/rules/git.md`
- `.claude/rules/testing.md`
- `.claude/rules/demo.md`
- `.claude/rules/packages/core.md`
- `.claude/rules/packages/react.md`
- `.claude/rules/packages/vue.md`
- `.claude/rules/packages/svelte.md`

### 2. Identify Changed Files

```bash
git diff --name-only HEAD~1
```

### 3. Apply the Relevant Rules

| Changed Path | Apply These Rules |
|--------------|-------------------|
| `packages/core/**` | `code-style.md`, `cross-framework.md`, `packages/core.md` |
| `packages/react/**` | `code-style.md`, `cross-framework.md`, `packages/react.md` |
| `packages/vue/**` | `code-style.md`, `cross-framework.md`, `packages/vue.md` |
| `packages/svelte/**` | `code-style.md`, `cross-framework.md`, `packages/svelte.md` |
| `apps/demo/**` | `code-style.md`, `demo.md` |
| `tests/ct/**` | `code-style.md`, `testing.md` |
| Commit message | `git.md` |

### 4. Verify Each Category

For each applicable rule file, verify the following.

#### Code Style (`code-style.md`)

- [ ] Exports use `function` declarations.
- [ ] Callbacks use arrow functions.
- [ ] Public APIs prefer `satisfies` over type annotations.
- [ ] Type guards replace `as` casts.
- [ ] Public APIs include JSDoc.

#### Cross-Framework (`cross-framework.md`)

- [ ] Each component exists in all three framework packages.
- [ ] Props match across frameworks (allowing `class` versus `className`).
- [ ] Hooks, composables, and runes share an option interface defined in `@vizel/core`.
- [ ] No framework package re-exports symbols from `@vizel/core`.

#### Core Package (`packages/core.md`)

- [ ] No framework runtime dependencies.
- [ ] Shared types and constants live here.
- [ ] No usage of `@tiptap/starter-kit`.

#### Framework Packages (`packages/{react,vue,svelte}.md`)

- [ ] Idiomatic naming (hooks vs composables vs runes).
- [ ] Correct context API usage.
- [ ] No duplication of `@vizel/core` logic.

#### Git (`git.md`)

- [ ] The commit subject follows Conventional Commits.
- [ ] The subject uses the imperative mood.
- [ ] The subject is 72 characters or fewer.

### 5. Report

Use this format:

```markdown
## Instruction Compliance Report

### ✅ Passing
- <rule>: <description>

### ❌ Violations
- <rule>: <file:line> — <issue>
  - **Fix**: <suggested fix>

### ⚠️ Warnings
- <rule>: <potential issue>
```

### 6. Apply Fixes

For each fixable violation:

1. Show the violation.
2. Propose the fix.
3. Apply the fix after the user confirms.

## Quick Checks

| Command | Purpose |
|---------|---------|
| `pnpm check` | Auto-fix Biome violations (formatting, imports, exports, naming) |
| `pnpm typecheck` | Verify type safety |
| `pnpm build` | Verify the build succeeds |

## Common Violations

| Violation | Rule | Fix |
|-----------|------|-----|
| `export const fn = () => {}` | `code-style.md` | Use `export function fn() {}` |
| `data as Type` | `code-style.md` | Add a type guard function |
| Type defined inside a framework package | `cross-framework.md` | Move the type to `@vizel/core` |
| Component missing in one framework | `cross-framework.md` | Add the equivalent component |
| `default export` | Biome | Use a named export |
| Re-export from `@vizel/core` in a framework package | `cross-framework.md` | Import directly from `@vizel/core` |
