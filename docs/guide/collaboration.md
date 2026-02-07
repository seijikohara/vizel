# Real-Time Collaboration

Vizel supports real-time collaborative editing using [Yjs](https://yjs.dev/), a CRDT-based framework that enables multiple users to edit the same document simultaneously without conflicts.

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client A   │     │   Client B   │     │   Client C   │
│  (Vizel +    │     │  (Vizel +    │     │  (Vizel +    │
│   Yjs)       │     │   Yjs)       │     │   Yjs)       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────┬───────┴────────────────────┘
                    │
            ┌───────▼───────┐
            │  Yjs Server   │
            │ (y-websocket) │
            └───────────────┘
```

Vizel provides:
- **History exclusion** — Automatically disables the built-in History extension when collaboration is enabled (Yjs provides its own undo manager)
- **State tracking** — Framework hooks/composables/runes for tracking connection status, sync state, and peer count
- **Lifecycle management** — Automatic setup and cleanup of event listeners

## Prerequisites

Install the required peer dependencies:

```bash
npm install yjs y-websocket @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

::: warning Version Compatibility
Ensure your `@tiptap/extension-collaboration` version is compatible with the `@tiptap/core` version used by Vizel. Check the [Tiptap documentation](https://tiptap.dev/) for version requirements.
:::

## Setup

### 1. Start a Yjs WebSocket Server

You need a Yjs-compatible WebSocket server for synchronization. The simplest option is `y-websocket`:

```bash
npx y-websocket
```

This starts a server on `ws://localhost:1234`. For production, see [Server Setup](#server-setup) below.

### 2. Configure the Editor

::: code-group

```tsx [React]
import { useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import {
  Vizel,
  useVizelEditor,
  useVizelCollaboration,
} from "@vizel/react";

function CollaborativeEditor() {
  const user = { name: "Alice", color: "#ff0000" };

  // Create Yjs document and WebSocket provider
  const [doc] = useState(() => new Y.Doc());
  const [provider] = useState(
    () => new WebsocketProvider("ws://localhost:1234", "my-document", doc)
  );

  // Track collaboration state
  const { isConnected, isSynced, peerCount } = useVizelCollaboration(
    () => provider,
    { user }
  );

  // Create editor with collaboration enabled
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
        <span>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</span>
        <span>{isSynced ? "Synced" : "Syncing..."}</span>
        <span>{peerCount} peer(s)</span>
      </div>
      <Vizel editor={editor} />
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
  Vizel,
  useVizelEditor,
  useVizelCollaboration,
} from "@vizel/vue";

const user = { name: "Alice", color: "#ff0000" };

// Create Yjs document and WebSocket provider
const doc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "my-document",
  doc
);

// Track collaboration state
const { isConnected, isSynced, peerCount } = useVizelCollaboration(
  () => provider,
  { user }
);

// Create editor with collaboration enabled
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
      <span>{{ isConnected ? "🟢 Connected" : "🔴 Disconnected" }}</span>
      <span>{{ isSynced ? "Synced" : "Syncing..." }}</span>
      <span>{{ peerCount }} peer(s)</span>
    </div>
    <Vizel :editor="editor" />
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
  Vizel,
  createVizelEditor,
  createVizelCollaboration,
} from "@vizel/svelte";

const user = { name: "Alice", color: "#ff0000" };

// Create Yjs document and WebSocket provider
const doc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "my-document",
  doc
);

// Track collaboration state
const collab = createVizelCollaboration(
  () => provider,
  { user }
);

// Create editor with collaboration enabled
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
    <span>{collab.isConnected ? "🟢 Connected" : "🔴 Disconnected"}</span>
    <span>{collab.isSynced ? "Synced" : "Syncing..."}</span>
    <span>{collab.peerCount} peer(s)</span>
  </div>
  <Vizel editor={editor.current} />
</div>
```

:::

## API Reference

### Options

The collaboration hooks accept these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable collaboration state tracking |
| `user` | `{ name, color }` | Required | Current user info for cursor display |
| `onConnect` | `() => void` | — | Callback when connected to server |
| `onDisconnect` | `() => void` | — | Callback when disconnected |
| `onSynced` | `() => void` | — | Callback when initial sync completes |
| `onError` | `(error) => void` | — | Callback when an error occurs |
| `onPeersChange` | `(count) => void` | — | Callback when peer count changes |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Whether connected to the server |
| `isSynced` | `boolean` | Whether initial document sync is complete |
| `peerCount` | `number` | Number of connected peers (including self) |
| `error` | `Error \| null` | Last error that occurred |
| `connect()` | `() => void` | Connect to the server |
| `disconnect()` | `() => void` | Disconnect from the server |
| `updateUser()` | `(user) => void` | Update cursor information |

### Feature Flag

Setting `features.collaboration` to `true` in the editor options disables the built-in History extension. This is necessary because Yjs provides its own undo/redo mechanism through `Y.UndoManager`.

```ts
const editor = useVizelEditor({
  features: {
    collaboration: true, // Disables History extension
  },
});
```

## Key Concepts

### How Collaboration Works

1. **CRDT (Conflict-free Replicated Data Type)** — Yjs uses CRDTs to merge concurrent edits without conflicts. Each client can edit independently, and changes are automatically merged.

2. **Awareness** — Yjs Awareness protocol tracks ephemeral state like cursor positions, user names, and colors. This is separate from the document and is not persisted.

3. **History** — When collaboration is enabled, the built-in Tiptap History extension must be disabled because Yjs provides `Y.UndoManager` which understands CRDT operations. The standard History extension would conflict with collaborative edits.

### Offline Support

Yjs automatically handles offline scenarios:
- Edits made offline are stored locally
- When reconnecting, changes are automatically synced and merged
- No data loss occurs even with extended offline periods

## Server Setup

### Development Server

For local development, use the built-in `y-websocket` server:

```bash
npx y-websocket
```

### Production Server

For production deployments, create a custom server:

```js
// server.js
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const wss = new WebSocketServer({ port: 1234 });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
});

console.log("Yjs WebSocket server running on ws://localhost:1234");
```

### Persistence

To persist documents on the server, use `y-websocket` with LevelDB:

```bash
HOST=0.0.0.0 PORT=1234 YPERSISTENCE=./yjs-docs npx y-websocket
```

Or configure persistence programmatically:

```js
import { LeveldbPersistence } from "y-leveldb";

const persistence = new LeveldbPersistence("./yjs-docs");
// Pass to y-websocket server configuration
```

### Alternative Providers

Yjs supports multiple transport providers:

| Provider | Package | Use Case |
|----------|---------|----------|
| WebSocket | `y-websocket` | Standard server-client setup |
| WebRTC | `y-webrtc` | Peer-to-peer, no server needed |
| Hocuspocus | `@hocuspocus/provider` | Feature-rich, authentication support |

## Troubleshooting

### History Extension Conflict

**Problem**: Undo/redo behaves unexpectedly with collaboration enabled.

**Solution**: Ensure `features.collaboration` is set to `true` in your editor options. This disables the built-in History extension that conflicts with Yjs's undo manager.

### Connection Issues

**Problem**: WebSocket connection fails or keeps disconnecting.

**Solution**:
1. Verify the WebSocket server is running
2. Check that the server URL is correct (including protocol `ws://` or `wss://`)
3. For production, ensure your reverse proxy supports WebSocket connections
4. Check CORS settings if the server is on a different origin

### Cursor Colors Not Showing

**Problem**: Remote cursors appear but without colors.

**Solution**: Ensure you pass the `user` object with both `name` and `color` properties to both `CollaborationCursor.configure()` and the collaboration hook.
