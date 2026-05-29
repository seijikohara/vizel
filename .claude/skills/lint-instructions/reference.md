# Lint-Instructions Skill Reference

This document holds the long-form reference for the `lint-instructions` skill. The skill's `SKILL.md` keeps the trigger short; this file expands the process, the rule taxonomy, and the report format.

## Process

### 1. Load the rules

Each rule under `.claude/rules/` declares a `paths:` frontmatter that scopes its automatic loading. This skill performs full compliance checks across the project, so it reads every rule file explicitly regardless of the current file scope.

Read every file under `.claude/rules/` and `.claude/rules/packages/`. The skill considers a rule applicable when the changed path matches the rule's `paths:` patterns or when the rule has no `paths:` (always-on rules).

### 2. Identify changed files

```bash
git diff --name-only HEAD~1
```

### 3. Apply the relevant rules

| Changed path | Apply these rules |
|--------------|-------------------|
| `packages/core/**` | `code-style.md`, `writing.md`, `feature-manifest.md`, `packages/core.md` |
| `packages/headless/**` | `code-style.md`, `writing.md`, `packages/headless.md` |
| `packages/react/**` | `code-style.md`, `writing.md`, `feature-manifest.md`, `packages/react.md` |
| `packages/vue/**` | `code-style.md`, `writing.md`, `feature-manifest.md`, `packages/vue.md` |
| `packages/svelte/**` | `code-style.md`, `writing.md`, `feature-manifest.md`, `packages/svelte.md` |
| `apps/demo/**` | `code-style.md`, `writing.md`, `demo.md` |
| `tests/ct/**` | `code-style.md`, `writing.md`, `testing.md` |
| `docs/**` | `writing.md` |
| Commit message | `git.md` |

### 4. Verify each category

#### Code style (`code-style.md`)

- Exports use `function` declarations where applicable.
- Callbacks use arrow functions.
- Public APIs prefer `satisfies` over type annotations.
- Type guards replace `as` casts.
- Public APIs include JSDoc.

#### Writing (`writing.md`)

- One idea per sentence; no filler.
- Active voice; present tense in comments and docstrings.
- Explicit subjects; no ambiguous pronouns (`it`, `this`, `that`).
- Abbreviations defined at first use.
- Function docstrings start with an infinitive verb.
- Comments explain *why*, not *what*.

#### Feature manifest (`feature-manifest.md`)

- Every new feature has a `VizelFeatureDefinition` entry in `packages/core/src/feature-manifest.ts`.
- Every adapter implements the symbol declared in the manifest.
- The scenario folder under `tests/ct/scenarios/<feature-id>/` exists.

#### Core package (`packages/core.md`)

- No framework runtime dependencies.
- Shared types and constants live here.

#### Framework packages (`packages/{react,vue,svelte}.md`)

- Idiomatic naming (hooks vs composables vs runes).
- Correct context API usage.
- No duplication of `@vizel/core` logic.
- No direct `document.addEventListener` calls; controllers from `@vizel/core` or `@vizel/headless` own global listeners.

#### Git (`git.md`)

- The commit subject follows Conventional Commits.
- The subject uses the imperative mood, lower case, no trailing period.
- The subject stays at or under 72 characters.

### 5. Report

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

### 6. Apply fixes

For each fixable violation:

1. Show the violation.
2. Propose the fix.
3. Apply the fix after the user confirms.

## Quick checks

| Command | Purpose |
|---------|---------|
| `pnpm check` | Auto-fix Biome violations (formatting, imports, exports, naming) |
| `pnpm typecheck` | Verify type safety |
| `pnpm check:feature-parity` | Verify cross-framework feature parity against the manifest |
| `pnpm build` | Verify the build succeeds |

## Common violations

| Violation | Rule | Fix |
|-----------|------|-----|
| `export const fn = () => {}` | `code-style.md` | Use `export function fn() {}` |
| `data as Type` | `code-style.md` | Add a type guard function |
| Type defined inside a framework package | `feature-manifest.md` / `packages/core.md` | Move the type to `@vizel/core` |
| Component missing in one framework | `feature-manifest.md` | Add the equivalent component and update the manifest |
| `default export` | Biome | Use a named export |
| `document.addEventListener` in framework component | `packages/{react,vue,svelte}.md` | Delegate to a controller from `@vizel/core` or `@vizel/headless` |
| Passive voice in a comment | `writing.md` | Rewrite in the active voice |
| Component file over 120 view-template lines | `packages/{react,vue,svelte}.md` | Split or extract logic into Core / Headless |
