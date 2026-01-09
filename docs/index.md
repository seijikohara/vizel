---
layout: home

hero:
  name: Vizel
  text: Block-based Visual Editor
  tagline: A powerful Markdown editor built with Tiptap, supporting React 19, Vue 3, and Svelte 5
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
  - icon: 📝
    title: Block-based Editing
    details: Intuitive block-based editing with slash commands, drag-and-drop reordering, and a bubble menu for inline formatting. Create rich content effortlessly.
    link: /guide/features
    linkText: Explore Features

  - icon: ✨
    title: Markdown Support
    details: Full Markdown import/export with real-time preview. Write in Markdown or use the visual editor - seamlessly switch between both.
    link: /guide/configuration
    linkText: Learn More

  - icon: ⚛️
    title: Multi-Framework Support
    details: First-class support for React 19, Vue 3, and Svelte 5 with consistent APIs and framework-specific optimizations.
    link: /guide/react
    linkText: Choose Your Framework

  - icon: 🎨
    title: Fully Customizable
    details: Extensive theming with CSS variables, custom extensions, and configurable features. Make it yours with minimal effort.
    link: /guide/theming
    linkText: Customize Theme

  - icon: 🔌
    title: Rich Extensions
    details: Built-in support for images, tables, code blocks, diagrams (Mermaid), math equations, embeds, and more.
    link: /guide/features
    linkText: View Extensions

  - icon: 📦
    title: TypeScript First
    details: Complete TypeScript support with comprehensive type definitions. Enjoy full IntelliSense and type safety.
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

Install Vizel for your preferred framework:

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

Type `/` to open the command menu and quickly insert blocks:

- **Headings** - H1, H2, H3
- **Lists** - Bullet, Numbered, Task
- **Media** - Images, Embeds, Files
- **Advanced** - Tables, Code Blocks, Diagrams, Math

### Bubble Menu

Select text to reveal the bubble menu:

- **Bold**, *Italic*, ~~Strikethrough~~
- Links, Highlights, Code
- Text alignment and more

### Drag & Drop

Grab any block by its handle and reorder your content with intuitive drag-and-drop.

## Why Vizel?

| Feature | Vizel | Other Editors |
|---------|-------|---------------|
| Multi-framework | React, Vue, Svelte | Usually single framework |
| TypeScript | Full support | Partial or none |
| Markdown | Import/Export | Often limited |
| Theming | CSS Variables | Complex overrides |
| Bundle Size | Tree-shakeable | Often monolithic |
| Extensions | Modular | Tightly coupled |

## Community

- [GitHub Repository](https://github.com/seijikohara/vizel) - Star us on GitHub!
- [Issue Tracker](https://github.com/seijikohara/vizel/issues) - Report bugs or request features
- [Discussions](https://github.com/seijikohara/vizel/discussions) - Ask questions and share ideas

---

<div style="text-align: center; margin-top: 2rem;">
  <a href="./guide/getting-started" style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(120deg, oklch(0.623 0.214 259.815), oklch(0.627 0.265 303.9)); color: oklch(1 0 0); border-radius: 8px; text-decoration: none; font-weight: 600;">
    Get Started with Vizel →
  </a>
</div>
