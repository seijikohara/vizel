# @vizel/svelte

Svelte 5 components for Vizel block-based Markdown editor.

## Installation

```bash
npm install @vizel/svelte @vizel/core
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

<Vizel />
```

### With Editor Control

```svelte
<script lang="ts">
import { VizelEditor, VizelBubbleMenu, createVizelEditor } from "@vizel/svelte";
import "@vizel/core/styles.css";

const editor = createVizelEditor();
</script>

<VizelEditor editor={editor.current} />
<VizelBubbleMenu editor={editor.current} />
```

### Markdown Import/Export

```svelte
<script lang="ts">
import { createVizelEditor, createVizelMarkdown } from "@vizel/svelte";

const editor = createVizelEditor();
const { getMarkdown, setMarkdown } = createVizelMarkdown(() => editor.current);

const handleExport = () => {
  const markdown = getMarkdown();
  console.log(markdown);
};
</script>
```

## Components

| Component | Description |
|-----------|-------------|
| `Vizel` | All-in-one editor with bubble menu |
| `VizelEditor` | Editor component |
| `VizelBubbleMenu` | Floating formatting toolbar |
| `VizelSlashMenu` | Slash command menu |
| `VizelIconProvider` | Custom icon provider |

## Runes

| Rune | Description |
|------|-------------|
| `createVizelEditor` | Create and manage editor instance |
| `createVizelMarkdown` | Markdown import/export |
| `createVizelAutoSave` | Auto-save functionality |
| `createVizelState` | Editor state management |

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
