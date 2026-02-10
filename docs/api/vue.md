# @vizel/vue

Vue 3 components and composables for Vizel editor.

::: tip Looking for a guide?
See the [Vue Guide](/guide/vue) for step-by-step tutorials and common patterns.
:::

## Installation

```bash
npm install @vizel/vue
```

## Components

### Vizel

All-in-one editor component with built-in bubble menu. This is the recommended way to get started.

```vue
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
import '@vizel/core/styles.css';
</script>

<template>
  <Vizel
    :initialContent="{ type: 'doc', content: [] }"
    placeholder="Start writing..."
    :editable="true"
    autofocus="end"
    :showBubbleMenu="true"
    :enableEmbed="true"
    class="my-editor"
    :features="{ markdown: true }"
    @update="({ editor }) => {}"
    @create="({ editor }) => {}"
    @focus="({ editor }) => {}"
    @blur="({ editor }) => {}"
  />
</template>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial editor content (JSON) |
| `initialMarkdown` | `string` | - | Initial editor content (Markdown) |
| `v-model:markdown` | `string` | - | Two-way Markdown binding |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus behavior |
| `features` | `VizelFeatureOptions` | - | Feature configuration |
| `class` | `string` | - | CSS class name |
| `showToolbar` | `boolean` | `false` | Show fixed toolbar above editor |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu on selection |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

**Slots:**

| Slot | Props | Description |
|------|-------|-------------|
| `toolbar` | `{ editor: Editor }` | Custom toolbar content |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `{ editor: Editor }` | Fires when content changes |
| `update:markdown` | `string` | Fires when Markdown content changes |
| `create` | `{ editor: Editor }` | Fires when the editor initializes |
| `destroy` | - | Fires when the editor destroys |
| `selectionUpdate` | `{ editor: Editor }` | Fires when the selection changes |
| `focus` | `{ editor: Editor }` | Fires when the editor gains focus |
| `blur` | `{ editor: Editor }` | Fires when the editor loses focus |

---

## Composables

### useVizelEditor

This composable creates and manages a Vizel editor instance.

```typescript
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `ShallowRef<Editor | null>`

### useVizelState

This composable forces a re-render on editor state changes.

```typescript
import { useVizelState } from '@vizel/vue';

const updateCount = useVizelState(() => editor.value);
```

**Returns:** `Ref<number>` (update count)

### useVizelEditorState

This composable tracks specific editor state properties reactively.

```typescript
import { useVizelEditorState } from '@vizel/vue';

const isBold = useVizelEditorState(
  () => editor.value,
  (editor) => editor.isActive('bold')
);
```

**Returns:** `ComputedRef` with the value returned by the selector function

### useVizelAutoSave

This composable auto-saves editor content with debouncing.

```typescript
import { useVizelAutoSave } from '@vizel/vue';

const result = useVizelAutoSave(
  getEditor: () => Editor | null,
  options?: VizelAutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ComputedRef<VizelSaveStatus>` | Current save status |
| `hasUnsavedChanges` | `ComputedRef<boolean>` | Whether unsaved changes exist |
| `lastSaved` | `ComputedRef<Date \| null>` | Last save timestamp |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `save` | `() => Promise<void>` | Save content manually |
| `restore` | `() => Promise<JSONContent \| null>` | Restore content manually |

### useVizelMarkdown

This composable provides two-way Markdown synchronization with debouncing.

```typescript
import { useVizelMarkdown } from '@vizel/vue';

const result = useVizelMarkdown(
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
| `markdown` | `Ref<string>` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `Ref<boolean>` | Whether sync is pending |

### useVizelTheme

This composable accesses theme state within VizelThemeProvider.

```typescript
import { useVizelTheme } from '@vizel/vue';

const { theme, resolvedTheme, systemTheme, setTheme } = useVizelTheme();
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `VizelTheme` | Current theme setting |
| `resolvedTheme` | `VizelResolvedTheme` | Resolved theme |
| `systemTheme` | `VizelResolvedTheme` | System preference |
| `setTheme` | `(theme: VizelTheme) => void` | Set theme function |

### useVizelCollaboration

This composable tracks real-time collaboration state with a Yjs provider.

```typescript
import { useVizelCollaboration } from '@vizel/vue';

const {
  isConnected,
  isSynced,
  peerCount,
  error,
  connect,
  disconnect,
  updateUser,
} = useVizelCollaboration(
  () => provider,
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
| `isConnected` | `ComputedRef<boolean>` | Whether the editor is connected to the server |
| `isSynced` | `ComputedRef<boolean>` | Whether initial sync is complete |
| `peerCount` | `ComputedRef<number>` | Number of connected peers |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `connect` | `() => void` | Connect to the server |
| `disconnect` | `() => void` | Disconnect from the server |
| `updateUser` | `(user: VizelCollaborationUser) => void` | Update user cursor info |

### useVizelComment

This composable manages document comments and annotations.

```typescript
import { useVizelComment } from '@vizel/vue';

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
} = useVizelComment(() => editor.value, { key: 'my-comments' });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelCommentOptions` | Comment configuration options |

**Returns:** `UseVizelCommentResult`

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `ComputedRef<VizelComment[]>` | All stored comments (newest first) |
| `activeCommentId` | `ComputedRef<string \| null>` | Currently active comment ID |
| `isLoading` | `ComputedRef<boolean>` | Whether comments are loading |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `addComment` | `(text: string, author?: string) => Promise<VizelComment \| null>` | Add a comment to the selection |
| `removeComment` | `(commentId: string) => Promise<void>` | Remove a comment |
| `resolveComment` | `(commentId: string) => Promise<boolean>` | Resolve a comment |
| `reopenComment` | `(commentId: string) => Promise<boolean>` | Reopen a comment |
| `replyToComment` | `(commentId: string, text: string, author?: string) => Promise<VizelCommentReply \| null>` | Reply to a comment |
| `setActiveComment` | `(commentId: string \| null) => void` | Set the active comment |
| `loadComments` | `() => Promise<VizelComment[]>` | Load comments from storage |
| `getCommentById` | `(commentId: string) => VizelComment \| undefined` | Get a comment by ID |

### useVizelVersionHistory

This composable manages document version history with save, restore, and delete operations.

```typescript
import { useVizelVersionHistory } from '@vizel/vue';

const {
  snapshots,
  isLoading,
  error,
  saveVersion,
  restoreVersion,
  loadVersions,
  deleteVersion,
  clearVersions,
} = useVizelVersionHistory(() => editor.value, { maxVersions: 20 });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `getEditor` | `() => Editor \| null \| undefined` | Getter function for the editor |
| `options` | `VizelVersionHistoryOptions` | Version history configuration |

**Returns:** `UseVizelVersionHistoryResult`

| Property | Type | Description |
|----------|------|-------------|
| `snapshots` | `ComputedRef<VizelVersionSnapshot[]>` | All stored snapshots (newest first) |
| `isLoading` | `ComputedRef<boolean>` | Whether history is loading |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `saveVersion` | `(description?: string, author?: string) => Promise<VizelVersionSnapshot \| null>` | Save a new version |
| `restoreVersion` | `(versionId: string) => Promise<boolean>` | Restore a version |
| `loadVersions` | `() => Promise<VizelVersionSnapshot[]>` | Load versions from storage |
| `deleteVersion` | `(versionId: string) => Promise<void>` | Delete a version |
| `clearVersions` | `() => Promise<void>` | Delete all versions |

---

## Components

### VizelFindReplace

Find & Replace panel component. This component renders when the Find & Replace extension is open.

```vue
<script setup lang="ts">
import { VizelFindReplace } from '@vizel/vue';
</script>

<template>
  <VizelFindReplace
    :editor="editor"
    class="my-find-replace"
    @close="() => console.log('Closed')"
  />
</template>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | - | Fires when the panel closes |

### VizelEditor

This component renders the editor content area.

```vue
<VizelEditor :editor="editor" class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### VizelBubbleMenu

This component renders a floating formatting bubble menu.

```vue
<VizelBubbleMenu 
  :editor="editor"
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

```vue
<VizelBubbleMenuDefault 
  :editor="editor"
  :enableEmbed="false"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `enableEmbed` | `boolean` | `false` | Enable embed in links |

### VizelBubbleMenuButton

This component renders an individual bubble menu button.

```vue
<VizelBubbleMenuButton
  icon="lucide:bold"
  :isActive="editor.isActive('bold')"
  @click="editor.chain().focus().toggleBold().run()"
/>
```

### VizelBubbleMenuDivider

This component renders a bubble menu divider.

```vue
<VizelBubbleMenuDivider />
```

### VizelToolbar

This component renders a fixed toolbar.

```vue
<script setup lang="ts">
import { VizelToolbar } from '@vizel/vue';
</script>

<template>
  <VizelToolbar :editor="editor" class="my-toolbar" />
</template>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance (falls back to context) |
| `class` | `string` | - | CSS class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar content |

**Slots:**

| Slot | Props | Description |
|------|-------|-------------|
| `default` | `{ editor: Editor }` | Custom toolbar content |

### VizelToolbarDefault

This component renders the default toolbar content with grouped formatting buttons.

```vue
<VizelToolbarDefault :editor="editor" :actions="customActions" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor` | - | Editor instance (required) |
| `class` | `string` | - | CSS class name |
| `actions` | `VizelToolbarAction[]` | `vizelDefaultToolbarActions` | Custom actions |

### VizelToolbarButton

This component renders an individual toolbar button.

```vue
<VizelToolbarButton
  :is-active="editor.isActive('bold')"
  title="Bold (Cmd+B)"
  @click="editor.chain().focus().toggleBold().run()"
>
  <VizelIcon name="bold" />
</VizelToolbarButton>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isActive` | `boolean` | `false` | Active state |
| `disabled` | `boolean` | `false` | Disabled state |
| `title` | `string` | - | Tooltip text |
| `class` | `string` | - | CSS class name |
| `action` | `string` | - | Action identifier |

### VizelToolbarDivider

This component renders a divider between toolbar button groups.

```vue
<VizelToolbarDivider />
```

### VizelThemeProvider

This component provides theme context to its children.

```vue
<VizelThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  :disableTransitionOnChange="false"
>
  <slot />
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

```vue
<VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `VizelSaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `class` | `string` | CSS class name |

### VizelPortal

This component renders its children in a portal.

```vue
<VizelPortal :container="document.body">
  <slot />
</VizelPortal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `container` | `HTMLElement` | Portal target |

### VizelColorPicker

This component renders a color selection interface.

```vue
<VizelColorPicker
  :colors="colors"
  :value="currentColor"
  :recentColors="recentColors"
  @update:value="setColor"
/>
```

### VizelIconProvider

This component provides custom icons for Vizel components.

```vue
<script setup lang="ts">
import { VizelIconProvider } from '@vizel/vue';
import type { CustomIconMap } from '@vizel/core';

const icons: CustomIconMap = {
  bold: 'mdi:format-bold',
  italic: 'mdi:format-italic',
};
</script>

<template>
  <VizelIconProvider :icons="icons">
    <Vizel />
  </VizelIconProvider>
</template>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icons` | [`CustomIconMap`](/api/core#customiconmap) | Map of icon names to Iconify icon IDs |

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Children |

### VizelSlashMenu

This component renders the slash command menu.

```vue
<VizelSlashMenu
  :items="items"
  :command="handleCommand"
  class="my-menu"
/>
```

---

## Utilities

### createVizelSlashMenuRenderer

This function creates a slash menu renderer for the SlashCommand extension.

```typescript
import { createVizelSlashMenuRenderer } from '@vizel/vue';

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

```typescript
// Framework-specific components and composables
import { 
  Vizel, 
  VizelEditor, 
  VizelBubbleMenu, 
  VizelThemeProvider,
  useVizelEditor,
  useVizelMarkdown,
  useVizelAutoSave,
} from '@vizel/vue';

// Vizel types and utilities from @vizel/core
import { getVizelEditorState, VIZEL_TEXT_COLORS } from '@vizel/core';
import type { VizelEditorOptions, VizelSaveStatus } from '@vizel/core';

// Tiptap types from @tiptap/core
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
```
