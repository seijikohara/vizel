# @vizel/core

Framework-agnostic core for Vizel block-based Markdown editor built on Tiptap.

## Installation

```bash
npm install @vizel/core
```

## Overview

This package provides:

- Tiptap extensions for block-based editing
- Type definitions shared across framework packages
- Utility functions for editor configuration
- CSS styles for editor components
- Auto-save, theme, collaboration, comments, and version history utilities
- Plugin system for extending functionality

## Exports

| Category | Examples |
|----------|---------|
| Types | `VizelEditorOptions`, `VizelFeatureOptions`, `VizelEditorState`, `VizelSlashCommandItem` |
| Extensions | `createVizelExtensions()`, `resolveVizelFeatures()` |
| Utilities | `getVizelEditorState()`, `getVizelMarkdown()`, `createVizelImageUploader()` |
| Theme | `VIZEL_DEFAULT_THEME`, `resolveVizelTheme()` |
| Auto-save | `createVizelAutoSaveHandlers()` |
| Collaboration | `createVizelCollaborationHandlers()` |
| Comments | `createVizelCommentHandlers()` |
| Version History | `createVizelVersionHistoryHandlers()` |
| Plugin System | `VizelPluginManager`, `validateVizelPlugin()` |
| Constants | `VIZEL_TEXT_COLORS`, `VIZEL_HIGHLIGHT_COLORS`, `vizelDefaultSlashCommands` |

## CSS Entry Points

| Import | Description |
|--------|-------------|
| `@vizel/core/styles.css` | Full stylesheet (CSS variables + component styles) |
| `@vizel/core/components.css` | Component styles only (for shadcn/ui integration) |
| `@vizel/core/mathematics.css` | KaTeX styles for math rendering |

## Extensions

All extensions are enabled by default except `collaboration`, `comment`, and `wikiLink`:

| Extension | Description |
|-----------|-------------|
| Base | Headings, bold, italic, underline, strikethrough, lists, blockquotes |
| SlashCommand | Type `/` to open command menu |
| Table | Table editing with row/column controls |
| Link | Autolink and paste URL detection |
| Image | Upload, paste, drag-and-drop, resize |
| CodeBlock | Syntax highlighting with lowlight (37+ languages) |
| CharacterCount | Real-time character and word count |
| TextColor | Text color and highlight |
| TaskList | Checkbox task lists |
| DragHandle | Block drag handle and Alt+Arrow keyboard shortcuts |
| Markdown | Import/export with GitHub Flavored Markdown |
| Mathematics | LaTeX equations with KaTeX |
| Embed | oEmbed/OGP URL embedding |
| Details | Collapsible content blocks |
| Diagram | Mermaid and GraphViz diagrams |
| WikiLink | `[[page-name]]` internal linking |
| Comment | Text annotations for collaborative review |

## Usage

This package is used as a dependency of framework-specific packages:

- `@vizel/react` - React 19 components and hooks
- `@vizel/vue` - Vue 3 components and composables
- `@vizel/svelte` - Svelte 5 components and runes

### Direct Usage

```typescript
import { resolveVizelFeatures, createVizelImageUploader } from '@vizel/core';
import type { VizelEditorOptions, VizelFeatureOptions } from '@vizel/core';

// Import styles
import '@vizel/core/styles.css';
```

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
