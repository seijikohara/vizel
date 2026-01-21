# Git Workflow and Conventions

## Commit Message Format

Use Conventional Commits format. The commit message is validated by lefthook pre-commit hook.

### Format

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
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring without feature or fix |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or external dependencies |
| `ci` | CI configuration changes |
| `chore` | Other changes (tooling, config, etc.) |
| `revert` | Revert previous commit |

### Scopes

| Scope | Description |
|-------|-------------|
| `core` | @vizel/core package |
| `react` | @vizel/react package |
| `vue` | @vizel/vue package |
| `svelte` | @vizel/svelte package |
| `demo` | Demo applications |
| (none) | Multiple packages or project-wide |

### Examples

```
feat(core): add image resize functionality
fix(svelte): resolve slash menu filtering issue
refactor(core): replace @tiptap/starter-kit with individual packages
docs: update README with installation instructions
chore: update dependencies
```

### Rules

- Use English for commit messages
- Use imperative mood ("add" not "added", "fix" not "fixed")
- First line must be 72 characters or less
- Do not end the subject line with a period
- Do not include Claude Code signatures or co-author lines

## Pull Request Format

### Title

Use the same format as commit messages:

```
<type>(<scope>): <description>
```

### Body

```markdown
## Summary

- Bullet points describing the changes
- Focus on what and why, not how

## Breaking Changes (if applicable)

- List any breaking changes
- Include migration instructions

## Test Plan

- [x] Run lint (`pnpm lint`)
- [x] Run typecheck (`pnpm typecheck`)
- [x] Manual testing description
```

### Rules

- PR title must match the primary change type
- Include Test Plan section with verification steps
- Mark completed verification items with `[x]`
- Use draft PR for work in progress

## Branch Naming

```
<type>/<short-description>
```

Examples:
- `feat/image-resize`
- `fix/slash-menu-filtering`
- `refactor/replace-starter-kit`

## Pre-commit Hooks

The project uses lefthook for Git hooks:

- `pre-commit`: Biome lint/format, typecheck
- `commit-msg`: Conventional Commits validation
- `pre-push`: Full lint and typecheck

Always ensure hooks pass before pushing.
