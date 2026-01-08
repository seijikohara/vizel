# Editor Types

Core editor options, content format, and state types.

## VizelEditorOptions

Main configuration options for creating an editor.

```typescript
interface VizelEditorOptions {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  
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

Editor state object returned by `getVizelEditorState()`.

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

Selection range type used in commands.

```typescript
interface VizelRange {
  from: number;
  to: number;
}
```

## VizelEmbedData

Data structure for embedded content.

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
