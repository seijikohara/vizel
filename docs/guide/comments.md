# Comments & Annotations

Vizel provides a comment/annotation system that lets you add comments to specific text selections in the editor.

## Overview

Comments enable:

- **Text annotation** — add comments to any text selection
- **Reply threads** — discuss specific passages
- **Resolve/reopen** — track comment status
- **Storage flexibility** — use localStorage or a custom backend
- **Active highlighting** — click a comment to highlight its text

## Quick Start

### React

```tsx
import { useVizelEditor, useVizelComment, VizelProvider, VizelEditor } from "@vizel/react";

function Editor() {
  const editor = useVizelEditor({
    features: { comment: true },
  });
  const { comments, addComment, resolveComment, removeComment, setActiveComment } =
    useVizelComment(() => editor, {
      key: "my-doc-comments",
    });

  const handleAddComment = () => {
    const text = prompt("Enter comment:");
    if (text) addComment(text, "Author");
  };

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <button onClick={handleAddComment}>Add Comment</button>
      <ul>
        {comments.map((c) => (
          <li key={c.id} onClick={() => setActiveComment(c.id)}>
            {c.text} {c.resolved ? "(resolved)" : ""}
            <button onClick={() => resolveComment(c.id)}>Resolve</button>
            <button onClick={() => removeComment(c.id)}>Delete</button>
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
import { useVizelEditor, useVizelComment, VizelProvider, VizelEditor } from "@vizel/vue";

const editor = useVizelEditor({
  features: { comment: true },
});
const { comments, addComment, resolveComment, removeComment, setActiveComment } =
  useVizelComment(() => editor.value, {
    key: "my-doc-comments",
  });

function handleAddComment() {
  const text = prompt("Enter comment:");
  if (text) addComment(text, "Author");
}
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <button @click="handleAddComment">Add Comment</button>
    <ul>
      <li
        v-for="c in comments"
        :key="c.id"
        @click="setActiveComment(c.id)"
      >
        {{ c.text }} {{ c.resolved ? "(resolved)" : "" }}
        <button @click="resolveComment(c.id)">Resolve</button>
        <button @click="removeComment(c.id)">Delete</button>
      </li>
    </ul>
  </VizelProvider>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { createVizelEditor, createVizelComment, VizelProvider, VizelEditor } from "@vizel/svelte";

const editor = createVizelEditor({
  features: { comment: true },
});
const comment = createVizelComment(() => editor.current, {
  key: "my-doc-comments",
});

function handleAddComment() {
  const text = prompt("Enter comment:");
  if (text) comment.addComment(text, "Author");
}
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <button onclick={handleAddComment}>Add Comment</button>
  <ul>
    {#each comment.comments as c}
      <li onclick={() => comment.setActiveComment(c.id)}>
        {c.text} {c.resolved ? "(resolved)" : ""}
        <button onclick={() => comment.resolveComment(c.id)}>Resolve</button>
        <button onclick={() => comment.removeComment(c.id)}>Delete</button>
      </li>
    {/each}
  </ul>
</VizelProvider>
```

## Enabling the Feature

The comment feature is **disabled by default**. You can enable it via `features.comment`:

```typescript
const editor = useVizelEditor({
  features: {
    comment: true, // Enable with defaults
  },
});

// Or with options
const editor = useVizelEditor({
  features: {
    comment: {
      onCommentClick: (commentId) => {
        console.log("Clicked comment:", commentId);
      },
    },
  },
});
```

## Comment Options

```typescript
interface VizelCommentOptions {
  /** Enable comments (default: true) */
  enabled?: boolean;
  /** Storage backend (default: 'localStorage') */
  storage?: VizelCommentStorage;
  /** Storage key for localStorage (default: 'vizel-comments') */
  key?: string;
  /** Callback when a comment is added */
  onAdd?: (comment: VizelComment) => void;
  /** Callback when a comment is removed */
  onRemove?: (commentId: string) => void;
  /** Callback when a comment is resolved */
  onResolve?: (comment: VizelComment) => void;
  /** Callback when a comment is reopened */
  onReopen?: (comment: VizelComment) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}
```

### Custom Storage Backend

```typescript
useVizelComment(() => editor, {
  storage: {
    save: async (comments) => {
      await fetch("/api/comments", {
        method: "PUT",
        body: JSON.stringify(comments),
      });
    },
    load: async () => {
      const res = await fetch("/api/comments");
      return res.json();
    },
  },
});
```

## Data Model

### Comment

```typescript
interface VizelComment {
  /** Unique identifier */
  id: string;
  /** Comment text */
  text: string;
  /** Optional author name */
  author?: string;
  /** Unix timestamp (milliseconds) */
  createdAt: number;
  /** Whether the comment is resolved */
  resolved: boolean;
  /** Replies to this comment */
  replies: VizelCommentReply[];
}
```

### Reply

```typescript
interface VizelCommentReply {
  /** Unique identifier */
  id: string;
  /** Reply text */
  text: string;
  /** Optional author name */
  author?: string;
  /** Unix timestamp (milliseconds) */
  createdAt: number;
}
```

## API Reference

### Hook / Composable / Rune

| Framework | Function |
|-----------|----------|
| React | `useVizelComment(getEditor, options)` |
| Vue | `useVizelComment(getEditor, options)` |
| Svelte | `createVizelComment(getEditor, options)` |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `VizelComment[]` | All stored comments (newest first) |
| `activeCommentId` | `string \| null` | Currently active comment ID |
| `isLoading` | `boolean` | Whether comments are loading |
| `error` | `Error \| null` | Last error that occurred |
| `addComment(text, author?)` | `Promise<VizelComment \| null>` | Add a comment to the selection |
| `removeComment(id)` | `Promise<void>` | Remove a comment and its mark |
| `resolveComment(id)` | `Promise<boolean>` | Mark a comment as resolved |
| `reopenComment(id)` | `Promise<boolean>` | Reopen a resolved comment |
| `replyToComment(id, text, author?)` | `Promise<VizelCommentReply \| null>` | Add a reply |
| `setActiveComment(id)` | `void` | Set the active comment |
| `loadComments()` | `Promise<VizelComment[]>` | Reload from storage |
| `getCommentById(id)` | `VizelComment \| undefined` | Get a comment by ID |

::: tip
In Vue, `comments`, `activeCommentId`, `isLoading`, and `error` are `ComputedRef` values — access them with `.value` in script or directly in templates.
:::

## Styling

Comment highlights use these CSS classes:

| Class | Description |
|-------|-------------|
| `.vizel-comment-marker` | Base highlight for commented text |
| `.vizel-comment-marker--active` | Highlight for the active comment |

### CSS Custom Properties

```css
:root {
  /* Comment highlight */
  --vizel-comment-bg: rgba(255, 212, 100, 0.3);
  --vizel-comment-border: rgba(255, 180, 50, 0.6);
  --vizel-comment-hover-bg: rgba(255, 212, 100, 0.5);

  /* Active comment */
  --vizel-comment-active-bg: rgba(255, 180, 50, 0.5);
  --vizel-comment-active-border: rgba(255, 150, 0, 0.8);
  --vizel-comment-active-outline: rgba(255, 150, 0, 0.4);
}
```

## Core Handlers

For advanced use cases, you can use the core handlers directly:

```typescript
import {
  createVizelCommentHandlers,
  type VizelCommentState,
} from "@vizel/core";

const handlers = createVizelCommentHandlers(
  () => editor,
  { key: "my-comments" },
  (state: Partial<VizelCommentState>) => {
    // Handle state changes
  }
);

await handlers.addComment("Needs review", "Alice");
await handlers.replyToComment(commentId, "Fixed!", "Bob");
await handlers.resolveComment(commentId);
```
