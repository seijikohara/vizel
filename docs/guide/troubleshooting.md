# Troubleshooting

Common issues and solutions when using Vizel.

## Editor Not Rendering

### CSS Not Loaded

If the editor appears unstyled or broken, ensure CSS is imported:

```typescript
// Import Vizel styles
import '@vizel/core/styles.css';

// For components like Bubble Menu (optional)
import '@vizel/core/components.css';

// For mathematics support (optional)
import '@vizel/core/mathematics.css';
```

### Editor Instance is Null

The editor hook/composable returns `null` until initialization completes:

::: code-group

```tsx [React]
import { useVizelEditor, VizelEditor } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor({});

  // Handle loading state
  if (!editor) {
    return <div>Loading...</div>;
  }

  return <VizelEditor editor={editor} />;
}
```

```vue [Vue]
<script setup lang="ts">
import { useVizelEditor, VizelEditor } from '@vizel/vue';

const editor = useVizelEditor({});
</script>

<template>
  <div v-if="!editor">Loading...</div>
  <VizelEditor v-else :editor="editor" />
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { createVizelEditor, VizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor({});
</script>

{#if !editor.current}
  <div>Loading...</div>
{:else}
  <VizelEditor editor={editor.current} />
{/if}
```

:::

### Console Errors

Check the browser console for initialization errors. Common issues include:

- Missing peer dependencies
- Extension conflicts
- Invalid initial content format

---

## Image Upload Failures

### Upload Handler Not Configured

By default, Vizel converts images to Base64. For production, configure a custom upload handler:

```typescript
const editor = useVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { url } = await response.json();
        return url;
      },
    },
  },
});
```

### File Size Exceeded

Configure `maxFileSize` and handle validation errors:

```typescript
const editor = useVizelEditor({
  features: {
    image: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      onValidationError: (error) => {
        if (error.type === 'file-too-large') {
          alert(`File too large. Maximum size: ${error.maxFileSize} bytes`);
        }
      },
    },
  },
});
```

### Invalid File Type

Configure allowed MIME types:

```typescript
const editor = useVizelEditor({
  features: {
    image: {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      onValidationError: (error) => {
        if (error.type === 'invalid-type') {
          alert('Only JPEG, PNG, and WebP images are allowed');
        }
      },
    },
  },
});
```

### Network Errors

Handle upload failures gracefully:

```typescript
const editor = useVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        // Your upload logic
      },
      onUploadError: (error, file) => {
        console.error(`Failed to upload ${file.name}:`, error);
        // Show user-friendly error message
        alert('Upload failed. Please check your connection and try again.');
      },
    },
  },
});
```

---

## Performance Issues

### Auto-Save Too Frequent

Increase debounce time for auto-save:

```typescript
import { useVizelAutoSave } from '@vizel/react';

useVizelAutoSave({
  getEditor: () => editor,
  onSave: async (content) => {
    await saveToServer(content);
  },
  debounceMs: 2000, // Wait 2 seconds after last change
});
```

### Large Documents

For large documents, consider:

1. **Disable unused features** to reduce bundle size and processing:

```typescript
const editor = useVizelEditor({
  features: {
    mathematics: false,  // Disable if not needed
    diagram: false,      // Disable if not needed
    embed: false,        // Disable if not needed
  },
});
```

2. **Lazy load optional features**:

```typescript
// Only import mathematics CSS when needed
if (useMathematics) {
  import('@vizel/core/mathematics.css');
}
```

3. **Optimize code blocks** with fewer languages:

```typescript
import { createLowlight, common } from 'lowlight';

// Use only common languages instead of all
const lowlight = createLowlight(common);

const editor = useVizelEditor({
  features: {
    codeBlock: {
      lowlight,
    },
  },
});
```

### Sluggish Typing

If typing feels slow:

1. Check for expensive `onUpdate` handlers
2. Debounce state updates
3. Avoid synchronous JSON serialization on every keystroke

```typescript
// Bad: Expensive on every keystroke
onUpdate: ({ editor }) => {
  setContent(editor.getJSON()); // Triggers re-render
  saveToLocalStorage(editor.getJSON()); // Synchronous I/O
},

// Good: Debounced updates
const [content, setContent] = useState(null);
const debouncedSetContent = useMemo(
  () => debounce((json) => setContent(json), 300),
  []
);

onUpdate: ({ editor }) => {
  debouncedSetContent(editor.getJSON());
},
```

---

## Common Error Messages

### "Cannot read property 'commands' of null"

The editor instance is not initialized. Always check for null:

```typescript
// Wrong
editor.commands.setContent(content);

// Correct
if (editor) {
  editor.commands.setContent(content);
}

// Or use optional chaining
editor?.commands.setContent(content);
```

### "Maximum call stack size exceeded"

Usually caused by:

1. **Circular content updates**: Avoid updating content inside `onUpdate`:

```typescript
// Wrong: Causes infinite loop
onUpdate: ({ editor }) => {
  editor.commands.setContent(transformContent(editor.getJSON()));
},

// Correct: Use external trigger
const handleTransform = () => {
  if (editor) {
    editor.commands.setContent(transformContent(editor.getJSON()));
  }
};
```

2. **Recursive component rendering**: Ensure proper dependency arrays in hooks.

### "Extension not found"

Check that required features are enabled:

```typescript
// Error when trying to use disabled feature
editor.commands.toggleMathInline(); // Fails if mathematics: false

// Solution: Enable the feature
const editor = useVizelEditor({
  features: {
    mathematics: true,
  },
});
```

### "Adding different instances of a keyed plugin"

This error occurs when multiple instances of ProseMirror plugins are loaded. Common causes:

1. **Duplicate Tiptap packages** in dependencies:

```bash
# Check for duplicates
pnpm why @tiptap/core
npm ls @tiptap/core
```

2. **Incorrect bundling** of @vizel/core:

Ensure your bundler treats @tiptap/* as external. For Vite:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@tiptap/core', '@tiptap/pm'],
  },
});
```

3. **Multiple editor instances** sharing extensions:

Create fresh extension instances for each editor:

```typescript
// Wrong: Sharing extensions
const extensions = createVizelExtensions({});
const editor1 = useVizelEditor({ extensions });
const editor2 = useVizelEditor({ extensions }); // Error!

// Correct: Create extensions per editor
const editor1 = useVizelEditor({
  extensions: createVizelExtensions({}),
});
const editor2 = useVizelEditor({
  extensions: createVizelExtensions({}),
});
```

---

## Framework-Specific Issues

### React Hydration Errors

When using SSR (Next.js, Remix), the editor must render client-side only:

```tsx
// Next.js
'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./Editor'), { ssr: false });

export default function Page() {
  return <Editor />;
}
```

```tsx
// Remix
import { ClientOnly } from 'remix-utils/client-only';

export default function Page() {
  return (
    <ClientOnly fallback={<div>Loading editor...</div>}>
      {() => <Editor />}
    </ClientOnly>
  );
}
```

### Vue Reactivity Caveats

The editor instance is wrapped in `shallowRef` for performance. Access `.value` when needed:

```vue
<script setup lang="ts">
import { useVizelEditor } from '@vizel/vue';
import { watch } from 'vue';

const editor = useVizelEditor({});

// Watch editor changes
watch(
  () => editor.value,
  (newEditor) => {
    if (newEditor) {
      console.log('Editor ready');
    }
  }
);

// Access editor methods
const handleSave = () => {
  if (editor.value) {
    const content = editor.value.getJSON();
    // Save content
  }
};
</script>
```

### Svelte Compilation Errors

Ensure you're using Svelte 5 with the `runes` feature:

```javascript
// svelte.config.js
export default {
  compilerOptions: {
    runes: true,
  },
};
```

For TypeScript, use the `$props()` rune:

```svelte
<script lang="ts">
  import type { Editor } from '@tiptap/core';

  let { editor }: { editor: Editor | null } = $props();
</script>
```

---

## Debugging Tips

### Browser DevTools

1. **Inspect editor state**:

```javascript
// In browser console
const editor = document.querySelector('.vizel-editor').__vizelEditor;
console.log(editor.getJSON());
console.log(editor.state);
```

2. **Check registered extensions**:

```javascript
console.log(editor.extensionManager.extensions.map(e => e.name));
```

3. **Monitor transactions**:

```typescript
const editor = useVizelEditor({
  onTransaction: ({ transaction }) => {
    console.log('Transaction:', transaction);
    console.log('Steps:', transaction.steps);
  },
});
```

### Editor State Inspection

Use `getVizelEditorState` for debugging:

```typescript
import { getVizelEditorState } from '@vizel/core';

const debugEditor = () => {
  if (!editor) return;

  const state = getVizelEditorState(editor);
  console.table({
    focused: state.isFocused,
    empty: state.isEmpty,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    characters: state.characterCount,
    words: state.wordCount,
  });
};
```

### ProseMirror DevTools

Install [ProseMirror DevTools](https://github.com/d4rkr00t/prosemirror-dev-tools) for advanced debugging:

```typescript
import { applyDevTools } from 'prosemirror-dev-tools';

const editor = useVizelEditor({
  onCreate: ({ editor }) => {
    if (process.env.NODE_ENV === 'development') {
      applyDevTools(editor.view);
    }
  },
});
```

### Logging Transactions

Track all document changes:

```typescript
const editor = useVizelEditor({
  onTransaction: ({ transaction, editor }) => {
    if (transaction.docChanged) {
      console.group('Document Changed');
      console.log('From:', transaction.before.toJSON());
      console.log('To:', editor.state.doc.toJSON());
      console.log('Steps:', transaction.steps.map(s => s.toJSON()));
      console.groupEnd();
    }
  },
});
```

---

## Getting Help

If you encounter issues not covered here:

1. **Search existing issues**: [GitHub Issues](https://github.com/seijikohara/vizel/issues)
2. **Check Tiptap documentation**: [Tiptap Docs](https://tiptap.dev/docs)
3. **Open a new issue**: Include:
   - Vizel version
   - Framework and version
   - Minimal reproduction code
   - Expected vs actual behavior
   - Browser and OS

## Next Steps

- [Configuration](/guide/configuration) - Full configuration reference
- [Features](/guide/features) - Feature-specific options
- [API Reference](/api/)
