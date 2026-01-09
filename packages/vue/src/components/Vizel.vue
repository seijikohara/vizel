<script setup lang="ts">
// Vizel - All-in-one editor component
//
// A complete editor component that includes EditorContent and BubbleMenu.
// This is the recommended way to use Vizel for most use cases.
import type { Editor, JSONContent } from "@tiptap/core";
import { getVizelMarkdown, setVizelMarkdown, type VizelFeatureOptions } from "@vizel/core";
import { useSlots, watch } from "vue";
import { useVizelEditor } from "../composables/useVizelEditor.ts";
import VizelBubbleMenu from "./VizelBubbleMenu.vue";
import VizelEditor from "./VizelEditor.vue";

export interface VizelProps {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /**
   * Initial content in Markdown format.
   * If both initialContent and initialMarkdown are provided, initialMarkdown takes precedence.
   * @example
   * ```vue
   * <Vizel initial-markdown="# Hello World\n\nThis is **bold** text." />
   * ```
   */
  initialMarkdown?: string;
  /**
   * Automatically transform diagram code blocks (mermaid, graphviz) to diagram nodes
   * when importing markdown content. Only applies when initialMarkdown is provided.
   * @default true
   */
  transformDiagramsOnImport?: boolean;
  /**
   * Two-way binding for markdown content (v-model:markdown).
   * When set, markdown will be synchronized with the editor content.
   */
  markdown?: string;
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
  transformDiagramsOnImport: true,
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
  /** Emitted when markdown content changes (for v-model:markdown) */
  "update:markdown": [markdown: string];
}>();

const slots = useSlots();

// Track whether we're currently updating from external markdown change
let isUpdatingFromMarkdown = false;

const editor = useVizelEditor({
  ...(props.initialContent !== undefined && { initialContent: props.initialContent }),
  ...(props.initialMarkdown !== undefined && { initialMarkdown: props.initialMarkdown }),
  transformDiagramsOnImport: props.transformDiagramsOnImport,
  ...(props.placeholder !== undefined && { placeholder: props.placeholder }),
  editable: props.editable,
  autofocus: props.autofocus,
  ...(props.features !== undefined && { features: props.features }),
  onUpdate: (e) => {
    emit("update", e);
    // Emit markdown update for v-model:markdown if not updating from external change
    if (!isUpdatingFromMarkdown && props.markdown !== undefined) {
      emit("update:markdown", getVizelMarkdown(e.editor));
    }
  },
  onCreate: (e) => emit("create", e),
  onDestroy: () => emit("destroy"),
  onSelectionUpdate: (e) => emit("selectionUpdate", e),
  onFocus: (e) => emit("focus", e),
  onBlur: (e) => emit("blur", e),
});

// Watch for external markdown changes (v-model:markdown)
watch(
  () => props.markdown,
  (newMarkdown) => {
    if (newMarkdown === undefined || !editor.value) return;

    // Get current editor markdown
    const currentMarkdown = getVizelMarkdown(editor.value);
    if (newMarkdown === currentMarkdown) return;

    // Set flag to prevent emitting update:markdown during this update
    isUpdatingFromMarkdown = true;
    setVizelMarkdown(editor.value, newMarkdown, {
      transformDiagrams: props.transformDiagramsOnImport,
    });
    isUpdatingFromMarkdown = false;
  }
);

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
    <VizelBubbleMenu v-if="showBubbleMenu && editor && slots['bubble-menu']" :editor="editor" :enable-embed="enableEmbed ?? false">
      <slot name="bubble-menu" :editor="editor" />
    </VizelBubbleMenu>
    <VizelBubbleMenu v-else-if="showBubbleMenu && editor" :editor="editor" :enable-embed="enableEmbed ?? false" />
    <slot :editor="editor" />
  </div>
</template>
