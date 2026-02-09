# Getting Started

## Installation

Install the package for your framework:

::: code-group

```bash [React]
npm install @vizel/react
# or
pnpm add @vizel/react
# or
yarn add @vizel/react
```

```bash [Vue]
npm install @vizel/vue
# or
pnpm add @vizel/vue
# or
yarn add @vizel/vue
```

```bash [Svelte]
npm install @vizel/svelte
# or
pnpm add @vizel/svelte
# or
yarn add @vizel/svelte
```

:::

::: info Peer Dependencies
Each framework package requires its respective framework as a peer dependency:
- `@vizel/react` requires `react@^19` and `react-dom@^19`
- `@vizel/vue` requires `vue@^3`
- `@vizel/svelte` requires `svelte@^5`
:::

## Quick Start

Use the `Vizel` component:

::: code-group

```tsx [React]
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';

function App() {
  return <Vizel placeholder="Type '/' for commands..." />;
}
```

```vue [Vue]
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
import '@vizel/core/styles.css';
</script>

<template>
  <Vizel placeholder="Type '/' for commands..." />
</template>
```

```svelte [Svelte]
<script lang="ts">
import { Vizel } from '@vizel/svelte';
import '@vizel/core/styles.css';
</script>

<Vizel placeholder="Type '/' for commands..." />
```

:::

The `Vizel` component includes the editor, bubble menu, and slash command menu.

## Import Styles

Import the default stylesheet in your application entry point:

```typescript
import '@vizel/core/styles.css';
```

This includes both CSS variables and component styles. For custom theming, see [Theming](/guide/theming).

## Advanced Usage

To customize the editor, you can use individual components:

### React

```tsx
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles.css';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
  });

  return (
    <div className="editor-container">
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </div>
  );
}

export default Editor;
```

### Vue

```vue
<script setup lang="ts">
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from '@vizel/vue';
import '@vizel/core/styles.css';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
});
</script>

<template>
  <div class="editor-container">
    <VizelEditor :editor="editor" />
    <VizelBubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { VizelEditor, VizelBubbleMenu, createVizelEditor } from '@vizel/svelte';
  import '@vizel/core/styles.css';

  const editor = createVizelEditor({
    placeholder: "Type '/' for commands...",
  });
</script>

<div class="editor-container">
  <VizelEditor editor={editor.current} />
  {#if editor.current}
    <VizelBubbleMenu editor={editor.current} />
  {/if}
</div>
```

## Toolbar

You can enable the built-in fixed toolbar for a traditional formatting bar above the editor:

::: code-group

```tsx [React]
<Vizel showToolbar placeholder="Type '/' for commands..." />
```

```vue [Vue]
<Vizel :show-toolbar="true" placeholder="Type '/' for commands..." />
```

```svelte [Svelte]
<Vizel showToolbar placeholder="Type '/' for commands..." />
```

:::

The toolbar includes undo/redo, text formatting, headings, lists, and block actions by default. See the API reference for VizelToolbar ([React](/api/react#vizeltoolbar), [Vue](/api/vue#vizeltoolbar), [Svelte](/api/svelte#vizeltoolbar)) for customization options.

## Working with Content

### Initial Content

You can initialize the editor with **Markdown** or **JSON** format.

#### Using Markdown

You can initialize with Markdown:

::: code-group

```tsx [React]
import { Vizel } from '@vizel/react';

<Vizel initialMarkdown="# Hello World\n\nStart editing..." />
```

```vue [Vue]
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
</script>

<template>
  <Vizel initialMarkdown="# Hello World\n\nStart editing..." />
</template>
```

```svelte [Svelte]
<script lang="ts">
import { Vizel } from '@vizel/svelte';
</script>

<Vizel initialMarkdown="# Hello World\n\nStart editing..." />
```

:::

Or with the hook/composable/rune:

::: code-group

```tsx [React]
const editor = useVizelEditor({
  initialMarkdown: '# Hello World\n\nStart editing...',
});
```

```vue [Vue]
const editor = useVizelEditor({
  initialMarkdown: '# Hello World\n\nStart editing...',
});
```

```svelte [Svelte]
const editor = createVizelEditor({
  initialMarkdown: '# Hello World\n\nStart editing...',
});
```

:::

#### Using JSON

You can initialize with JSON format:

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

You can access the editor content in multiple formats:

```typescript
// Get JSON content
const json = editor.getJSON();

// Get Markdown content
import { getVizelMarkdown } from '@vizel/core';
const markdown = getVizelMarkdown(editor);

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

### Syncing Markdown Content

For two-way Markdown synchronization, use the dedicated hooks/composables/runes:

::: code-group

```tsx [React]
import { useVizelEditor, useVizelMarkdown, VizelEditor } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor();
  const { markdown, setMarkdown, isPending } = useVizelMarkdown(() => editor);
  
  // markdown updates automatically when editor content changes
  // setMarkdown() updates editor content from markdown
  
  return (
    <div>
      <VizelEditor editor={editor} />
      <textarea 
        value={markdown} 
        onChange={(e) => setMarkdown(e.target.value)}
      />
      {isPending && <span>Syncing...</span>}
    </div>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
import { ref } from 'vue';

const markdown = ref('# Hello World');
</script>

<template>
  <!-- v-model:markdown provides two-way binding -->
  <Vizel v-model:markdown="markdown" />
  <textarea v-model="markdown" />
</template>
```

```svelte [Svelte]
<script lang="ts">
import { Vizel } from '@vizel/svelte';

let markdown = $state('# Hello World');
</script>

<!-- bind:markdown provides two-way binding -->
<Vizel bind:markdown={markdown} />
<textarea bind:value={markdown} />
```

:::

## Enabling Features

You can enable optional features through the `features` option:

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

You can configure image uploads with a custom handler:

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

Use `VizelThemeProvider` for theme support:

::: code-group

```tsx [React]
import { VizelThemeProvider, useVizelTheme } from '@vizel/react';

function App() {
  return (
    <VizelThemeProvider defaultTheme="system" storageKey="my-theme">
      <Editor />
      <ThemeToggle />
    </VizelThemeProvider>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useVizelTheme();
  
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { VizelThemeProvider, useVizelTheme } from '@vizel/vue';

const { resolvedTheme, setTheme } = useVizelTheme();

function toggleTheme() {
  setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark');
}
</script>

<template>
  <VizelThemeProvider defaultTheme="system" storageKey="my-theme">
    <Editor />
    <button @click="toggleTheme">
      {{ resolvedTheme === 'dark' ? '☀️' : '🌙' }}
    </button>
  </VizelThemeProvider>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { VizelThemeProvider, getVizelTheme } from '@vizel/svelte';

  const theme = getVizelTheme();

  function toggleTheme() {
    theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<VizelThemeProvider defaultTheme="system" storageKey="my-theme">
  <Editor />
  <button onclick={toggleTheme}>
    {theme.resolvedTheme === 'dark' ? '☀️' : '🌙'}
  </button>
</VizelThemeProvider>
```

:::

See [Theming](/guide/theming) for more customization options.

## Next Steps

- [Configuration](/guide/configuration) - Editor options
- [Features](/guide/features) - Configure individual features
- [Theming](/guide/theming) - Customize appearance with CSS variables
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [React Guide](/guide/react) - React-specific patterns
- [Vue Guide](/guide/vue) - Vue-specific patterns
- [Svelte Guide](/guide/svelte) - Svelte-specific patterns
