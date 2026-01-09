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

Includes CSS variables and component styles.

### Components Only

```typescript
import '@vizel/core/components.css';
```

Component styles without CSS variable definitions. Use with custom theming or shadcn/ui.

---

## Extensions

Vizel provides pre-configured Tiptap extensions.

### createVizelExtensions

Creates the default set of Vizel extensions.

```typescript
import { createVizelExtensions } from '@vizel/core';

const extensions = createVizelExtensions({
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

Resolves feature options to extension configuration.

```typescript
import { resolveVizelFeatures } from '@vizel/core';

const resolved = resolveVizelFeatures({
  markdown: true,
  mathematics: { katexOptions: { strict: false } },
});
```

### getVizelEditorState

Gets the current editor state.

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

Formats a date as relative time.

```typescript
import { formatVizelRelativeTime } from '@vizel/core';

formatVizelRelativeTime(new Date(Date.now() - 60000));
// "1 minute ago"
```

---

## Theme Utilities

### getVizelSystemTheme

Gets the system color scheme preference.

```typescript
import { getVizelSystemTheme } from '@vizel/core';

const theme = getVizelSystemTheme();
// 'light' | 'dark'
```

### resolveVizelTheme

Resolves theme setting to actual theme.

```typescript
import { resolveVizelTheme } from '@vizel/core';

resolveVizelTheme('system', 'dark');
// 'dark'
```

### applyVizelTheme

Applies theme to the DOM.

```typescript
import { applyVizelTheme } from '@vizel/core';

applyVizelTheme('dark', document.documentElement);
```

### getVizelThemeInitScript

Gets inline script for preventing flash of unstyled content.

```typescript
import { getVizelThemeInitScript } from '@vizel/core';

const script = getVizelThemeInitScript('my-theme-key');
// Include in <head>
```

---

## Image Utilities

### createVizelImageUploader

Creates an image upload function.

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

Validates an image file.

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

Gets recent colors from localStorage.

```typescript
import { getVizelRecentColors } from '@vizel/core';

const colors = getVizelRecentColors('text');
// ['#ff0000', '#00ff00', ...]
```

### addVizelRecentColor

Adds a color to recent colors.

```typescript
import { addVizelRecentColor } from '@vizel/core';

addVizelRecentColor('text', '#ff0000');
```

---

## Embed Utilities

### detectVizelEmbedProvider

Detects oEmbed provider from URL.

```typescript
import { detectVizelEmbedProvider } from '@vizel/core';

const provider = detectVizelEmbedProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// { name: 'YouTube', ... }
```

---

## Constants

### VIZEL_TEXT_COLORS

Default text color palette.

```typescript
import { VIZEL_TEXT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### VIZEL_HIGHLIGHT_COLORS

Default highlight color palette.

```typescript
import { VIZEL_HIGHLIGHT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### vizelDefaultEmbedProviders

Default oEmbed providers.

```typescript
import { vizelDefaultEmbedProviders } from '@vizel/core';
// YouTube, Vimeo, Twitter, etc.
```

---

## Importing from Tiptap

Vizel does not re-export Tiptap types and classes. Import them directly from `@tiptap/core`:

```typescript
// Import Vizel types/utilities from @vizel/core
import { createVizelExtensions, getVizelEditorState } from '@vizel/core';
import type { VizelEditorOptions, VizelFeatureOptions } from '@vizel/core';

// Import Tiptap types/classes directly from @tiptap/core
import { Editor } from '@tiptap/core';
import type { JSONContent, Extensions } from '@tiptap/core';
```

---

## Next Steps

- [CSS Variables](/api/css-variables/) - Complete CSS variable reference
- [Type Definitions](/api/types/) - Full TypeScript types
- [React API](/api/react) - React-specific APIs
- [Vue API](/api/vue) - Vue-specific APIs
- [Svelte API](/api/svelte) - Svelte-specific APIs
