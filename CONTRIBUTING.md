# Contributing to Vizel

Thank you for your interest in contributing to Vizel! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (>= 18)
- [pnpm](https://pnpm.io/) (specified in `package.json` `packageManager` field)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/seijikohara/vizel.git
cd vizel

# Install dependencies
pnpm install

# Run a demo app
pnpm dev:react    # React demo (http://localhost:3000)
pnpm dev:vue      # Vue demo (http://localhost:3001)
pnpm dev:svelte   # Svelte demo (http://localhost:3002)
pnpm dev:all      # All demos simultaneously
```

## Development Workflow

### Branch Naming

Use the format `<type>/<short-description>`:

```
feat/image-resize
fix/slash-menu-filtering
docs/api-reference
refactor/replace-starter-kit
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:react` | Run React demo |
| `pnpm dev:vue` | Run Vue demo |
| `pnpm dev:svelte` | Run Svelte demo |
| `pnpm dev:all` | Run all demos |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run Biome linter |
| `pnpm check` | Run Biome check with auto-fix |
| `pnpm typecheck` | Run type checking for all packages |
| `pnpm test:ct` | Run all E2E tests (parallel) |
| `pnpm test:ct:react` | Run React E2E tests |
| `pnpm test:ct:vue` | Run Vue E2E tests |
| `pnpm test:ct:svelte` | Run Svelte E2E tests |

### Before Submitting

1. Run `pnpm check` to auto-fix lint and formatting issues
2. Run `pnpm typecheck` to verify type safety
3. Run `pnpm build` to verify all packages build
4. Run `pnpm test:ct` to verify all E2E tests pass

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by a `commit-msg` hook via [lefthook](https://github.com/evilmartians/lefthook).

### Format

```
<type>(<scope>): <description>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system changes |
| `ci` | CI configuration changes |
| `chore` | Other changes |

### Scopes

| Scope | Description |
|-------|-------------|
| `core` | `@vizel/core` package |
| `react` | `@vizel/react` package |
| `vue` | `@vizel/vue` package |
| `svelte` | `@vizel/svelte` package |
| `demo` | Demo applications |

### Examples

```
feat(core): add image resize functionality
fix(svelte): resolve slash menu filtering issue
docs: update README with installation instructions
```

## Pull Request Process

1. Create a branch from `main` using the naming convention above
2. Make your changes and commit using Conventional Commits
3. Push your branch and open a Pull Request
4. Ensure all CI checks pass
5. Fill in the PR template with a summary and test plan

### PR Title

Use the same Conventional Commits format as commit messages.

## Architecture

### Core Package Centralization

All framework-agnostic code belongs in `@vizel/core`:

- **Types** — `core/src/types.ts`
- **Extensions** — `core/src/extensions/`
- **Utilities** — `core/src/utils/`
- **Styles** — `core/src/styles/`
- **Constants** — `core/src/`

Framework packages (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`) only contain framework-specific components and state management.

### Cross-Framework Consistency

**New features must be implemented in all three frameworks.** When adding a component or hook:

- [ ] Implement in `@vizel/react`
- [ ] Implement in `@vizel/vue`
- [ ] Implement in `@vizel/svelte`
- [ ] Update all three demo apps
- [ ] Add shared test scenario in `tests/ct/scenarios/`
- [ ] Add framework-specific test specs

If a feature cannot be implemented for a specific framework, document the reason in the PR.

## Code Style

- **TypeScript** with strict mode enabled
- **Biome** for linting and formatting
- Use `function` declarations for exports, arrow functions for callbacks
- Use `satisfies` operator over type annotations
- Use type guards over `as` casts

## Testing

This project uses [Playwright Component Testing](https://playwright.dev/docs/test-components) for E2E tests.

- Shared test scenarios live in `tests/ct/scenarios/`
- Framework-specific specs live in `tests/ct/{framework}/specs/`
- Prefer `[data-vizel-*]` attributes for test locators

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Security

For reporting security vulnerabilities, please see our [Security Policy](SECURITY.md).
