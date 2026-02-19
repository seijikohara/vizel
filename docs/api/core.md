# @vizel/core

Framework-agnostic core package containing Tiptap extensions, types, utilities, and styles.

## Installation

```bash
npm install @vizel/core
```

::: tip
You typically don't need to install this package directly. It's included as a dependency of `@vizel/react`, `@vizel/vue`, and `@vizel/svelte`.
:::

## Styles

### Default Styles

```typescript
import '@vizel/core/styles.css';
```

This stylesheet includes CSS variables and component styles.

### Components Only

```typescript
import '@vizel/core/components.css';
```

This stylesheet provides component styles without CSS variable definitions. Use it with custom theming or shadcn/ui.

---

## Extensions

Vizel provides pre-configured Tiptap extensions.

### createVizelExtensions

This function creates the default set of Vizel extensions.

```typescript
import { createVizelExtensions } from '@vizel/core';

const extensions = await createVizelExtensions({
  placeholder: 'Start writing...',
  features: {
    markdown: true,
    mathematics: true,
  },
});
```

### Base Extensions (Always Included)

| Extension | Description |
|-----------|-------------|
| `Document` | Document node |
| `Paragraph` | Paragraph node |
| `Text` | Text node |
| `Bold` | Bold mark |
| `Italic` | Italic mark |
| `Strike` | Strikethrough mark |
| `Underline` | Underline mark |
| `Code` | Inline code mark |
| `Heading` | H1-H6 headings |
| `BulletList` | Bullet list |
| `OrderedList` | Numbered list |
| `ListItem` | List item |
| `Blockquote` | Block quote |
| `HorizontalRule` | Horizontal divider |
| `HardBreak` | Line break |
| `History` | Undo/redo |
| `Placeholder` | Placeholder text |
| `Dropcursor` | Drop cursor |
| `Gapcursor` | Gap cursor |

### Feature Extensions

| Feature | Extensions |
|---------|------------|
| `slashCommand` | `SlashCommand` |
| `table` | `Table`, `TableRow`, `TableCell`, `TableHeader` |
| `link` | `Link` |
| `image` | `Image`, `ImageResize` |
| `codeBlock` | `CodeBlockLowlight` |
| `characterCount` | `CharacterCount` |
| `textColor` | `Color`, `Highlight` |
| `taskList` | `TaskList`, `TaskItem` |
| `dragHandle` | `DragHandle` |
| `markdown` | `Markdown` |
| `mathematics` | `Mathematics` |
| `embed` | `Embed` |
| `details` | `Details`, `DetailsContent`, `DetailsSummary` |
| `diagram` | `Diagram` |
| `wikiLink` | `WikiLink` |
| `comment` | `CommentMark` |
| `callout` | `Callout` |
| `mention` | `Mention` |
| `tableOfContents` | `TableOfContents` |
| `superscript` | `Superscript` |
| `subscript` | `Subscript` |
| `typography` | `Typography` |
| `collaboration` | Yjs extensions (`Collaboration`, `CollaborationCursor`) |

---

## Types

### VizelEditorOptions

```typescript
import type { VizelEditorOptions } from '@vizel/core';
```

See [Type Definitions](/api/types/editor) for full interface.

### VizelFeatureOptions

```typescript
import type { VizelFeatureOptions } from '@vizel/core';
```

See [Type Definitions](/api/types/features) for full interface.

### VizelMarkdownFlavor

```typescript
import type { VizelMarkdownFlavor } from '@vizel/core';

type VizelMarkdownFlavor = "commonmark" | "gfm" | "obsidian" | "docusaurus";
```

Supported Markdown output flavors. Controls how content is serialized when exporting Markdown. The default is `"gfm"`.

### VizelFlavorConfig

```typescript
import type { VizelFlavorConfig } from '@vizel/core';

interface VizelFlavorConfig {
  /** How callout/admonition blocks are serialized */
  calloutFormat: VizelCalloutMarkdownFormat;
  /** Whether wiki links are serialized as [[page]] (true) or standard links (false) */
  wikiLinkSerialize: boolean;
}
```

Flavor-specific configuration resolved from a `VizelMarkdownFlavor`. Used internally by extensions to determine how to serialize Markdown.

### VizelCalloutMarkdownFormat

```typescript
import type { VizelCalloutMarkdownFormat } from '@vizel/core';

type VizelCalloutMarkdownFormat =
  | "github-alerts"
  | "obsidian-callouts"
  | "directives"
  | "blockquote-fallback";
```

Callout/admonition output format for Markdown serialization.

### JSONContent

Tiptap's JSON content format. Import directly from `@tiptap/core`:

```typescript
import type { JSONContent } from '@tiptap/core';

const content: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }
  ],
};
```

### VizelSaveStatus

```typescript
import type { VizelSaveStatus } from '@vizel/core';

type VizelSaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
```

### Theme Types

```typescript
import type { VizelTheme, VizelResolvedTheme } from '@vizel/core';

type VizelTheme = 'light' | 'dark' | 'system';
type VizelResolvedTheme = 'light' | 'dark';
```

---

## Utilities

### resolveVizelFeatures

This function resolves feature options to extension configuration.

```typescript
import { resolveVizelFeatures } from '@vizel/core';

const resolved = resolveVizelFeatures({
  features: {
    markdown: true,
    mathematics: { katexOptions: { strict: false } },
  },
  createSlashMenuRenderer: mySlashMenuRenderer,
});
```

### resolveVizelFlavorConfig

This function resolves flavor-specific configuration from a Markdown flavor name.

```typescript
import { resolveVizelFlavorConfig } from '@vizel/core';

const config = resolveVizelFlavorConfig('obsidian');
// config.calloutFormat === "obsidian-callouts"
// config.wikiLinkSerialize === true

// Defaults to "gfm" when called without arguments
const defaultConfig = resolveVizelFlavorConfig();
// defaultConfig.calloutFormat === "github-alerts"
// defaultConfig.wikiLinkSerialize === false
```

### getVizelEditorState

This function returns the current editor state.

```typescript
import { getVizelEditorState } from '@vizel/core';

const state = getVizelEditorState(editor);
// {
//   isFocused: boolean,
//   isEmpty: boolean,
//   canUndo: boolean,
//   canRedo: boolean,
//   characterCount: number,
//   wordCount: number,
// }
```

### formatVizelRelativeTime

This function formats a date as relative time.

```typescript
import { formatVizelRelativeTime } from '@vizel/core';

formatVizelRelativeTime(new Date(Date.now() - 60000));
// "1m ago"
```

---

## Theme Utilities

### getVizelSystemTheme

This function returns the system color scheme preference.

```typescript
import { getVizelSystemTheme } from '@vizel/core';

const theme = getVizelSystemTheme();
// 'light' | 'dark'
```

### resolveVizelTheme

This function resolves a theme setting to an actual theme value.

```typescript
import { resolveVizelTheme } from '@vizel/core';

resolveVizelTheme('system', 'dark');
// 'dark'
```

### applyVizelTheme

This function applies a theme to the DOM.

```typescript
import { applyVizelTheme } from '@vizel/core';

applyVizelTheme('dark', 'html');
```

### getVizelThemeInitScript

This function returns an inline script that prevents flash of unstyled content.

```typescript
import { getVizelThemeInitScript } from '@vizel/core';

const script = getVizelThemeInitScript('my-theme-key');
// Include in <head>
```

---

## Image Utilities

### createVizelImageUploader

This function creates an image upload handler.

```typescript
import { createVizelImageUploader } from '@vizel/core';

const upload = createVizelImageUploader({
  onUpload: async (file) => {
    // Upload file
    return 'https://example.com/image.png';
  },
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});
```

### validateVizelImageFile

This function validates an image file against size and type constraints.

```typescript
import { validateVizelImageFile } from '@vizel/core';

const result = validateVizelImageFile(file, {
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});

if (!result.valid) {
  console.error(result.error);
}
```

---

## Color Utilities

### getVizelRecentColors

This function retrieves recent colors from localStorage.

```typescript
import { getVizelRecentColors } from '@vizel/core';

const colors = getVizelRecentColors('text');
// ['#ff0000', '#00ff00', ...]
```

### addVizelRecentColor

This function adds a color to the recent colors list.

```typescript
import { addVizelRecentColor } from '@vizel/core';

addVizelRecentColor('text', '#ff0000');
```

---

## Embed Utilities

### detectVizelEmbedProvider

This function detects the oEmbed provider from a URL.

```typescript
import { detectVizelEmbedProvider } from '@vizel/core';

const provider = detectVizelEmbedProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// { name: 'YouTube', ... }
```

---

## Constants

### VIZEL_DEFAULT_FLAVOR

This constant defines the default Markdown output flavor.

```typescript
import { VIZEL_DEFAULT_FLAVOR } from '@vizel/core';
// "gfm"
```

### VIZEL_TEXT_COLORS

This constant defines the default text color palette.

```typescript
import { VIZEL_TEXT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### VIZEL_HIGHLIGHT_COLORS

This constant defines the default highlight color palette.

```typescript
import { VIZEL_HIGHLIGHT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### vizelDefaultEmbedProviders

This constant defines the default oEmbed providers.

```typescript
import { vizelDefaultEmbedProviders } from '@vizel/core';
// YouTube, Vimeo, Twitter, etc.
```

---

## Toolbar

### VizelToolbarAction

Type definition for a toolbar action.

```typescript
import type { VizelToolbarAction } from '@vizel/core';

interface VizelToolbarAction {
  id: string;
  label: string;
  icon: VizelIconName;
  group: string;
  isActive: (editor: Editor) => boolean;
  isEnabled: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  shortcut?: string;
}
```

### VizelToolbarDropdownAction

Type definition for a dropdown toolbar action that groups multiple sub-actions.

```typescript
import type { VizelToolbarDropdownAction } from '@vizel/core';

interface VizelToolbarDropdownAction {
  id: string;
  label: string;
  icon: VizelIconName;
  group: string;
  type: 'dropdown';
  options: VizelToolbarAction[];
  getActiveOption?: (editor: Editor) => VizelToolbarAction | undefined;
}
```

### VizelToolbarActionItem

Union type for any toolbar item — either a simple action or a dropdown.

```typescript
import type { VizelToolbarActionItem } from '@vizel/core';

type VizelToolbarActionItem = VizelToolbarAction | VizelToolbarDropdownAction;
```

### isVizelToolbarDropdownAction

Type guard to check if a toolbar item is a dropdown action.

```typescript
import { isVizelToolbarDropdownAction } from '@vizel/core';

if (isVizelToolbarDropdownAction(action)) {
  // action is VizelToolbarDropdownAction
  action.options.forEach(opt => /* ... */);
}
```

### vizelDefaultToolbarActions

This constant provides the default toolbar actions including undo/redo, formatting, headings, lists, and blocks.

```typescript
import { vizelDefaultToolbarActions } from '@vizel/core';
// Array of VizelToolbarAction
```

**Default groups:** `history`, `format`, `heading`, `list`, `block`

### groupVizelToolbarActions

This function groups toolbar actions by their `group` property for rendering with dividers. Supports both simple actions and dropdown actions.

```typescript
import { groupVizelToolbarActions } from '@vizel/core';

const groups = groupVizelToolbarActions(actions);
// VizelToolbarActionItem[][] - each sub-array is a group
```

---

## Find & Replace

A standalone Tiptap extension for text search and replacement within the editor. This extension is not included in `createVizelExtensions()` — you add it manually.

### createVizelFindReplaceExtension

This function creates the Find & Replace extension.

```typescript
import { createVizelFindReplaceExtension } from '@vizel/core';

const findReplace = createVizelFindReplaceExtension({
  caseSensitive: false,
  onResultsChange: ({ total, current }) => {
    console.log(`Match ${current} of ${total}`);
  },
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `caseSensitive` | `boolean` | `false` | Enable case-sensitive search |
| `onResultsChange` | `(results: { total: number; current: number }) => void` | — | Called when search results change |

### Editor Commands

The extension registers the following commands on the editor:

| Command | Parameters | Description |
|---------|-----------|-------------|
| `openFindReplace` | `mode?: 'find' \| 'replace'` | Open the Find & Replace panel |
| `closeFindReplace` | — | Close the panel |
| `find` | `query: string` | Search for text in the document |
| `findNext` | — | Navigate to the next match |
| `findPrevious` | — | Navigate to the previous match |
| `replace` | `text: string` | Replace the current match |
| `replaceAll` | `text: string` | Replace all matches |
| `setFindCaseSensitive` | `caseSensitive: boolean` | Toggle case-sensitive search |
| `clearFind` | — | Clear the search state |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Mod-f` | Open Find panel |
| `Mod-Shift-h` | Open Replace panel |

### getVizelFindReplaceState

This function returns the current Find & Replace plugin state from the editor.

```typescript
import { getVizelFindReplaceState } from '@vizel/core';

const state = getVizelFindReplaceState(editor.state);
// {
//   query: string,
//   matches: VizelFindMatch[],
//   activeIndex: number,
//   caseSensitive: boolean,
//   isOpen: boolean,
//   mode: 'find' | 'replace',
// }
```

### Types

```typescript
import type {
  VizelFindReplaceOptions,
  VizelFindReplaceState,
  VizelFindMatch,
} from '@vizel/core';

import { vizelFindReplacePluginKey } from '@vizel/core';
```

| Type | Description |
|------|-------------|
| `VizelFindReplaceOptions` | Configuration options for the extension |
| `VizelFindReplaceState` | Plugin state containing query, matches, activeIndex, and more |
| `VizelFindMatch` | Single match with `from` and `to` positions |
| `vizelFindReplacePluginKey` | ProseMirror `PluginKey` for accessing the plugin state |

---

## Wiki Link

A mark extension for wiki-style `[[page-name]]` links. Supports display text aliases with `[[page-name|display text]]` syntax.

### createVizelWikiLinkExtension

This function creates a configured Wiki Link extension.

```typescript
import { createVizelWikiLinkExtension } from '@vizel/core';

const wikiLink = createVizelWikiLinkExtension({
  resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
  pageExists: (page) => knownPages.has(page),
  onLinkClick: (page, event) => {
    event.preventDefault();
    router.push(`/wiki/${page}`);
  },
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `resolveLink` | `(pageName: string) => string` | `(p) => '#' + p` | Resolve a page name to a URL |
| `pageExists` | `(pageName: string) => boolean` | `() => true` | Check whether a page exists (for visual differentiation) |
| `getPageSuggestions` | `(query: string) => VizelWikiLinkSuggestion[]` | — | Return autocomplete suggestions |
| `onLinkClick` | `(pageName: string, event: MouseEvent) => void` | — | Called when a wiki link is clicked |
| `existingClass` | `string` | `'vizel-wiki-link--existing'` | CSS class for existing page links |
| `newClass` | `string` | `'vizel-wiki-link--new'` | CSS class for non-existing page links |
| `HTMLAttributes` | `Record<string, unknown>` | `{}` | Additional HTML attributes |

### Editor Commands

| Command | Parameters | Description |
|---------|-----------|-------------|
| `setWikiLink` | `pageName: string, displayText?: string` | Insert a wiki link at the current position |
| `unsetWikiLink` | — | Remove the wiki link mark from the selection |

### Types

```typescript
import type { VizelWikiLinkOptions, VizelWikiLinkSuggestion } from '@vizel/core';
import { VizelWikiLink, vizelWikiLinkPluginKey } from '@vizel/core';
```

| Type | Description |
|------|-------------|
| `VizelWikiLinkOptions` | Configuration options for the extension |
| `VizelWikiLinkSuggestion` | Page suggestion with `name` and optional `label` |
| `VizelWikiLink` | Tiptap Mark extension class |
| `vizelWikiLinkPluginKey` | ProseMirror `PluginKey` for the wiki link plugin |

---

## Comments

Comment management module for adding, resolving, and replying to text annotations. This module provides a handler factory pattern with pluggable storage backends.

### createVizelCommentHandlers

This function creates comment handler methods for an editor.

```typescript
import { createVizelCommentHandlers } from '@vizel/core';
import type { VizelCommentState } from '@vizel/core';

const handlers = createVizelCommentHandlers(
  () => editor,
  {
    storage: 'localStorage',
    key: 'my-comments',
    onAdd: (comment) => console.log('Added:', comment.id),
  },
  (partial) => setState((prev) => ({ ...prev, ...partial }))
);

// Add a comment to the current text selection
await handlers.addComment('Needs clarification', 'Alice');

// Resolve a comment
await handlers.resolveComment(commentId);

// Reply to a comment
await handlers.replyToComment(commentId, 'Fixed in latest commit', 'Bob');
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor instance |
| `options` | `VizelCommentOptions` | Configuration options |
| `onStateChange` | `(state: Partial<VizelCommentState>) => void` | Callback to update reactive state |

#### Return Value

| Method | Signature | Description |
|--------|-----------|-------------|
| `addComment` | `(text: string, author?: string) => Promise<VizelComment \| null>` | Add a comment to the current selection |
| `removeComment` | `(commentId: string) => Promise<void>` | Remove a comment and its mark |
| `resolveComment` | `(commentId: string) => Promise<boolean>` | Mark a comment as resolved |
| `reopenComment` | `(commentId: string) => Promise<boolean>` | Reopen a resolved comment |
| `replyToComment` | `(commentId: string, text: string, author?: string) => Promise<VizelCommentReply \| null>` | Add a reply to a comment |
| `setActiveComment` | `(commentId: string \| null) => void` | Set the currently active comment |
| `loadComments` | `() => Promise<VizelComment[]>` | Load all comments from storage |
| `getCommentById` | `(commentId: string) => VizelComment \| undefined` | Get a comment by its ID |

### getVizelCommentStorageBackend

This function creates a normalized storage backend from the storage option.

```typescript
import { getVizelCommentStorageBackend } from '@vizel/core';

const backend = getVizelCommentStorageBackend('localStorage', 'my-comments');
const comments = await backend.load();
await backend.save(comments);
```

### Comment Extension

This extension adds a mark to the editor for highlighting commented text.

```typescript
import { createVizelCommentExtension } from '@vizel/core';

const commentExtension = createVizelCommentExtension();
```

### Types

```typescript
import type {
  VizelComment,
  VizelCommentReply,
  VizelCommentState,
  VizelCommentOptions,
  VizelCommentStorage,
} from '@vizel/core';

import {
  VIZEL_DEFAULT_COMMENT_OPTIONS,
  vizelCommentPluginKey,
} from '@vizel/core';
```

| Type | Description |
|------|-------------|
| `VizelComment` | Comment annotation with id, text, author, createdAt, resolved, replies |
| `VizelCommentReply` | Reply with id, text, author, createdAt |
| `VizelCommentState` | State object containing comments, activeCommentId, isLoading, error |
| `VizelCommentOptions` | Configuration for enabled, storage, key, and event callbacks |
| `VizelCommentStorage` | `'localStorage'` or custom `{ save, load }` backend |

---

## Version History

Version history module for saving, restoring, and managing document snapshots. This module uses the same handler factory pattern and pluggable storage backends as Comments.

### createVizelVersionHistoryHandlers

This function creates version history handler methods for an editor.

```typescript
import { createVizelVersionHistoryHandlers } from '@vizel/core';
import type { VizelVersionHistoryState } from '@vizel/core';

const handlers = createVizelVersionHistoryHandlers(
  () => editor,
  {
    maxVersions: 20,
    storage: 'localStorage',
    onSave: (snapshot) => console.log('Saved version:', snapshot.id),
  },
  (partial) => setState((prev) => ({ ...prev, ...partial }))
);

// Save the current document state
await handlers.saveVersion('Initial draft', 'Alice');

// List all versions
const versions = await handlers.loadVersions();

// Restore a specific version
await handlers.restoreVersion(versions[0].id);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor instance |
| `options` | `VizelVersionHistoryOptions` | Configuration options |
| `onStateChange` | `(state: Partial<VizelVersionHistoryState>) => void` | Callback to update reactive state |

#### Return Value

| Method | Signature | Description |
|--------|-----------|-------------|
| `saveVersion` | `(description?: string, author?: string) => Promise<VizelVersionSnapshot \| null>` | Save the current document as a new version |
| `restoreVersion` | `(versionId: string) => Promise<boolean>` | Restore the document to a specific version |
| `loadVersions` | `() => Promise<VizelVersionSnapshot[]>` | Load all versions from storage |
| `deleteVersion` | `(versionId: string) => Promise<void>` | Delete a specific version |
| `clearVersions` | `() => Promise<void>` | Delete all versions |

### getVizelVersionStorageBackend

This function creates a normalized storage backend from the storage option.

```typescript
import { getVizelVersionStorageBackend } from '@vizel/core';

const backend = getVizelVersionStorageBackend('localStorage', 'my-versions');
const snapshots = await backend.load();
await backend.save(snapshots);
```

### Types

```typescript
import type {
  VizelVersionSnapshot,
  VizelVersionHistoryState,
  VizelVersionHistoryOptions,
  VizelVersionStorage,
} from '@vizel/core';

import { VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS } from '@vizel/core';
```

| Type | Description |
|------|-------------|
| `VizelVersionSnapshot` | Snapshot with id, content (JSONContent), timestamp, description, author |
| `VizelVersionHistoryState` | State object containing snapshots, isLoading, error |
| `VizelVersionHistoryOptions` | Configuration for enabled, maxVersions, storage, key, and callbacks |
| `VizelVersionStorage` | `'localStorage'` or custom `{ save, load }` backend |

#### Default Options

```typescript
VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS = {
  enabled: true,
  maxVersions: 50,
  storage: 'localStorage',
  key: 'vizel-versions',
};
```

---

## Collaboration

Real-time multi-user editing module built on Yjs. This module provides types, state management, and lifecycle utilities for integrating Yjs-based collaboration.

::: warning
You must install your own compatible versions of `yjs`, a Yjs provider (e.g. `y-websocket`), `@tiptap/extension-collaboration`, and `@tiptap/extension-collaboration-cursor`.
:::

### createVizelCollaborationHandlers

This function creates collaboration handler methods for tracking provider state and managing lifecycle.

```typescript
import { createVizelCollaborationHandlers } from '@vizel/core';
import type { VizelCollaborationState } from '@vizel/core';

const handlers = createVizelCollaborationHandlers(
  () => wsProvider,
  {
    user: { name: 'Alice', color: '#ff0000' },
    onConnect: () => console.log('Connected'),
    onPeersChange: (count) => console.log('Peers:', count),
  },
  (partial) => setState((prev) => ({ ...prev, ...partial }))
);

// Start listening to provider events
const unsubscribe = handlers.subscribe();

// Connect to the server
handlers.connect();

// Later, clean up
unsubscribe();
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `getProvider` | `() => VizelYjsProvider \| null \| undefined` | Getter function for the Yjs provider |
| `options` | `VizelCollaborationOptions` | Collaboration options including user info |
| `onStateChange` | `(state: Partial<VizelCollaborationState>) => void` | Callback to update reactive state |

#### Return Value

| Method | Signature | Description |
|--------|-----------|-------------|
| `connect` | `() => void` | Connect to the collaboration server |
| `disconnect` | `() => void` | Disconnect from the server |
| `updateUser` | `(user: VizelCollaborationUser) => void` | Update the current user's cursor information |
| `subscribe` | `() => () => void` | Subscribe to provider events; returns an unsubscribe function |

### Types

```typescript
import type {
  VizelCollaborationUser,
  VizelCollaborationOptions,
  VizelCollaborationState,
  VizelYjsProvider,
  VizelYjsAwareness,
} from '@vizel/core';

import { VIZEL_DEFAULT_COLLABORATION_OPTIONS } from '@vizel/core';
```

| Type | Description |
|------|-------------|
| `VizelCollaborationUser` | User info with `name` and `color` |
| `VizelCollaborationOptions` | Configuration for enabled, user, and event callbacks |
| `VizelCollaborationState` | State containing isConnected, isSynced, peerCount, error |
| `VizelYjsProvider` | Interface matching the Yjs WebSocket provider API |
| `VizelYjsAwareness` | Interface matching the Yjs Awareness API |

#### VizelCollaborationOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable collaboration tracking |
| `user` | `VizelCollaborationUser` | — | Current user info for cursor display (required) |
| `onConnect` | `() => void` | — | Called when connected |
| `onDisconnect` | `() => void` | — | Called when disconnected |
| `onSynced` | `() => void` | — | Called when initial document sync completes |
| `onError` | `(error: Error) => void` | — | Called when an error occurs |
| `onPeersChange` | `(count: number) => void` | — | Called when the number of connected peers changes |

---

## Plugin System

A plugin architecture for extending Vizel with third-party functionality. The plugin system supports dependency resolution, lifecycle hooks, style injection, and transaction handling.

### VizelPluginManager

The main class for managing plugins.

```typescript
import { VizelPluginManager } from '@vizel/core';
import type { VizelPlugin } from '@vizel/core';

const manager = new VizelPluginManager();

// Register a plugin
manager.register(myPlugin);

// Pass plugin extensions to the editor
const editor = useVizelEditor({
  extensions: manager.getExtensions(),
});

// Connect the editor to enable lifecycle hooks
if (editor) manager.setEditor(editor);

// Clean up
manager.destroy();
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(plugin: VizelPlugin) => void` | Register a plugin (validates, injects styles, calls `onInstall` if the editor is connected) |
| `unregister` | `(pluginName: string) => void` | Unregister a plugin (checks dependents, removes styles, calls `onUninstall`) |
| `setEditor` | `(editor: Editor) => void` | Connect an editor instance and call `onInstall` on all plugins |
| `destroy` | `() => void` | Disconnect the editor and clean up all plugins |
| `getExtensions` | `() => Extensions` | Return aggregated extensions from all plugins in dependency order |
| `getPlugin` | `(name: string) => VizelPlugin \| undefined` | Get a registered plugin by name |
| `listPlugins` | `() => VizelPlugin[]` | List all registered plugins |
| `hasPlugin` | `(name: string) => boolean` | Check whether a plugin is registered |

### VizelPlugin Interface

```typescript
import type { VizelPlugin } from '@vizel/core';

const myPlugin: VizelPlugin = {
  name: 'my-vizel-plugin',
  version: '1.0.0',
  description: 'Adds cool feature to Vizel',
  extensions: [MyExtension],
  styles: '.my-plugin { color: red; }',
  dependencies: ['other-plugin'],
  onInstall: (editor) => console.log('Installed'),
  onUninstall: (editor) => console.log('Uninstalled'),
  onTransaction: ({ editor, transaction }) => { /* handle transaction */ },
};
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier (kebab-case) |
| `version` | `string` | Yes | Semver version (e.g. `'1.0.0'`) |
| `description` | `string` | No | Human-readable description |
| `extensions` | `Extensions` | No | Tiptap extensions to add |
| `styles` | `string` | No | CSS styles to inject |
| `onInstall` | `(editor: Editor) => void` | No | Called when the editor installs the plugin |
| `onUninstall` | `(editor: Editor) => void` | No | Called when the editor uninstalls the plugin |
| `onTransaction` | `(props: { editor: Editor; transaction: Transaction }) => void` | No | Called on each editor transaction |
| `dependencies` | `string[]` | No | Plugin names that you must register first |

### validateVizelPlugin

This function validates a plugin's required fields and format. It throws a descriptive error if validation fails.

```typescript
import { validateVizelPlugin } from '@vizel/core';

validateVizelPlugin(myPlugin); // throws if invalid
```

### resolveVizelPluginDependencies

This function resolves plugin dependencies via topological sort. It throws if it detects a circular dependency or a missing dependency.

```typescript
import { resolveVizelPluginDependencies } from '@vizel/core';

const ordered = resolveVizelPluginDependencies(plugins);
// Returns plugins in dependency-first order
```

---

## Importing from Tiptap

For convenience, `@vizel/core` re-exports commonly used Tiptap types and classes: `Editor`, `Extensions`, `JSONContent`, `BubbleMenuPlugin`, `SuggestionOptions`, and `SuggestionProps`. You can import them from either `@vizel/core` or directly from `@tiptap/core`:

```typescript
// Option 1: Import from @vizel/core (convenience re-exports)
import { createVizelExtensions, getVizelEditorState } from '@vizel/core';
import type { Editor, JSONContent, Extensions, VizelEditorOptions } from '@vizel/core';

// Option 2: Import Tiptap types directly
import type { Editor, JSONContent, Extensions } from '@tiptap/core';
```

For types not re-exported by Vizel, import them directly from the relevant `@tiptap/*` package.

---

## Next Steps

- [CSS Variables](/api/css-variables/)
- [Type Definitions](/api/types/)
- [React API](/api/react) - React-specific APIs
- [Vue API](/api/vue) - Vue-specific APIs
- [Svelte API](/api/svelte) - Svelte-specific APIs
- [Wiki Links Guide](/guide/wiki-links) - Wiki link usage guide
- [Comments Guide](/guide/comments) - Comment management guide
- [Version History Guide](/guide/version-history) - Version history guide
- [Collaboration Guide](/guide/collaboration) - Real-time collaboration guide
- [Plugins Guide](/guide/plugins) - Plugin system guide
