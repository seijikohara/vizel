# Git Workflow

This project uses Conventional Commits. The lefthook `commit-msg` hook validates each commit message.

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style only (formatting, semicolons) |
| `refactor` | Code change that is neither feature nor fix |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system or external dependencies |
| `ci` | CI configuration |
| `chore` | Other changes (tooling, config) |
| `revert` | Revert a previous commit |

### Scopes

| Scope | Description |
|-------|-------------|
| `core` | `@vizel/core` package |
| `react` | `@vizel/react` package |
| `vue` | `@vizel/vue` package |
| `svelte` | `@vizel/svelte` package |
| `demo` | Demo applications under `apps/demo/` |
| `docs` | VitePress docs site under `docs/` |
| `ct` | Vitest Browser Mode component tests under `tests/ct/` |
| `deps` | Dependency-only changes (typically `chore(deps)`) |
| `spec` | design spec under `docs/superpowers/specs/` |
| `guide` | User-facing guide pages under `docs/guide/` |
| `plan` | Implementation plans under `docs/superpowers/plans/` |
| `i18n` | Locale files |
| `a11y` | Accessibility-only fixes |
| `ci` | CI workflows under `.github/workflows/` |
| (none) | Multiple packages or project-wide changes |

### Rules

- Write commit messages in English.
- Use the imperative mood ("add", not "added"; "fix", not "fixed").
- Limit the subject line to 72 characters.
- Do not end the subject line with a period.
- Do not include AI-generated co-author or signature lines.

### Examples

```
feat(core): add image resize functionality
fix(svelte): resolve slash menu filtering issue
refactor(core): replace @tiptap/starter-kit with individual packages
docs: update README with installation instructions
chore: update dependencies
```

## Pull Requests

### Title

The PR title follows the commit message format:

```
<type>(<scope>): <description>
```

### Body Template

```markdown
## Summary

- Bullet points describing the changes.
- Focus on what and why, not how.

## Breaking Changes (if applicable)

- List breaking changes.
- Include migration instructions.

## Test Plan

- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Manual testing description.
```

### Rules

- The PR title matches the primary change type.
- The body includes a Test Plan with executable verification steps.
- The author marks completed verification items with `[x]`.
- The author marks the PR as draft while work is in progress.

## Branch Naming

Use the pattern `<type>/<short-description>`:

```
feat/image-resize
fix/slash-menu-filtering
refactor/replace-starter-kit
```

## Pre-commit Hooks

Lefthook runs the following hooks. Always ensure they pass before pushing.

| Hook | Action |
|------|--------|
| `pre-commit` | Biome lint and format, TypeScript check |
| `commit-msg` | Conventional Commits validation |
| `pre-push` | Full lint and typecheck |
