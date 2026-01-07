# Getting Started

## Installation

Install the package for your framework:

::: code-group

```bash [React]
npm install @vizel/react
# or
bun add @vizel/react
# or
pnpm add @vizel/react
# or
yarn add @vizel/react
```

```bash [Vue]
npm install @vizel/vue
# or
bun add @vizel/vue
# or
pnpm add @vizel/vue
# or
yarn add @vizel/vue
```

```bash [Svelte]
npm install @vizel/svelte
# or
bun add @vizel/svelte
# or
pnpm add @vizel/svelte
# or
yarn add @vizel/svelte
```

:::

::: info Peer Dependencies
Each framework package has peer dependencies on its respective framework:
- `@vizel/react` requires `react@^19` and `react-dom@^19`
- `@vizel/vue` requires `vue@^3`
- `@vizel/svelte` requires `svelte@^5`
:::

## Import Styles

Import the default stylesheet in your application entry point:

```typescript
import '@vizel/core/styles.css';
```

This includes both CSS variables and component styles. For custom theming, see [Theming](/guide/theming).

## Basic Usage

### React

```tsx
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles.css';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
  });

  return (
    <div className="editor-container">
      <EditorContent editor={editor} />
      {editor && <BubbleMenu editor={editor} />}
    </div>
  );
}

export default Editor;
```

### Vue

```vue
<script setup lang="ts">
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/vue';
import '@vizel/core/styles.css';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
});
</script>

<template>
  <div class="editor-container">
    <EditorContent :editor="editor" />
    <BubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { EditorContent, BubbleMenu, createVizelEditor } from '@vizel/svelte';
  import '@vizel/core/styles.css';

  const editor = createVizelEditor({
    placeholder: "Type '/' for commands...",
  });
</script>

<div class="editor-container">
  <EditorContent editor={editor.current} />
  {#if editor.current}
    <BubbleMenu editor={editor.current} />
  {/if}
</div>
```

## Working with Content

### Initial Content

You can initialize the editor with content in JSON format:

::: code-group

```tsx [React]
const editor = useVizelEditor({
  initialContent: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Hello World' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start editing...' }],
      },
    ],
  },
});
```

```vue [Vue]
const editor = useVizelEditor({
  initialContent: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Hello World' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start editing...' }],
      },
    ],
  },
});
```

```svelte [Svelte]
const editor = createVizelEditor({
  initialContent: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Hello World' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start editing...' }],
      },
    ],
  },
});
```

:::

### Getting Content

Access the editor content in JSON format:

```typescript
// Get JSON content
const json = editor.getJSON();

// Get HTML content
const html = editor.getHTML();

// Get plain text
const text = editor.getText();
```

### Listening to Changes

::: code-group

```tsx [React]
const editor = useVizelEditor({
  onUpdate: ({ editor }) => {
    const content = editor.getJSON();
    console.log('Content updated:', content);
    // Save to your backend
  },
});
```

```vue [Vue]
const editor = useVizelEditor({
  onUpdate: ({ editor }) => {
    const content = editor.getJSON();
    console.log('Content updated:', content);
    // Save to your backend
  },
});
```

```svelte [Svelte]
const editor = createVizelEditor({
  onUpdate: ({ editor }) => {
    const content = editor.getJSON();
    console.log('Content updated:', content);
    // Save to your backend
  },
});
```

:::

## Enabling Features

Enable optional features through the `features` option:

::: code-group

```tsx [React]
const editor = useVizelEditor({
  features: {
    // Enabled by default
    slashCommand: true,
    table: true,
    image: true,
    codeBlock: true,
    dragHandle: true,
    characterCount: true,
    textColor: true,
    taskList: true,
    link: true,

    // Disabled by default - enable as needed
    markdown: true,
    mathematics: true,
    embed: true,
    details: true,
    diagram: true,
  },
});
```

```vue [Vue]
const editor = useVizelEditor({
  features: {
    markdown: true,
    mathematics: true,
    embed: true,
    details: true,
    diagram: true,
  },
});
```

```svelte [Svelte]
const editor = createVizelEditor({
  features: {
    markdown: true,
    mathematics: true,
    embed: true,
    details: true,
    diagram: true,
  },
});
```

:::

See [Features](/guide/features) for detailed configuration of each feature.

## Image Upload

Configure image uploads with a custom handler:

::: code-group

```tsx [React]
const editor = useVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        // Upload to your server/CDN
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const { url } = await response.json();
        return url;
      },
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
  },
});
```

```vue [Vue]
const editor = useVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const { url } = await response.json();
        return url;
      },
    },
  },
});
```

```svelte [Svelte]
const editor = createVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const { url } = await response.json();
        return url;
      },
    },
  },
});
```

:::

## Dark Mode

Vizel supports light and dark themes. Use the `ThemeProvider` component:

::: code-group

```tsx [React]
import { ThemeProvider, useTheme } from '@vizel/react';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-theme">
      <Editor />
      <ThemeToggle />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { ThemeProvider, useTheme } from '@vizel/vue';

const { resolvedTheme, setTheme } = useTheme();

function toggleTheme() {
  setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark');
}
</script>

<template>
  <ThemeProvider defaultTheme="system" storageKey="my-theme">
    <Editor />
    <button @click="toggleTheme">
      {{ resolvedTheme === 'dark' ? '☀️' : '🌙' }}
    </button>
  </ThemeProvider>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { ThemeProvider, getTheme } from '@vizel/svelte';

  const theme = getTheme();

  function toggleTheme() {
    theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<ThemeProvider defaultTheme="system" storageKey="my-theme">
  <Editor />
  <button onclick={toggleTheme}>
    {theme.resolvedTheme === 'dark' ? '☀️' : '🌙'}
  </button>
</ThemeProvider>
```

:::

See [Theming](/guide/theming) for more customization options.

## Next Steps

- [Configuration](/guide/configuration) - Full editor options reference
- [Features](/guide/features) - Configure individual features
- [Theming](/guide/theming) - Customize appearance with CSS variables
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [React Guide](/guide/react) - React-specific patterns
- [Vue Guide](/guide/vue) - Vue-specific patterns
- [Svelte Guide](/guide/svelte) - Svelte-specific patterns
