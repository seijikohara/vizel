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

See [Type Definitions](/api/types#vizelEditorOptions) for full interface.

### VizelFeatureOptions

```typescript
import type { VizelFeatureOptions } from '@vizel/core';
```

See [Type Definitions](/api/types#vizelFeatureOptions) for full interface.

### JSONContent

Tiptap's JSON content format.

```typescript
import type { JSONContent } from '@vizel/core';

const content: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }
  ],
};
```

### SaveStatus

```typescript
import type { SaveStatus } from '@vizel/core';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
```

### Theme Types

```typescript
import type { Theme, ResolvedTheme } from '@vizel/core';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
```

---

## Utilities

### resolveFeatures

Resolves feature options to extension configuration.

```typescript
import { resolveFeatures } from '@vizel/core';

const resolved = resolveFeatures({
  markdown: true,
  mathematics: { katexOptions: { strict: false } },
});
```

### getEditorState

Gets the current editor state.

```typescript
import { getEditorState } from '@vizel/core';

const state = getEditorState(editor);
// {
//   isFocused: boolean,
//   isEmpty: boolean,
//   canUndo: boolean,
//   canRedo: boolean,
//   characterCount: number,
//   wordCount: number,
// }
```

### formatRelativeTime

Formats a date as relative time.

```typescript
import { formatRelativeTime } from '@vizel/core';

formatRelativeTime(new Date(Date.now() - 60000));
// "1 minute ago"
```

---

## Theme Utilities

### getSystemTheme

Gets the system color scheme preference.

```typescript
import { getSystemTheme } from '@vizel/core';

const theme = getSystemTheme();
// 'light' | 'dark'
```

### resolveTheme

Resolves theme setting to actual theme.

```typescript
import { resolveTheme } from '@vizel/core';

resolveTheme('system', 'dark');
// 'dark'
```

### applyTheme

Applies theme to the DOM.

```typescript
import { applyTheme } from '@vizel/core';

applyTheme('dark', document.documentElement);
```

### getThemeInitScript

Gets inline script for preventing flash of unstyled content.

```typescript
import { getThemeInitScript } from '@vizel/core';

const script = getThemeInitScript('my-theme-key');
// Include in <head>
```

---

## Image Utilities

### createImageUploader

Creates an image upload function.

```typescript
import { createImageUploader } from '@vizel/core';

const upload = createImageUploader({
  onUpload: async (file) => {
    // Upload file
    return 'https://example.com/image.png';
  },
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});
```

### validateImageFile

Validates an image file.

```typescript
import { validateImageFile } from '@vizel/core';

const result = validateImageFile(file, {
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});

if (!result.valid) {
  console.error(result.error);
}
```

---

## Color Utilities

### getRecentColors

Gets recent colors from localStorage.

```typescript
import { getRecentColors } from '@vizel/core';

const colors = getRecentColors('text');
// ['#ff0000', '#00ff00', ...]
```

### addRecentColor

Adds a color to recent colors.

```typescript
import { addRecentColor } from '@vizel/core';

addRecentColor('text', '#ff0000');
```

### isValidHexColor

Validates a hex color string.

```typescript
import { isValidHexColor } from '@vizel/core';

isValidHexColor('#ff0000'); // true
isValidHexColor('red');     // false
```

---

## Embed Utilities

### detectProvider

Detects oEmbed provider from URL.

```typescript
import { detectProvider } from '@vizel/core';

const provider = detectProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// { name: 'YouTube', ... }
```

### isValidUrl

Checks if a string is a valid URL.

```typescript
import { isValidUrl } from '@vizel/core';

isValidUrl('https://example.com'); // true
isValidUrl('not a url');           // false
```

---

## Constants

### TEXT_COLORS

Default text color palette.

```typescript
import { TEXT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### HIGHLIGHT_COLORS

Default highlight color palette.

```typescript
import { HIGHLIGHT_COLORS } from '@vizel/core';
// Array of { name: string, color: string }
```

### defaultEmbedProviders

Default oEmbed providers.

```typescript
import { defaultEmbedProviders } from '@vizel/core';
// YouTube, Vimeo, Twitter, etc.
```

---

## Re-exports

The core package re-exports from Tiptap:

```typescript
// From @tiptap/core
export { Editor, Extension, Mark, Node } from '@tiptap/core';
export type { Extensions, Content } from '@tiptap/core';
```

---

## Next Steps

- [CSS Variables](/api/css-variables) - Complete CSS variable reference
- [Type Definitions](/api/types) - Full TypeScript types
- [React API](/api/react) - React-specific APIs
- [Vue API](/api/vue) - Vue-specific APIs
- [Svelte API](/api/svelte) - Svelte-specific APIs
