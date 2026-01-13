---
layout: home

hero:
  name: Vizel
  text: Block-based Visual Editor
  tagline: A Markdown editor built with Tiptap for React 19, Vue 3, and Svelte 5
  image:
    src: /logo.svg
    alt: Vizel Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/seijikohara/vizel
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Block-based Editing
    details: Block-based editing with slash commands, drag-and-drop reordering, and a bubble menu for inline formatting.
    link: /guide/features
    linkText: Features

  - title: Markdown Support
    details: Markdown import and export. Switch between Markdown source and visual editing.
    link: /guide/configuration
    linkText: Configuration

  - title: Multi-Framework
    details: Supports React 19, Vue 3, and Svelte 5 with consistent APIs.
    link: /guide/react
    linkText: Framework Guides

  - title: Customizable
    details: Theming with CSS variables, custom extensions, and configurable features.
    link: /guide/theming
    linkText: Theming

  - title: Built-in Extensions
    details: Images, tables, code blocks, diagrams, math equations, and embeds.
    link: /guide/features
    linkText: Extensions

  - title: TypeScript
    details: Written in TypeScript with exported type definitions.
    link: /api/types
    linkText: Type Definitions
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  /* oklch: indigo-500 (#6366F1) -> oklch(0.623 0.214 259.815), purple-500 (#A855F7) -> oklch(0.627 0.265 303.9) */
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, oklch(0.623 0.214 259.815) 30%, oklch(0.627 0.265 303.9));
  --vp-home-hero-image-background-image: linear-gradient(-45deg, oklch(0.623 0.214 259.815) 50%, oklch(0.627 0.265 303.9) 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>

## Quick Start

Install Vizel for your framework:

::: code-group

```bash [React]
npm install @vizel/react
```

```bash [Vue]
npm install @vizel/vue
```

```bash [Svelte]
npm install @vizel/svelte
```

:::

## Basic Usage

::: code-group

```tsx [React]
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

```vue [Vue]
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
import '@vizel/core/styles.css';
</script>

<template>
  <Vizel
    placeholder="Type '/' for commands..."
    @update="({ editor }) => console.log(editor.getJSON())"
  />
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { Vizel } from '@vizel/svelte';
  import '@vizel/core/styles.css';
</script>

<Vizel
  placeholder="Type '/' for commands..."
  onUpdate={({ editor }) => console.log(editor.getJSON())}
/>
```

:::

## Feature Highlights

### Slash Commands

Type `/` to open the command menu:

- **Headings** - H1, H2, H3
- **Lists** - Bullet, Numbered, Task
- **Media** - Images, Embeds, Files
- **Advanced** - Tables, Code Blocks, Diagrams, Math

### Bubble Menu

Select text to display the bubble menu:

- **Bold**, *Italic*, ~~Strikethrough~~
- Links, Highlights, Code
- Text alignment

### Drag & Drop

Drag blocks by their handle to reorder content.

## Features

| Feature | Description |
|---------|-------------|
| Multi-framework | React 19, Vue 3, Svelte 5 |
| TypeScript | Type definitions included |
| Markdown | Import and export |
| Theming | CSS variables |
| Bundle size | Tree-shakeable |
| Extensions | Modular architecture |

## Community

- [GitHub Repository](https://github.com/seijikohara/vizel)
- [Issue Tracker](https://github.com/seijikohara/vizel/issues)
- [Discussions](https://github.com/seijikohara/vizel/discussions)

---

<div style="text-align: center; margin-top: 2rem;">
  <a href="./guide/getting-started" style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(120deg, oklch(0.623 0.214 259.815), oklch(0.627 0.265 303.9)); color: oklch(1 0 0); border-radius: 8px; text-decoration: none; font-weight: 600;">
    Getting Started
  </a>
</div>
