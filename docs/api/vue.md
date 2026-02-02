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
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu on selection |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `{ editor: Editor }` | Content updated |
| `update:markdown` | `string` | Markdown content changed |
| `create` | `{ editor: Editor }` | Editor created |
| `destroy` | - | Editor destroyed |
| `selectionUpdate` | `{ editor: Editor }` | Selection changed |
| `focus` | `{ editor: Editor }` | Editor focused |
| `blur` | `{ editor: Editor }` | Editor blurred |

---

## Composables

### useVizelEditor

Creates and manages a Vizel editor instance.

```typescript
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `ShallowRef<Editor | null>`

### useVizelState

Forces re-render on editor state changes.

```typescript
import { useVizelState } from '@vizel/vue';

const updateCount = useVizelState(() => editor.value);
```

**Returns:** `Ref<number>` (update count)

### useVizelEditorState

Tracks specific editor state properties reactively.

```typescript
import { useVizelEditorState } from '@vizel/vue';

const isBold = useVizelEditorState(
  () => editor.value,
  (editor) => editor.isActive('bold')
);
```

**Returns:** `ComputedRef` with the value returned by the selector function

### useVizelAutoSave

Auto-saves editor content with debouncing.

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
| `hasUnsavedChanges` | `ComputedRef<boolean>` | Has unsaved changes |
| `lastSaved` | `ComputedRef<Date \| null>` | Last save timestamp |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore |

### useVizelMarkdown

Provides two-way Markdown synchronization with debouncing.

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

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `Ref<string>` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `Ref<boolean>` | Whether sync is pending |

### useVizelTheme

Access theme state within VizelThemeProvider.

```typescript
import { useVizelTheme } from '@vizel/vue';

const { theme, resolvedTheme, systemTheme, setTheme } = useVizelTheme();
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `Ref<VizelTheme>` | Current theme setting |
| `resolvedTheme` | `ComputedRef<VizelResolvedTheme>` | Resolved theme |
| `systemTheme` | `Ref<VizelResolvedTheme>` | System preference |
| `setTheme` | `(theme: VizelTheme) => void` | Set theme function |

---

## Components

### VizelEditor

Renders the editor content area.

```vue
<VizelEditor :editor="editor" class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### VizelBubbleMenu

Floating formatting bubble menu.

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

Default bubble menu with all formatting buttons.

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

Individual bubble menu button.

```vue
<VizelBubbleMenuButton
  icon="lucide:bold"
  :isActive="editor.isActive('bold')"
  @click="editor.chain().focus().toggleBold().run()"
/>
```

### VizelBubbleMenuDivider

Bubble menu divider.

```vue
<VizelBubbleMenuDivider />
```

### VizelToolbar

Fixed toolbar component.

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

Default toolbar content with grouped formatting buttons.

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

Individual toolbar button.

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

Divider between toolbar button groups.

```vue
<VizelToolbarDivider />
```

### VizelThemeProvider

Provides theme context.

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

Displays save status.

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

Renders content in a portal.

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

Color selection component.

```vue
<VizelColorPicker
  :colors="colors"
  :value="currentColor"
  :recentColors="recentColors"
  @update:value="setColor"
/>
```

### VizelIconProvider

Provides custom icons for Vizel components.

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

Slash command menu component.

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

Creates slash menu renderer for the SlashCommand extension.

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

Framework packages do not re-export from `@vizel/core`. Import directly:

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
