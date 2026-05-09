<!--
  Maintainer notes (stripped from Claude's context, visible only to humans):
  - Keep this file under 200 lines (official guideline).
  - Topic-specific rules live under .claude/rules/. Each rule auto-loads when
    its `paths:` frontmatter matches a file Claude reads. Rules without a
    `paths:` field load at startup with the same priority as this file.
  - AGENTS.md is a symlink to this file so other agents (Codex, etc.) read
    the same content without duplication.
-->

# Vizel

Vizel is a block-based visual Markdown editor. The project ships Tiptap-based components for React, Vue, and Svelte from a shared core package.

## Project Layout

| Path | Purpose |
|------|---------|
| `packages/core/` | Framework-agnostic Tiptap extensions, types, constants, utilities, and styles |
| `packages/react/` | React 19 components and hooks |
| `packages/vue/` | Vue 3 components and composables |
| `packages/svelte/` | Svelte 5 components and runes |
| `apps/demo/` | Demo applications, one per framework |
| `tests/ct/` | Playwright Component Tests with shared scenarios |

## Development Commands

Use Node.js LTS and pnpm. Invoke scripts with `pnpm <script>` and external binaries with `pnpm exec <package>`.

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev:react` / `dev:vue` / `dev:svelte` | Run a demo for one framework |
| `pnpm dev:all` | Run all demos in parallel |
| `pnpm lint` | Run Biome lint |
| `pnpm check` | Run Biome with auto-fix |
| `pnpm typecheck` | Run TypeScript checks across packages |
| `pnpm build` | Build all packages |
| `pnpm test:ct` | Run all Playwright Component Tests in parallel |
| `pnpm test:ct:seq` | Run all Playwright Component Tests sequentially |
| `pnpm test:ct:react` / `test:ct:vue` / `test:ct:svelte` | Run tests for one framework |

## Project Rules

Each rule under `.claude/rules/` is the single source of truth (SSOT) for its topic. Claude Code auto-discovers `.claude/rules/**/*.md` and loads each rule on demand: rules with a `paths:` frontmatter load when Claude reads a file matching the pattern; rules without `paths:` load at startup with the same priority as this file.

| Rule | Loads When | Topic |
|------|------------|-------|
| `.claude/rules/code-style.md` | Editing source under `packages/`, `apps/`, or `tests/` | TypeScript style, function declarations, type safety |
| `.claude/rules/cross-framework.md` | Editing under `packages/{react,vue,svelte}/` or `packages/core/src/types.ts` | Component, hook, composable, and rune parity |
| `.claude/rules/git.md` | Always (commit messages, branches, hooks) | Conventional Commits, branch naming, lefthook |
| `.claude/rules/testing.md` | Editing under `tests/` or any `playwright-ct.config.ts` | Playwright CT structure and best practices |
| `.claude/rules/demo.md` | Editing under `apps/demo/` | Demo content, dependencies, and CSS |
| `.claude/rules/packages/core.md` | Editing under `packages/core/` (`*.ts` / `*.scss`) | `@vizel/core` centralization and extension catalog |
| `.claude/rules/packages/react.md` | Editing under `packages/react/` (`*.{ts,tsx}`) | React 19 components, hooks, and context |
| `.claude/rules/packages/vue.md` | Editing under `packages/vue/` (`*.{ts,vue}`) | Vue 3 SFC components, composables, and provide/inject |
| `.claude/rules/packages/svelte.md` | Editing under `packages/svelte/` (`*.{ts,svelte,svelte.ts}`) | Svelte 5 components, runes, and snippets |

## Skills

Skills load on demand when Claude invokes them.

| Skill | Description |
|-------|-------------|
| `.claude/skills/test/` | Run Playwright Component Tests and audit test coverage |
| `.claude/skills/lint-instructions/` | Detect and fix violations of the project rules |

## Subagents

Subagents run as isolated agents with their own context and tool set.

| Subagent | Description |
|----------|-------------|
| `.claude/agents/cross-framework-reviewer.md` | Verify component, hook, composable, and rune parity across React, Vue, and Svelte |

## Settings

| File | Audience | Tracking |
|------|----------|----------|
| `.claude/settings.json` | Team-shared permissions and hooks | Checked into git |
| `.claude/settings.local.json` | Personal permissions and overrides | Ignored by git |
| `./CLAUDE.local.md` | Personal project memory (sandbox URLs, test data) | Ignored by git |
