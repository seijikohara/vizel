# Getting Started — Vue

`@vizel/vue` ships Vue 3.5 single-file components and composables. Installing the package is enough to render Vizel — `@vizel/core` and `@vizel/headless` come along as transitive dependencies.

This page covers the minimal setup. For a v1 codebase, read the [v1 to v2 migration guide](/guide/migration-v1-to-v2) first.

## Installation

```bash
pnpm add @vizel/vue
# or
npm install @vizel/vue
# or
yarn add @vizel/vue
```

::: info Peer requirements
- Vue 3.5 or newer (`defineModel`, `useId`, `useTemplateRef` rely on 3.5 features).
- Any ESM-compatible bundler. The package is tested against Vite 8 and Nuxt 3.
- Optional features (`lowlight`, `katex`, `mermaid`, `yjs`, `y-websocket`) install on demand when you enable the matching feature.
:::

## CSS

Import the stylesheet once at the application entry point:

```ts
import "@vizel/vue/styles.css";
```

The subpath resolves to `@vizel/core/styles.css`. The bundle ships under exactly two selectors — `:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]` — plus the `prefers-color-scheme: dark` fallback.

## Minimal editor

The `Vizel` component renders the editor, bubble menu, and slash menu in a single mount. Use `v-model:markdown` for two-way binding through Vue's `defineModel`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Vizel } from "@vizel/vue";
import "@vizel/vue/styles.css";

const markdown = ref("# Hello, Vizel");
</script>

<template>
  <Vizel
    v-model:markdown="markdown"
    placeholder="Type '/' for commands..."
  />
</template>
```

## Composable-driven editor

`useVizelEditor` returns a `ShallowRef<Editor | null>`. Read `.value` in script; templates auto-unwrap top-level refs. The first-party reactivity primitive uses `shallowRef` plus `onScopeDispose`-bound listeners.

```vue
<script setup lang="ts">
import {
  useVizelEditor,
  VizelBubbleMenu,
  VizelEditor,
} from "@vizel/vue";
import "@vizel/vue/styles.css";

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
  features: {
    content: { mathematics: true, diagram: true },
    interaction: { typography: true },
  },
});
</script>

<template>
  <div class="editor-container">
    <VizelEditor :editor="editor" />
    <VizelBubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

## Reading editor state

`useVizelEditorState(selector, { equalityFn? })` returns a `ComputedRef<T>`. The selector receives a typed snapshot (`{ editor, transaction }`); the composable re-evaluates on every transaction.

```vue
<script setup lang="ts">
import {
  shallowEqualObject,
  useVizelEditor,
  useVizelEditorState,
  VizelEditor,
  VizelProvider,
} from "@vizel/vue";

const editor = useVizelEditor();

// The editor flows through <VizelProvider>; the composable injects it.
const stats = useVizelEditorState(
  ({ editor }) => ({
    characters: editor?.storage.characterCount?.characters() ?? 0,
    words: editor?.storage.characterCount?.words() ?? 0,
  }),
  { equalityFn: shallowEqualObject },
);
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor :editor="editor" />
    <div class="status-bar">
      <span>{{ stats.characters }} characters</span>
      <span>{{ stats.words }} words</span>
    </div>
  </VizelProvider>
</template>
```

## Two-way Markdown with `v-model:markdown`

The top-level `Vizel` component exposes `v-model:markdown` through `defineModel<string>("markdown")`. The same prop works in controlled mode:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Vizel } from "@vizel/vue";

const markdown = ref("# Hello");
</script>

<template>
  <div class="split">
    <Vizel v-model:markdown="markdown" />
    <textarea v-model="markdown" />
  </div>
</template>
```

## Theming

Wrap the application in `VizelThemeProvider`. `useVizelTheme()` exposes the resolved theme as a `ComputedRef<VizelResolvedTheme>` plus a dedicated `resetToSystem()` method:

```vue
<!-- ThemeToggle.vue -->
<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

// `theme` is a ComputedRef. Templates auto-unwrap; in script read `.value`.
const { theme, setTheme, resetToSystem } = useVizelTheme();
</script>

<template>
  <fieldset>
    <button @click="setTheme('light')">Light</button>
    <button @click="setTheme('dark')">Dark</button>
    <button @click="resetToSystem">System (currently {{ theme }})</button>
  </fieldset>
</template>
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { VizelThemeProvider } from "@vizel/vue";
import Editor from "./Editor.vue";
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <VizelThemeProvider default-theme="system" storage-key="vizel-theme">
    <Editor />
    <ThemeToggle />
  </VizelThemeProvider>
</template>
```

## Next steps

- [Editor](/guide/editor) — options, features, lifecycle, auto-save.
- [Theming](/guide/theming) — CSS variables and host-theme integration.
- [SSR](/guide/ssr) — server rendering and static HTML generation.
- [Migration v1 to v2](/guide/migration-v1-to-v2) — every breaking change in one place.
