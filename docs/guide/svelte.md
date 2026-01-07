# Svelte

Svelte 5 components and runes for Vizel editor.

## Installation

```bash
npm install @vizel/svelte
# or
bun add @vizel/svelte
```

::: info Requirements
- Svelte 5
:::

## Quick Start

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

## Runes

### createVizelEditor

Creates and manages a Vizel editor instance using Svelte 5 runes.

```svelte
<script lang="ts">
  import { createVizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor({
    initialContent: { type: 'doc', content: [] },
    placeholder: 'Start writing...',
    features: {
      markdown: true,
      mathematics: true,
    },
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
  });
</script>
```

#### Options

See [Configuration](/guide/configuration) for full options.

#### Return Value

Returns `{ current: Editor | null }`. Access the editor via `editor.current`.

### createEditorState

Forces component re-render on editor state changes.

```svelte
<script lang="ts">
  import { createEditorState } from '@vizel/svelte';

  let { editor } = $props();
  
  // Re-renders when editor state changes
  const state = createEditorState(() => editor);
</script>

{#if editor}
  <div>
    <span>{editor.storage.characterCount?.characters() ?? 0} characters</span>
    <span>{editor.storage.characterCount?.words() ?? 0} words</span>
  </div>
{/if}
```

### createAutoSave

Automatically saves editor content.

```svelte
<script lang="ts">
  import { createVizelEditor, createAutoSave, SaveIndicator } from '@vizel/svelte';

  const editor = createVizelEditor();

  const autoSave = createAutoSave(() => editor.current, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
    onSave: (content) => console.log('Saved'),
    onError: (error) => console.error('Save failed', error),
  });
</script>

<EditorContent editor={editor.current} />
<SaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

### getTheme

Access theme state within ThemeProvider context.

```svelte
<script lang="ts">
  import { getTheme, ThemeProvider } from '@vizel/svelte';

  const theme = getTheme();

  function toggleTheme() {
    theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<ThemeProvider defaultTheme="system">
  <Editor />
  <button onclick={toggleTheme}>
    {theme.resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
  </button>
</ThemeProvider>
```

## Components

### EditorContent

Renders the editor content area.

```svelte
<EditorContent 
  editor={editor.current} 
  class="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `class` | `string` | Custom class name |

### BubbleMenu

Floating toolbar on text selection.

```svelte
<BubbleMenu 
  editor={editor.current}
  class="my-bubble-menu"
  showDefaultToolbar={true}
  updateDelay={100}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | Custom class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### ThemeProvider

Provides theme context.

```svelte
<ThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  disableTransitionOnChange={false}
>
  <slot />
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### SaveIndicator

Displays save status.

```svelte
<SaveIndicator 
  status={autoSave.status} 
  lastSaved={autoSave.lastSaved}
  class="my-indicator"
/>
```

### Portal

Renders children in a portal.

```svelte
<Portal container={document.body}>
  <div class="my-overlay">Content</div>
</Portal>
```

## Patterns

### Reactive Content with $state

```svelte
<script lang="ts">
  import type { JSONContent } from '@vizel/core';

  let content = $state<JSONContent>({ type: 'doc', content: [] });

  const editor = createVizelEditor({
    initialContent: content,
    onUpdate: ({ editor }) => {
      content = editor.getJSON();
    },
  });
</script>
```

### With Form

```svelte
<script lang="ts">
  const editor = createVizelEditor();

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (editor.current) {
      const content = editor.current.getJSON();
      // Submit content
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <EditorContent editor={editor.current} />
  <button type="submit">Submit</button>
</form>
```

### Binding to Variable

```svelte
<script lang="ts">
  let editorRef = $state<Editor | null>(null);

  const editor = createVizelEditor({
    onCreate: ({ editor }) => {
      editorRef = editor;
    },
  });

  function focusEditor() {
    editorRef?.commands.focus();
  }
</script>

<button onclick={focusEditor}>Focus</button>
<EditorContent editor={editor.current} />
```

### Custom Toolbar

```svelte
<script lang="ts">
  import type { Editor } from '@tiptap/core';

  let { editor }: { editor: Editor | null } = $props();
</script>

{#if editor}
  <div class="toolbar">
    <button
      onclick={() => editor.chain().focus().toggleBold().run()}
      class:active={editor.isActive('bold')}
    >
      Bold
    </button>
    <button
      onclick={() => editor.chain().focus().toggleItalic().run()}
      class:active={editor.isActive('italic')}
    >
      Italic
    </button>
    <button onclick={() => editor.chain().focus().undo().run()}>
      Undo
    </button>
    <button onclick={() => editor.chain().focus().redo().run()}>
      Redo
    </button>
  </div>
{/if}
```

### Context Pattern

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { createVizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor();
  setContext('editor', editor);
</script>

<!-- Child.svelte -->
<script lang="ts">
  import { getContext } from 'svelte';

  const editor = getContext('editor');
</script>
```

### Derived State

```svelte
<script lang="ts">
  const editor = createVizelEditor();
  createEditorState(() => editor.current);

  // Derived values that update with editor state
  const characterCount = $derived(
    editor.current?.storage.characterCount?.characters() ?? 0
  );
  
  const wordCount = $derived(
    editor.current?.storage.characterCount?.words() ?? 0
  );
  
  const isEmpty = $derived(
    editor.current?.isEmpty ?? true
  );
</script>

<div class="stats">
  <span>{characterCount} characters</span>
  <span>{wordCount} words</span>
  <span>{isEmpty ? 'Empty' : 'Has content'}</span>
</div>
```

## SSR/SvelteKit Considerations

The editor is client-side only. Use `browser` check or `onMount`:

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  // Only create editor on client
  const editor = browser ? createVizelEditor() : { current: null };
</script>

{#if mounted}
  <EditorContent editor={editor.current} />
{:else}
  <div>Loading editor...</div>
{/if}
```

Or use dynamic import:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let Editor = $state<typeof import('./Editor.svelte').default | null>(null);

  onMount(async () => {
    Editor = (await import('./Editor.svelte')).default;
  });
</script>

{#if Editor}
  <svelte:component this={Editor} />
{:else}
  <div>Loading...</div>
{/if}
```

## Svelte 5 Runes vs Svelte 4

Vizel uses Svelte 5 runes. Key differences:

| Svelte 4 | Svelte 5 (Vizel) |
|----------|------------------|
| `let editor` | `const editor = createVizelEditor()` |
| `$: count = ...` | `const count = $derived(...)` |
| `export let prop` | `let { prop } = $props()` |
| Stores | Runes (`$state`, `$derived`) |

## Next Steps

- [Configuration](/guide/configuration) - Full options reference
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/svelte) - Complete API documentation
