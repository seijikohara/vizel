<script setup lang="ts">
// Vizel - All-in-one editor component
//
// A complete editor component that includes EditorContent and BubbleMenu.
// This is the recommended way to use Vizel for most use cases.
import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelFeatureOptions } from "@vizel/core";
import { computed, useSlots } from "vue";
import { useVizelEditor } from "../composables/useVizelEditor.ts";
import VizelEditor from "./VizelEditor.vue";
import VizelToolbar from "./VizelToolbar.vue";

export interface VizelProps {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is editable (default: true) */
  editable?: boolean;
  /** Auto focus on mount */
  autofocus?: boolean | "start" | "end" | "all" | number;
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /** Custom class name for the editor container */
  class?: string;
  /** Whether to show the bubble menu (default: true) */
  showBubbleMenu?: boolean;
  /** Enable embed option in bubble menu link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

const props = withDefaults(defineProps<VizelProps>(), {
  editable: true,
  autofocus: false,
  showBubbleMenu: true,
  enableEmbed: false,
});

const emit = defineEmits<{
  /** Emitted when content changes */
  update: [{ editor: Editor }];
  /** Emitted when editor is created */
  create: [{ editor: Editor }];
  /** Emitted when editor is destroyed */
  destroy: [];
  /** Emitted when selection changes */
  selectionUpdate: [{ editor: Editor }];
  /** Emitted when editor gets focus */
  focus: [{ editor: Editor }];
  /** Emitted when editor loses focus */
  blur: [{ editor: Editor }];
}>();

const slots = useSlots();

const editor = useVizelEditor({
  ...(props.initialContent !== undefined && { initialContent: props.initialContent }),
  ...(props.placeholder !== undefined && { placeholder: props.placeholder }),
  editable: props.editable,
  autofocus: props.autofocus,
  ...(props.features !== undefined && { features: props.features }),
  onUpdate: (e) => emit("update", e),
  onCreate: (e) => emit("create", e),
  onDestroy: () => emit("destroy"),
  onSelectionUpdate: (e) => emit("selectionUpdate", e),
  onFocus: (e) => emit("focus", e),
  onBlur: (e) => emit("blur", e),
});

// Expose editor instance for advanced use cases
// Both `editor` property and `getEditor()` method are provided for compatibility
defineExpose({
  /** The underlying Tiptap editor instance */
  get editor() {
    return editor.value;
  },
  /**
   * Get the underlying Tiptap editor instance
   * @deprecated Use the `editor` property instead
   */
  getEditor: () => editor.value,
});
</script>

<template>
  <div :class="['vizel-root', $props.class]" data-vizel-root>
    <VizelEditor v-if="editor" :editor="editor" />
    <VizelToolbar v-if="showBubbleMenu && editor" :editor="editor" :enable-embed="enableEmbed ?? false">
      <slot name="bubble-menu" :editor="editor" />
    </VizelToolbar>
    <slot :editor="editor" />
  </div>
</template>
