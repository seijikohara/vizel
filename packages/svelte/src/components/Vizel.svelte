<script lang="ts" module>
import type {
  Editor,
  Extensions,
  JSONContent,
  VizelError,
  VizelFeatureOptions,
  VizelLocale,
  VizelMarkdownFlavor,
} from "@vizel/core";
import type { Snippet } from "svelte";

/**
 * Exposed ref type for Vizel component.
 * Use with `bind:this` and access the `editor` property.
 */
export interface VizelRef {
  /** The underlying Tiptap editor instance */
  readonly editor: Editor | null;
}

export interface VizelProps {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /**
   * Initial content in Markdown format.
   * If both initialContent and initialMarkdown are provided, initialMarkdown takes precedence.
   * @example
   * ```svelte
   * <Vizel initialMarkdown="# Hello World\n\nThis is **bold** text." />
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
   * Two-way binding for markdown content (bind:markdown).
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
  /** Custom toolbar content */
  toolbar?: Snippet<[{ editor: Editor }]>;
  /** Whether to show the bubble menu (default: true) */
  showBubbleMenu?: boolean;
  /** Enable embed option in bubble menu link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Custom bubble menu content */
  bubbleMenu?: Snippet<[{ editor: Editor }]>;
  /** Additional children to render inside the editor root */
  children?: Snippet<[{ editor: Editor | null }]>;
  /** Callback when content changes */
  onUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor is created */
  onCreate?: (props: { editor: Editor }) => void;
  /** Callback when editor is destroyed */
  onDestroy?: () => void;
  /** Callback when selection changes */
  onSelectionUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor gets focus */
  onFocus?: (props: { editor: Editor }) => void;
  /** Callback when editor loses focus */
  onBlur?: (props: { editor: Editor }) => void;
  /**
   * Callback when an error occurs during editor operations.
   * Provides structured error information for logging or user feedback.
   */
  onError?: (error: VizelError) => void;
}
</script>

<script lang="ts">
// Vizel - All-in-one editor component
// A complete editor component that includes EditorContent and BubbleMenu.
// This is the recommended way to use Vizel for most use cases.
import { getVizelMarkdown, setVizelMarkdown } from "@vizel/core";
import { setContext } from "svelte";
import { createVizelEditor } from "../runes/createVizelEditor.svelte.js";
import VizelBlockMenu from "./VizelBlockMenu.svelte";
import VizelBubbleMenu from "./VizelBubbleMenu.svelte";
import { type VizelContextAccessor, VIZEL_CONTEXT_KEY } from "./VizelContext.js";
import VizelEditor from "./VizelEditor.svelte";
import VizelToolbar from "./VizelToolbar.svelte";

// Use $props() without destructuring to avoid state_referenced_locally warnings
// Props are intentionally captured once at editor creation time
let {
  class: className,
  showToolbar = false,
  toolbar,
  showBubbleMenu = true,
  enableEmbed = false,
  bubbleMenu,
  children,
  markdown = $bindable(),
  transformDiagramsOnImport = true,
  ...restProps
}: VizelProps = $props();

// Wrap onUpdate to sync markdown. Read restProps.onUpdate inside the
// callback (not via a captured local) so later prop changes are picked up.
//
// The previous shape used a synchronous `isUpdatingFromMarkdown` flag to
// suppress write-back during an external markdown update. Tiptap does not
// guarantee the `update` event fires synchronously inside
// `setVizelMarkdown` — when it lands in a microtask the flag is already
// false and the editor's just-applied markdown gets written back to the
// bound prop, occasionally creating a tick of feedback. Comparing the new
// markdown against the bound prop directly avoids the timing race
// altogether: when the editor's content matches the prop, there is
// nothing to propagate.
const wrappedOnUpdate = (e: { editor: import("@vizel/core").Editor }) => {
  restProps.onUpdate?.(e);
  if (markdown === undefined) return;
  const nextMarkdown = getVizelMarkdown(e.editor);
  if (nextMarkdown === markdown) return;
  markdown = nextMarkdown;
};

// Capture initial values for editor creation (these are intentionally not reactive)
// The editor is created once and should not be recreated when props change
// svelte-ignore state_referenced_locally
const initialTransformDiagrams = transformDiagramsOnImport;

// Create editor with initial props - editor is intentionally created once
// svelte-ignore state_referenced_locally
const editorState = createVizelEditor({
  ...(restProps.initialContent !== undefined && { initialContent: restProps.initialContent }),
  ...(restProps.initialMarkdown !== undefined && { initialMarkdown: restProps.initialMarkdown }),
  transformDiagramsOnImport: initialTransformDiagrams,
  ...(restProps.placeholder !== undefined && { placeholder: restProps.placeholder }),
  editable: restProps.editable ?? true,
  autofocus: restProps.autofocus ?? false,
  ...(restProps.features !== undefined && { features: restProps.features }),
  ...(restProps.flavor !== undefined && {
    markdown: { flavor: restProps.flavor },
  }),
  ...(restProps.locale !== undefined && { locale: restProps.locale }),
  ...(restProps.extensions !== undefined && { extensions: restProps.extensions }),
  onUpdate: wrappedOnUpdate,
  ...(restProps.onCreate !== undefined && { onCreate: restProps.onCreate }),
  ...(restProps.onDestroy !== undefined && { onDestroy: restProps.onDestroy }),
  ...(restProps.onSelectionUpdate !== undefined && { onSelectionUpdate: restProps.onSelectionUpdate }),
  ...(restProps.onFocus !== undefined && { onFocus: restProps.onFocus }),
  ...(restProps.onBlur !== undefined && { onBlur: restProps.onBlur }),
  ...(restProps.onError !== undefined && { onError: restProps.onError }),
});

const editor = $derived(editorState.current);

// Expose the editor through the same context key VizelProvider uses, so
// nested components (and the built-in toolbar / bubble menu / block menu)
// can resolve it via getVizelContext() without an explicit `editor` prop.
const accessor: VizelContextAccessor = {
  get current() {
    return editorState.current;
  },
};
setContext(VIZEL_CONTEXT_KEY, accessor);

// Watch for external markdown changes (bind:markdown). `wrappedOnUpdate`
// compares the editor's markdown against the bound prop and skips the
// write-back when they match, so this effect can apply the incoming
// value without juggling a synchronous reentrancy flag.
$effect(() => {
  if (markdown === undefined || !editor) return;
  const currentMarkdown = getVizelMarkdown(editor);
  if (markdown === currentMarkdown) return;
  setVizelMarkdown(editor, markdown, {
    transformDiagrams: transformDiagramsOnImport,
  });
});
</script>

<div class="vizel-root {className ?? ''}" data-vizel-root>
  {#if showToolbar && editor && toolbar}
    <VizelToolbar {editor} {...(restProps.locale ? { locale: restProps.locale } : {})}>
      {#snippet children({ editor: e })}
        {@render toolbar({ editor: e })}
      {/snippet}
    </VizelToolbar>
  {:else if showToolbar && editor}
    <VizelToolbar {editor} {...(restProps.locale ? { locale: restProps.locale } : {})} />
  {/if}
  <VizelEditor {editor} />
  {#if showBubbleMenu && editor && bubbleMenu}
    <VizelBubbleMenu {editor} {enableEmbed} {...(restProps.locale ? { locale: restProps.locale } : {})}>
      {@render bubbleMenu({ editor })}
    </VizelBubbleMenu>
  {:else if showBubbleMenu && editor}
    <VizelBubbleMenu {editor} {enableEmbed} {...(restProps.locale ? { locale: restProps.locale } : {})} />
  {/if}
  {#if restProps.locale}
    <VizelBlockMenu locale={restProps.locale} />
  {:else}
    <VizelBlockMenu />
  {/if}
  {#if children}
    {@render children({ editor })}
  {/if}
</div>
