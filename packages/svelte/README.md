# @vizel/svelte

Svelte 5 components and runes for Vizel block-based Markdown editor.

## Installation

```bash
npm install @vizel/svelte
```

## Requirements

- Svelte 5+

## Usage

### Basic Setup

```svelte
<script lang="ts">
import { Vizel } from "@vizel/svelte";
import "@vizel/core/styles.css";
</script>

<Vizel placeholder="Type '/' for commands..." />
```

### With Editor Control

```svelte
<script lang="ts">
import { VizelEditor, VizelBubbleMenu, createVizelEditor } from "@vizel/svelte";
import "@vizel/core/styles.css";

const editor = createVizelEditor({
  features: {
    image: { onUpload: async (file) => "https://example.com/image.png" },
  },
});
</script>

<VizelEditor editor={editor.current} />
{#if editor.current}
  <VizelBubbleMenu editor={editor.current} />
{/if}
```

### Markdown Import/Export

```svelte
<script lang="ts">
import { createVizelEditor, createVizelMarkdown } from "@vizel/svelte";

const editor = createVizelEditor();
const md = createVizelMarkdown(() => editor.current);

// Access: md.markdown, md.setMarkdown(value)
</script>
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
| `VizelToolbar` | Fixed toolbar |
| `VizelToolbarDefault` | Default toolbar layout |
| `VizelToolbarButton` | Toolbar button |
| `VizelToolbarDivider` | Toolbar divider |
| `VizelLinkEditor` | Link editing popover |
| `VizelNodeSelector` | Node type selector |
| `VizelColorPicker` | Color picker |
| `VizelFindReplace` | Find and replace panel |
| `VizelSaveIndicator` | Auto-save status indicator |
| `VizelEmbedView` | Embed content viewer |
| `VizelIconProvider` | Custom icon provider |
| `VizelThemeProvider` | Theme provider |
| `VizelProvider` | Editor context provider |
| `VizelPortal` | Portal component |

## Runes

| Rune | Description |
|------|-------------|
| `createVizelEditor` | Create and manage editor instance |
| `createVizelEditorState` | Track editor state changes |
| `createVizelState` | Trigger reactivity on editor updates |
| `createVizelMarkdown` | Two-way Markdown synchronization |
| `createVizelAutoSave` | Auto-save to localStorage or custom backend |
| `createVizelCollaboration` | Real-time collaboration management |
| `createVizelComment` | Comment and annotation management |
| `createVizelVersionHistory` | Document version history |
| `getVizelContext` | Access editor from context |
| `getVizelTheme` | Access theme from context |

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
