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

Creates and manages a Vizel editor instance.

```tsx
import { useVizelEditor } from '@vizel/react';

const editor = useVizelEditor(options?: VizelEditorOptions);
```

**Returns:** `Editor | null`

### useVizelState

Forces re-render on editor state changes.

```tsx
import { useVizelState } from '@vizel/react';

const updateCount = useVizelState(() => editor);
```

**Returns:** `number` (update count)

### useVizelEditorState

Tracks specific editor state properties reactively.

```tsx
import { useVizelEditorState } from '@vizel/react';

const isBold = useVizelEditorState(
  () => editor,
  (editor) => editor.isActive('bold')
);
```

**Returns:** The value returned by the selector function

### useVizelAutoSave

Auto-saves editor content with debouncing.

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
| `hasUnsavedChanges` | `boolean` | Whether there are unsaved changes |
| `lastSaved` | `Date \| null` | Last save timestamp |
| `error` | `Error \| null` | Last error |
| `save` | `() => Promise<void>` | Manual save function |
| `restore` | `() => Promise<JSONContent \| null>` | Manual restore function |

### useVizelMarkdown

Provides two-way Markdown synchronization with debouncing.

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

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `string` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending |

### useVizelTheme

Access theme state within VizelThemeProvider.

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

Access editor from VizelProvider context.

```tsx
import { useVizelContext } from '@vizel/react';

const { editor } = useVizelContext();
```

---

## Components

### VizelEditor

Renders the editor content area.

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

Floating formatting bubble menu.

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

Default bubble menu with all formatting buttons.

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

Individual bubble menu button.

```tsx
import { VizelBubbleMenuButton } from '@vizel/react';

<VizelBubbleMenuButton
  icon="lucide:bold"
  isActive={editor.isActive('bold')}
  onClick={() => editor.chain().focus().toggleBold().run()}
/>
```

### VizelBubbleMenuDivider

Bubble menu divider.

```tsx
import { VizelBubbleMenuDivider } from '@vizel/react';

<VizelBubbleMenuDivider />
```

### VizelToolbar

Fixed toolbar component.

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

Default toolbar content with grouped formatting buttons.

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

Individual toolbar button.

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

Divider between toolbar button groups.

```tsx
import { VizelToolbarDivider } from '@vizel/react';

<VizelToolbarDivider />
```

### VizelThemeProvider

Provides theme context.

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

Displays save status.

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

Renders content in a portal.

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

Color selection component.

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

Provides custom icons for Vizel components.

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

Slash command menu component.

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

Creates slash menu renderer for the SlashCommand extension.

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

Framework packages do not re-export from `@vizel/core`. Import directly:

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
