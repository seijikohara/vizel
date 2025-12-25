---
paths: packages/vue/**/*.{ts,vue}
---

# @vizel/vue Package Guidelines

See `cross-framework.md` for component/composable equivalence requirements.

## Package Purpose

Vue 3 components and composables for Vizel editor.
This package only contains Vue-specific wrappers around `@vizel/core`.

## Component Development

### Single File Component Structure

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { ComponentProps } from "./types";

// Props definition
const props = defineProps<{
  editor: Editor;
  class?: string;
}>();

// Emits definition
const emit = defineEmits<{
  (e: "update", value: string): void;
}>();

// Component logic
</script>

<template>
  <!-- Template -->
</template>
```

### Props Naming

- Use `class` for CSS class names (Vue convention)
- Use `on*` prefix for event handler props
- Export props types with component name

```typescript
export interface BubbleMenuProps {
  editor: Editor;
  class?: string;
}
```

## Composables

### useVizelEditor

Primary composable for creating editor instances.

```typescript
const editor = useVizelEditor({
  initialContent,
  placeholder,
  features: {
    image: { onUpload: uploadFn },
  },
  onUpdate: ({ editor }) => {},
});
```

### Composable Conventions

- Prefix with `use`
- Return `ShallowRef<Editor | null>`
- Use `onMounted` for DOM-dependent initialization
- Use `onBeforeUnmount` for cleanup
- Use `null` for uninitialized state (not `undefined`)

## Context (Provide/Inject)

### EditorContext

- Use `provide()` in EditorRoot
- Use `inject()` in child components
- Use Symbol keys for type safety

```typescript
export const EditorContextKey = Symbol("EditorContext");

// Provide
provide(EditorContextKey, editor);

// Inject
const editor = inject(EditorContextKey);
```

## Reactivity

- Use `shallowRef` for Editor instance
- Use `ref` for primitive values
- Use `computed` for derived values
- Avoid deep reactivity on Editor

## Template Directives

- Use `v-if` for conditional rendering
- Use `:class` for dynamic classes
- Use `@` for event handlers
