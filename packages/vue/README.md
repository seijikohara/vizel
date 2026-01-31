# @vizel/vue

Vue 3 components for Vizel block-based Markdown editor.

## Installation

```bash
npm install @vizel/vue
```

## Requirements

- Vue 3.4+

## Usage

### Basic Setup

```vue
<script setup lang="ts">
import { Vizel } from "@vizel/vue";
import "@vizel/core/styles.css";
</script>

<template>
  <Vizel />
</template>
```

### With Editor Control

```vue
<script setup lang="ts">
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from "@vizel/vue";
import "@vizel/core/styles.css";

const editor = useVizelEditor();
</script>

<template>
  <VizelEditor :editor="editor" />
  <VizelBubbleMenu :editor="editor" />
</template>
```

### Markdown Import/Export

```vue
<script setup lang="ts">
import { useVizelEditor, useVizelMarkdown } from "@vizel/vue";

const editor = useVizelEditor();
const { getMarkdown, setMarkdown } = useVizelMarkdown(() => editor.value);

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

## Composables

| Composable | Description |
|------------|-------------|
| `useVizelEditor` | Create and manage editor instance |
| `useVizelMarkdown` | Markdown import/export |
| `useVizelAutoSave` | Auto-save functionality |
| `useVizelState` | Editor state management |

## Documentation

See the [main repository](https://github.com/seijikohara/vizel) for full documentation.

## License

MIT
