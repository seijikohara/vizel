# @vizel/react

React 19 components and hooks for Vizel editor.

::: tip Looking for a guide?
See the [React Guide](/guide/react) for step-by-step tutorials and common patterns.
:::

## Installation

```bash
npm install @vizel/react
```

## Components

### Vizel

All-in-one editor component with built-in bubble menu. This is the recommended way to get started.

```tsx
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';

<Vizel
  initialContent={{ type: 'doc', content: [] }}
  placeholder="Start writing..."
  editable={true}
  autofocus="end"
  showBubbleMenu={true}
  enableEmbed={true}
  className="my-editor"
  features={{ markdown: true }}
  onUpdate={({ editor }) => {}}
  onCreate={({ editor }) => {}}
  onFocus={({ editor }) => {}}
  onBlur={({ editor }) => {}}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial editor content (JSON) |
| `initialMarkdown` | `string` | - | Initial editor content (Markdown) |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus behavior |
| `features` | `VizelFeatureOptions` | - | Feature configuration |
| `className` | `string` | - | CSS class name |
| `showToolbar` | `boolean` | `false` | Show fixed toolbar above editor |
| `toolbarContent` | `ReactNode` | - | Custom toolbar content |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu on selection |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |
| `onUpdate` | `({ editor }) => void` | - | Update callback |
| `onCreate` | `({ editor }) => void` | - | Create callback |
| `onDestroy` | `() => void` | - | Destroy callback |
| `onSelectionUpdate` | `({ editor }) => void` | - | Selection change callback |
| `onFocus` | `({ editor }) => void` | - | Focus callback |
| `onBlur` | `({ editor }) => void` | - | Blur callback |

---

## Hooks

### useVizelEditor

This hook creates and manages a Vizel editor instance.

```tsx
import { useVizelEditor } from '@vizel/react';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `Editor | null`

### useVizelState

This hook forces a re-render on editor state changes.

```tsx
import { useVizelState } from '@vizel/react';

const updateCount = useVizelState(() => editor);
```

**Returns:** `number` (update count)

### useVizelEditorState

This hook tracks specific editor state properties reactively.

```tsx
import { useVizelEditorState } from '@vizel/react';

const isBold = useVizelEditorState(
  () => editor,
  (editor) => editor.isActive('bold')
);
```

**Returns:** The value returned by the selector function

### useVizelAutoSave

This hook auto-saves editor content with debouncing.

```tsx
import { useVizelAutoSave } from '@vizel/react';

const result = useVizelAutoSave(
  () => editor,
  options?: VizelAutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `VizelSaveStatus` | Current save status |
| `hasUnsavedChanges` | `boolean` | Whether unsaved changes exist |
| `lastSaved` | `Date \| null` | Last save timestamp |
| `error` | `Error \| null` | Last error |
| `save` | `() => Promise<void>` | Save content manually |
| `restore` | `() => Promise<JSONContent \| null>` | Restore content manually |

### useVizelMarkdown

This hook provides two-way Markdown synchronization with debouncing.

```tsx
import { useVizelMarkdown } from '@vizel/react';

const result = useVizelMarkdown(
  () => editor,
  options?: VizelMarkdownSyncOptions
);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `transformDiagrams` | `boolean` | `true` | Transform diagram code blocks when setting markdown |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `string` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending |

### useVizelTheme

This hook accesses theme state within VizelThemeProvider.

```tsx
import { useVizelTheme } from '@vizel/react';

const { theme, resolvedTheme, systemTheme, setTheme } = useVizelTheme();
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `VizelTheme` | Current theme setting |
| `resolvedTheme` | `VizelResolvedTheme` | Resolved theme |
| `systemTheme` | `VizelResolvedTheme` | System preference |
| `setTheme` | `(theme: VizelTheme) => void` | Set theme function |

### useVizelContext

This hook accesses the editor from VizelProvider context.

```tsx
import { useVizelContext } from '@vizel/react';

const { editor } = useVizelContext();
```

### useVizelCollaboration

This hook tracks real-time collaboration state with a Yjs provider.

```tsx
import { useVizelCollaboration } from '@vizel/react';

const {
  isConnected,
  isSynced,
  peerCount,
  error,
  connect,
  disconnect,
  updateUser,
} = useVizelCollaboration(
  () => wsProvider,
  { user: { name: 'Alice', color: '#ff0000' } }
);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getProvider` | `() => VizelYjsProvider \| null \| undefined` | Getter function for the Yjs provider |
| `options` | `VizelCollaborationOptions` | Collaboration options including user info |

**Returns:** `UseVizelCollaborationResult`

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Whether the editor is connected to the server |
| `isSynced` | `boolean` | Whether initial sync is complete |
| `peerCount` | `number` | Number of connected peers |
| `error` | `Error \| null` | Last error |
| `connect` | `() => void` | Connect to the server |
| `disconnect` | `() => void` | Disconnect from the server |
| `updateUser` | `(user: VizelCollaborationUser) => void` | Update user cursor info |

### useVizelComment

This hook manages document comments and annotations.

```tsx
import { useVizelComment } from '@vizel/react';

const {
  comments,
  activeCommentId,
  isLoading,
  error,
  addComment,
  removeComment,
  resolveComment,
  reopenComment,
  replyToComment,
  setActiveComment,
  loadComments,
  getCommentById,
} = useVizelComment(() => editor, { key: 'my-comments' });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelCommentOptions` | Comment configuration options |

**Returns:** `UseVizelCommentResult`

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `VizelComment[]` | All stored comments (newest first) |
| `activeCommentId` | `string \| null` | Currently active comment ID |
| `isLoading` | `boolean` | Whether comments are loading |
| `error` | `Error \| null` | Last error |
| `addComment` | `(text: string, author?: string) => Promise<VizelComment \| null>` | Add a comment to the selection |
| `removeComment` | `(commentId: string) => Promise<void>` | Remove a comment |
| `resolveComment` | `(commentId: string) => Promise<boolean>` | Resolve a comment |
| `reopenComment` | `(commentId: string) => Promise<boolean>` | Reopen a comment |
| `replyToComment` | `(commentId: string, text: string, author?: string) => Promise<VizelCommentReply \| null>` | Reply to a comment |
| `setActiveComment` | `(commentId: string \| null) => void` | Set the active comment |
| `loadComments` | `() => Promise<VizelComment[]>` | Load comments from storage |
| `getCommentById` | `(commentId: string) => VizelComment \| undefined` | Get a comment by ID |

### useVizelVersionHistory

This hook manages document version history with save, restore, and delete operations.

```tsx
import { useVizelVersionHistory } from '@vizel/react';

const {
  snapshots,
  isLoading,
  error,
  saveVersion,
  restoreVersion,
  loadVersions,
  deleteVersion,
  clearVersions,
} = useVizelVersionHistory(() => editor, { maxVersions: 20 });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelVersionHistoryOptions` | Version history configuration |

**Returns:** `UseVizelVersionHistoryResult`

| Property | Type | Description |
|----------|------|-------------|
| `snapshots` | `VizelVersionSnapshot[]` | All stored snapshots (newest first) |
| `isLoading` | `boolean` | Whether history is loading |
| `error` | `Error \| null` | Last error |
| `saveVersion` | `(description?: string, author?: string) => Promise<VizelVersionSnapshot \| null>` | Save a new version |
| `restoreVersion` | `(versionId: string) => Promise<boolean>` | Restore a version |
| `loadVersions` | `() => Promise<VizelVersionSnapshot[]>` | Load versions from storage |
| `deleteVersion` | `(versionId: string) => Promise<void>` | Delete a version |
| `clearVersions` | `() => Promise<void>` | Delete all versions |

---

## Components

### VizelFindReplace

Find & Replace panel component. This component renders when the Find & Replace extension is open.

```tsx
import { VizelFindReplace } from '@vizel/react';

<VizelFindReplace
  editor={editor}
  className="my-find-replace"
  onClose={() => console.log('Closed')}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | CSS class name |
| `onClose` | `() => void` | - | Called when the panel closes |

### VizelEditor

This component renders the editor content area.

```tsx
import { VizelEditor } from '@vizel/react';

<VizelEditor editor={editor} className="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | CSS class name |

### VizelBubbleMenu

This component renders a floating formatting bubble menu.

```tsx
import { VizelBubbleMenu } from '@vizel/react';

<VizelBubbleMenu 
  editor={editor}
  className="my-bubble-menu"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | CSS class name |
| `children` | `ReactNode` | - | Custom content |

### VizelBubbleMenuDefault

This component renders the default bubble menu with all formatting buttons.

```tsx
import { VizelBubbleMenuDefault } from '@vizel/react';

<VizelBubbleMenuDefault 
  editor={editor}
  enableEmbed={false}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `enableEmbed` | `boolean` | `false` | Enable embed in links |

### VizelBubbleMenuButton

This component renders an individual bubble menu button.

```tsx
import { VizelBubbleMenuButton } from '@vizel/react';

<VizelBubbleMenuButton
  icon="lucide:bold"
  isActive={editor.isActive('bold')}
  onClick={() => editor.chain().focus().toggleBold().run()}
/>
```

### VizelBubbleMenuDivider

This component renders a bubble menu divider.

```tsx
import { VizelBubbleMenuDivider } from '@vizel/react';

<VizelBubbleMenuDivider />
```

### VizelToolbar

This component renders a fixed toolbar.

```tsx
import { VizelToolbar } from '@vizel/react';

<VizelToolbar editor={editor} className="my-toolbar" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance (falls back to context) |
| `className` | `string` | - | CSS class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar content |
| `children` | `ReactNode` | - | Custom toolbar content |

### VizelToolbarDefault

This component renders the default toolbar content with grouped formatting buttons.

```tsx
import { VizelToolbarDefault } from '@vizel/react';

<VizelToolbarDefault editor={editor} actions={customActions} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor` | - | Editor instance (required) |
| `className` | `string` | - | CSS class name |
| `actions` | `VizelToolbarAction[]` | `vizelDefaultToolbarActions` | Custom actions |

### VizelToolbarButton

This component renders an individual toolbar button.

```tsx
import { VizelToolbarButton } from '@vizel/react';

<VizelToolbarButton
  onClick={() => editor.chain().focus().toggleBold().run()}
  isActive={editor.isActive("bold")}
  title="Bold (Cmd+B)"
>
  <VizelIcon name="bold" />
</VizelToolbarButton>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClick` | `() => void` | - | Click handler |
| `isActive` | `boolean` | `false` | Active state |
| `disabled` | `boolean` | `false` | Disabled state |
| `children` | `ReactNode` | - | Button content |
| `title` | `string` | - | Tooltip text |
| `className` | `string` | - | CSS class name |
| `action` | `string` | - | Action identifier |

### VizelToolbarDivider

This component renders a divider between toolbar button groups.

```tsx
import { VizelToolbarDivider } from '@vizel/react';

<VizelToolbarDivider />
```

### VizelThemeProvider

This component provides theme context to its children.

```tsx
import { VizelThemeProvider } from '@vizel/react';

<VizelThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  disableTransitionOnChange={false}
>
  {children}
</VizelThemeProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `VizelTheme` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |
| `children` | `ReactNode` | - | Children |

### VizelSaveIndicator

This component displays the save status.

```tsx
import { VizelSaveIndicator } from '@vizel/react';

<VizelSaveIndicator status={status} lastSaved={lastSaved} />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `VizelSaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `className` | `string` | CSS class name |

### VizelPortal

This component renders its children in a portal.

```tsx
import { VizelPortal } from '@vizel/react';

<VizelPortal container={document.body}>{children}</VizelPortal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content to render |
| `container` | `HTMLElement` | Portal target |

### VizelColorPicker

This component renders a color selection interface.

```tsx
import { VizelColorPicker } from '@vizel/react';

<VizelColorPicker
  colors={colors}
  value={currentColor}
  onChange={setColor}
  recentColors={recentColors}
/>
```

### VizelIconProvider

This component provides custom icons for Vizel components.

```tsx
import { VizelIconProvider } from '@vizel/react';
import type { CustomIconMap } from '@vizel/core';

const icons: CustomIconMap = {
  bold: 'mdi:format-bold',
  italic: 'mdi:format-italic',
};

<VizelIconProvider icons={icons}>
  <Vizel />
</VizelIconProvider>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icons` | [`CustomIconMap`](/api/core#customiconmap) | Map of icon names to Iconify icon IDs |
| `children` | `ReactNode` | Children |

### VizelSlashMenu

This component renders the slash command menu.

```tsx
import { VizelSlashMenu } from '@vizel/react';

<VizelSlashMenu
  items={items}
  command={handleCommand}
  className="my-menu"
/>
```

---

## Utilities

### createVizelSlashMenuRenderer

This function creates a slash menu renderer for the SlashCommand extension.

```tsx
import { createVizelSlashMenuRenderer } from '@vizel/react';

const suggestion = createVizelSlashMenuRenderer();

const editor = useVizelEditor({
  features: {
    slashCommand: {
      suggestion,
    },
  },
});
```

---

## Importing from @vizel/core and @tiptap/core

Framework packages do not re-export from `@vizel/core`. You must import directly:

```tsx
// Framework-specific components and hooks
import { 
  Vizel, 
  VizelEditor, 
  VizelBubbleMenu, 
  VizelThemeProvider,
  useVizelEditor,
  useVizelMarkdown,
  useVizelAutoSave,
} from '@vizel/react';

// Vizel types and utilities from @vizel/core
import { getVizelEditorState, VIZEL_TEXT_COLORS } from '@vizel/core';
import type { VizelEditorOptions, VizelSaveStatus } from '@vizel/core';

// Tiptap types from @tiptap/core
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
```
