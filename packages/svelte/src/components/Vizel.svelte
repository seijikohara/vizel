<script lang="ts" module>
import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelFeatureOptions } from "@vizel/core";
import type { Snippet } from "svelte";

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
}
</script>

<script lang="ts">
// Vizel - All-in-one editor component
// A complete editor component that includes EditorContent and BubbleMenu.
// This is the recommended way to use Vizel for most use cases.
import { createVizelEditor } from "../runes/createVizelEditor.svelte.ts";
import VizelToolbar from "./VizelToolbar.svelte";
import VizelEditor from "./VizelEditor.svelte";

// Use $props() without destructuring to avoid state_referenced_locally warnings
// Props are intentionally captured once at editor creation time
const props: VizelProps = $props();

// Destructure for template usage (these are fine to use reactively in template)
const {
  class: className,
  showBubbleMenu = true,
  enableEmbed = false,
  bubbleMenu,
  children,
} = $derived(props);

// Create editor with initial props - editor is intentionally created once
const editorState = createVizelEditor({
  ...(props.initialContent !== undefined && { initialContent: props.initialContent }),
  ...(props.placeholder !== undefined && { placeholder: props.placeholder }),
  editable: props.editable ?? true,
  autofocus: props.autofocus ?? false,
  ...(props.features !== undefined && { features: props.features }),
  ...(props.onUpdate !== undefined && { onUpdate: props.onUpdate }),
  ...(props.onCreate !== undefined && { onCreate: props.onCreate }),
  ...(props.onDestroy !== undefined && { onDestroy: props.onDestroy }),
  ...(props.onSelectionUpdate !== undefined && { onSelectionUpdate: props.onSelectionUpdate }),
  ...(props.onFocus !== undefined && { onFocus: props.onFocus }),
  ...(props.onBlur !== undefined && { onBlur: props.onBlur }),
});

const editor = $derived(editorState.current);
</script>

<div class="vizel-root {className ?? ''}" data-vizel-root>
  <VizelEditor {editor} />
  {#if showBubbleMenu && editor}
    <VizelToolbar {editor} {enableEmbed}>
      {#if bubbleMenu}
        {@render bubbleMenu({ editor })}
      {/if}
    </VizelToolbar>
  {/if}
  {#if children}
    {@render children({ editor })}
  {/if}
</div>
