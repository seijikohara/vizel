# Editor Types

Core editor options, content format, and state types.

## VizelEditorOptions

Main configuration options for creating an editor.

```typescript
interface VizelEditorOptions {
  /** Feature configuration */
  features?: VizelFeatureOptions;

  /** Initial content in JSON format */
  initialContent?: JSONContent;

  /** Initial content in Markdown format */
  initialMarkdown?: string;

  /** Transform diagram code blocks on Markdown import (default: true) */
  transformDiagramsOnImport?: boolean;

  /** Placeholder text when editor is empty */
  placeholder?: string;

  /** Whether the editor is editable */
  editable?: boolean;

  /** Auto focus behavior on mount */
  autofocus?: boolean | 'start' | 'end' | 'all' | number;

  /** Called when content changes */
  onUpdate?: (props: { editor: Editor }) => void;

  /** Called when editor is created */
  onCreate?: (props: { editor: Editor }) => void;

  /** Called when editor is destroyed */
  onDestroy?: () => void;

  /** Called when selection changes */
  onSelectionUpdate?: (props: { editor: Editor }) => void;

  /** Called when editor receives focus */
  onFocus?: (props: { editor: Editor }) => void;

  /** Called when editor loses focus */
  onBlur?: (props: { editor: Editor }) => void;

  /** Called when an error occurs (error is re-thrown after callback) */
  onError?: (error: VizelError) => void;
}
```

::: tip Markdown vs JSON
If both `initialContent` and `initialMarkdown` are provided, `initialMarkdown` takes precedence.
Using `initialMarkdown` is recommended for most use cases as it's more human-readable.
:::

::: info extensions
The `extensions` property is available on `VizelCreateEditorOptions` (used by `useVizelEditor` / `createVizelEditor`), not on `VizelEditorOptions` directly. The `Vizel` component also accepts `extensions` as a prop.
:::

## JSONContent

Tiptap's JSON content format.

```typescript
interface JSONContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, unknown>;
  }[];
  text?: string;
}
```

### Example

```typescript
const content: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello World' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
        { type: 'text', text: ' text.' }
      ]
    }
  ]
};
```

## VizelEditorState

The editor state object that `getVizelEditorState()` returns.

```typescript
interface VizelEditorState {
  /** Whether the editor is currently focused */
  isFocused: boolean;
  
  /** Whether the editor content is empty */
  isEmpty: boolean;
  
  /** Whether undo is available */
  canUndo: boolean;
  
  /** Whether redo is available */
  canRedo: boolean;
  
  /** Current character count */
  characterCount: number;
  
  /** Current word count */
  wordCount: number;
}
```

### Usage

```typescript
import { getVizelEditorState } from '@vizel/core';

const state = getVizelEditorState(editor);
console.log(`${state.characterCount} characters, ${state.wordCount} words`);
```

## VizelSlashCommandRange

Selection range type that slash commands use.

```typescript
interface VizelSlashCommandRange {
  from: number;
  to: number;
}
```

## VizelEmbedData

Data structure that represents embedded content.

```typescript
interface VizelEmbedData {
  /** Original URL */
  url: string;
  /** Type of embed based on available data */
  type: 'oembed' | 'ogp' | 'title' | 'link';
  /** Provider name if detected */
  provider?: string;
  /** oEmbed HTML content */
  html?: string;
  /** oEmbed width */
  width?: number;
  /** oEmbed height */
  height?: number;
  /** OGP/oEmbed title */
  title?: string;
  /** OGP/oEmbed description */
  description?: string;
  /** OGP/oEmbed image URL */
  image?: string;
  /** OGP site name */
  siteName?: string;
  /** Favicon URL */
  favicon?: string;
  /** Whether the embed is currently loading */
  loading?: boolean;
}
```

## VizelMarkdownSyncOptions

Options for Markdown synchronization hooks/composables/runes.

```typescript
interface VizelMarkdownSyncOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Transform diagram code blocks when setting markdown (default: true) */
  transformDiagrams?: boolean;
}
```

## VizelMarkdownSyncResult

Return type that Markdown synchronization hooks/composables/runes provide.

```typescript
interface VizelMarkdownSyncResult {
  /** Current Markdown content */
  markdown: string;
  
  /** Update editor content from Markdown */
  setMarkdown: (markdown: string) => void;
  
  /** Whether a sync operation is pending */
  isPending: boolean;
}
```

## Markdown Utilities

These utility functions help you work with Markdown content.

```typescript
// Get Markdown from editor (preferred)
const markdown = editor.getMarkdown();

// Set editor content from Markdown
import { setVizelMarkdown } from '@vizel/core';
setVizelMarkdown(editor, '# Hello World');

// Parse Markdown to JSONContent (without an editor)
import { parseVizelMarkdown } from '@vizel/core';
const json = parseVizelMarkdown('# Hello World');
```
