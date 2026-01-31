# @vizel/react

React components for Vizel block-based Markdown editor.

## Installation

```bash
npm install @vizel/react
```

## Requirements

- React 19+
- React DOM 19+

## Usage

### Basic Setup

```tsx
import { Vizel } from "@vizel/react";
import "@vizel/core/styles.css";

function App() {
  return <Vizel />;
}
```

### With Editor Control

```tsx
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from "@vizel/react";
import "@vizel/core/styles.css";

function App() {
  const editor = useVizelEditor();

  return (
    <>
      <VizelEditor editor={editor} />
      <VizelBubbleMenu editor={editor} />
    </>
  );
}
```

### Markdown Import/Export

```tsx
import { useVizelEditor, useVizelMarkdown } from "@vizel/react";

function App() {
  const editor = useVizelEditor();
  const { getMarkdown, setMarkdown } = useVizelMarkdown(() => editor);

  const handleExport = () => {
    const markdown = getMarkdown();
    console.log(markdown);
  };

  return <VizelEditor editor={editor} />;
}
```

## Components

| Component | Description |
|-----------|-------------|
| `Vizel` | All-in-one editor with bubble menu |
| `VizelEditor` | Editor component |
| `VizelBubbleMenu` | Floating formatting toolbar |
| `VizelSlashMenu` | Slash command menu |
| `VizelIconProvider` | Custom icon provider |

## Hooks

| Hook | Description |
|------|-------------|
| `useVizelEditor` | Create and manage editor instance |
| `useVizelMarkdown` | Markdown import/export |
| `useVizelAutoSave` | Auto-save functionality |
| `useVizelState` | Editor state management |

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
