# Vue

Vue 3 components and composables for Vizel editor.

## Installation

```bash
npm install @vizel/vue
# or
bun add @vizel/vue
```

::: info Requirements
- Vue 3.3+
:::

## Quick Start

```vue
<script setup lang="ts">
import { EditorContent, BubbleMenu, useVizelEditor } from '@vizel/vue';
import '@vizel/core/styles.css';

const editor = useVizelEditor({
  placeholder: "Type '/' for commands...",
});
</script>

<template>
  <div class="editor-container">
    <EditorContent :editor="editor" />
    <BubbleMenu v-if="editor" :editor="editor" />
  </div>
</template>
```

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

### useEditorState

Forces component re-render on editor state changes.

```vue
<script setup lang="ts">
import { useEditorState } from '@vizel/vue';

const props = defineProps<{ editor: Editor | null }>();

// Re-renders when editor state changes
useEditorState(() => props.editor);
</script>

<template>
  <div v-if="editor">
    <span>{{ editor.storage.characterCount?.characters() ?? 0 }} characters</span>
    <span>{{ editor.storage.characterCount?.words() ?? 0 }} words</span>
  </div>
</template>
```

### useAutoSave

Automatically saves editor content.

```vue
<script setup lang="ts">
import { useVizelEditor, useAutoSave, SaveIndicator } from '@vizel/vue';

const editor = useVizelEditor();

const { status, lastSaved, save, restore } = useAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: 'localStorage',
  key: 'my-editor-content',
  onSave: (content) => console.log('Saved'),
  onError: (error) => console.error('Save failed', error),
});
</script>

<template>
  <div>
    <EditorContent :editor="editor" />
    <SaveIndicator :status="status" :lastSaved="lastSaved" />
  </div>
</template>
```

### useTheme

Access theme state within ThemeProvider.

```vue
<script setup lang="ts">
import { useTheme, ThemeProvider } from '@vizel/vue';

const { theme, resolvedTheme, setTheme } = useTheme();

function toggleTheme() {
  setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark');
}
</script>

<template>
  <ThemeProvider defaultTheme="system">
    <Editor />
    <button @click="toggleTheme">
      {{ resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
    </button>
  </ThemeProvider>
</template>
```

## Components

### EditorContent

Renders the editor content area.

```vue
<EditorContent 
  :editor="editor" 
  class="my-editor"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Editor instance |
| `class` | `string` | Custom class name |

### BubbleMenu

Floating toolbar on text selection.

```vue
<BubbleMenu 
  :editor="editor"
  class="my-bubble-menu"
  :showDefaultToolbar="true"
  :updateDelay="100"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `Editor \| null` | - | Editor instance |
| `class` | `string` | - | Custom class name |
| `showDefaultToolbar` | `boolean` | `true` | Show default toolbar |
| `pluginKey` | `string` | `"vizelBubbleMenu"` | Plugin key |
| `updateDelay` | `number` | `100` | Position update delay |
| `shouldShow` | `Function` | - | Custom visibility logic |
| `enableEmbed` | `boolean` | - | Enable embed in link editor |

### ThemeProvider

Provides theme context.

```vue
<ThemeProvider 
  defaultTheme="system"
  storageKey="my-theme"
  :disableTransitionOnChange="false"
>
  <slot />
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | Storage key |
| `targetSelector` | `string` | - | Theme attribute target |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions |

### SaveIndicator

Displays save status.

```vue
<SaveIndicator 
  :status="status" 
  :lastSaved="lastSaved"
  class="my-indicator"
/>
```

### Portal

Renders children in a portal.

```vue
<Portal :container="document.body">
  <div class="my-overlay">Content</div>
</Portal>
```

## Patterns

### Controlled Content with v-model

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import type { JSONContent } from '@vizel/core';

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
    <EditorContent :editor="editor" />
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
    <EditorContent :editor="editor" />
  </div>
</template>
```

### Custom Toolbar

```vue
<script setup lang="ts">
import type { Editor } from '@tiptap/core';

const props = defineProps<{ editor: Editor | null }>();
</script>

<template>
  <div v-if="editor" class="toolbar">
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

- [Configuration](/guide/configuration) - Full options reference
- [Features](/guide/features) - Enable and configure features
- [Theming](/guide/theming) - Customize appearance
- [API Reference](/api/vue) - Complete API documentation
