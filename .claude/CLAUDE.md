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
```

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Run React demo (default)
bun run dev:react    # Run React demo
bun run dev:vue      # Run Vue demo
bun run dev:svelte   # Run Svelte demo
bun run dev:all      # Run all demos simultaneously
bun run lint         # Run Biome linter
bun run typecheck    # Run type checking for all packages
bun run build        # Build all packages
```

## Architecture Principles

- Core package contains all Tiptap extensions and is framework-agnostic
- Framework packages (react, vue, svelte) re-export core and add framework-specific components
- Each framework package provides: EditorContent, BubbleMenu, SlashMenu components
- Use composition pattern: EditorRoot > EditorContent + BubbleMenu

## Runtime Environment

Use Bun instead of Node.js for all operations:

- `bun install` instead of npm/yarn/pnpm install
- `bun run <script>` instead of npm run
- `bunx <package>` instead of npx
