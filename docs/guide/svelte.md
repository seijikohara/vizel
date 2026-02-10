# Svelte

Svelte 5 components and runes for Vizel editor.

## Installation

```bash
npm install @vizel/svelte
# or
pnpm add @vizel/svelte
# or
yarn add @vizel/svelte
```

::: info Requirements
- Svelte 5
:::

## Quick Start

Use the `Vizel` component:

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

### Advanced Setup

To customize, use individual components with runes:

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

## Components

### Vizel

All-in-one editor component with built-in bubble menu.

```svelte
<script lang="ts">
  import { Vizel } from '@vizel/svelte';
</script>

<Vizel
  initialContent={{ type: 'doc', content: [] }}
  placeholder="Start writing..."
  editable={true}
  autofocus="end"
  showBubbleMenu={true}
  enableEmbed={true}
  class="my-editor"
  features={{
    image: { onUpload: async (file) => 'url' },
  }}
  onUpdate={({ editor }) => {}}
  onCreate={({ editor }) => {}}
  onFocus={({ editor }) => {}}
  onBlur={({ editor }) => {}}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial content (JSON) |
| `initialMarkdown` | `string` | - | Initial content (Markdown) |
| `bind:markdown` | `string` | - | Two-way Markdown binding |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus |
| `features` | `VizelFeatureOptions` | - | Feature options |
| `class` | `string` | - | CSS class |
| `showToolbar` | `boolean` | `false` | Show fixed toolbar above editor |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu |
| `enableEmbed` | `boolean` | - | Enable embed in links |
| `extensions` | `Extensions` | - | Additional Tiptap extensions |
| `transformDiagramsOnImport` | `boolean` | `true` | Transform diagram code blocks on import |
| `onUpdate` | `Function` | - | Update callback |
| `onCreate` | `Function` | - | Create callback |
| `onDestroy` | `Function` | - | Destroy callback |
| `onSelectionUpdate` | `Function` | - | Selection change callback |
| `onFocus` | `Function` | - | Focus callback |
| `onBlur` | `Function` | - | Blur callback |

## Runes

### createVizelEditor

This rune creates and manages a Vizel editor instance using Svelte 5 reactivity.

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

### createVizelState

This rune forces a component re-render on editor state changes.

```svelte
<script lang="ts">
  import { createVizelState } from '@vizel/svelte';

  let { editor } = $props();
  
  // Re-renders when editor state changes
  const state = createVizelState(() => editor);
</script>

{#if editor}
  <div>
    <span>{editor.storage.characterCount?.characters() ?? 0} characters</span>
    <span>{editor.storage.characterCount?.words() ?? 0} words</span>
  </div>
{/if}
```

### createVizelEditorState

This rune returns computed editor state that updates reactively. It provides commonly needed properties like character count, word count, and undo/redo availability.

```svelte
<script lang="ts">
  import { createVizelEditor, createVizelEditorState, VizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor();
  const editorState = createVizelEditorState(() => editor.current);
</script>

<VizelEditor editor={editor.current} />
<div class="status-bar">
  <span>{editorState.current.characterCount} characters</span>
  <span>{editorState.current.wordCount} words</span>
</div>
```

#### Return Value

Returns `{ readonly current: VizelEditorState }`:

| Property | Type | Description |
|----------|------|-------------|
| `isFocused` | `boolean` | Whether the editor is focused |
| `isEmpty` | `boolean` | Whether the editor is empty |
| `canUndo` | `boolean` | Whether undo is available |
| `canRedo` | `boolean` | Whether redo is available |
| `characterCount` | `number` | Character count |
| `wordCount` | `number` | Word count |

### createVizelAutoSave

This rune automatically saves editor content.

```svelte
<script lang="ts">
  import { createVizelEditor, createVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/svelte';

  const editor = createVizelEditor();

  const autoSave = createVizelAutoSave(() => editor.current, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
    onSave: (content) => console.log('Saved'),
    onError: (error) => console.error('Save failed', error),
  });
</script>

<VizelEditor editor={editor.current} />
<VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

### createVizelMarkdown

This rune provides two-way Markdown synchronization with debouncing.

```svelte
<script lang="ts">
  import { createVizelEditor, createVizelMarkdown, VizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor();
  const md = createVizelMarkdown(() => editor.current, {
    debounceMs: 300, // default: 300ms
  });
</script>

<VizelEditor editor={editor.current} />
<textarea value={md.markdown} oninput={(e) => md.setMarkdown(e.target.value)} />
{#if md.isPending}
  <span>Syncing...</span>
{/if}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `string` | Current Markdown content (reactive) |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending (reactive) |

### getVizelTheme

This rune accesses theme state within `VizelThemeProvider` context.

```svelte
<script lang="ts">
  import { getVizelTheme, VizelThemeProvider } from '@vizel/svelte';

  const theme = getVizelTheme();

  function toggleTheme() {
    theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<VizelThemeProvider defaultTheme="system">
  <Editor />
  <button onclick={toggleTheme}>
    {theme.resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
  </button>
</VizelThemeProvider>
```

## Components

### VizelEditor

This component renders the editor content area.

```svelte
<VizelEditor 
  editor={editor.current} 
  class="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `class` | `string` | Custom class name |

### VizelBubbleMenu

This component displays a floating bubble menu on text selection.

```svelte
<VizelBubbleMenu 
  editor={editor.current}
  class="my-bubble-menu"
  showDefaultMenu={true}
  updateDelay={100}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | Custom class name |
| `showDefaultMenu` | `boolean` | `true` | Show default bubble menu |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### VizelThemeProvider

This component provides theme context.

```svelte
<VizelThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  disableTransitionOnChange={false}
>
  {@render children()}
</VizelThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### VizelSaveIndicator

This component displays the save status.

```svelte
<VizelSaveIndicator 
  status={autoSave.status} 
  lastSaved={autoSave.lastSaved}
  class="my-indicator"
/>
```

### VizelPortal

This component renders children in a portal.

```svelte
<VizelPortal container={document.body}>
  <div class="my-overlay">Content</div>
</VizelPortal>
```

### VizelIcon

This component renders an icon from the icon context. It uses Iconify icon IDs by default, and can be customized via `VizelIconProvider`.

```svelte
<script lang="ts">
  import { VizelIcon } from '@vizel/svelte';
</script>

<VizelIcon name="bold" class="my-icon" />
```

## Patterns

### Working with Markdown

```svelte
<script lang="ts">
  import { Vizel } from '@vizel/svelte';

  let markdown = $state('# Hello World\n\nStart editing...');
</script>

<!-- Simple: bind:markdown for two-way binding -->
<Vizel bind:markdown={markdown} />

<!-- Or one-way with initialMarkdown -->
<Vizel initialMarkdown="# Read Only Initial" />
```

### Split View (WYSIWYG + Raw Markdown)

```svelte
<script lang="ts">
  import { Vizel } from '@vizel/svelte';

  let markdown = $state('# Hello\n\nEdit in either pane!');
</script>

<div class="split-view">
  <Vizel bind:markdown={markdown} />
  <textarea bind:value={markdown} />
</div>
```

### Reactive Content with $state (JSON)

```svelte
<script lang="ts">
  import type { JSONContent } from '@tiptap/core';

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
  <VizelEditor editor={editor.current} />
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
<VizelEditor editor={editor.current} />
```

### Custom Bubble Menu

```svelte
<script lang="ts">
  import type { Editor } from '@tiptap/core';

  let { editor }: { editor: Editor | null } = $props();
</script>

{#if editor}
  <div class="bubble-menu">
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
  createVizelState(() => editor.current);

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

The editor runs on the client side only. Use a `browser` check or `onMount`:

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
  <VizelEditor editor={editor.current} />
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

- [Configuration](/guide/configuration) - Editor options
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/svelte)
