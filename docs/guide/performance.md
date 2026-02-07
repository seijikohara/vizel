# Performance Optimization

Strategies for optimizing Vizel editor performance in production applications.

## Bundle Size Optimization

### Disable Unused Features

All features are enabled by default. Disable features you don't use to reduce bundle size and extension processing:

```typescript
const editor = useVizelEditor({
  features: {
    mathematics: false,  // KaTeX (~80KB gzipped)
    diagram: false,      // Mermaid (~40KB gzipped, lazy-loaded)
    embed: false,        // oEmbed/OGP processing
    codeBlock: false,    // lowlight/highlight.js (~20KB gzipped)
    table: false,
    dragHandle: false,
  },
});
```

### Feature Size Impact

Approximate sizes (minified + gzipped) of optional features:

| Feature | Approximate Size | Dependencies |
|---------|-----------------|--------------|
| `mathematics` | ~80KB gzipped | KaTeX |
| `diagram` | ~40KB gzipped | Mermaid (lazy-loaded); GraphViz via `@hpcc-js/wasm-graphviz` adds additional size |
| `codeBlock` | ~20KB gzipped | lowlight / highlight.js |
| `embed` | ~5KB gzipped | Built-in oEmbed |
| `table` | ~8KB gzipped | @tiptap/extension-table |
| `dragHandle` | ~3KB gzipped | Built-in |
| `textColor` | ~2KB gzipped | Built-in |
| `taskList` | ~2KB gzipped | Built-in |
| `details` | ~2KB gzipped | Built-in |

::: tip Measurement
Actual bundle sizes depend on your bundler configuration and tree-shaking. Use tools like [bundlephobia](https://bundlephobia.com/) or your bundler's analysis output to measure exact sizes:

```bash
# Vite
npx vite-bundle-visualizer

# Webpack
npx webpack-bundle-analyzer
```
:::

### Lazy Loading

Vizel uses `createLazyLoader()` internally for optional dependencies like Mermaid. Diagram rendering is lazy-loaded on first use, so simply having the feature enabled doesn't add to initial load time.

For CSS, you can also lazy-load optional stylesheets:

```typescript
// Only import mathematics CSS when the feature is used
if (useMathematics) {
  import('@vizel/core/mathematics.css');
}
```

### Code Block Language Optimization

By default, code blocks load all common languages. Limit to only the languages you need:

```typescript
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('css', css);

const editor = useVizelEditor({
  features: {
    codeBlock: { lowlight },
  },
});
```

Or use the `common` subset instead of `all`:

```typescript
import { createLowlight, common } from 'lowlight';

// ~40 common languages instead of all ~190
const lowlight = createLowlight(common);
```

---

## Large Document Handling

### Character Count Limits

Use the character count feature to enforce document size limits:

```typescript
const editor = useVizelEditor({
  features: {
    characterCount: {
      limit: 50000, // Maximum characters
    },
  },
});
```

### Optimize onUpdate Handlers

Avoid expensive operations on every keystroke:

```typescript
// Bad: Expensive serialization on every keystroke
onUpdate: ({ editor }) => {
  setContent(editor.getJSON());        // Triggers re-render
  localStorage.setItem('content',
    JSON.stringify(editor.getJSON())); // Synchronous I/O
},

// Good: Use auto-save with debouncing
const editor = useVizelEditor({
  onUpdate: ({ editor }) => {
    // Only lightweight operations here
  },
});

useVizelAutoSave(() => editor, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-content',
});
```

### Debounce State Updates

When syncing editor state to external state management:

::: code-group

```tsx [React]
import { useMemo, useState } from 'react';
import { useVizelEditor } from '@vizel/react';

function Editor() {
  const [content, setContent] = useState(null);

  // Debounce content updates
  const debouncedSetContent = useMemo(
    () => {
      let timer: ReturnType<typeof setTimeout>;
      return (json: unknown) => {
        clearTimeout(timer);
        timer = setTimeout(() => setContent(json), 300);
      };
    },
    []
  );

  const editor = useVizelEditor({
    onUpdate: ({ editor }) => {
      debouncedSetContent(editor.getJSON());
    },
  });

  return <VizelEditor editor={editor} />;
}
```

```vue [Vue]
<script setup lang="ts">
import { shallowRef } from 'vue';
import { useVizelEditor, VizelEditor } from '@vizel/vue';

const content = shallowRef(null);
let timer: ReturnType<typeof setTimeout>;

const editor = useVizelEditor({
  onUpdate: ({ editor }) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      content.value = editor.getJSON();
    }, 300);
  },
});
</script>

<template>
  <VizelEditor :editor="editor" />
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { createVizelEditor, VizelEditor } from '@vizel/svelte';

  let content = $state(null);
  let timer: ReturnType<typeof setTimeout>;

  const editor = createVizelEditor({
    onUpdate: ({ editor }) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        content = editor.getJSON();
      }, 300);
    },
  });
</script>

<VizelEditor editor={editor.current} />
```

:::

---

## Auto-Save Configuration

### Debounce Timing

Choose a debounce value that balances responsiveness with performance:

| Use Case | Recommended `debounceMs` |
|----------|-------------------------|
| Real-time collaboration | 500ms |
| General editing | 1000ms (default) |
| Large documents | 2000–3000ms |
| Server-side persistence | 3000–5000ms |

### Storage Backend Selection

| Backend | Best For | Considerations |
|---------|----------|---------------|
| `localStorage` | Quick prototyping | ~5MB limit, synchronous |
| `sessionStorage` | Temporary drafts | Cleared on tab close |
| Custom (API) | Production apps | Async, no size limit |

See [Auto-Save](/guide/auto-save) for detailed configuration.

---

## Framework-Specific Tips

### React

- Avoid creating a new `onUpdate` function on every render — use `useCallback` or define outside the component
- Use `React.memo` for toolbar components that receive the editor instance
- Do not store the entire editor state in React state — use `useVizelEditorState` for reactive state tracking

```tsx
import { useVizelEditor, useVizelEditorState } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor({});

  // Reactive state without manual onUpdate tracking
  const { characterCount, wordCount } = useVizelEditorState(() => editor);

  return (
    <div>
      <VizelEditor editor={editor} />
      <span>{characterCount} characters, {wordCount} words</span>
    </div>
  );
}
```

### Vue

- Use `shallowRef` for the editor instance (this is done automatically by `useVizelEditor`)
- Avoid `watch` with `deep: true` on the editor — use `useVizelEditorState` instead
- Use `computed` for derived values from editor state

```vue
<script setup lang="ts">
import { useVizelEditor, useVizelEditorState } from '@vizel/vue';

const editor = useVizelEditor({});

// Reactive state tracking
const { characterCount, wordCount } = useVizelEditorState(() => editor.value);
</script>
```

### Svelte

- Svelte 5 runes handle reactivity efficiently by default
- Use `createVizelEditorState` for reactive state tracking
- Avoid frequent `$effect` calls that read the editor state — batch updates

```svelte
<script lang="ts">
  import { createVizelEditor, createVizelEditorState } from '@vizel/svelte';

  const editor = createVizelEditor({});

  // Reactive state tracking
  const editorState = createVizelEditorState(() => editor.current);
</script>

<span>{editorState.current.characterCount} characters</span>
```

---

## Production Checklist

Before deploying to production, verify these optimizations:

- [ ] **Disable unused features** — Remove features not used in your application
- [ ] **Optimize code block languages** — Only register languages you need
- [ ] **Configure auto-save debouncing** — Set appropriate `debounceMs` for your use case
- [ ] **Debounce onUpdate handlers** — Avoid expensive operations on every keystroke
- [ ] **Set character count limits** — Prevent excessively large documents if applicable
- [ ] **Lazy load optional CSS** — Only import `mathematics.css` if using math features
- [ ] **Enable compression** — Ensure gzip or brotli compression is configured on your server
- [ ] **Analyze bundle size** — Use bundle analysis tools to identify optimization opportunities
- [ ] **Test with realistic content** — Profile with documents similar to production usage

---

## Next Steps

- [Configuration](/guide/configuration) - Editor options reference
- [Features](/guide/features) - Feature-specific configuration
- [Auto-Save](/guide/auto-save) - Auto-save configuration
- [Troubleshooting](/guide/troubleshooting) - Common issues and solutions
