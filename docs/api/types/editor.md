# Editor Types

Core editor options, content format, and state types.

## VizelEditorOptions

Main configuration options for creating an editor.

```typescript
interface VizelEditorOptions {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  
  /** Initial content in Markdown format */
  initialMarkdown?: string;
  
  /** Placeholder text when editor is empty */
  placeholder?: string;
  
  /** Whether the editor is editable */
  editable?: boolean;
  
  /** Auto focus behavior on mount */
  autofocus?: boolean | 'start' | 'end' | 'all' | number;
  
  /** Feature configuration */
  features?: VizelFeatureOptions;
  
  /** Additional Tiptap extensions */
  extensions?: Extensions;
  
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
}
```

::: tip Markdown vs JSON
If both `initialContent` and `initialMarkdown` are provided, `initialContent` takes precedence.
Using `initialMarkdown` is recommended for most use cases as it's more human-readable.
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

## VizelRange

Selection range type that commands use.

```typescript
interface VizelRange {
  from: number;
  to: number;
}
```

## VizelEmbedData

Data structure that represents embedded content.

```typescript
interface VizelEmbedData {
  type: 'iframe' | 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  html?: string;
}
```

## VizelMarkdownSyncOptions

Options for Markdown synchronization hooks/composables/runes.

```typescript
interface VizelMarkdownSyncOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
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
import { 
  getVizelMarkdown, 
  setVizelMarkdown, 
  parseVizelMarkdown 
} from '@vizel/core';

// Get Markdown from editor
const markdown = getVizelMarkdown(editor);

// Set editor content from Markdown
setVizelMarkdown(editor, '# Hello World');

// Parse Markdown to JSONContent (without an editor)
const json = parseVizelMarkdown('# Hello World');
```
