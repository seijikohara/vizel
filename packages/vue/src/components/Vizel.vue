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
  type VizelLocale,
  type VizelMarkdownFlavor,
} from "@vizel/core";
import { computed, provide, useSlots, watch } from "vue";
import { useVizelEditor } from "../composables/useVizelEditor.ts";
import VizelBlockMenu from "./VizelBlockMenu.vue";
import VizelBubbleMenu from "./VizelBubbleMenu.vue";
import { VIZEL_CONTEXT_KEY } from "./VizelContext.ts";
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
  /** Locale for translated UI strings */
  locale?: VizelLocale;
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

const editor = useVizelEditor({
  ...(props.initialContent !== undefined && { initialContent: props.initialContent }),
  ...(props.initialMarkdown !== undefined && { initialMarkdown: props.initialMarkdown }),
  transformDiagramsOnImport: props.transformDiagramsOnImport,
  ...(props.placeholder !== undefined && { placeholder: props.placeholder }),
  // Pass a getter so `useVizelEditor` tracks reactive prop updates. The
  // literal `props.editable` would be captured once during setup and the
  // watcher would never see subsequent changes.
  editable: () => props.editable,
  autofocus: props.autofocus,
  ...(props.features !== undefined && { features: props.features }),
  ...(props.flavor !== undefined && {
    markdown: { flavor: props.flavor },
  }),
  ...(props.locale !== undefined && { locale: props.locale }),
  ...(props.extensions !== undefined && { extensions: props.extensions }),
  onUpdate: (e) => {
    emit("update", e);
    // Skip the write-back when the editor's current markdown already
    // matches the controlled prop. The previous shape used a synchronous
    // flag to mute write-back during an external update, but Tiptap's
    // `update` event can fire in a microtask after `setVizelMarkdown`
    // returns, by which point the flag was already false — comparing the
    // markdown values directly avoids that timing race.
    if (markdown.value === undefined) return;
    const nextMarkdown = getVizelMarkdown(e.editor);
    if (nextMarkdown === markdown.value) return;
    markdown.value = nextMarkdown;
  },
  onCreate: (e) => emit("create", e),
  onDestroy: () => emit("destroy"),
  onSelectionUpdate: (e) => emit("selectionUpdate", e),
  onFocus: (e) => emit("focus", e),
  onBlur: (e) => emit("blur", e),
  // Always forward errors through the `error` emit. The previous shape
  // gated the trampoline on `useAttrs().onError !== undefined`, but
  // Vue 3 deliberately strips declared emits from `$attrs` / `useAttrs()`
  // so that check was always `false` and runtime errors funneled through
  // `emitVizelError` (UPLOAD_FAILED, EMBED_LOAD_FAILED, MARKDOWN_LOSSY)
  // never reached the consumer. Vue's `emit` is a no-op when no parent
  // listener is attached, so unwiring the gate does not silently swallow
  // configuration errors — `useVizelEditor` still rethrows
  // INVALID_CONFIG to the global handler regardless of this callback.
  onError: (e: VizelError) => emit("error", e),
});

// Watch for external markdown changes (v-model:markdown), including the
// initial value at mount. The onUpdate wrapper compares the editor's
// markdown to the controlled prop and skips the write-back when they
// match, so this watcher can apply the incoming value without juggling
// a synchronous reentrancy flag. `immediate: true` makes the
// `v-model:markdown="md"` seed land in the editor on first mount
// instead of waiting for the next user-triggered prop change.
watch(
  // Track both the prop and the editor instance so the watcher fires
  // when either side becomes available — the prop may resolve before
  // the editor finishes async initialization.
  () => [markdown.value, editor.value] as const,
  ([newMarkdown, editorValue]) => {
    if (newMarkdown === undefined || !editorValue) return;
    const currentMarkdown = getVizelMarkdown(editorValue);
    if (newMarkdown === currentMarkdown) return;
    setVizelMarkdown(editorValue, newMarkdown, {
      transformDiagrams: props.transformDiagramsOnImport,
    });
  },
  { immediate: true }
);

// Expose the editor through the same provide key VizelProvider uses, so
// nested components (and the built-in toolbar / bubble menu / block menu)
// can resolve it via `useVizelContext` without an explicit `:editor` prop.
provide(VIZEL_CONTEXT_KEY, editor);

// Expose editor instance for advanced use cases.
defineExpose<VizelRef>({
  /** The underlying Tiptap editor instance */
  get editor() {
    return editor.value;
  },
});

// Memoize the `locale`-bound props object so toolbar / bubble-menu /
// block-menu children don't see a fresh identity each render, matching
// the React component's `useMemo(localeProps, [locale])` shape.
const localeProps = computed(() => (props.locale ? { locale: props.locale } : {}));
</script>

<template>
  <div :class="['vizel-root', $props.class]" data-vizel-root>
    <VizelToolbar v-if="showToolbar && editor" v-bind="localeProps">
      <template v-if="slots['toolbar']" #default>
        <slot name="toolbar" :editor="editor" />
      </template>
    </VizelToolbar>
    <VizelEditor :editor="editor" />
    <VizelBubbleMenu v-if="showBubbleMenu && editor" :enable-embed="enableEmbed ?? false" v-bind="localeProps">
      <template v-if="slots['bubble-menu']" #default>
        <slot name="bubble-menu" :editor="editor" />
      </template>
    </VizelBubbleMenu>
    <VizelBlockMenu v-bind="localeProps" />
    <slot :editor="editor" />
  </div>
</template>
