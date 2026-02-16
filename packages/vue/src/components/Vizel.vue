<script setup lang="ts">
// Vizel - All-in-one editor component
//
// A complete editor component that includes EditorContent and BubbleMenu.
// This is the recommended way to use Vizel for most use cases.
import {
  type Editor,
  type Extensions,
  getVizelMarkdown,
  type JSONContent,
  setVizelMarkdown,
  type VizelError,
  type VizelFeatureOptions,
  type VizelMarkdownFlavor,
} from "@vizel/core";
import { useSlots, watch } from "vue";
import { useVizelEditor } from "../composables/useVizelEditor.ts";
import VizelBubbleMenu from "./VizelBubbleMenu.vue";
import VizelEditor from "./VizelEditor.vue";
import VizelToolbar from "./VizelToolbar.vue";

/**
 * Exposed ref type for Vizel component.
 * Use with `ref` attribute to access the editor instance.
 */
export interface VizelRef {
  /** The underlying Tiptap editor instance */
  editor: Editor | null;
}

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
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is editable (default: true) */
  editable?: boolean;
  /** Auto focus on mount */
  autofocus?: boolean | "start" | "end" | "all" | number;
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /**
   * Markdown output flavor.
   * Controls how Markdown is serialized when exporting content.
   * @default "gfm"
   */
  flavor?: VizelMarkdownFlavor;
  /** Additional Tiptap extensions */
  extensions?: Extensions;
  /** Custom class name for the editor container */
  class?: string;
  /** Whether to show the toolbar (default: false) */
  showToolbar?: boolean;
  /** Whether to show the bubble menu (default: true) */
  showBubbleMenu?: boolean;
  /** Enable embed option in bubble menu link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

const props = withDefaults(defineProps<VizelProps>(), {
  editable: true,
  autofocus: false,
  showToolbar: false,
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
  /** Emitted when an error occurs during editor operations */
  error: [VizelError];
}>();

/**
 * Two-way binding for markdown content (v-model:markdown).
 * When set, markdown will be synchronized with the editor content.
 * Uses Vue 3.4+ defineModel for cleaner two-way binding.
 */
const markdown = defineModel<string>("markdown");

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
  ...(props.flavor !== undefined && { flavor: props.flavor }),
  ...(props.extensions !== undefined && { extensions: props.extensions }),
  onUpdate: (e) => {
    emit("update", e);
    // Update markdown model if not updating from external change
    if (!isUpdatingFromMarkdown && markdown.value !== undefined) {
      markdown.value = getVizelMarkdown(e.editor);
    }
  },
  onCreate: (e) => emit("create", e),
  onDestroy: () => emit("destroy"),
  onSelectionUpdate: (e) => emit("selectionUpdate", e),
  onFocus: (e) => emit("focus", e),
  onBlur: (e) => emit("blur", e),
  onError: (e) => emit("error", e),
});

// Watch for external markdown changes (v-model:markdown)
watch(markdown, (newMarkdown) => {
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
});

// Expose editor instance for advanced use cases
// Both `editor` property and `getEditor()` method are provided for compatibility
defineExpose<VizelRef & { getEditor: () => Editor | null }>({
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
    <VizelToolbar v-if="showToolbar && editor && slots['toolbar']" :editor="editor">
      <slot name="toolbar" :editor="editor" />
    </VizelToolbar>
    <VizelToolbar v-else-if="showToolbar && editor" :editor="editor" />
    <VizelEditor v-if="editor" :editor="editor" />
    <VizelBubbleMenu v-if="showBubbleMenu && editor && slots['bubble-menu']" :editor="editor" :enable-embed="enableEmbed ?? false">
      <slot name="bubble-menu" :editor="editor" />
    </VizelBubbleMenu>
    <VizelBubbleMenu v-else-if="showBubbleMenu && editor" :editor="editor" :enable-embed="enableEmbed ?? false" />
    <slot :editor="editor" />
  </div>
</template>
