# Vizel

A block-based visual editor for Markdown built with [Tiptap](https://tiptap.dev/), supporting React, Vue, and Svelte.

## Packages

| Package | Description |
|---------|-------------|
| `@vizel/core` | Framework-agnostic core with Tiptap extensions |
| `@vizel/react` | React 18/19 components and hooks |
| `@vizel/vue` | Vue 3 components and composables |
| `@vizel/svelte` | Svelte 5 components |
| `@vizel/styles` | Optional Tailwind-based styles (coming soon) |

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
import { EditorRoot, EditorContent, useVizelEditor } from '@vizel/react';

function MyEditor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
  });

  return (
    <EditorRoot editor={editor}>
      <EditorContent className="prose" />
    </EditorRoot>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { EditorRoot, EditorContent, useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
});
</script>

<template>
  <EditorRoot :editor="editor">
    <EditorContent :editor="editor" class="prose" />
  </EditorRoot>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { createVizelEditor, type Editor } from '@vizel/svelte';

let editorElement: HTMLElement;
let editor: Editor | null = $state(null);

onMount(() => {
  editor = createVizelEditor({
    element: editorElement,
    placeholder: "Type '/' for commands...",
  });
});

onDestroy(() => editor?.destroy());
</script>

<div bind:this={editorElement} class="prose"></div>
```

## Development

```bash
# Install dependencies
bun install

# Run demos
bun run dev           # React demo (http://localhost:3000)
bun run dev:react     # React demo (http://localhost:3000)
bun run dev:vue       # Vue demo (http://localhost:3001)
bun run dev:svelte    # Svelte demo (http://localhost:3002)
bun run dev:all       # All demos simultaneously

# Type check all packages
bun run typecheck
```

### Demo Apps

| Framework | Port | Directory |
|-----------|------|-----------|
| React 19 | 3000 | `apps/demo/react` |
| Vue 3 | 3001 | `apps/demo/vue` |
| Svelte 5 | 3002 | `apps/demo/svelte` |

## Features

- Rich text formatting (bold, italic, underline, strikethrough)
- Headings (H1-H3)
- Lists (bullet, numbered, todo)
- Blockquotes and code blocks
- Markdown shortcuts
- Slash commands (coming soon)
- Bubble menu (coming soon)
- Image upload (coming soon)

## License

MIT
