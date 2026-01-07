# @vizel/svelte

Svelte 5 components and runes for Vizel editor.

## Installation

```bash
npm install @vizel/svelte
```

## Runes

### createVizelEditor

Creates and manages a Vizel editor instance.

```typescript
import { createVizelEditor } from '@vizel/svelte';

const editor = createVizelEditor(options?: VizelEditorOptions);
// Access: editor.current
```

**Returns:** `{ current: Editor | null }`

### createEditorState

Forces re-render on editor state changes.

```typescript
import { createEditorState } from '@vizel/svelte';

const state = createEditorState(getEditor: () => Editor | null);
// Access: state.current (update count)
```

**Returns:** `{ readonly current: number }`

### createAutoSave

Auto-saves editor content with debouncing.

```typescript
import { createAutoSave } from '@vizel/svelte';

const autoSave = createAutoSave(
  getEditor: () => Editor | null,
  options?: AutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `SaveStatus` | Current save status (reactive) |
| `hasUnsavedChanges` | `boolean` | Has unsaved changes (reactive) |
| `lastSaved` | `Date \| null` | Last save timestamp (reactive) |
| `error` | `Error \| null` | Last error (reactive) |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore |

### getTheme

Access theme state within ThemeProvider context.

```typescript
import { getTheme } from '@vizel/svelte';

const theme = getTheme();
// Access: theme.theme, theme.resolvedTheme, theme.setTheme()
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `Theme` | Current theme setting (reactive) |
| `resolvedTheme` | `ResolvedTheme` | Resolved theme (reactive) |
| `systemTheme` | `ResolvedTheme` | System preference (reactive) |
| `setTheme` | `(theme: Theme) => void` | Set theme function |

---

## Components

### EditorContent

Renders the editor content area.

```svelte
<EditorContent editor={editor.current} class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### BubbleMenu

Floating formatting toolbar.

```svelte
<BubbleMenu 
  editor={editor.current}
  showDefaultToolbar={true}
  updateDelay={100}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Update delay (ms) |
| `shouldShow` | `Function` | - | Custom visibility |
| `enableEmbed` | `boolean` | `false` | Enable embed in links |

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Custom toolbar content |

### ThemeProvider

Provides theme context.

```svelte
<ThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  disableTransitionOnChange={false}
>
  <slot />
</ThemeProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `Theme` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### SaveIndicator

Displays save status.

```svelte
<SaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `SaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `class` | `string` | CSS class name |

### Portal

Renders content in a portal.

```svelte
<Portal container={document.body}>
  <!-- content -->
</Portal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `container` | `HTMLElement` | Portal target |

### ColorPicker

Color selection component.

```svelte
<ColorPicker
  colors={colors}
  value={currentColor}
  recentColors={recentColors}
  onchange={setColor}
/>
```

### SlashMenu

Slash command menu component.

```svelte
<SlashMenu
  items={items}
  command={handleCommand}
  class="my-menu"
/>
```

---

## Utilities

### createSlashMenuRenderer

Creates slash menu renderer for the SlashCommand extension.

```typescript
import { createSlashMenuRenderer } from '@vizel/svelte';

const suggestion = createSlashMenuRenderer();

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
  const editor = createVizelEditor();
  createEditorState(() => editor.current);

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

## Re-exports

All exports from `@vizel/core` are re-exported:

```typescript
import { 
  // Types
  type JSONContent,
  type VizelEditorOptions,
  type SaveStatus,
  // Utilities
  getEditorState,
  formatRelativeTime,
  // Constants
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from '@vizel/svelte';
```
