# Collaboration

Collaboration in Vizel covers four concerns that share the same editor
instance: real-time co-editing through a Yjs provider, inline comments,
version history snapshots, and presence indicators carried by the
collaboration provider. Each concern is opt-in and composes with the
others.

| Concern | Hook / composable / rune | Feature flag | Default storage |
|---------|--------------------------|--------------|-----------------|
| Real-time editing | `useVizelCollaboration` / `createVizelCollaboration` | `features.collaboration.provider` | Yjs provider |
| Comments | `useVizelComment` / `createVizelComment` | `features.collaboration.comments` (requires `provider`) | `localStorage` |
| Version history | `useVizelVersionHistory` / `createVizelVersionHistory` | `features.collaboration.versionHistory` (always available without flag) | `localStorage` |

## Real-time editing

Vizel integrates with [Yjs](https://yjs.dev/), a CRDT-based framework
that lets multiple users edit the same document simultaneously without
conflicts. Setting `features.collaboration.provider` to any truthy
value (boolean or a `VizelCollaborationProvider` adapter) automatically
disables the built-in `History` extension because Yjs owns undo / redo
through `Y.UndoManager`.

### Prerequisites

Install the required peer dependencies:

```bash
npm install yjs y-websocket @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

::: warning Version compatibility
Ensure your `@tiptap/extension-collaboration` version is compatible
with the `@tiptap/core` version used by Vizel. Check the
[Tiptap documentation](https://tiptap.dev/) for version requirements.
:::

### Setup

Start a Yjs WebSocket server for development:

```bash
npx y-websocket
```

Then create the editor and the collaboration provider:

::: code-group

```tsx [React]
import { useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import {
  VizelEditor,
  VizelBubbleMenu,
  useVizelEditor,
  useVizelCollaboration,
} from "@vizel/react";

function CollaborativeEditor() {
  const user = { name: "Alice", color: "#ff0000" };

  const [doc] = useState(() => new Y.Doc());
  const [provider] = useState(
    () => new WebsocketProvider("ws://localhost:1234", "my-document", doc),
  );

  const { isConnected, isSynced, peerCount } = useVizelCollaboration(
    provider,
    { user },
  );

  const editor = useVizelEditor({
    features: { collaboration: true },
    extensions: [
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({ provider, user }),
    ],
  });

  return (
    <div>
      <div className="status-bar">
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
        <span>{isSynced ? "Synced" : "Syncing..."}</span>
        <span>{peerCount} peer(s)</span>
      </div>
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </div>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import {
  VizelEditor,
  VizelBubbleMenu,
  useVizelEditor,
  useVizelCollaboration,
} from "@vizel/vue";

const user = { name: "Alice", color: "#ff0000" };
const doc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "my-document",
  doc,
);

const { isConnected, isSynced, peerCount } = useVizelCollaboration(
  () => provider,
  { user },
);

const editor = useVizelEditor({
  features: { collaboration: true },
  extensions: [
    Collaboration.configure({ document: doc }),
    CollaborationCursor.configure({ provider, user }),
  ],
});
</script>

<template>
  <div>
    <div class="status-bar">
      <span>{{ isConnected ? "Connected" : "Disconnected" }}</span>
      <span>{{ isSynced ? "Synced" : "Syncing..." }}</span>
      <span>{{ peerCount }} peer(s)</span>
    </div>
    <VizelEditor :editor="editor" />
    <VizelBubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

```svelte [Svelte]
<script lang="ts">
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import {
  VizelEditor,
  VizelBubbleMenu,
  createVizelEditor,
  createVizelCollaboration,
} from "@vizel/svelte";

const user = { name: "Alice", color: "#ff0000" };
const doc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "my-document",
  doc,
);

const collab = createVizelCollaboration(() => provider, { user });

const editor = createVizelEditor({
  features: { collaboration: true },
  extensions: [
    Collaboration.configure({ document: doc }),
    CollaborationCursor.configure({ provider, user }),
  ],
});
</script>

<div>
  <div class="status-bar">
    <span>{collab.isConnected ? "Connected" : "Disconnected"}</span>
    <span>{collab.isSynced ? "Synced" : "Syncing..."}</span>
    <span>{collab.peerCount} peer(s)</span>
  </div>
  <VizelEditor editor={editor.current} />
  {#if editor.current}
    <VizelBubbleMenu editor={editor.current} />
  {/if}
</div>
```

:::

### Collaboration options and return values

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable state tracking |
| `user` | `{ name, color }` | Required | Current user info for cursor display |
| `onConnect` | `() => void` | — | Fires when the client connects |
| `onDisconnect` | `() => void` | — | Fires when the client disconnects |
| `onSynced` | `() => void` | — | Fires when initial sync completes |
| `onError` | `(error) => void` | — | Fires on a provider error |
| `onPeersChange` | `(count) => void` | — | Fires when the peer count changes |

| Return value | Description |
|--------------|-------------|
| `isConnected` | Whether the client is connected to the server |
| `isSynced` | Whether initial document sync is complete |
| `peerCount` | Number of connected peers (including self) |
| `error` | Last error that occurred |
| `connect()` | Connect to the server |
| `disconnect()` | Disconnect from the server |
| `updateUser(user)` | Update cursor user information |

### Server setup

For local development, `npx y-websocket` is sufficient. For production:

```js
// server.js
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const wss = new WebSocketServer({ port: 1234 });
wss.on("connection", (ws, req) => setupWSConnection(ws, req));
```

Persist documents with LevelDB through the `YPERSISTENCE` environment
variable or `y-leveldb`. Yjs supports alternative transports
(`y-webrtc` for peer-to-peer, `@hocuspocus/provider` for auth and
extensibility) that drop into the same `useVizelCollaboration` call.

## Comments

Comments add inline annotations to any text selection. The feature is
opt-in and ships with `localStorage` persistence by default.

### Quick start

::: code-group

```tsx [React]
import {
  useVizelEditor,
  useVizelComment,
  VizelProvider,
  VizelEditor,
} from "@vizel/react";

function Editor() {
  const editor = useVizelEditor({ features: { comment: true } });
  const { comments, addComment, resolveComment, removeComment, setActiveComment } =
    useVizelComment(editor, { key: "my-doc-comments" });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <button onClick={() => {
        const text = prompt("Enter comment:");
        if (text) addComment(text, "Author");
      }}>
        Add Comment
      </button>
      <ul>
        {comments.map((c) => (
          <li key={c.id} onClick={() => setActiveComment(c.id)}>
            {c.text}
            <button onClick={() => resolveComment(c.id)}>Resolve</button>
            <button onClick={() => removeComment(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </VizelProvider>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import {
  useVizelEditor,
  useVizelComment,
  VizelProvider,
  VizelEditor,
} from "@vizel/vue";

const editor = useVizelEditor({ features: { comment: true } });
const { comments, addComment, resolveComment, removeComment, setActiveComment } =
  useVizelComment(() => editor.value, { key: "my-doc-comments" });
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <button @click="() => {
      const text = prompt('Enter comment:');
      if (text) addComment(text, 'Author');
    }">
      Add Comment
    </button>
    <ul>
      <li v-for="c in comments" :key="c.id" @click="setActiveComment(c.id)">
        {{ c.text }}
        <button @click="resolveComment(c.id)">Resolve</button>
        <button @click="removeComment(c.id)">Delete</button>
      </li>
    </ul>
  </VizelProvider>
</template>
```

```svelte [Svelte]
<script lang="ts">
import {
  createVizelEditor,
  createVizelComment,
  VizelProvider,
  VizelEditor,
} from "@vizel/svelte";

const editor = createVizelEditor({ features: { comment: true } });
const comment = createVizelComment(() => editor.current, {
  key: "my-doc-comments",
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <button onclick={() => {
    const text = prompt("Enter comment:");
    if (text) comment.addComment(text, "Author");
  }}>
    Add Comment
  </button>
  <ul>
    {#each comment.comments as c}
      <li onclick={() => comment.setActiveComment(c.id)}>
        {c.text}
        <button onclick={() => comment.resolveComment(c.id)}>Resolve</button>
        <button onclick={() => comment.removeComment(c.id)}>Delete</button>
      </li>
    {/each}
  </ul>
</VizelProvider>
```

:::

### Comment options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable comments |
| `storage` | `VizelCommentStorage` | `"localStorage"` | Storage backend |
| `key` | `string` | `"vizel-comments"` | Storage key for localStorage |
| `onAdd` | `(comment) => void` | — | Fires after a comment is added |
| `onRemove` | `(commentId) => void` | — | Fires after a comment is removed |
| `onResolve` | `(comment) => void` | — | Fires after a comment is resolved |
| `onReopen` | `(comment) => void` | — | Fires after a comment is reopened |
| `onError` | `(error) => void` | — | Fires on a storage error |

A custom storage backend must implement both `save` and `load`:

```ts
useVizelComment(editor, {
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

### Comment data model

```ts
interface VizelComment {
  id: string;
  text: string;
  author?: string;
  createdAt: number;
  resolved: boolean;
  replies: VizelCommentReply[];
}

interface VizelCommentReply {
  id: string;
  text: string;
  author?: string;
  createdAt: number;
}
```

### Comment return values

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `VizelComment[]` | All stored comments (newest first) |
| `activeCommentId` | `string \| null` | Currently active comment ID |
| `isLoading` | `boolean` | Whether comments are loading |
| `error` | `Error \| null` | Last error |
| `addComment(text, author?)` | `Promise<VizelComment \| null>` | Add a comment to the selection |
| `removeComment(id)` | `Promise<void>` | Remove a comment and its mark |
| `resolveComment(id)` | `Promise<boolean>` | Mark a comment as resolved |
| `reopenComment(id)` | `Promise<boolean>` | Reopen a resolved comment |
| `replyToComment(id, text, author?)` | `Promise<VizelCommentReply \| null>` | Add a reply |
| `setActiveComment(id)` | `void` | Set the active comment |
| `loadComments()` | `Promise<VizelComment[]>` | Reload from storage |
| `getCommentById(id)` | `VizelComment \| undefined` | Lookup a comment |

### Comment styling

Comment highlights ship two CSS classes that you can theme with custom
properties:

| Class | Description |
|-------|-------------|
| `.vizel-comment-marker` | Base highlight for commented text |
| `.vizel-comment-marker--active` | Highlight for the active comment |

```css
:root {
  --vizel-comment-bg: rgba(255, 212, 100, 0.3);
  --vizel-comment-border: rgba(255, 180, 50, 0.6);
  --vizel-comment-active-bg: rgba(255, 180, 50, 0.5);
  --vizel-comment-active-border: rgba(255, 150, 0, 0.8);
}
```

## Version history

Version history captures document snapshots that you can restore later.
The hook works without any feature flag because snapshots are derived
from the live editor instance.

### Quick start

::: code-group

```tsx [React]
import {
  useVizelEditor,
  useVizelVersionHistory,
  VizelProvider,
  VizelEditor,
} from "@vizel/react";

function Editor() {
  const editor = useVizelEditor({});
  const { snapshots, saveVersion, restoreVersion, deleteVersion } =
    useVizelVersionHistory(editor, {
      maxVersions: 20,
      key: "my-doc-versions",
    });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <button onClick={() => saveVersion("Manual save")}>Save Version</button>
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

```vue [Vue]
<script setup lang="ts">
import {
  useVizelEditor,
  useVizelVersionHistory,
  VizelProvider,
  VizelEditor,
} from "@vizel/vue";

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

```svelte [Svelte]
<script lang="ts">
import {
  createVizelEditor,
  createVizelVersionHistory,
  VizelProvider,
  VizelEditor,
} from "@vizel/svelte";

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

:::

### Version history options and return values

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable version history |
| `maxVersions` | `number` | `50` | Maximum number of snapshots to keep |
| `storage` | `VizelVersionStorage` | `"localStorage"` | Storage backend |
| `key` | `string` | `"vizel-versions"` | Storage key for localStorage |
| `onSave` | `(snapshot) => void` | — | Fires after a snapshot is saved |
| `onRestore` | `(snapshot) => void` | — | Fires after a snapshot is restored |
| `onError` | `(error) => void` | — | Fires on a storage error |

| Return value | Description |
|--------------|-------------|
| `snapshots` | `VizelVersionSnapshot[]` (newest first) |
| `isLoading` | Whether history is loading |
| `error` | Last error |
| `saveVersion(desc?, author?)` | Save the current state |
| `restoreVersion(id)` | Restore a version |
| `loadVersions()` | Reload from storage |
| `deleteVersion(id)` | Delete a single version |
| `clearVersions()` | Delete every version |

A snapshot carries the document content as JSON, a unique id, a Unix
timestamp, and optional description and author fields:

```ts
interface VizelVersionSnapshot {
  id: string;
  content: JSONContent;
  timestamp: number;
  description?: string;
  author?: string;
}
```

## Key concepts

1. **CRDT.** Yjs uses Conflict-free Replicated Data Types to merge
   concurrent edits without conflicts. Each client edits independently
   and Yjs merges changes automatically.
2. **Awareness.** The Yjs Awareness protocol carries ephemeral state
   like cursor positions, user names, and colors. Awareness state is
   separate from the document and is not persisted.
3. **History extension conflict.** Always set
   `features.collaboration.provider` (boolean or adapter) when Yjs is
   in play. The built-in `History` extension does not understand CRDT
   operations and conflicts with `Y.UndoManager`.
4. **Offline support.** Yjs stores edits made offline locally and
   syncs them on reconnect without data loss.

## Troubleshooting

| Symptom | Resolution |
|---------|------------|
| Undo / redo behaves unexpectedly | Set `features.collaboration.provider` (boolean or adapter) so the built-in `History` extension is disabled |
| WebSocket disconnects in production | Verify the reverse proxy supports WebSocket upgrades; check the `ws://` vs `wss://` protocol |
| Remote cursors appear without color | Pass `user.color` to both `CollaborationCursor.configure()` and the collaboration hook / composable / rune |
| Comments do not persist | Confirm the storage backend resolves both `save` and `load` |

## Try this if you want to ...

- ... configure the editor instance itself → [Editor](/guide/editor)
- ... reorder, duplicate, or delete whole blocks → [Blocks](/guide/blocks)
- ... change the Markdown flavor → [Markdown](/guide/markdown)
- ... render Markdown on the server → [SSR](/guide/ssr)
