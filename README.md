# Vizel

A block-based visual editor for Markdown built with [Tiptap](https://tiptap.dev/), supporting React, Vue, and Svelte.

## Features

- **Rich Text Editing** - Bold, italic, underline, strikethrough, text color, highlight
- **Block Elements** - Headings (H1-H6), lists (bullet, numbered, task), blockquotes, horizontal rules
- **Slash Commands** - Type `/` to insert blocks quickly
- **Bubble Menu** - Inline formatting toolbar on text selection
- **Tables** - Full table support with row/column controls
- **Code Blocks** - Syntax highlighting with 190+ languages
- **Images** - Drag & drop, paste, resize support
- **Markdown** - Import/export Markdown content
- **Mathematics** - LaTeX equations with KaTeX
- **Embeds** - YouTube, Vimeo, Twitter, and more via oEmbed
- **Details** - Collapsible content blocks
- **Auto-save** - localStorage, sessionStorage, or custom backend
- **Dark Mode** - System-aware theme switching
- **Character Count** - Real-time character and word count

## Packages

| Package | Description |
|---------|-------------|
| `@vizel/core` | Framework-agnostic core with Tiptap extensions |
| `@vizel/react` | React 18/19 components and hooks |
| `@vizel/vue` | Vue 3 components and composables |
| `@vizel/svelte` | Svelte 5 components and runes |

## Installation

```bash
# React
bun add @vizel/react

# Vue
bun add @vizel/vue

# Svelte
bun add @vizel/svelte
```

## Usage

### React

```tsx
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
    features: {
      markdown: true,
      mathematics: true,
      image: {
        onUpload: async (file) => {
          // Upload file and return URL
          return 'https://example.com/image.png';
        },
      },
    },
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
  });

  return (
    <div>
      <EditorContent editor={editor} />
      {editor && <BubbleMenu editor={editor} />}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/vue';
import '@vizel/core/styles';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
  features: {
    markdown: true,
    mathematics: true,
  },
});
</script>

<template>
  <div>
    <EditorContent :editor="editor" />
    <BubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { EditorContent, BubbleMenu, createVizelEditor } from '@vizel/svelte';
import '@vizel/core/styles';

const editor = createVizelEditor({
  placeholder: "Type '/' for commands...",
  features: {
    markdown: true,
    mathematics: true,
  },
});
</script>

<EditorContent editor={editor.current} />
{#if editor.current}
  <BubbleMenu editor={editor.current} />
{/if}
```

## Configuration

### Feature Options

```typescript
const editor = useVizelEditor({
  // Initial content (JSON or Markdown)
  initialContent: { type: 'doc', content: [] },
  
  // Placeholder text
  placeholder: "Type '/' for commands...",
  
  // Auto-focus on mount
  autofocus: 'end', // 'start' | 'end' | 'all' | number | boolean
  
  // Feature configuration
  features: {
    // Slash commands (default: enabled)
    slashCommand: true,
    
    // Table support (default: enabled)
    table: true,
    
    // Link handling (default: enabled)
    link: true,
    
    // Task lists (default: enabled)
    taskList: true,
    
    // Text color/highlight (default: enabled)
    textColor: true,
    
    // Code block with syntax highlighting (default: enabled)
    codeBlock: true,
    
    // Drag handle (default: enabled)
    dragHandle: true,
    
    // Character count (default: enabled)
    characterCount: true,
    
    // Image upload (default: disabled)
    image: {
      onUpload: async (file) => 'url',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    
    // Markdown import/export (default: disabled)
    markdown: true,
    
    // LaTeX mathematics (default: disabled)
    mathematics: true,
    
    // URL embeds (default: disabled)
    embed: true,
    
    // Collapsible details (default: disabled)
    details: true,
  },
  
  // Callbacks
  onUpdate: ({ editor }) => {},
  onCreate: ({ editor }) => {},
  onFocus: ({ editor }) => {},
  onBlur: ({ editor }) => {},
});
```

### Auto-save

```typescript
// React
import { useAutoSave } from '@vizel/react';

const { status, lastSaved } = useAutoSave(editor, {
  debounceMs: 2000,
  storage: 'localStorage', // or 'sessionStorage' or custom
  key: 'my-editor-content',
});

// Vue
import { useAutoSave } from '@vizel/vue';

const { status, lastSaved } = useAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
});

// Svelte
import { createAutoSave } from '@vizel/svelte';

const autoSave = createAutoSave(() => editor.current, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
});
// Access: autoSave.status, autoSave.lastSaved
```

### Theme

```typescript
// React
import { ThemeProvider, useTheme } from '@vizel/react';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-theme">
      <Editor />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Toggle
    </button>
  );
}
```

## Development

```bash
# Install dependencies
bun install

# Run demos
bun run dev:react     # React demo (http://localhost:3000)
bun run dev:vue       # Vue demo (http://localhost:3001)
bun run dev:svelte    # Svelte demo (http://localhost:3002)
bun run dev:all       # All demos simultaneously

# Build all packages
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
bun run check         # Lint + format with auto-fix

# Run E2E tests
bun run test:ct       # All frameworks (parallel)
bun run test:ct:react # React only
bun run test:ct:vue   # Vue only
bun run test:ct:svelte # Svelte only
```

## License

MIT
