# Wiki Links

Vizel supports wiki-style internal links using `[[page-name]]` syntax, enabling knowledge base and note-taking use cases.

## Overview

Wiki links provide:

- **`[[page]]` syntax** — quickly link between pages by typing double brackets
- **Display text aliases** — `[[page|custom text]]` for custom link labels
- **Visual differentiation** — existing vs non-existing page styling
- **Custom link resolution** — control where links point to
- **Click handling** — intercept clicks for SPA navigation

::: info
Wiki links are **disabled by default**. Enable them via the `wikiLink` feature option.
:::

## Quick Start

### Enable Wiki Links

```typescript
import { useVizelEditor } from "@vizel/react";

const editor = useVizelEditor({
  features: {
    wikiLink: true,
  },
});
```

### With Custom Options

```typescript
const editor = useVizelEditor({
  features: {
    wikiLink: {
      resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
      pageExists: (page) => knownPages.has(page),
      onLinkClick: (page) => router.push(`/wiki/${page}`),
    },
  },
});
```

## Syntax

Type double brackets to create a wiki link:

| Input | Result |
|-------|--------|
| `[[My Page]]` | Link to "My Page" with "My Page" as display text |
| `[[My Page\|Custom Label]]` | Link to "My Page" with "Custom Label" as display text |

Vizel automatically creates the link when you close the double brackets (`]]`).

## Options

```typescript
interface VizelWikiLinkOptions {
  /** Resolve a page name to a URL (default: `#pageName`) */
  resolveLink?: (pageName: string) => string;
  /** Check if a page exists (default: `() => true`) */
  pageExists?: (pageName: string) => boolean;
  /** Get page suggestions for autocomplete */
  getPageSuggestions?: (query: string) => VizelWikiLinkSuggestion[];
  /** Callback when a wiki link is clicked */
  onLinkClick?: (pageName: string, event: MouseEvent) => void;
  /** CSS class for existing page links */
  existingClass?: string;
  /** CSS class for non-existing page links */
  newClass?: string;
  /** Additional HTML attributes */
  HTMLAttributes?: Record<string, unknown>;
}
```

### `resolveLink`

Converts a page name to a URL. Vizel uses this value for the `href` attribute on rendered links.

```typescript
{
  wikiLink: {
    resolveLink: (page) => `/docs/${page.toLowerCase().replace(/\s+/g, "-")}`,
  },
}
```

### `pageExists`

Determines if a linked page exists. This function controls visual styling: existing pages display a solid underline, and non-existing pages display a dashed underline with muted color.

```typescript
const existingPages = new Set(["Getting Started", "API Reference", "FAQ"]);

{
  wikiLink: {
    pageExists: (page) => existingPages.has(page),
  },
}
```

### `onLinkClick`

Intercepts wiki link clicks for client-side navigation. Without this callback, links follow standard browser navigation using the `href` from `resolveLink`.

```typescript
{
  wikiLink: {
    onLinkClick: (pageName, event) => {
      // SPA navigation
      router.push(`/wiki/${pageName}`);
    },
  },
}
```

### `getPageSuggestions`

Provides autocomplete suggestions. You can use this callback for future autocomplete UI integration.

```typescript
{
  wikiLink: {
    getPageSuggestions: (query) =>
      allPages
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10),
  },
}
```

## Commands

The wiki link extension provides two editor commands:

```typescript
// Insert a wiki link
editor.commands.setWikiLink("My Page");

// Insert with custom display text
editor.commands.setWikiLink("My Page", "Click here");

// Remove wiki link mark from selection
editor.commands.unsetWikiLink();
```

## Styling

Wiki links use these CSS classes:

| Class | Description |
|-------|-------------|
| `.vizel-wiki-link` | Base wiki link style |
| `.vizel-wiki-link--existing` | Existing page (solid underline) |
| `.vizel-wiki-link--new` | Non-existing page (dashed underline, muted color) |

### Custom Styling

You can override the default styles with CSS custom properties:

```css
.vizel-wiki-link {
  color: var(--vizel-primary);
  border-bottom: 1px dashed var(--vizel-primary);
}

.vizel-wiki-link--new {
  color: var(--vizel-muted-foreground);
  border-bottom-color: var(--vizel-muted-foreground);
}
```

## Framework Integration

### React

```tsx
import { useVizelEditor, VizelProvider, VizelEditor } from "@vizel/react";

function WikiEditor() {
  const knownPages = new Set(["Home", "About", "Contact"]);

  const editor = useVizelEditor({
    features: {
      wikiLink: {
        resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
        pageExists: (page) => knownPages.has(page),
        onLinkClick: (page) => {
          console.log(`Navigate to: ${page}`);
        },
      },
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { useVizelEditor, VizelProvider, VizelEditor } from "@vizel/vue";

const knownPages = new Set(["Home", "About", "Contact"]);

const editor = useVizelEditor({
  features: {
    wikiLink: {
      resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
      pageExists: (page) => knownPages.has(page),
      onLinkClick: (page) => {
        console.log(`Navigate to: ${page}`);
      },
    },
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { createVizelEditor, VizelProvider, VizelEditor } from "@vizel/svelte";

const knownPages = new Set(["Home", "About", "Contact"]);

const editor = createVizelEditor({
  features: {
    wikiLink: {
      resolveLink: (page) => `/wiki/${encodeURIComponent(page)}`,
      pageExists: (page) => knownPages.has(page),
      onLinkClick: (page) => {
        console.log(`Navigate to: ${page}`);
      },
    },
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
```

## Advanced Usage

### Standalone Extension

For advanced setups, you can use the extension directly instead of the feature option:

```typescript
import { createVizelWikiLinkExtension } from "@vizel/core";

const editor = useVizelEditor({
  extensions: [
    createVizelWikiLinkExtension({
      resolveLink: (page) => `/wiki/${page}`,
    }),
  ],
});
```

### Backlink Tracking

You can track which pages link to a given page by inspecting the editor content:

```typescript
function getBacklinks(editor: Editor): string[] {
  const links: string[] = [];

  editor.state.doc.descendants((node) => {
    node.marks.forEach((mark) => {
      if (mark.type.name === "wikiLink" && mark.attrs.pageName) {
        links.push(mark.attrs.pageName as string);
      }
    });
    return true;
  });

  return [...new Set(links)];
}
```
