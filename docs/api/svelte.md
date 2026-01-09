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

Creates and manages a Vizel editor instance.

```typescript
import { createVizelEditor } from '@vizel/svelte';

const editor = createVizelEditor(options?: VizelEditorOptions);
// Access: editor.current
```

**Returns:** `{ current: Editor | null }`

### createVizelState

Forces re-render on editor state changes.

```typescript
import { createVizelState } from '@vizel/svelte';

const state = createVizelState(getEditor: () => Editor | null);
// Access: state.current (update count)
```

**Returns:** `{ readonly current: number }`

### createVizelAutoSave

Auto-saves editor content with debouncing.

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
| `hasUnsavedChanges` | `boolean` | Has unsaved changes (reactive) |
| `lastSaved` | `Date \| null` | Last save timestamp (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore |

### createVizelMarkdown

Provides two-way Markdown synchronization with debouncing.

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

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `string` | Current Markdown content (reactive) |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending (reactive) |

### getVizelTheme

Access theme state within VizelThemeProvider context.

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

---

## Components

### VizelEditor

Renders the editor content area.

```svelte
<VizelEditor editor={editor.current} class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### VizelBubbleMenu

Floating formatting bubble menu.

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

Default bubble menu with all formatting buttons.

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

Individual bubble menu button.

```svelte
<VizelBubbleMenuButton
  icon="lucide:bold"
  isActive={editor.current?.isActive('bold')}
  onclick={() => editor.current?.chain().focus().toggleBold().run()}
/>
```

### VizelBubbleMenuDivider

Bubble menu divider.

```svelte
<VizelBubbleMenuDivider />
```

### VizelThemeProvider

Provides theme context.

```svelte
<VizelThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  disableTransitionOnChange={false}
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

Renders content in a portal.

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

Color selection component.

```svelte
<VizelColorPicker
  colors={colors}
  value={currentColor}
  recentColors={recentColors}
  onchange={setColor}
/>
```

### VizelSlashMenu

Slash command menu component.

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

Creates slash menu renderer for the SlashCommand extension.

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

Framework packages do not re-export from `@vizel/core`. Import directly:

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
