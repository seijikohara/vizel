# @vizel/react

React 19 components and hooks for Vizel block-based Markdown editor.

## Installation

```bash
npm install @vizel/react
```

`@vizel/core`, the required `@tiptap/*` packages, and ProseMirror are declared as peer dependencies and are installed automatically by npm 7+, pnpm, and yarn. Add them to your own `package.json` only if you want to pin specific versions. `@vizel/core` still appears in style imports because CSS cannot be re-exported across packages.

Optional features require extra packages installed manually:

- Code highlighting: `lowlight`
- Math: `katex`
- Diagrams: `mermaid`, `@hpcc-js/wasm-graphviz`
- Collaboration: `yjs`, `y-websocket`

## Requirements

- React 19+ and React DOM 19+
- Any ESM-compatible bundler (verified against Vite 8, Next.js 15, esbuild)

## Usage

### Basic Setup

```tsx
import { Vizel } from "@vizel/react";
import "@vizel/core/styles.css";

function App() {
  return <Vizel placeholder="Type '/' for commands..." />;
}
```

### With Editor Control

```tsx
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from "@vizel/react";
import "@vizel/core/styles.css";

function App() {
  const editor = useVizelEditor({
    features: {
      image: { onUpload: async (file) => "https://example.com/image.png" },
    },
  });

  return (
    <>
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </>
  );
}
```

### Markdown Import/Export

```tsx
import { useVizelEditor, useVizelMarkdown } from "@vizel/react";

function App() {
  const editor = useVizelEditor();
  const { markdown, setMarkdown } = useVizelMarkdown(() => editor);

  return <VizelEditor editor={editor} />;
}
```

## Components

| Component | Description |
|-----------|-------------|
| `Vizel` | All-in-one editor with bubble menu and optional toolbar |
| `VizelEditor` | Editor component |
| `VizelBubbleMenu` | Floating formatting toolbar |
| `VizelBubbleMenuDefault` | Default bubble menu layout |
| `VizelBubbleMenuButton` | Bubble menu button |
| `VizelBubbleMenuDivider` | Bubble menu divider |
| `VizelBubbleMenuColorPicker` | Bubble menu color picker |
| `VizelSlashMenu` | Slash command menu |
| `VizelSlashMenuItem` | Slash command menu item |
| `VizelSlashMenuEmpty` | Slash command empty state |
| `VizelBlockMenu` | Block context menu (drag handle click) |
| `VizelToolbar` | Fixed toolbar |
| `VizelToolbarDefault` | Default toolbar layout |
| `VizelToolbarButton` | Toolbar button |
| `VizelToolbarDivider` | Toolbar divider |
| `VizelToolbarDropdown` | Toolbar dropdown button |
| `VizelToolbarOverflow` | Toolbar overflow menu |
| `VizelMentionMenu` | @mention suggestion menu |
| `VizelLinkEditor` | Link editing popover |
| `VizelNodeSelector` | Node type selector |
| `VizelColorPicker` | Color picker |
| `VizelFindReplace` | Find and replace panel |
| `VizelSaveIndicator` | Auto-save status indicator |
| `VizelEmbedView` | Embed content viewer |
| `VizelIcon` | Icon component |
| `VizelIconProvider` | Custom icon provider |
| `VizelThemeProvider` | Theme provider |
| `VizelProvider` | Editor context provider |
| `VizelPortal` | Portal component |

## Hooks

| Hook | Description |
|------|-------------|
| `useVizelEditor` | Create and manage editor instance |
| `useVizelEditorState` | Track editor state changes |
| `useVizelState` | Trigger re-renders on editor updates |
| `useVizelMarkdown` | Two-way Markdown synchronization |
| `useVizelAutoSave` | Auto-save to localStorage or custom backend |
| `useVizelCollaboration` | Real-time collaboration management |
| `useVizelComment` | Comment and annotation management |
| `useVizelVersionHistory` | Document version history |
| `useVizelContext` | Access editor from context |
| `useVizelContextSafe` | Access editor from context (returns null outside provider) |
| `useVizelTheme` | Access theme from context |
| `useVizelIconContext` | Access icon context |

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
