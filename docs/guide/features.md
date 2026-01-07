# Features

Vizel provides a modular feature system. Each feature can be enabled, disabled, or customized through the `features` option.

## Feature Overview

```mermaid
graph TB
    subgraph default["Enabled by Default"]
        SlashCommand["Slash Commands"]
        Table["Tables"]
        Image["Images"]
        CodeBlock["Code Blocks"]
        DragHandle["Drag Handle"]
        CharCount["Character Count"]
        TextColor["Text Color"]
        TaskList["Task Lists"]
        Link["Links"]
    end

    subgraph optional["Opt-in Features"]
        Markdown["Markdown"]
        Math["Mathematics"]
        Embed["Embeds"]
        Details["Details"]
        Diagram["Diagrams"]
    end
```

| Feature | Default | Description |
|---------|:-------:|-------------|
| `slashCommand` | :white_check_mark: | Slash command menu (type `/` to open) |
| `table` | :white_check_mark: | Table editing support |
| `image` | :white_check_mark: | Image upload and resize |
| `codeBlock` | :white_check_mark: | Code blocks with syntax highlighting |
| `dragHandle` | :white_check_mark: | Drag handle for block reordering |
| `characterCount` | :white_check_mark: | Character and word counting |
| `textColor` | :white_check_mark: | Text color and highlight |
| `taskList` | :white_check_mark: | Checkbox task lists |
| `link` | :white_check_mark: | Link editing |
| `markdown` | :x: | Markdown import/export |
| `mathematics` | :x: | LaTeX math equations |
| `embed` | :x: | URL embeds (YouTube, etc.) |
| `details` | :x: | Collapsible content blocks |
| `diagram` | :x: | Mermaid/GraphViz diagrams |

## Disabling Features

Set a feature to `false` to disable it:

```typescript
const editor = useVizelEditor({
  features: {
    slashCommand: false,  // Disable slash commands
    dragHandle: false,    // Disable drag handle
    table: false,         // Disable tables
  },
});
```

---

## Slash Commands

Type `/` to open the command menu for quick block insertion.

### Options

| Property | Type | Description |
|----------|------|-------------|
| `items` | `SlashCommandItem[]` | Custom command items |
| `suggestion` | `object` | Suggestion configuration |

### Custom Commands

```typescript
import type { SlashCommandItem } from '@vizel/core';

const customItems: SlashCommandItem[] = [
  {
    title: 'Custom Block',
    description: 'Insert a custom block',
    icon: 'lucide:box',
    keywords: ['custom', 'block'],
    group: 'custom',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Custom content' }],
      }).run();
    },
  },
];

const editor = useVizelEditor({
  features: {
    slashCommand: {
      items: customItems, // Add custom items
    },
  },
});
```

### Default Commands

| Group | Commands |
|-------|----------|
| Text | Paragraph, Heading 1-3, Quote, Code |
| Lists | Bullet List, Numbered List, Task List |
| Media | Image, Horizontal Rule |
| Advanced | Details*, Embed*, Diagram*, Math Block* |

*Only shown when the feature is enabled.

---

## Images

Image support with drag & drop, paste, and resize functionality.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resize` | `boolean` | `true` | Enable image resizing |
| `onUpload` | `(file: File) => Promise<string>` | Base64 | Upload handler |
| `maxFileSize` | `number` | - | Max file size in bytes |
| `allowedTypes` | `string[]` | See below | Allowed MIME types |
| `onValidationError` | `(error) => void` | - | Validation error callback |
| `onUploadError` | `(error, file) => void` | - | Upload error callback |

### Default Allowed Types

```typescript
['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
```

### Example: Custom Upload

```typescript
const editor = useVizelEditor({
  features: {
    image: {
      onUpload: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const { url } = await res.json();
        return url;
      },
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      onValidationError: (error) => {
        if (error.type === 'file-too-large') {
          alert('File is too large. Maximum size is 5MB.');
        } else if (error.type === 'invalid-type') {
          alert('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }
      },
      onUploadError: (error, file) => {
        console.error(`Failed to upload ${file.name}:`, error);
        alert('Upload failed. Please try again.');
      },
    },
  },
});
```

---

## Code Blocks

Syntax-highlighted code blocks with language selection.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultLanguage` | `string` | `"plaintext"` | Default language |
| `lineNumbers` | `boolean` | `false` | Show line numbers |
| `lowlight` | `Lowlight` | All languages | Custom Lowlight instance |

### Example: Limited Languages

```typescript
import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);

const editor = useVizelEditor({
  features: {
    codeBlock: {
      defaultLanguage: 'typescript',
      lineNumbers: true,
      lowlight, // Only common languages
    },
  },
});
```

---

## Character Count

Track character and word counts.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| null` | `null` | Max characters (null = unlimited) |
| `mode` | `"textSize" \| "nodeSize"` | `"textSize"` | Counting mode |
| `wordCounter` | `(text: string) => number` | - | Custom word counter |

### Example: Character Limit

```typescript
const editor = useVizelEditor({
  features: {
    characterCount: {
      limit: 10000, // Max 10,000 characters
      mode: 'textSize',
    },
  },
});

// Access counts
const chars = editor.storage.characterCount.characters();
const words = editor.storage.characterCount.words();
const limit = editor.storage.characterCount.limit;
const percentage = (chars / limit) * 100;
```

---

## Text Color & Highlight

Text color and background highlight support.

### Options

| Property | Type | Description |
|----------|------|-------------|
| `textColors` | `ColorDefinition[]` | Custom text color palette |
| `highlightColors` | `ColorDefinition[]` | Custom highlight color palette |
| `multicolor` | `boolean` | Enable multicolor highlights |

### Custom Color Palette

```typescript
import type { ColorDefinition } from '@vizel/core';

const customColors: ColorDefinition[] = [
  { name: 'Brand', color: '#6366f1' },
  { name: 'Success', color: '#22c55e' },
  { name: 'Warning', color: '#f59e0b' },
  { name: 'Error', color: '#ef4444' },
];

const editor = useVizelEditor({
  features: {
    textColor: {
      textColors: customColors,
      highlightColors: customColors.map(c => ({
        ...c,
        color: `${c.color}40`, // Add transparency
      })),
    },
  },
});
```

---

## Markdown

Enable Markdown import/export.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `indentation` | `{ style, size }` | `{ style: 'space', size: 2 }` | Indentation config |
| `gfm` | `boolean` | `true` | GitHub Flavored Markdown |
| `breaks` | `boolean` | `false` | Convert newlines to `<br>` |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    markdown: {
      gfm: true,
      breaks: false,
      indentation: {
        style: 'space',
        size: 2,
      },
    },
  },
});

// Export to Markdown
const md = editor.storage.markdown.getMarkdown();

// Import from Markdown
editor.commands.setContent(
  editor.storage.markdown.parseMarkdown('# Hello\n\nWorld')
);
```

---

## Mathematics

LaTeX math equations rendered with KaTeX.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `katexOptions` | `KatexOptions` | `{}` | KaTeX rendering options |
| `inlineInputRules` | `boolean` | `true` | Enable `$...$` input rules |
| `blockInputRules` | `boolean` | `true` | Enable `$$...$$` input rules |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    mathematics: {
      katexOptions: {
        throwOnError: false,
        strict: false,
      },
      inlineInputRules: true,
      blockInputRules: true,
    },
  },
});
```

### Usage

- Inline math: Type `$E=mc^2$` and press space
- Block math: Type `$$` on a new line, enter equation, type `$$`

---

## Embeds

Embed external content from URLs (YouTube, Vimeo, Twitter, etc.).

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fetchEmbedData` | `Function` | Built-in | Custom fetch function |
| `providers` | `EmbedProvider[]` | Default providers | Custom/additional providers |
| `pasteHandler` | `boolean` | `true` | Auto-embed pasted URLs |
| `inline` | `boolean` | `false` | Inline vs block embeds |

### Default Providers

- YouTube
- Vimeo
- Twitter/X
- CodePen
- CodeSandbox
- Figma
- Loom
- Spotify

### Example: Custom Provider

```typescript
import type { EmbedProvider } from '@vizel/core';

const customProvider: EmbedProvider = {
  name: 'MyService',
  pattern: /^https?:\/\/myservice\.com\/embed\/(\w+)/,
  transform: (url, match) => ({
    type: 'iframe',
    url: `https://myservice.com/embed/${match[1]}`,
    width: 640,
    height: 360,
  }),
};

const editor = useVizelEditor({
  features: {
    embed: {
      providers: [customProvider],
      pasteHandler: true,
    },
  },
});
```

---

## Details

Collapsible content blocks (accordion/disclosure).

### Options

| Property | Type | Description |
|----------|------|-------------|
| `details` | `object` | Details container options |
| `detailsContent` | `object` | Content area options |
| `detailsSummary` | `object` | Summary/header options |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    details: true, // Enable with defaults
  },
});
```

### Usage

Use the slash command `/details` or `/toggle` to insert a collapsible block.

---

## Diagrams

Mermaid and GraphViz diagram support.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mermaidConfig` | `MermaidConfig` | `{}` | Mermaid configuration |
| `graphvizEngine` | `string` | `"dot"` | GraphViz layout engine |
| `defaultType` | `"mermaid" \| "graphviz"` | `"mermaid"` | Default diagram type |
| `defaultCode` | `string` | - | Default Mermaid code |
| `defaultGraphvizCode` | `string` | - | Default GraphViz code |

### GraphViz Engines

- `dot` - Hierarchical (default)
- `neato` - Spring model
- `fdp` - Force-directed
- `sfdp` - Scalable force-directed
- `twopi` - Radial
- `circo` - Circular

### Example

```typescript
const editor = useVizelEditor({
  features: {
    diagram: {
      mermaidConfig: {
        theme: 'neutral',
        securityLevel: 'loose',
      },
      defaultType: 'mermaid',
      defaultCode: `graph TD
    A[Start] --> B[End]`,
    },
  },
});
```

---

## Links

Link editing and auto-linking.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `openOnClick` | `boolean` | `true` | Open links on click |
| `autolink` | `boolean` | `true` | Auto-link URLs while typing |
| `linkOnPaste` | `boolean` | `true` | Link pasted URLs |
| `defaultProtocol` | `string` | `"https"` | Default protocol |
| `HTMLAttributes` | `object` | - | HTML attributes for links |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    link: {
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    },
  },
});
```

---

## Task Lists

Checkbox task lists for to-do items.

### Options

| Property | Type | Description |
|----------|------|-------------|
| `taskList` | `TaskListOptions` | Task list container options |
| `taskItem` | `TaskItemOptions` | Task item options |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    taskList: {
      taskItem: {
        nested: true, // Allow nested task lists
      },
    },
  },
});
```

---

## Drag Handle

Visual handle for drag-and-drop block reordering.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Show drag handle |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    dragHandle: {
      enabled: true,
    },
  },
});
```

---

## Next Steps

- [Theming](/guide/theming) - Customize the appearance
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [API Reference](/api/) - Complete API documentation
