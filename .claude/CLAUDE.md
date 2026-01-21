# Vizel Project

A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte.

## Project Structure

```
packages/
├── core/     # Framework-agnostic core (Tiptap extensions)
├── react/    # React 19 components and hooks
├── vue/      # Vue 3 components and composables
└── svelte/   # Svelte 5 components and runes
apps/
└── demo/     # Demo applications for each framework
tests/
└── ct/       # Playwright Component Tests
    ├── scenarios/  # Shared test scenarios
    ├── react/      # React test specs
    ├── vue/        # Vue test specs
    └── svelte/     # Svelte test specs
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev:react        # Run React demo
pnpm dev:vue          # Run Vue demo
pnpm dev:svelte       # Run Svelte demo
pnpm dev:all          # Run all demos simultaneously
pnpm lint             # Run Biome linter
pnpm check            # Run Biome check with auto-fix
pnpm typecheck        # Run type checking for all packages
pnpm build            # Build all packages
pnpm test:ct          # Run all E2E tests (parallel)
pnpm test:ct:seq      # Run all E2E tests (sequential)
pnpm test:ct:react    # Run React E2E tests
pnpm test:ct:vue      # Run Vue E2E tests
pnpm test:ct:svelte   # Run Svelte E2E tests
```

## Runtime Environment

Use Node.js LTS and pnpm for all operations:

- `pnpm install` for dependency installation
- `pnpm <script>` for script execution
- `pnpm exec <package>` for package execution

---

## Architecture Principles

- Core package contains all Tiptap extensions and is framework-agnostic
- Framework packages (react, vue, svelte) add framework-specific components (no re-exports from core)
- Each framework package provides: Vizel, VizelEditor, VizelBubbleMenu, VizelSlashMenu, VizelIconProvider components
- Use composition pattern: Vizel (all-in-one) or VizelEditor + VizelBubbleMenu

### Core Package Centralization

All framework-agnostic code belongs in `@vizel/core`:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `VizelEditorOptions`, `VizelFeatureOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT`, `VIZEL_TEXT_COLORS` |
| Extensions | `core/src/extensions/` | `VizelSlashCommand`, `VizelImageResize` |
| Utilities | `core/src/utils/` | `resolveVizelFeatures`, `createVizelImageUploader` |
| Styles | `core/src/styles/` | All CSS |

Framework packages only contain:
- Framework-specific components
- Framework-specific state management (hooks/composables/runes)

---

## Detailed Guidelines

For detailed coding rules and guidelines, see the following files:

### Rules (`.claude/rules/`)

| File | Description |
|------|-------------|
| `code-style.md` | TypeScript, function declarations, type safety |
| `cross-framework.md` | React/Vue/Svelte API consistency |
| `git.md` | Conventional Commits, branch naming |
| `testing.md` | Playwright Component Testing guidelines |
| `demo.md` | Demo application guidelines |
| `packages/core.md` | @vizel/core package rules |
| `packages/react.md` | @vizel/react package rules |
| `packages/vue.md` | @vizel/vue package rules |
| `packages/svelte.md` | @vizel/svelte package rules (Svelte 5 runes) |

### Skills (`.claude/skills/`)

| Skill | Description |
|-------|-------------|
| `test/SKILL.md` | E2E test execution and coverage check |
| `lint-instructions/SKILL.md` | Project rule violation detection |

---

## Quick Reference

### Code Style

- Use `function` for exports, arrow functions for callbacks
- Use `satisfies` operator over type annotations
- Use type guards over `as` casts

### Cross-Framework

- All components must exist in React, Vue, and Svelte
- React: `use*` hooks, Vue: `use*` composables, Svelte: `create*`/`get*` runes
- Shared types/constants/utils go in `@vizel/core`
- All hooks/composables/runes use getter pattern: `() => editor`

### Git

- Conventional Commits: `feat(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Scopes: `core`, `react`, `vue`, `svelte`, `demo`

### Testing

- `pnpm test:ct` - Run all tests
- Use shared scenarios in `tests/ct/scenarios/`
- Prefer `[data-vizel-*]` attributes for locators
