# Auto-Save

Vizel provides built-in auto-save functionality to persist editor content automatically.

## Basic Usage

::: code-group

```tsx [React]
import { useVizelEditor, useVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor();
  
  const { status, lastSaved } = useVizelAutoSave(() => editor, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
  });

  return (
    <div>
      <VizelEditor editor={editor} />
      <VizelSaveIndicator status={status} lastSaved={lastSaved} />
    </div>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { useVizelEditor, useVizelAutoSave } from '@vizel/vue';
import { VizelEditor, VizelSaveIndicator } from '@vizel/vue';

const editor = useVizelEditor();

const { status, lastSaved } = useVizelAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
});
</script>

<template>
  <div>
    <VizelEditor :editor="editor" />
    <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
  </div>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { createVizelEditor, createVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/svelte';

  const editor = createVizelEditor();
  
  const autoSave = createVizelAutoSave(() => editor.current, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
  });
</script>

<VizelEditor editor={editor.current} />
<VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

:::

## Options

### AutoSaveOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable auto-save |
| `debounceMs` | `number` | `1000` | Debounce delay in milliseconds |
| `storage` | `StorageBackend` | `"localStorage"` | Storage backend |
| `key` | `string` | `"vizel-content"` | Storage key |
| `onSave` | `(content) => void` | - | Callback after successful save |
| `onError` | `(error) => void` | - | Callback on save error |
| `onRestore` | `(content) => void` | - | Callback when content is restored |

## Storage Backends

### localStorage (Default)

Persists content in the browser's localStorage:

```typescript
const { status } = useVizelAutoSave(() => editor, {
  storage: 'localStorage',
  key: 'my-editor-content',
});
```

### sessionStorage

Persists content only for the current session:

```typescript
const { status } = useVizelAutoSave(() => editor, {
  storage: 'sessionStorage',
  key: 'my-editor-content',
});
```

### Custom Backend

Implement your own storage backend for server-side persistence:

```typescript
const { status } = useVizelAutoSave(() => editor, {
  storage: {
    save: async (content) => {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
    },
    load: async () => {
      const response = await fetch('/api/content');
      if (!response.ok) return null;
      return response.json();
    },
  },
});
```

## Return Values

### Status

| Value | Description |
|-------|-------------|
| `"saved"` | Content is saved and up to date |
| `"saving"` | Save operation in progress |
| `"unsaved"` | Unsaved changes pending |
| `"error"` | Save failed |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | `SaveStatus` | Current save status |
| `hasUnsavedChanges` | `boolean` | Whether there are unsaved changes |
| `lastSaved` | `Date \| null` | Timestamp of last successful save |
| `error` | `Error \| null` | Last error if status is "error" |

### Methods

| Method | Description |
|--------|-------------|
| `save()` | Manually trigger save |
| `restore()` | Manually restore content |

## Manual Save/Restore

```typescript
const { save, restore } = useVizelAutoSave(() => editor, { storage: 'localStorage' });

// Trigger manual save
await save();

// Restore from storage
const content = await restore();
if (content) {
  editor.commands.setContent(content);
}
```

## Save Indicator

The `VizelSaveIndicator` component displays the current save status:

::: code-group

```tsx [React]
import { VizelSaveIndicator } from '@vizel/react';

<VizelSaveIndicator 
  status={status} 
  lastSaved={lastSaved}
  className="my-indicator"
/>
```

```vue [Vue]
import { VizelSaveIndicator } from '@vizel/vue';

<VizelSaveIndicator 
  :status="status" 
  :lastSaved="lastSaved"
  class="my-indicator"
/>
```

```svelte [Svelte]
import { VizelSaveIndicator } from '@vizel/svelte';

<VizelSaveIndicator 
  status={autoSave.status} 
  lastSaved={autoSave.lastSaved}
  class="my-indicator"
/>
```

:::

### Custom Indicator

```tsx
function CustomIndicator({ status, lastSaved }) {
  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.round((date.getTime() - Date.now()) / 60000), 'minute');
  };

  return (
    <div className="save-indicator">
      {status === 'saving' && <span>Saving...</span>}
      {status === 'saved' && lastSaved && (
        <span>Saved {formatTime(lastSaved)}</span>
      )}
      {status === 'unsaved' && <span>Unsaved changes</span>}
      {status === 'error' && <span className="error">Save failed</span>}
    </div>
  );
}
```

## Debouncing

The `debounceMs` option controls how long to wait after the last change before saving:

```typescript
// Save 500ms after last change (more responsive)
useVizelAutoSave(() => editor, { debounceMs: 500 });

// Save 5 seconds after last change (less frequent)
useVizelAutoSave(() => editor, { debounceMs: 5000 });
```

## Error Handling

Handle save errors gracefully:

```typescript
const { status, error } = useVizelAutoSave(() => editor, {
  storage: {
    save: async (content) => {
      const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(content),
      });
      if (!response.ok) {
        throw new Error('Failed to save');
      }
    },
  },
  onError: (error) => {
    console.error('Auto-save failed:', error);
    // Show notification to user
    toast.error('Failed to save. Please try again.');
  },
});
```

## Restoring Content on Load

Restore saved content when the editor initializes:

::: code-group

```tsx [React]
import { useEffect } from 'react';
import { useVizelEditor, useVizelAutoSave, VizelEditor } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor();
  
  const { restore } = useVizelAutoSave(() => editor, {
    storage: 'localStorage',
    key: 'my-editor-content',
    onRestore: (content) => {
      if (content) {
        console.log('Restored saved content');
      }
    },
  });

  useEffect(() => {
    if (editor) {
      restore().then((content) => {
        if (content) {
          editor.commands.setContent(content);
        }
      });
    }
  }, [editor]);

  return <VizelEditor editor={editor} />;
}
```

```vue [Vue]
<script setup lang="ts">
import { watch } from 'vue';
import { useVizelEditor, useVizelAutoSave } from '@vizel/vue';

const editor = useVizelEditor();

const { restore } = useVizelAutoSave(() => editor.value, {
  storage: 'localStorage',
  key: 'my-editor-content',
});

watch(editor, async (ed) => {
  if (ed) {
    const content = await restore();
    if (content) {
      ed.commands.setContent(content);
    }
  }
}, { once: true });
</script>
```

```svelte [Svelte]
<script lang="ts">
  import { onMount } from 'svelte';
  import { createVizelEditor, createVizelAutoSave } from '@vizel/svelte';

  const editor = createVizelEditor();
  
  const autoSave = createVizelAutoSave(() => editor.current, {
    storage: 'localStorage',
    key: 'my-editor-content',
  });

  onMount(async () => {
    const content = await autoSave.restore();
    if (content && editor.current) {
      editor.current.commands.setContent(content);
    }
  });
</script>
```

:::

## Disabling Auto-Save

Temporarily disable auto-save:

```typescript
const { status } = useVizelAutoSave(() => editor, {
  enabled: false, // Disable auto-save
});
```

Or conditionally based on state:

```typescript
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

const { status } = useVizelAutoSave(() => editor, {
  enabled: autoSaveEnabled,
});
```

---

## Next Steps

- [Configuration](/guide/configuration) - Full editor options
- [Features](/guide/features) - Configure features
- [API Reference](/api/) - Complete API documentation
