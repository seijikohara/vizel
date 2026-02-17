# Features

You can enable, disable, or customize each feature through the `features` option.

## Feature Overview

Vizel enables most features by default. Set any feature to `false` to disable it.

```mermaid
graph TB
    subgraph default["All Features (Enabled by Default)"]
        SlashCommand["Slash Commands"]
        Table["Tables"]
        ToC["Table of Contents"]
        Image["Images"]
        CodeBlock["Code Blocks"]
        DragHandle["Drag Handle & Block Menu"]
        CharCount["Character Count"]
        TextColor["Text Color"]
        TaskList["Task Lists"]
        Link["Links"]
        Markdown["Markdown"]
        Math["Mathematics"]
        Embed["Embeds"]
        Details["Details"]
        Callout["Callout"]
        Diagram["Diagrams"]
        Superscript["Superscript"]
        Subscript["Subscript"]
        Typography["Typography"]
    end
    subgraph opt["Opt-in Features"]
        WikiLink["Wiki Links"]
        Mention["@Mention"]
        Comment["Comments"]
        Collaboration["Collaboration"]
    end
```

| Feature | Description |
|---------|-------------|
| `slashCommand` | Slash command menu (type `/` to open) |
| `table` | Table editing support |
| `tableOfContents` | Auto-collected heading navigation block |
| `image` | Image upload and resize |
| `codeBlock` | Code blocks with syntax highlighting |
| `dragHandle` | Drag handle for block reordering |
| `characterCount` | Character and word counting |
| `textColor` | Text color and highlight |
| `taskList` | Checkbox task lists |
| `link` | Link editing |
| `markdown` | Markdown import/export |
| `mathematics` | LaTeX math equations |
| `embed` | URL embeds (YouTube, etc.) |
| `details` | Collapsible content blocks |
| `callout` | Info, warning, danger, tip, and note admonition blocks |
| `diagram` | Mermaid/GraphViz diagrams |
| `superscript` | Superscript text formatting |
| `subscript` | Subscript text formatting |
| `typography` | Smart quotes, em dashes, and other typographic transformations |
| `wikiLink` | Wiki-style internal links (`[[page-name]]`) — opt-in |
| `mention` | `@user` autocomplete — opt-in |
| `comment` | Text annotations and comments — opt-in |
| `collaboration` | Real-time collaboration mode (disables History) — opt-in |

## Markdown Flavor Selection

Vizel supports multiple Markdown output flavors to match the platform you are targeting. The `flavor` option controls how content is serialized when exporting Markdown; input parsing is always tolerant and accepts all formats regardless of the selected flavor.

### Available Flavors

| Flavor | Callout Output | WikiLink Output | Target Platforms |
|--------|---------------|-----------------|------------------|
| `"commonmark"` | Blockquote fallback | Standard link `[text](wiki://page)` | Stack Overflow, Reddit, email |
| `"gfm"` (default) | GitHub Alerts `> [!NOTE]` | Standard link `[text](wiki://page)` | GitHub, GitLab, DEV.to |
| `"obsidian"` | Obsidian Callouts `> [!note]` | `[[page]]` / `[[page\|text]]` | Obsidian, Logseq, Foam |
| `"docusaurus"` | Directives `:::note` | Standard link `[text](wiki://page)` | Docusaurus, VitePress, Zenn, Qiita |

### Usage

```typescript
const editor = useVizelEditor({
  flavor: 'obsidian', // Default: 'gfm'
});
```

### Extension-Specific Behavior

- **Callout**: Serializes admonition blocks in the format matching the selected flavor. All four callout formats are parsed regardless of flavor.
- **WikiLink**: When `flavor` is `"obsidian"`, wiki links serialize as `[[page]]` syntax. For all other flavors, they serialize as standard Markdown links `[text](wiki://page)`.
- **Mention**: Always serializes as `@username` regardless of flavor.

::: tip
You can override the flavor-driven defaults for individual extensions. For example, set `wikiLink.serializeAsWikiLink` or `callout.markdownFormat` explicitly to override the flavor configuration.
:::

---

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

Type `/` to open the command menu for block insertion.

### Options

| Property | Type | Description |
|----------|------|-------------|
| `items` | `VizelSlashCommandItem[]` | Custom command items |
| `suggestion` | `object` | Suggestion configuration |

### Custom Commands

```typescript
import type { VizelSlashCommandItem } from '@vizel/core';

const customItems: VizelSlashCommandItem[] = [
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
| Text | Heading 1, Heading 2, Heading 3 |
| Lists | Bullet List, Numbered List, Task List |
| Blocks | Quote, Divider, Details, Code Block, Table |
| Media | Image, Upload Image, Embed |
| Advanced | Math Equation, Inline Math, Mermaid Diagram, GraphViz Diagram |

---

## Images

The image feature supports drag and drop, paste, and resize.

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
        if (error.type === 'file_too_large') {
          alert('File is too large. Maximum size is 5MB.');
        } else if (error.type === 'invalid_type') {
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

This feature provides code blocks with syntax highlighting and language selection.

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

This feature tracks character and word counts.

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

This feature adds text color and background highlight support.

### Options

| Property | Type | Description |
|----------|------|-------------|
| `textColors` | `VizelColorDefinition[]` | Custom text color palette |
| `highlightColors` | `VizelColorDefinition[]` | Custom highlight color palette |
| `multicolor` | `boolean` | Enable multicolor highlights |

### Custom Color Palette

```typescript
import type { VizelColorDefinition } from '@vizel/core';

const customColors: VizelColorDefinition[] = [
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

This feature enables Markdown import/export.

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

::: tip Recommended API
Use `editor.getMarkdown()` for Markdown export:

```typescript
const md = editor.getMarkdown();
```

The `editor.storage.markdown.getMarkdown()` method is an internal storage accessor. Prefer `editor.getMarkdown()` for application code.
:::

---

## Mathematics

This feature renders LaTeX math equations with KaTeX.

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

This feature embeds content from URLs (YouTube, Vimeo, Twitter).

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fetchEmbedData` | `Function` | Built-in | Custom fetch function |
| `providers` | `VizelEmbedProvider[]` | Default providers | Custom/additional providers |
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
import type { VizelEmbedProvider } from '@vizel/core';

const customProvider: VizelEmbedProvider = {
  name: 'MyService',
  patterns: [/^https?:\/\/myservice\.com\/embed\/(\w+)/],
  transform: (url) => `https://myservice.com/embed/${url.split('/').pop()}`,
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

This feature provides collapsible content blocks (accordion/disclosure).

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

This feature supports Mermaid and GraphViz diagrams.

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

This feature provides link editing and auto-linking.

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

This feature adds checkbox task lists.

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

This feature provides a handle for drag-and-drop block reordering.

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

### Block Menu

Clicking the drag handle opens a context menu for the block. The menu provides:

- **Delete** — Remove the block
- **Duplicate** — Copy the block below
- **Copy** / **Cut** — Clipboard operations
- **Turn into** — Convert the block to a different type (heading, list, blockquote, etc.)

The block menu is automatically included in the `Vizel` all-in-one component. When using the composition pattern (`VizelEditor` + `VizelBubbleMenu`), add `VizelBlockMenu` explicitly:

```tsx
// React
import { VizelBlockMenu } from '@vizel/react';
<VizelBlockMenu />

// Vue
import { VizelBlockMenu } from '@vizel/vue';
<VizelBlockMenu />

// Svelte
import { VizelBlockMenu } from '@vizel/svelte';
<VizelBlockMenu />
```

---

## Wiki Links

This feature adds wiki-style `[[page-name]]` links for linking between pages. It supports display text aliases with `[[page-name|display text]]` syntax.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resolveLink` | `(pageName: string) => string` | `(p) => '#' + p` | Resolves a page name to a URL |
| `pageExists` | `(pageName: string) => boolean` | `() => true` | Checks if a page exists |
| `getPageSuggestions` | `(query: string) => VizelWikiLinkSuggestion[]` | - | Autocomplete suggestions |
| `onLinkClick` | `(pageName: string, event: MouseEvent) => void` | - | Click callback |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    wikiLink: {
      resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
      pageExists: (page) => knownPages.has(page),
    },
  },
});
```

See the [Wiki Links Guide](/guide/wiki-links) for detailed usage.

---

## Comments

This feature adds text annotation marks for reviewing and discussion.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable comment marks |

### Example

```typescript
const editor = useVizelEditor({
  features: {
    comment: true,
  },
});
```

Comment management (storage, replies, resolution) uses the framework-specific hooks/composables/runes. See the [Comments Guide](/guide/comments) for details.

---

## Collaboration

This feature enables real-time multi-user editing built on Yjs. When you enable it, Vizel disables the built-in History extension (Yjs handles undo/redo).

::: warning
This opt-in feature requires additional dependencies: `yjs`, a Yjs provider, `@tiptap/extension-collaboration`, and `@tiptap/extension-collaboration-cursor`.
:::

### Example

```typescript
const editor = useVizelEditor({
  features: {
    collaboration: true, // Disables History
  },
  extensions: [
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({ provider, user }),
  ],
});
```

See the [Collaboration Guide](/guide/collaboration) for setup instructions.

---

## Next Steps

- [Wiki Links](/guide/wiki-links) - Wiki-style internal links
- [Comments](/guide/comments) - Text annotations and comments
- [Version History](/guide/version-history) - Document snapshots
- [Collaboration](/guide/collaboration) - Real-time multi-user editing
- [Plugins](/guide/plugins) - Extend Vizel with plugins
- [Theming](/guide/theming) - Customize the appearance
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [API Reference](/api/)
