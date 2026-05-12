---
paths:
  - "packages/core/**/*.{ts,scss,css}"
---

# `@vizel/core` Package

The core package owns all framework-agnostic code. The framework packages wrap and extend the core, but never duplicate what it defines.

## Single Source of Truth

The core package is the single source of truth for the following:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `VizelEditorOptions`, `VizelFeatureOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT`, `VIZEL_TEXT_COLORS` |
| Extensions | `core/src/extensions/` | `VizelSlashCommand`, `VizelImageResize` |
| Utilities | `core/src/utils/` | `resolveVizelFeatures`, `createVizelImageUploader` |
| Styles | `core/src/styles/` | All CSS |

The core package excludes:

- Framework-specific components.
- Framework-specific state primitives (hooks, composables, runes).
- Runtime dependencies on React, Vue, or Svelte.

## Extension Development

### Creating Extensions

- Use individual `@tiptap/extension-*` packages. Do not depend on `@tiptap/starter-kit`.
- Configure extensions through `createVizelExtensions()`.
- Export each extension to support advanced consumer usage.

```typescript
import Heading from "@tiptap/extension-heading";

Heading.configure({
  levels: [1, 2, 3],
});
```

### Extension Catalog

| Category | Location | Description |
|----------|----------|-------------|
| Base | `extensions/base.ts` | Core text editing (heading, bold, italic, etc.) |
| SlashCommand | `extensions/slash-command.ts` | Slash command menu |
| Table | `extensions/table.ts` | Table editing with row and column controls |
| Link | `extensions/link.ts` | Link with autolink and paste support |
| Image | `extensions/image.ts` | Image upload and resize |
| CodeBlock | `extensions/code-block-lowlight.ts` | Syntax-highlighted code blocks |
| CharacterCount | `extensions/character-count.ts` | Character and word counting |
| TextColor | `extensions/text-color.ts` | Text color and highlight |
| TaskList | `extensions/task-list.ts` | Checkbox task lists |
| DragHandle | `extensions/drag-handle.ts` | Block drag handle and keyboard reordering |
| Markdown | `extensions/markdown.ts` | Markdown import and export |
| Mathematics | `extensions/mathematics.ts` | LaTeX math with KaTeX |
| Embed | `extensions/embed.ts` | URL embedding (oEmbed/OGP) |
| Details | `extensions/details.ts` | Collapsible content blocks |
| Diagram | `extensions/diagram.ts` | Mermaid and GraphViz diagrams |
| WikiLink | `extensions/wiki-link.ts` | Wiki-style internal links |
| Comment | `extensions/comment.ts` | Text annotations and comments |

## Dependencies

### Allowed

- `@tiptap/core`, `@tiptap/pm`, `@tiptap/suggestion`.
- Individual `@tiptap/extension-*` packages.

### Prohibited

- Framework runtimes (React, Vue, Svelte).
- `@tiptap/starter-kit` (use individual extensions instead).
- Runtime-only dependencies that consumers must install separately.

### Adding a Dependency With Post-Install Scripts

pnpm 10+ refuses to run post-install / install scripts unless the
package is explicitly approved. When a new dependency triggers an
`ERR_PNPM_IGNORED_BUILDS` warning at install time, add it to the
`allowBuilds` block of `pnpm-workspace.yaml` (at the repo root). Skipping
this leaves the build scripts silently ignored — native binaries and
git-hook installers will not run, and CI commands that exit on the
warning will fail.

```yaml
# pnpm-workspace.yaml
allowBuilds:
  "@parcel/watcher": true
  esbuild: true
  lefthook: true
  leveldown: true
```

## Build Configuration

The core package uses Vite. Externalize all `@tiptap/*` packages and emit ES modules.

```typescript
external: [
  "@tiptap/core",
  /^@tiptap\/extension-/,
  "@tiptap/pm",
  "@tiptap/suggestion",
],
```

## Public API

`index.ts` exports the public API:

- All extensions.
- All public types (use the `type` modifier).
- Utility functions.

Order exports alphabetically.

### Naming Conventions

| Pattern | Example |
|---------|---------|
| Options type | `VizelExtensionsOptions`, `VizelImageOptions` |
| Factory function | `createVizelExtensions()`, `createLinkExtension()` |
| Extension class | `SlashCommand`, `ImageResize` |

## CSS Styles

CSS lives in `src/styles/`.

- Use BEM-like class names (`.vizel-*`).
- Scope styles to Vizel components.
- Use CSS custom properties for theming.
- Document non-trivial style dependencies in comments.
