# @vizel/react

React 19 components and hooks for Vizel editor.

## Installation

```bash
npm install @vizel/react
```

## Hooks

### useVizelEditor

Creates and manages a Vizel editor instance.

```tsx
import { useVizelEditor } from '@vizel/react';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `Editor | null`

### useEditorState

Forces re-render on editor state changes.

```tsx
import { useEditorState } from '@vizel/react';

const updateCount = useEditorState(editor: Editor | null);
```

**Returns:** `number` (update count)

### useAutoSave

Auto-saves editor content with debouncing.

```tsx
import { useAutoSave } from '@vizel/react';

const result = useAutoSave(
  editor: Editor | null,
  options?: AutoSaveOptions
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `SaveStatus` | Current save status |
| `hasUnsavedChanges` | `boolean` | Whether there are unsaved changes |
| `lastSaved` | `Date \| null` | Last save timestamp |
| `error` | `Error \| null` | Last error |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore function |

### useTheme

Access theme state within ThemeProvider.

```tsx
import { useTheme } from '@vizel/react';

const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `Theme` | Current theme setting |
| `resolvedTheme` | `ResolvedTheme` | Resolved theme |
| `systemTheme` | `ResolvedTheme` | System preference |
| `setTheme` | `(theme: Theme) => void` | Set theme function |

### useEditorContext

Access editor from EditorRoot context.

```tsx
import { useEditorContext } from '@vizel/react';

const { editor } = useEditorContext();
```

---

## Components

### EditorContent

Renders the editor content area.

```tsx
<EditorContent editor={editor} className="my-editor" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | CSS class name |

### BubbleMenu

Floating formatting toolbar.

```tsx
<BubbleMenu 
  editor={editor}
  showDefaultToolbar={true}
  updateDelay={100}
  enableEmbed={false}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | CSS class name |
| `children` | `ReactNode` | - | Custom content |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Update delay (ms) |
| `shouldShow` | `Function` | - | Custom visibility |
| `enableEmbed` | `boolean` | `false` | Enable embed in links |

### ThemeProvider

Provides theme context.

```tsx
<ThemeProvider
  defaultTheme="system"
  storageKey="vizel-theme"
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `Theme` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |
| `children` | `ReactNode` | - | Children |

### SaveIndicator

Displays save status.

```tsx
<SaveIndicator status={status} lastSaved={lastSaved} />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `SaveStatus` | Save status |
| `lastSaved` | `Date \| null` | Last save time |
| `className` | `string` | CSS class name |

### Portal

Renders content in a portal.

```tsx
<Portal container={document.body}>{children}</Portal>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content to render |
| `container` | `HTMLElement` | Portal target |

### ColorPicker

Color selection component.

```tsx
<ColorPicker
  colors={colors}
  value={currentColor}
  onChange={setColor}
  recentColors={recentColors}
/>
```

### SlashMenu

Slash command menu component.

```tsx
<SlashMenu
  items={items}
  command={handleCommand}
  className="my-menu"
/>
```

---

## Utilities

### createSlashMenuRenderer

Creates slash menu renderer for the SlashCommand extension.

```tsx
import { createSlashMenuRenderer } from '@vizel/react';

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

```tsx
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
} from '@vizel/react';
```
