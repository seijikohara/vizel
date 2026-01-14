# Vue

Vue 3 components and composables for Vizel editor.

## Installation

```bash
npm install @vizel/vue
# or
pnpm add @vizel/vue
# or
yarn add @vizel/vue
```

::: info Requirements
- Vue 3.3+
:::

## Quick Start

Use the `Vizel` component:

```vue
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

### Advanced Setup

To customize, use individual components with composables:

```vue
<script setup lang="ts">
import { VizelEditor, VizelBubbleMenu, useVizelEditor } from '@vizel/vue';
import '@vizel/core/styles.css';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
});
</script>

<template>
  <div class="editor-container">
    <VizelEditor :editor="editor" />
    <VizelBubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

## Components

### Vizel

All-in-one editor component with built-in bubble menu.

```vue
<script setup lang="ts">
import { Vizel } from '@vizel/vue';
</script>

<template>
  <Vizel
    :initialContent="{ type: 'doc', content: [] }"
    placeholder="Start writing..."
    :editable="true"
    autofocus="end"
    :showBubbleMenu="true"
    :enableEmbed="true"
    class="my-editor"
    :features="{
      image: { onUpload: async (file) => 'url' },
    }"
    @update="({ editor }) => {}"
    @create="({ editor }) => {}"
    @focus="({ editor }) => {}"
    @blur="({ editor }) => {}"
  />
</template>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `JSONContent` | - | Initial content (JSON) |
| `initialMarkdown` | `string` | - | Initial content (Markdown) |
| `v-model:markdown` | `string` | - | Two-way Markdown binding |
| `placeholder` | `string` | - | Placeholder text |
| `editable` | `boolean` | `true` | Editable state |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | - | Auto focus |
| `features` | `VizelFeatureOptions` | - | Feature options |
| `class` | `string` | - | CSS class |
| `showBubbleMenu` | `boolean` | `true` | Show bubble menu |
| `enableEmbed` | `boolean` | - | Enable embed in links |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `{ editor: Editor }` | Content updated |
| `update:markdown` | `string` | Markdown content changed |
| `create` | `{ editor: Editor }` | Editor created |
| `focus` | `{ editor: Editor }` | Editor focused |
| `blur` | `{ editor: Editor }` | Editor blurred |

## Composables

### useVizelEditor

Creates and manages a Vizel editor instance.

```vue
<script setup lang="ts">
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor({
  initialContent: { type: 'doc', content: [] },
  placeholder: 'Start writing...',
  features: {
    markdown: true,
    mathematics: true,
  },
  onUpdate: ({ editor }) => {
    console.log(editor.getJSON());
  },
});
</script>
```

#### Options

See [Configuration](/guide/configuration) for full options.

#### Return Value

Returns `ShallowRef<Editor | null>`. The editor is `null` during SSR and before initialization.

### useVizelState

Forces component re-render on editor state changes.

```vue
<script setup lang="ts">
import { useVizelState } from '@vizel/vue';

const props = defineProps<{ editor: Editor | null }>();

// Re-renders when editor state changes
useVizelState(() => props.editor);
</script>

<template>
  <div v-if="editor">
    <span>{{ editor.storage.characterCount?.characters() ?? 0 }} characters</span>
    <span>{{ editor.storage.characterCount?.words() ?? 0 }} words</span>
  </div>
</template>
```

### useVizelAutoSave

Automatically saves editor content.

```vue
<script setup lang="ts">
import { useVizelEditor, useVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/vue';

const editor = useVizelEditor();

const { status, lastSaved, save, restore } = useVizelAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
  onSave: (content) => console.log('Saved'),
  onError: (error) => console.error('Save failed', error),
});
</script>

<template>
  <div>
    <VizelEditor :editor="editor" />
    <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
  </div>
</template>
```

### useVizelMarkdown

Two-way Markdown synchronization with debouncing.

```vue
<script setup lang="ts">
import { useVizelEditor, useVizelMarkdown, VizelEditor } from '@vizel/vue';

const editor = useVizelEditor();
const { markdown, setMarkdown, isPending } = useVizelMarkdown(() => editor.value, {
  debounceMs: 300, // default: 300ms
});
</script>

<template>
  <VizelEditor :editor="editor" />
  <textarea :value="markdown" @input="setMarkdown($event.target.value)" />
  <span v-if="isPending">Syncing...</span>
</template>
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `markdown` | `Ref<string>` | Current Markdown content |
| `setMarkdown` | `(md: string) => void` | Update editor from Markdown |
| `isPending` | `Ref<boolean>` | Whether sync is pending |

### useVizelTheme

Access theme state within VizelThemeProvider.

```vue
<script setup lang="ts">
import { useVizelTheme, VizelThemeProvider } from '@vizel/vue';

const { theme, resolvedTheme, setTheme } = useVizelTheme();

function toggleTheme() {
  setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark');
}
</script>

<template>
  <VizelThemeProvider defaultTheme="system">
    <Editor />
    <button @click="toggleTheme">
      {{ resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
    </button>
  </VizelThemeProvider>
</template>
```

## Components

### VizelEditor

Renders the editor content area.

```vue
<VizelEditor 
  :editor="editor" 
  class="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `class` | `string` | Custom class name |

### VizelBubbleMenu

Floating bubble menu on text selection.

```vue
<VizelBubbleMenu 
  :editor="editor"
  class="my-bubble-menu"
  :showDefaultMenu="true"
  :updateDelay="100"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | Custom class name |
| `showDefaultMenu` | `boolean` | `true` | Show default bubble menu |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### VizelThemeProvider

Provides theme context.

```vue
<VizelThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  :disableTransitionOnChange="false"
>
  <slot />
</VizelThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### VizelSaveIndicator

Displays save status.

```vue
<VizelSaveIndicator 
  :status="status" 
  :lastSaved="lastSaved"
  class="my-indicator"
/>
```

### VizelPortal

Renders children in a portal.

```vue
<VizelPortal :container="document.body">
  <div class="my-overlay">Content</div>
</VizelPortal>
```

## Patterns

### Working with Markdown

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Vizel } from '@vizel/vue';

const markdown = ref('# Hello World\n\nStart editing...');
</script>

<template>
  <!-- Simple: v-model:markdown for two-way binding -->
  <Vizel v-model:markdown="markdown" />
  
  <!-- Or one-way with initialMarkdown -->
  <Vizel initialMarkdown="# Read Only Initial" />
</template>
```

### Split View (WYSIWYG + Raw Markdown)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Vizel } from '@vizel/vue';

const markdown = ref('# Hello\n\nEdit in either pane!');
</script>

<template>
  <div class="split-view">
    <Vizel v-model:markdown="markdown" />
    <textarea v-model="markdown" />
  </div>
</template>
```

### Controlled Content with v-model (JSON)

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import type { JSONContent } from '@tiptap/core';

const content = ref<JSONContent>({ type: 'doc', content: [] });

const editor = useVizelEditor({
  initialContent: content.value,
  onUpdate: ({ editor }) => {
    content.value = editor.getJSON();
  },
});
</script>
```

### With Form

```vue
<script setup lang="ts">
const editor = useVizelEditor();

function handleSubmit() {
  if (editor.value) {
    const content = editor.value.getJSON();
    // Submit content
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VizelEditor :editor="editor" />
    <button type="submit">Submit</button>
  </form>
</template>
```

### Template Ref Access

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const editorRef = ref<Editor | null>(null);

const editor = useVizelEditor({
  onCreate: ({ editor }) => {
    editorRef.value = editor;
  },
});

function focusEditor() {
  editorRef.value?.commands.focus();
}
</script>

<template>
  <div>
    <button @click="focusEditor">Focus</button>
    <VizelEditor :editor="editor" />
  </div>
</template>
```

### Custom Bubble Menu

```vue
<script setup lang="ts">
import type { Editor } from '@tiptap/core';

const props = defineProps<{ editor: Editor | null }>();
</script>

<template>
  <div v-if="editor" class="bubble-menu">
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ active: editor.isActive('bold') }"
    >
      Bold
    </button>
    <button
      @click="editor.chain().focus().toggleItalic().run()"
      :class="{ active: editor.isActive('italic') }"
    >
      Italic
    </button>
    <button @click="editor.chain().focus().undo().run()">
      Undo
    </button>
    <button @click="editor.chain().focus().redo().run()">
      Redo
    </button>
  </div>
</template>
```

### Provide/Inject Pattern

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { provide } from 'vue';
import { useVizelEditor } from '@vizel/vue';

const editor = useVizelEditor();
provide('editor', editor);
</script>

<!-- Child.vue -->
<script setup lang="ts">
import { inject, type ShallowRef } from 'vue';
import type { Editor } from '@tiptap/core';

const editor = inject<ShallowRef<Editor | null>>('editor');
</script>
```

## SSR/Nuxt Considerations

The editor is client-side only. Use `<ClientOnly>` in Nuxt:

```vue
<template>
  <ClientOnly>
    <Editor />
    <template #fallback>
      <div>Loading editor...</div>
    </template>
  </ClientOnly>
</template>
```

Or use dynamic import:

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const Editor = defineAsyncComponent(() => import('./Editor.vue'));
</script>
```

## Next Steps

- [Configuration](/guide/configuration) - Editor options
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/vue)
