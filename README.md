<p align="center">
  <img src="docs/public/logo.svg" width="100" height="100" alt="Vizel Logo">
</p>

<h1 align="center">Vizel</h1>

<p align="center">
  A block-based visual editor for Markdown built with <a href="https://tiptap.dev/">Tiptap</a>, supporting React, Vue, and Svelte.
</p>

<p align="center">
  <a href="https://github.com/seijikohara/vizel/actions/workflows/ci.yml"><img src="https://github.com/seijikohara/vizel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/seijikohara/vizel/blob/main/LICENSE"><img src="https://img.shields.io/github/license/seijikohara/vizel" alt="License"></a>
  <a href="https://seijikohara.github.io/vizel/"><img src="https://img.shields.io/badge/Docs-GitHub%20Pages-blue?logo=github" alt="Documentation"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue">
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white" alt="Svelte">
</p>

## Features

- **Text Formatting** - Bold, italic, underline, strikethrough, text color, highlight
- **Block Elements** - Headings (H1-H6), lists (bullet, numbered, task), blockquotes, horizontal rules
- **Slash Commands** - Type `/` to insert blocks
- **Floating Toolbar** - Inline formatting toolbar on text selection
- **Tables** - Table editing with row/column controls
- **Code Blocks** - Syntax highlighting with 190+ languages
- **Images** - Drag & drop, paste, resize support
- **Markdown** - Import/export Markdown content
- **Mathematics** - LaTeX equations with KaTeX
- **Embeds** - YouTube, Vimeo, Twitter, CodePen, Figma via oEmbed
- **Details** - Collapsible content blocks
- **Auto-save** - localStorage, sessionStorage, or custom backend
- **Dark Mode** - System-aware theme switching
- **Character Count** - Real-time character and word count

## Packages

| Package | Description |
|---------|-------------|
| `@vizel/core` | Framework-agnostic core with Tiptap extensions and styles |
| `@vizel/react` | React 19 components and hooks |
| `@vizel/vue` | Vue 3 components and composables |
| `@vizel/svelte` | Svelte 5 components and runes |

## Installation

```bash
# React
npm install @vizel/react

# Vue
npm install @vizel/vue

# Svelte
npm install @vizel/svelte
```

### With shadcn/ui (Optional)

Vizel uses OKLCH color values by default, which are compatible with shadcn/ui's theming system. For shadcn/ui projects, import `components.css` (without CSS variable definitions) and map your theme colors:

```typescript
import '@vizel/core/components.css';
```

```css
:root {
  /* Map your shadcn colors to Vizel */
  --vizel-primary: var(--primary);
  --vizel-background: var(--background);
  --vizel-foreground: var(--foreground);
  --vizel-border: var(--border);
  --vizel-muted: var(--muted);
  --vizel-accent: var(--accent);
}
```

## Usage

The `Vizel` component is the recommended way to get started. It wraps the editor content with a floating toolbar out of the box.

### React

```tsx
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';

function App() {
  return (
    <Vizel
      placeholder="Type '/' for commands..."
      onUpdate={({ editor }) => console.log(editor.getJSON())}
    />
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
import '@vizel/core/styles.css';
</script>

<template>
  <Vizel
    placeholder="Type '/' for commands..."
    @update="({ editor }) => console.log(editor.getJSON())"
  />
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { Vizel } from '@vizel/svelte';
  import '@vizel/core/styles.css';
</script>

<Vizel
  placeholder="Type '/' for commands..."
  onUpdate={({ editor }) => console.log(editor.getJSON())}
/>
```

### Advanced Usage

For more control, use individual components with hooks/composables/runes:

```tsx
// React
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles.css';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
    features: {
      image: {
        onUpload: async (file) => 'https://example.com/image.png',
      },
    },
  });

  return (
    <div>
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </div>
  );
}
```

## Configuration

### Vizel Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial editor content |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Whether editor is editable |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus behavior |
| `features` | `VizelFeatureOptions` | - | Feature configuration |
| `class` / `className` | `string` | - | Custom CSS class |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu on selection |
| `enableEmbed` | `boolean` | - | Enable embed in bubble menu link editor |

### Feature Options

All major features are enabled by default:

```typescript
// Using Vizel component
<Vizel
  placeholder="Type '/' for commands..."
  features={{
    // Image upload (configure handler)
    image: {
      onUpload: async (file) => 'url',
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  }}
/>

// Or using useVizelEditor hook
const editor = useVizelEditor({
  features: {
    slashCommand: true,    // enabled by default
    table: true,           // enabled by default
    link: true,            // enabled by default
    taskList: true,        // enabled by default
    textColor: true,       // enabled by default
    codeBlock: true,       // enabled by default
    dragHandle: true,      // enabled by default
    characterCount: true,  // enabled by default
    markdown: true,        // enabled by default
    mathematics: true,     // enabled by default
    embed: true,           // enabled by default
    details: true,         // enabled by default
    diagram: true,         // enabled by default
  },
});
```

### Auto-save

```typescript
// React
import { useVizelAutoSave } from '@vizel/react';

const { status, lastSaved } = useVizelAutoSave(() => editor, {
  debounceMs: 2000,
  storage: 'localStorage', // or 'sessionStorage' or custom
  key: 'my-editor-content',
});

// Vue
import { useVizelAutoSave } from '@vizel/vue';

const { status, lastSaved } = useVizelAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
});

// Svelte
import { createVizelAutoSave } from '@vizel/svelte';

const autoSave = createVizelAutoSave(() => editor.current, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
});
// Access: autoSave.status, autoSave.lastSaved
```

### Theme

```typescript
// React
import { VizelThemeProvider, useVizelTheme } from '@vizel/react';

function App() {
  return (
    <VizelThemeProvider defaultTheme="system" storageKey="my-theme">
      <Editor />
    </VizelThemeProvider>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useVizelTheme();
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Toggle
    </button>
  );
}
```

## Styling

### Default Styles

Import the pre-built stylesheet (includes CSS variables + component styles):

```typescript
import '@vizel/core/styles.css';
```

For shadcn/ui projects, use components-only styles (without CSS variable definitions):

```typescript
import '@vizel/core/components.css';
```

### Custom Theming

Override CSS variables to customize the appearance:

```css
:root {
  --vizel-primary: #3b82f6;
  --vizel-background: #ffffff;
  --vizel-foreground: #111827;
  --vizel-border: #e5e7eb;
  --vizel-radius-md: 0.375rem;
}

[data-vizel-theme="dark"] {
  --vizel-primary: #60a5fa;
  --vizel-background: #1f2937;
  --vizel-foreground: #f9fafb;
  --vizel-border: #374151;
}
```

#### Available CSS Variables

| Category | Variables |
|----------|-----------|
| **Colors** | `--vizel-primary`, `--vizel-primary-hover`, `--vizel-background`, `--vizel-foreground`, `--vizel-border`, `--vizel-muted`, `--vizel-accent`, `--vizel-success`, `--vizel-warning`, `--vizel-error` |
| **Typography** | `--vizel-font-sans`, `--vizel-font-mono`, `--vizel-font-size-sm`, `--vizel-font-size-base`, `--vizel-line-height-normal` |
| **Spacing** | `--vizel-spacing-1` through `--vizel-spacing-12` |
| **Border Radius** | `--vizel-radius-sm`, `--vizel-radius-md`, `--vizel-radius-lg`, `--vizel-radius-full` |
| **Shadows** | `--vizel-shadow-sm`, `--vizel-shadow-md`, `--vizel-shadow-lg` |
| **Transitions** | `--vizel-transition-fast`, `--vizel-transition-normal`, `--vizel-transition-slow` |
| **Editor** | `--vizel-editor-min-height`, `--vizel-editor-padding`, `--vizel-editor-font-family` |
| **Code Block** | `--vizel-code-block-bg`, `--vizel-code-block-text`, `--vizel-code-block-border` |

See [_tokens.scss](packages/core/src/styles/_tokens.scss) for all available design tokens and [_variables.scss](packages/core/src/styles/_variables.scss) for how they're output as CSS variables.

## Development

```bash
# Install dependencies
npm install

# Run demos
npm run dev:react     # React demo (http://localhost:3000)
npm run dev:vue       # Vue demo (http://localhost:3001)
npm run dev:svelte    # Svelte demo (http://localhost:3002)
npm run dev:all       # All demos simultaneously

# Build all packages
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
npm run check         # Lint + format with auto-fix

# Run E2E tests
npm run test:ct       # All frameworks (parallel)
npm run test:ct:react # React only
npm run test:ct:vue   # Vue only
npm run test:ct:svelte # Svelte only
```

## License

MIT
