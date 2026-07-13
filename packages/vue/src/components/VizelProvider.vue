<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { computed, provide, shallowRef, watch } from "vue";

import { VIZEL_CONTEXT_KEY } from "./VizelContext.ts";

export interface VizelProviderProps {
  /** The editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
}

const props = defineProps<VizelProviderProps>();

// Hold the editor in a `shallowRef` so consumers receive a `ShallowRef`
// directly via `useVizelContext()`, mirroring `useVizelEditor`'s return
// shape. A watcher keeps the ref in sync with the (possibly null) prop.
const editorRef = shallowRef<Editor | null>(props.editor);
watch(
  () => props.editor,
  (editor) => {
    editorRef.value = editor;
  }
);

provide(VIZEL_CONTEXT_KEY, editorRef);

// Always emit the `vizel-root` class so consumers get the CSS variable scope
// for free (.vizel-root { --vizel-* }). Matches the React provider behavior.
const rootClass = computed(() => (props.class ? `vizel-root ${props.class}` : "vizel-root"));
</script>

<template>
  <div :class="rootClass" data-vizel-root>
    <slot />
  </div>
</template>
