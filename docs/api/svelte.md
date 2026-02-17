# @vizel/svelte

Svelte 5 components and runes for Vizel editor.

::: tip Looking for a guide?
See the [Svelte Guide](/guide/svelte) for step-by-step tutorials and common patterns.
:::

## Installation

```bash
npm install @vizel/svelte
```

## Components

### Vizel

All-in-one editor component with built-in bubble menu. This is the recommended way to get started.

```svelte
<script lang="ts">
  import { Vizel } from '@vizel/svelte';
  import '@vizel/core/styles.css';
</script>

<Vizel
  initialContent={{ type: 'doc', content: [] }}
  placeholder="Start writing..."
  editable={true}
  autofocus="end"
  showBubbleMenu={true}
  enableEmbed={true}
  class="my-editor"
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
| `bind:markdown` | `string` | - | Two-way Markdown binding |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus behavior |
| `features` | `VizelFeatureOptions` | - | Feature configuration |
| `class` | `string` | - | CSS class name |
| `showToolbar` | `boolean` | `false` | Show fixed toolbar above editor |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu on selection |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |
| `onUpdate` | `({ editor }) => void` | - | Update callback |
| `onCreate` | `({ editor }) => void` | - | Create callback |
| `onDestroy` | `() => void` | - | Destroy callback |
| `onSelectionUpdate` | `({ editor }) => void` | - | Selection change callback |
| `onFocus` | `({ editor }) => void` | - | Focus callback |
| `onBlur` | `({ editor }) => void` | - | Blur callback |

---

## Runes

### createVizelEditor

This rune creates and manages a Vizel editor instance.

```typescript
import { createVizelEditor } from '@vizel/svelte';

const editor = createVizelEditor(options?: VizelEditorOptions);
// Access: editor.current
```

**Returns:** `{ current: Editor | null }`

### createVizelState

This rune forces a re-render on editor state changes.

```typescript
import { createVizelState } from '@vizel/svelte';

const state = createVizelState(getEditor: () => Editor | null);
// Access: state.current (update count)
```

**Returns:** `{ readonly current: number }`

### createVizelAutoSave

This rune auto-saves editor content with debouncing.

```typescript
import { createVizelAutoSave } from '@vizel/svelte';

const autoSave = createVizelAutoSave(
  getEditor: () => Editor | null,
  options?: VizelAutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `VizelSaveStatus` | Current save status (reactive) |
| `hasUnsavedChanges` | `boolean` | Whether unsaved changes exist (reactive) |
| `lastSaved` | `Date \| null` | Last save timestamp (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `save` | `() => Promise<void>` | Save content manually |
| `restore` | `() => Promise<JSONContent \| null>` | Restore content manually |

### createVizelMarkdown

This rune provides two-way Markdown synchronization with debouncing.

```typescript
import { createVizelMarkdown } from '@vizel/svelte';

const md = createVizelMarkdown(
  getEditor: () => Editor | null,
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
| `markdown` | `string` | Current Markdown content (reactive) |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending (reactive) |

### getVizelTheme

This rune accesses theme state within VizelThemeProvider context.

```typescript
import { getVizelTheme } from '@vizel/svelte';

const theme = getVizelTheme();
// Access: theme.theme, theme.resolvedTheme, theme.setTheme()
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `VizelTheme` | Current theme setting (reactive) |
| `resolvedTheme` | `VizelResolvedTheme` | Resolved theme (reactive) |
| `systemTheme` | `VizelResolvedTheme` | System preference (reactive) |
| `setTheme` | `(theme: VizelTheme) => void` | Set theme function |

### createVizelCollaboration

This rune tracks real-time collaboration state with a Yjs provider.

```typescript
import { createVizelCollaboration } from '@vizel/svelte';

const collab = createVizelCollaboration(
  () => provider,
  { user: { name: 'Alice', color: '#ff0000' } }
);

// Access reactive state
// collab.isConnected, collab.peerCount
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getProvider` | `() => VizelYjsProvider \| null \| undefined` | Getter function for the Yjs provider |
| `options` | `VizelCollaborationOptions` | Collaboration options including user info |

**Returns:** `CreateVizelCollaborationResult`

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Whether the editor is connected to the server (reactive) |
| `isSynced` | `boolean` | Whether initial sync is complete (reactive) |
| `peerCount` | `number` | Number of connected peers (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `connect` | `() => void` | Connect to the server |
| `disconnect` | `() => void` | Disconnect from the server |
| `updateUser` | `(user: VizelCollaborationUser) => void` | Update user cursor info |

### createVizelComment

This rune manages document comments and annotations.

```typescript
import { createVizelComment } from '@vizel/svelte';

const comment = createVizelComment(
  () => editor.current,
  { key: 'my-comments' }
);

// Access reactive state
// comment.comments, comment.activeCommentId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelCommentOptions` | Comment configuration options |

**Returns:** `CreateVizelCommentResult`

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `VizelComment[]` | All stored comments (newest first, reactive) |
| `activeCommentId` | `string \| null` | Currently active comment ID (reactive) |
| `isLoading` | `boolean` | Whether comments are loading (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `addComment` | `(text: string, author?: string) => Promise<VizelComment \| null>` | Add a comment to the selection |
| `removeComment` | `(commentId: string) => Promise<void>` | Remove a comment |
| `resolveComment` | `(commentId: string) => Promise<boolean>` | Resolve a comment |
| `reopenComment` | `(commentId: string) => Promise<boolean>` | Reopen a comment |
| `replyToComment` | `(commentId: string, text: string, author?: string) => Promise<VizelCommentReply \| null>` | Reply to a comment |
| `setActiveComment` | `(commentId: string \| null) => void` | Set the active comment |
| `loadComments` | `() => Promise<VizelComment[]>` | Load comments from storage |
| `getCommentById` | `(commentId: string) => VizelComment \| undefined` | Get a comment by ID |

### createVizelVersionHistory

This rune manages document version history with save, restore, and delete operations.

```typescript
import { createVizelVersionHistory } from '@vizel/svelte';

const history = createVizelVersionHistory(
  () => editor.current,
  { maxVersions: 20 }
);

// Access reactive state
// history.snapshots, history.isLoading
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelVersionHistoryOptions` | Version history configuration |

**Returns:** `CreateVizelVersionHistoryResult`

| Property | Type | Description |
|----------|------|-------------|
| `snapshots` | `VizelVersionSnapshot[]` | All stored snapshots (newest first, reactive) |
| `isLoading` | `boolean` | Whether history is loading (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `saveVersion` | `(description?: string, author?: string) => Promise<VizelVersionSnapshot \| null>` | Save a new version |
| `restoreVersion` | `(versionId: string) => Promise<boolean>` | Restore a version |
| `loadVersions` | `() => Promise<VizelVersionSnapshot[]>` | Load versions from storage |
| `deleteVersion` | `(versionId: string) => Promise<void>` | Delete a version |
| `clearVersions` | `() => Promise<void>` | Delete all versions |

---

## Components

### VizelFindReplace

Find & Replace panel component. This component renders when the Find & Replace extension is open.

```svelte
<script lang="ts">
  import { VizelFindReplace } from '@vizel/svelte';
</script>

<VizelFindReplace
  editor={editor.current}
  class="my-find-replace"
  onClose={() => console.log('Closed')}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |
| `onClose` | `() => void` | - | Called when the panel closes |

### VizelEditor

This component renders the editor content area.

```svelte
<VizelEditor editor={editor.current} class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### VizelBlockMenu

Block context menu that appears when clicking the drag handle.

```svelte
<script>
  import { VizelBlockMenu } from '@vizel/svelte';
</script>

<VizelBlockMenu />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `VizelBlockMenuAction[]` | `vizelDefaultBlockMenuActions` | Custom menu actions |
| `nodeTypes` | `VizelNodeTypeOption[]` | `vizelDefaultNodeTypes` | Node types for "Turn into" submenu |
| `class` | `string` | - | CSS class name |

### VizelBubbleMenu

This component renders a floating formatting bubble menu.

```svelte
<VizelBubbleMenu 
  editor={editor.current}
  class="my-bubble-menu"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Custom bubble menu content |

### VizelBubbleMenuDefault

This component renders the default bubble menu with all formatting buttons.

```svelte
<VizelBubbleMenuDefault 
  editor={editor.current}
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

```svelte
<VizelBubbleMenuButton
  icon="lucide:bold"
  isActive={editor.current?.isActive('bold')}
  onclick={() => editor.current?.chain().focus().toggleBold().run()}
/>
```

### VizelBubbleMenuDivider

This component renders a bubble menu divider.

```svelte
<VizelBubbleMenuDivider />
```

### VizelToolbar

This component renders a fixed toolbar.

```svelte
<script lang="ts">
  import { VizelToolbar } from '@vizel/svelte';
</script>

<VizelToolbar editor={editor.current} class="my-toolbar" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance (falls back to context) |
| `class` | `string` | - | CSS class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar content |
| `children` | `Snippet<[{ editor: Editor }]>` | - | Custom toolbar content |

### VizelToolbarDefault

This component renders the default toolbar content with grouped formatting buttons.

```svelte
<VizelToolbarDefault editor={editor.current} actions={customActions} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor` | - | Editor instance (required) |
| `class` | `string` | - | CSS class name |
| `actions` | `VizelToolbarActionItem[]` | `vizelDefaultToolbarActions` | Custom actions (supports dropdowns) |

### VizelToolbarDropdown

This component renders a dropdown toolbar button with a popover of nested actions.

```svelte
<VizelToolbarDropdown {editor} dropdown={headingDropdown} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor` | - | Editor instance (required) |
| `dropdown` | `VizelToolbarDropdownAction` | - | Dropdown action definition (required) |
| `class` | `string` | - | CSS class name |

### VizelToolbarOverflow

This component renders a "..." overflow button that shows hidden actions in a popover.

```svelte
<VizelToolbarOverflow {editor} actions={overflowActions} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor` | - | Editor instance (required) |
| `actions` | `VizelToolbarActionItem[]` | - | Actions to show in overflow (required) |
| `class` | `string` | - | CSS class name |

### VizelToolbarButton

This component renders an individual toolbar button.

```svelte
<VizelToolbarButton
  onclick={() => editor.current?.chain().focus().toggleBold().run()}
  isActive={editor.current?.isActive("bold") ?? false}
  title="Bold (Cmd+B)"
>
  <VizelIcon name="bold" />
</VizelToolbarButton>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onclick` | `() => void` | - | Click handler |
| `isActive` | `boolean` | `false` | Active state |
| `disabled` | `boolean` | `false` | Disabled state |
| `children` | `Snippet` | - | Button content |
| `title` | `string` | - | Tooltip text |
| `class` | `string` | - | CSS class name |
| `action` | `string` | - | Action identifier |

### VizelToolbarDivider

This component renders a divider between toolbar button groups.

```svelte
<VizelToolbarDivider />
```

### VizelThemeProvider

This component provides theme context to its children.

```svelte
<VizelThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  disableTransitionOnChange={false}
>
  {@render children()}
</VizelThemeProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `VizelTheme` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### VizelSaveIndicator

This component displays the save status.

```svelte
<VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `VizelSaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `class` | `string` | CSS class name |

### VizelPortal

This component renders its children in a portal.

```svelte
<VizelPortal container={document.body}>
  <!-- content -->
</VizelPortal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `container` | `HTMLElement` | Portal target |

### VizelColorPicker

This component renders a color selection interface.

```svelte
<VizelColorPicker
  colors={colors}
  value={currentColor}
  recentColors={recentColors}
  onchange={setColor}
/>
```

### VizelIconProvider

This component provides custom icons for Vizel components.

```svelte
<script lang="ts">
import { VizelIconProvider } from '@vizel/svelte';
import type { CustomIconMap } from '@vizel/core';

const icons: CustomIconMap = {
  bold: 'mdi:format-bold',
  italic: 'mdi:format-italic',
};
</script>

<VizelIconProvider {icons}>
  <Vizel />
</VizelIconProvider>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icons` | [`CustomIconMap`](/api/core#customiconmap) | Map of icon names to Iconify icon IDs |
| `children` | `Snippet` | Children |

### VizelSlashMenu

This component renders the slash command menu.

```svelte
<VizelSlashMenu
  items={items}
  command={handleCommand}
  class="my-menu"
/>
```

---

## Utilities

### createVizelSlashMenuRenderer

This function creates a slash menu renderer for the SlashCommand extension.

```typescript
import { createVizelSlashMenuRenderer } from '@vizel/svelte';

const suggestion = createVizelSlashMenuRenderer();

const editor = createVizelEditor({
  features: {
    slashCommand: {
      suggestion,
    },
  },
});
```

---

## Svelte 5 Patterns

### Using $derived

```svelte
<script lang="ts">
  import { createVizelEditor, createVizelState } from '@vizel/svelte';

  const editor = createVizelEditor();
  createVizelState(() => editor.current);

  const isEmpty = $derived(editor.current?.isEmpty ?? true);
  const characterCount = $derived(
    editor.current?.storage.characterCount?.characters() ?? 0
  );
</script>

<p>{isEmpty ? 'Start typing...' : `${characterCount} characters`}</p>
```

### Using $effect

```svelte
<script lang="ts">
  import { createVizelEditor } from '@vizel/svelte';

  const editor = createVizelEditor();

  $effect(() => {
    if (editor.current) {
      console.log('Editor ready');
      
      return () => {
        console.log('Editor destroyed');
      };
    }
  });
</script>
```

---

## Importing from @vizel/core and @tiptap/core

Framework packages do not re-export from `@vizel/core`. You must import directly:

```typescript
// Framework-specific components and runes
import { 
  Vizel, 
  VizelEditor, 
  VizelBubbleMenu, 
  VizelThemeProvider,
  createVizelEditor,
  createVizelMarkdown,
  createVizelAutoSave,
} from '@vizel/svelte';

// Vizel types and utilities from @vizel/core
import { getVizelEditorState, VIZEL_TEXT_COLORS } from '@vizel/core';
import type { VizelEditorOptions, VizelSaveStatus } from '@vizel/core';

// Tiptap types from @tiptap/core
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
```
