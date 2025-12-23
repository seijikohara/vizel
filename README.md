# Vizel

A Notion-style visual editor built with [Tiptap](https://tiptap.dev/), supporting React, Vue, and Svelte.

## Packages

| Package | Description |
|---------|-------------|
| `@vizel/core` | Framework-agnostic core with Tiptap extensions |
| `@vizel/react` | React components and hooks |
| `@vizel/vue` | Vue components and composables (coming soon) |
| `@vizel/svelte` | Svelte components (coming soon) |
| `@vizel/styles` | Optional Tailwind-based styles (coming soon) |

## Installation

```bash
# React
bun add @vizel/react

# or with npm
npm install @vizel/react
```

## Usage (React)

```tsx
import { EditorRoot, EditorContent, useVizelEditor } from '@vizel/react';

function MyEditor() {
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
  });

  return (
    <EditorRoot editor={editor}>
      <EditorContent className="prose" />
    </EditorRoot>
  );
}
```

## Development

```bash
# Install dependencies
bun install

# Run demo
bun run dev

# Type check all packages
bun run typecheck
```

## Features

- Rich text formatting (bold, italic, underline, strikethrough)
- Headings (H1-H3)
- Lists (bullet, numbered, todo)
- Blockquotes and code blocks
- Markdown shortcuts
- Slash commands (coming soon)
- Bubble menu (coming soon)
- Image upload (coming soon)

## License

MIT
