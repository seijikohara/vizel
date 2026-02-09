# Version History

Vizel provides a version history system that lets you save, view, and restore document snapshots.

## Overview

Version history enables:

- **Save snapshots** — capture document state at any point
- **Restore versions** — revert to a previous snapshot
- **Browse history** — list all saved versions with timestamps
- **Storage flexibility** — use localStorage or a custom backend
- **Version limits** — automatic cleanup of old versions

## Quick Start

### React

```tsx
import { useVizelEditor, useVizelVersionHistory, VizelProvider, VizelEditor } from "@vizel/react";

function Editor() {
  const editor = useVizelEditor({});
  const { snapshots, saveVersion, restoreVersion, deleteVersion } =
    useVizelVersionHistory(() => editor, {
      maxVersions: 20,
      key: "my-doc-versions",
    });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <button onClick={() => saveVersion("Manual save")}>
        Save Version
      </button>
      <ul>
        {snapshots.map((s) => (
          <li key={s.id}>
            {s.description ?? "Untitled"} —{" "}
            {new Date(s.timestamp).toLocaleString()}
            <button onClick={() => restoreVersion(s.id)}>Restore</button>
            <button onClick={() => deleteVersion(s.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </VizelProvider>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { useVizelEditor, useVizelVersionHistory, VizelProvider, VizelEditor } from "@vizel/vue";

const editor = useVizelEditor({});
const { snapshots, saveVersion, restoreVersion, deleteVersion } =
  useVizelVersionHistory(() => editor.value, {
    maxVersions: 20,
    key: "my-doc-versions",
  });
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <button @click="saveVersion('Manual save')">Save Version</button>
    <ul>
      <li v-for="s in snapshots" :key="s.id">
        {{ s.description ?? "Untitled" }} —
        {{ new Date(s.timestamp).toLocaleString() }}
        <button @click="restoreVersion(s.id)">Restore</button>
        <button @click="deleteVersion(s.id)">Delete</button>
      </li>
    </ul>
  </VizelProvider>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { createVizelEditor, createVizelVersionHistory, VizelProvider, VizelEditor } from "@vizel/svelte";

const editor = createVizelEditor({});
const history = createVizelVersionHistory(() => editor.current, {
  maxVersions: 20,
  key: "my-doc-versions",
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <button onclick={() => history.saveVersion("Manual save")}>
    Save Version
  </button>
  <ul>
    {#each history.snapshots as s}
      <li>
        {s.description ?? "Untitled"} —
        {new Date(s.timestamp).toLocaleString()}
        <button onclick={() => history.restoreVersion(s.id)}>Restore</button>
        <button onclick={() => history.deleteVersion(s.id)}>Delete</button>
      </li>
    {/each}
  </ul>
</VizelProvider>
```

## Options

```typescript
interface VizelVersionHistoryOptions {
  /** Enable version history (default: true) */
  enabled?: boolean;
  /** Maximum number of versions to keep (default: 50) */
  maxVersions?: number;
  /** Storage backend (default: 'localStorage') */
  storage?: VizelVersionStorage;
  /** Storage key for localStorage (default: 'vizel-versions') */
  key?: string;
  /** Callback when a version is saved */
  onSave?: (snapshot: VizelVersionSnapshot) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when a version is restored */
  onRestore?: (snapshot: VizelVersionSnapshot) => void;
}
```

### `maxVersions`

Limits the number of stored snapshots. When the limit is reached, Vizel removes the oldest snapshot.

```typescript
useVizelVersionHistory(() => editor, {
  maxVersions: 10, // Keep only the last 10 versions
});
```

### `storage`

You can choose between built-in localStorage or a custom backend.

```typescript
// localStorage (default)
useVizelVersionHistory(() => editor, {
  storage: "localStorage",
});

// Custom backend (e.g., API)
useVizelVersionHistory(() => editor, {
  storage: {
    save: async (snapshots) => {
      await fetch("/api/versions", {
        method: "PUT",
        body: JSON.stringify(snapshots),
      });
    },
    load: async () => {
      const res = await fetch("/api/versions");
      return res.json();
    },
  },
});
```

## Version Snapshot

Each snapshot contains:

```typescript
interface VizelVersionSnapshot {
  /** Unique identifier */
  id: string;
  /** Document content as JSON */
  content: JSONContent;
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  /** Optional description */
  description?: string;
  /** Optional author name */
  author?: string;
}
```

## API Reference

### Hook / Composable / Rune

| Framework | Function |
|-----------|----------|
| React | `useVizelVersionHistory(getEditor, options)` |
| Vue | `useVizelVersionHistory(getEditor, options)` |
| Svelte | `createVizelVersionHistory(getEditor, options)` |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `snapshots` | `VizelVersionSnapshot[]` | All stored snapshots (newest first) |
| `isLoading` | `boolean` | Whether history is loading |
| `error` | `Error \| null` | Last error that occurred |
| `saveVersion(desc?, author?)` | `Promise<VizelVersionSnapshot \| null>` | Save current state |
| `restoreVersion(id)` | `Promise<boolean>` | Restore to a version |
| `loadVersions()` | `Promise<VizelVersionSnapshot[]>` | Reload from storage |
| `deleteVersion(id)` | `Promise<void>` | Delete a version |
| `clearVersions()` | `Promise<void>` | Delete all versions |

::: tip
In Vue, `snapshots`, `isLoading`, and `error` are `ComputedRef` values — access them with `.value` in script or directly in templates.
:::

## Core Handlers

For advanced use cases, you can use the core handlers directly:

```typescript
import {
  createVizelVersionHistoryHandlers,
  type VizelVersionHistoryState,
} from "@vizel/core";

const handlers = createVizelVersionHistoryHandlers(
  () => editor,
  { maxVersions: 20, key: "my-versions" },
  (state: Partial<VizelVersionHistoryState>) => {
    // Handle state changes
  }
);

await handlers.saveVersion("Initial draft", "Alice");
const versions = await handlers.loadVersions();
await handlers.restoreVersion(versions[0].id);
```
