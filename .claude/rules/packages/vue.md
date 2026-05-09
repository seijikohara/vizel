---
paths:
  - "packages/vue/**/*.{ts,vue}"
---

# `@vizel/vue` Package

`@vizel/vue` provides Vue 3 components and composables. The package wraps `@vizel/core` and adds Vue-specific code only.

See `cross-framework.md` for component, composable, and props parity requirements.

## Component Structure

Use the `<script setup lang="ts">` syntax.

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import type { ComponentProps } from "./types";

const props = defineProps<{
  editor: Editor;
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update", value: string): void;
}>();
</script>

<template>
  <!-- template -->
</template>
```

## Props

- Use `class` for CSS class names (Vue convention).
- Use the `on*` prefix for event handler props.
- Export the props type alongside the component.

```typescript
export interface BubbleMenuProps {
  editor: Editor;
  class?: string;
}
```

## Composables

### `useVizelEditor`

`useVizelEditor` is the primary composable for creating an editor instance.

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

- Prefix the function name with `use`.
- Return `ShallowRef<Editor | null>`.
- Initialize DOM-dependent code inside `onMounted`.
- Run cleanup inside `onBeforeUnmount`.
- Use `null` for the uninitialized state, never `undefined`.

## Context (provide/inject)

- `VizelProvider` calls `provide()`.
- Children call `inject()` through `useVizelContext()` for required access or `useVizelContextSafe()` for optional access.

```typescript
import { useVizelContext } from "@vizel/vue";

const { editor } = useVizelContext();
```

## Reactivity

- Use `shallowRef` for the `Editor` instance.
- Use `ref` for primitive values.
- Use `computed` for derived values.
- Avoid deep reactivity on the editor.

## Template Directives

- Use `v-if` for conditional rendering.
- Use `:class` for dynamic classes.
- Use `@<event>` for event handlers.
