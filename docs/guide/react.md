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

Use the `Vizel` component:

```tsx
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';

function App() {
  return (
    <Vizel
      placeholder="Type '/' for commands..."
      onUpdate={({ editor }) => console.log(editor.getJSON())}
    />
  );
}
```

### Advanced Setup

To customize, use individual components with hooks:

```tsx
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from '@vizel/react';
import '@vizel/core/styles.css';

function Editor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
  });

  return (
    <div className="editor-container">
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </div>
  );
}
```

## Components

### Vizel

All-in-one editor component with built-in bubble menu.

```tsx
import { Vizel } from '@vizel/react';

<Vizel
  initialContent={{ type: 'doc', content: [] }}
  placeholder="Start writing..."
  editable={true}
  autofocus="end"
  showBubbleMenu={true}
  enableEmbed={true}
  className="my-editor"
  features={{
    image: { onUpload: async (file) => 'url' },
  }}
  onUpdate={({ editor }) => {}}
  onCreate={({ editor }) => {}}
  onFocus={({ editor }) => {}}
  onBlur={({ editor }) => {}}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial content (JSON) |
| `initialMarkdown` | `string` | - | Initial content (Markdown) |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus |
| `features` | `VizelFeatureOptions` | - | Feature options |
| `className` | `string` | - | CSS class |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu |
| `enableEmbed` | `boolean` | - | Enable embed in links |
| `onUpdate` | `Function` | - | Update callback |
| `onCreate` | `Function` | - | Create callback |
| `onFocus` | `Function` | - | Focus callback |
| `onBlur` | `Function` | - | Blur callback |

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

  return <VizelEditor editor={editor} />;
}
```

#### Options

See [Configuration](/guide/configuration) for full options.

#### Return Value

Returns `Editor | null`. The editor instance is `null` during SSR and before initialization.

### useVizelState

Forces component re-render on editor state changes.

```tsx
import { useVizelState } from '@vizel/react';

function EditorStats({ editor }) {
  // Re-renders when editor state changes
  useVizelState(() => editor);

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

### useVizelAutoSave

Automatically saves editor content.

```tsx
import { useVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/react';

function Editor() {
  const editor = useVizelEditor();

  const { status, lastSaved, save, restore } = useVizelAutoSave(() => editor, {
    debounceMs: 2000,
    storage: 'localStorage',
    key: 'my-editor-content',
    onSave: (content) => console.log('Saved'),
    onError: (error) => console.error('Save failed', error),
  });

  return (
    <div>
      <VizelEditor editor={editor} />
      <VizelSaveIndicator status={status} lastSaved={lastSaved} />
    </div>
  );
}
```

### useVizelMarkdown

Two-way Markdown synchronization with debouncing.

```tsx
import { useVizelEditor, useVizelMarkdown, VizelEditor } from '@vizel/react';

function MarkdownEditor() {
  const editor = useVizelEditor();
  const { markdown, setMarkdown, isPending } = useVizelMarkdown(() => editor, {
    debounceMs: 300, // default: 300ms
  });

  return (
    <div>
      <VizelEditor editor={editor} />
      <textarea 
        value={markdown} 
        onChange={(e) => setMarkdown(e.target.value)}
      />
      {isPending && <span>Syncing...</span>}
    </div>
  );
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `string` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `boolean` | Whether sync is pending |

### useVizelTheme

Access theme state within VizelThemeProvider.

```tsx
import { useVizelTheme, VizelThemeProvider } from '@vizel/react';

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useVizelTheme();

  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

function App() {
  return (
    <VizelThemeProvider defaultTheme="system">
      <Editor />
      <ThemeToggle />
    </VizelThemeProvider>
  );
}
```

## Components

### VizelEditor

Renders the editor content area.

```tsx
<VizelEditor 
  editor={editor} 
  className="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `className` | `string` | Custom class name |

### VizelBubbleMenu

Floating bubble menu on text selection.

```tsx
<VizelBubbleMenu 
  editor={editor}
  className="my-bubble-menu"
  showDefaultMenu={true}
  updateDelay={100}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `className` | `string` | - | Custom class name |
| `showDefaultMenu` | `boolean` | `true` | Show default bubble menu |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### VizelThemeProvider

Provides theme context.

```tsx
<VizelThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  disableTransitionOnChange={false}
>
  {children}
</VizelThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### VizelSaveIndicator

Displays save status.

```tsx
<VizelSaveIndicator 
  status={status} 
  lastSaved={lastSaved}
  className="my-indicator"
/>
```

### VizelPortal

Renders children in a portal.

```tsx
<VizelPortal container={document.body}>
  <div className="my-overlay">Content</div>
</VizelPortal>
```

## Patterns

### Working with Markdown

```tsx
import { Vizel } from '@vizel/react';

// Simple: initialMarkdown prop
function SimpleMarkdownEditor() {
  return (
    <Vizel 
      initialMarkdown="# Hello World\n\nStart editing..."
      onUpdate={({ editor }) => {
        // Get markdown using core utility
        import { getVizelMarkdown } from '@vizel/core';
        const md = getVizelMarkdown(editor);
        console.log(md);
      }}
    />
  );
}

// Advanced: Two-way sync with useVizelMarkdown
function TwoWayMarkdownSync() {
  const editor = useVizelEditor({
    initialMarkdown: '# Hello',
  });
  const { markdown, setMarkdown, isPending } = useVizelMarkdown(() => editor);

  return (
    <div className="split-view">
      <VizelEditor editor={editor} />
      <div>
        <textarea 
          value={markdown} 
          onChange={(e) => setMarkdown(e.target.value)} 
        />
        {isPending && <span>Syncing...</span>}
      </div>
    </div>
  );
}
```

### Controlled Content (JSON)

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

  return <VizelEditor editor={editor} />;
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
      <VizelEditor editor={editor} />
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
      <VizelEditor editor={editor} />
    </div>
  );
}
```

### Custom Bubble Menu

```tsx
function CustomBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="bubble-menu">
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

import { VizelEditor, useVizelEditor } from '@vizel/react';

export function Editor() {
  const editor = useVizelEditor();
  return <VizelEditor editor={editor} />;
}
```

## Next Steps

- [Configuration](/guide/configuration) - Editor options
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/react)
