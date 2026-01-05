# Vizel Project

A block-based visual editor for Markdown built with Tiptap, supporting React, Vue, and Svelte.

## Project Structure

```
packages/
├── core/     # Framework-agnostic core (Tiptap extensions)
├── react/    # React 18/19 components and hooks
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
bun install          # Install dependencies
bun run dev:react    # Run React demo
bun run dev:vue      # Run Vue demo
bun run dev:svelte   # Run Svelte demo
bun run dev:all      # Run all demos simultaneously
bun run lint         # Run Biome linter
bun run check        # Run Biome check with auto-fix
bun run typecheck    # Run type checking for all packages
bun run build        # Build all packages
bun run test:ct      # Run all E2E tests (parallel)
bun run test:ct:seq  # Run all E2E tests (sequential)
bun run test:ct:react    # Run React E2E tests
bun run test:ct:vue      # Run Vue E2E tests
bun run test:ct:svelte   # Run Svelte E2E tests
```

## Runtime Environment

Use Bun instead of Node.js for all operations:

- `bun install` instead of npm/yarn/pnpm install
- `bun run <script>` instead of npm run
- `bunx <package>` instead of npx

---

## Architecture Principles

- Core package contains all Tiptap extensions and is framework-agnostic
- Framework packages (react, vue, svelte) re-export core and add framework-specific components
- Each framework package provides: EditorContent, BubbleMenu, SlashMenu components
- Use composition pattern: EditorRoot > EditorContent + BubbleMenu

### Core Package Centralization

All framework-agnostic code belongs in `@vizel/core`:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `JSONContent`, `VizelEditorOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT` |
| Extensions | `core/src/extensions/` | `SlashCommand`, `ImageResize` |
| Utilities | `core/src/utils/` | `resolveFeatures`, `createImageUploader` |
| Styles | `core/src/styles/` | All CSS |

Framework packages only contain:
- Framework-specific components
- Framework-specific state management (hooks/composables/runes)
- Re-exports from core

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
- React: `use*` hooks, Vue: `use*` composables, Svelte: `create*` runes
- Shared types/constants/utils go in `@vizel/core`

### Git

- Conventional Commits: `feat(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Scopes: `core`, `react`, `vue`, `svelte`, `demo`

### Testing

- `bun run test:ct` - Run all tests
- Use shared scenarios in `tests/ct/scenarios/`
- Prefer `[data-vizel-*]` attributes for locators
