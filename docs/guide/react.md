# React

React 19 components and hooks for Vizel editor.

## Installation

```bash
npm install @vizel/react
# or
bun add @vizel/react
```

::: info Requirements
- React 19
- React DOM 19
:::

## Quick Start

```tsx
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles.css';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
  });

  return (
    <div className="editor-container">
      <EditorContent editor={editor} />
      {editor && <BubbleMenu editor={editor} />}
    </div>
  );
}
```

## Hooks

### useVizelEditor

Creates and manages a Vizel editor instance.

```tsx
import { useVizelEditor } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor({
    initialContent: { type: 'doc', content: [] },
    placeholder: 'Start writing...',
    features: {
      markdown: true,
      mathematics: true,
    },
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
  });

  return <EditorContent editor={editor} />;
}
```

#### Options

See [Configuration](/guide/configuration) for full options.

#### Return Value

Returns `Editor | null`. The editor instance is `null` during SSR and before initialization.

### useEditorState

Forces component re-render on editor state changes.

```tsx
import { useEditorState } from '@vizel/react';

function EditorStats({ editor }) {
  // Re-renders when editor state changes
  useEditorState(editor);

  if (!editor) return null;

  return (
    <div>
      <span>{editor.storage.characterCount?.characters() ?? 0} characters</span>
      <span>{editor.storage.characterCount?.words() ?? 0} words</span>
      <span>{editor.isFocused ? 'Focused' : 'Blurred'}</span>
    </div>
  );
}
```

### useAutoSave

Automatically saves editor content.

```tsx
import { useAutoSave } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor();

  const { status, lastSaved, save, restore } = useAutoSave(editor, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
    onSave: (content) => console.log('Saved'),
    onError: (error) => console.error('Save failed', error),
  });

  return (
    <div>
      <EditorContent editor={editor} />
      <SaveIndicator status={status} lastSaved={lastSaved} />
    </div>
  );
}
```

### useTheme

Access theme state within ThemeProvider.

```tsx
import { useTheme, ThemeProvider } from '@vizel/react';

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Editor />
      <ThemeToggle />
    </ThemeProvider>
  );
}
```

## Components

### EditorContent

Renders the editor content area.

```tsx
<EditorContent 
  editor={editor} 
  className="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `className` | `string` | Custom class name |

### BubbleMenu

Floating toolbar on text selection.

```tsx
<BubbleMenu 
  editor={editor}
  className="my-bubble-menu"
  showDefaultToolbar={true}
  updateDelay={100}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | Custom class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### ThemeProvider

Provides theme context.

```tsx
<ThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### SaveIndicator

Displays save status.

```tsx
<SaveIndicator 
  status={status} 
  lastSaved={lastSaved}
  className="my-indicator"
/>
```

### Portal

Renders children in a portal.

```tsx
<Portal container={document.body}>
  <div className="my-overlay">Content</div>
</Portal>
```

## Patterns

### Controlled Content

```tsx
function ControlledEditor() {
  const [content, setContent] = useState<JSONContent>({
    type: 'doc',
    content: [],
  });

  const editor = useVizelEditor({
    initialContent: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
  });

  return <EditorContent editor={editor} />;
}
```

### With Form

```tsx
function EditorForm() {
  const editor = useVizelEditor();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editor) {
      const content = editor.getJSON();
      // Submit content
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <EditorContent editor={editor} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Ref

```tsx
function EditorWithRef() {
  const editorRef = useRef<Editor | null>(null);
  
  const editor = useVizelEditor({
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
  });

  const focusEditor = () => {
    editorRef.current?.commands.focus();
  };

  return (
    <div>
      <button onClick={focusEditor}>Focus</button>
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Custom Toolbar

```tsx
function CustomToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
      >
        Italic
      </button>
      <button onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </button>
      <button onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </button>
    </div>
  );
}
```

## SSR Considerations

The editor is client-side only. Use dynamic import or check for browser:

```tsx
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});
```

Or with a client boundary:

```tsx
'use client';

import { EditorContent, useVizelEditor } from '@vizel/react';

export function Editor() {
  const editor = useVizelEditor();
  return <EditorContent editor={editor} />;
}
```

## Next Steps

- [Configuration](/guide/configuration) - Full options reference
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/react) - Complete API documentation
