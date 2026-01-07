# @vizel/vue

Vue 3 components and composables for Vizel editor.

## Installation

```bash
npm install @vizel/vue
```

## Composables

### useVizelEditor

Creates and manages a Vizel editor instance.

```typescript
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `ShallowRef<Editor | null>`

### useEditorState

Forces re-render on editor state changes.

```typescript
import { useEditorState } from '@vizel/vue';

const updateCount = useEditorState(getEditor: () => Editor | null);
```

**Returns:** `Ref<number>` (update count)

### useAutoSave

Auto-saves editor content with debouncing.

```typescript
import { useAutoSave } from '@vizel/vue';

const result = useAutoSave(
  getEditor: () => Editor | null,
  options?: AutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ComputedRef<SaveStatus>` | Current save status |
| `hasUnsavedChanges` | `ComputedRef<boolean>` | Has unsaved changes |
| `lastSaved` | `ComputedRef<Date \| null>` | Last save timestamp |
| `error` | `ComputedRef<Error \| null>` | Last error |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore |

### useTheme

Access theme state within ThemeProvider.

```typescript
import { useTheme } from '@vizel/vue';

const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `Ref<Theme>` | Current theme setting |
| `resolvedTheme` | `ComputedRef<ResolvedTheme>` | Resolved theme |
| `systemTheme` | `Ref<ResolvedTheme>` | System preference |
| `setTheme` | `(theme: Theme) => void` | Set theme function |

---

## Components

### EditorContent

Renders the editor content area.

```vue
<EditorContent :editor="editor" class="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | CSS class name |

### BubbleMenu

Floating formatting toolbar.

```vue
<BubbleMenu 
  :editor="editor"
  :showDefaultToolbar="true"
  :updateDelay="100"
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

```vue
<ThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  :disableTransitionOnChange="false"
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

```vue
<SaveIndicator :status="status" :lastSaved="lastSaved" />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `SaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `class` | `string` | CSS class name |

### Portal

Renders content in a portal.

```vue
<Portal :container="document.body">
  <slot />
</Portal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `container` | `HTMLElement` | Portal target |

### ColorPicker

Color selection component.

```vue
<ColorPicker
  :colors="colors"
  :value="currentColor"
  :recentColors="recentColors"
  @update:value="setColor"
/>
```

### SlashMenu

Slash command menu component.

```vue
<SlashMenu
  :items="items"
  :command="handleCommand"
  class="my-menu"
/>
```

---

## Utilities

### createSlashMenuRenderer

Creates slash menu renderer for the SlashCommand extension.

```typescript
import { createSlashMenuRenderer } from '@vizel/vue';

const suggestion = createSlashMenuRenderer();

const editor = useVizelEditor({
  features: {
    slashCommand: {
      suggestion,
    },
  },
});
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
} from '@vizel/vue';
```
