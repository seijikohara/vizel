# Configuration

## Editor Options

The main configuration object passed to `useVizelEditor` (React/Vue) or `createVizelEditor` (Svelte).

### VizelEditorOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `initialContent` | `JSONContent` | Empty doc | Initial content in Tiptap JSON format |
| `placeholder` | `string` | `"Type '/' for commands..."` | Placeholder text when editor is empty |
| `editable` | `boolean` | `true` | Whether the editor is editable |
| `autofocus` | `boolean \| "start" \| "end" \| "all" \| number` | `false` | Auto focus behavior on mount |
| `features` | `VizelFeatureOptions` | See [Features](/guide/features) | Feature configuration |
| `extensions` | `Extensions` | `[]` | Additional Tiptap extensions |

### Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onUpdate` | `({ editor }) => void` | Called when content changes |
| `onCreate` | `({ editor }) => void` | Called when editor is created |
| `onDestroy` | `() => void` | Called when editor is destroyed |
| `onSelectionUpdate` | `({ editor }) => void` | Called when selection changes |
| `onFocus` | `({ editor }) => void` | Called when editor receives focus |
| `onBlur` | `({ editor }) => void` | Called when editor loses focus |

### Example

::: code-group

```tsx [React]
import { useVizelEditor } from '@vizel/react';

const editor = useVizelEditor({
  // Content
  initialContent: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello!' }] }
    ]
  },
  placeholder: 'Start writing...',
  
  // Behavior
  editable: true,
  autofocus: 'end',
  
  // Features
  features: {
    markdown: true,
    mathematics: true,
  },
  
  // Callbacks
  onUpdate: ({ editor }) => {
    console.log('Content:', editor.getJSON());
  },
  onCreate: ({ editor }) => {
    console.log('Editor created');
  },
  onFocus: ({ editor }) => {
    console.log('Editor focused');
  },
  onBlur: ({ editor }) => {
    console.log('Editor blurred');
  },
});
```

```vue [Vue]
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor({
  initialContent: { type: 'doc', content: [] },
  placeholder: 'Start writing...',
  editable: true,
  autofocus: 'end',
  features: {
    markdown: true,
    mathematics: true,
  },
  onUpdate: ({ editor }) => {
    console.log('Content:', editor.getJSON());
  },
});
```

```svelte [Svelte]
import { createVizelEditor } from '@vizel/svelte';

const editor = createVizelEditor({
  initialContent: { type: 'doc', content: [] },
  placeholder: 'Start writing...',
  editable: true,
  autofocus: 'end',
  features: {
    markdown: true,
    mathematics: true,
  },
  onUpdate: ({ editor }) => {
    console.log('Content:', editor.getJSON());
  },
});
```

:::

## Autofocus Options

The `autofocus` option controls where the cursor is placed when the editor mounts:

| Value | Description |
|-------|-------------|
| `false` | No autofocus (default) |
| `true` | Focus at the start |
| `"start"` | Focus at the start of the document |
| `"end"` | Focus at the end of the document |
| `"all"` | Select all content |
| `number` | Focus at specific position |

```typescript
// Focus at end of document
const editor = useVizelEditor({
  autofocus: 'end',
});

// Focus at position 10
const editor = useVizelEditor({
  autofocus: 10,
});
```

## Read-Only Mode

Set `editable: false` to make the editor read-only:

```typescript
const editor = useVizelEditor({
  editable: false,
  initialContent: myContent,
});
```

You can also toggle editability at runtime:

```typescript
// Make read-only
editor.setEditable(false);

// Make editable again
editor.setEditable(true);

// Check current state
const isEditable = editor.isEditable;
```

## Custom Extensions

Add additional Tiptap extensions alongside Vizel's defaults:

```typescript
import { useVizelEditor } from '@vizel/react';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';

const editor = useVizelEditor({
  extensions: [
    Highlight.configure({ multicolor: true }),
    Typography,
  ],
});
```

::: warning Extension Conflicts
Be careful when adding extensions that might conflict with Vizel's built-in extensions. If you need to customize a built-in extension, disable the feature and add your own configuration.
:::

## Editor State

Access editor state programmatically:

```typescript
import { getVizelEditorState } from '@vizel/core';

// Get current state
const state = getVizelEditorState(editor);

console.log(state);
// {
//   isFocused: boolean,
//   isEmpty: boolean,
//   canUndo: boolean,
//   canRedo: boolean,
//   characterCount: number,
//   wordCount: number,
// }
```

### React Hook

```tsx
import { useVizelState } from '@vizel/react';

function EditorStatus({ editor }) {
  const updateCount = useVizelState(() => editor);
  
  // Component re-renders on editor changes
  return (
    <div>
      <span>Characters: {editor?.storage.characterCount?.characters() ?? 0}</span>
      <span>Words: {editor?.storage.characterCount?.words() ?? 0}</span>
    </div>
  );
}
```

### Vue Composable

```vue
<script setup lang="ts">
import { useVizelState } from '@vizel/vue';

const props = defineProps<{ editor: Editor | null }>();
const updateCount = useVizelState(() => props.editor);
</script>

<template>
  <div>
    <span>Characters: {{ editor?.storage.characterCount?.characters() ?? 0 }}</span>
  </div>
</template>
```

### Svelte Rune

```svelte
<script lang="ts">
  import { createVizelState } from '@vizel/svelte';

  let { editor } = $props();
  const state = createVizelState(() => editor);
</script>

<div>
  <span>Characters: {editor?.storage.characterCount?.characters() ?? 0}</span>
</div>
```

## Content Format

### JSON Format (Recommended)

Vizel uses Tiptap's JSON format for content:

```typescript
const content = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Title' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Normal text ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
      ],
    },
  ],
};
```

### Getting Content

```typescript
// JSON format (recommended for storage)
const json = editor.getJSON();

// HTML format
const html = editor.getHTML();

// Plain text
const text = editor.getText();
```

### Setting Content

```typescript
// Replace all content
editor.commands.setContent({
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'New content' }] }
  ],
});

// Clear content
editor.commands.clearContent();
```

## Next Steps

- [Features](/guide/features) - Configure individual features in detail
- [Theming](/guide/theming) - Customize the editor appearance
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [API Reference](/api/) - Complete API documentation
