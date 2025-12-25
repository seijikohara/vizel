<script lang="ts" module>
import type { Editor } from "@vizel/core";
import type { Snippet } from "svelte";

export interface BubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name for the menu container */
  class?: string;
  /** Whether to show the default formatting toolbar */
  showDefaultToolbar?: boolean;
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
  /** Custom menu items (overrides default toolbar) */
  children?: Snippet;
}
</script>

<script lang="ts">
import { BubbleMenuPlugin } from "@vizel/core";
import { onDestroy } from "svelte";
import BubbleMenuToolbar from "./BubbleMenuToolbar.svelte";
import { useEditorContextSafe } from "./EditorContext.ts";

let {
  editor: editorProp,
  class: className,
  showDefaultToolbar = true,
  pluginKey = "vizelBubbleMenu",
  updateDelay = 100,
  shouldShow,
  children,
}: BubbleMenuProps = $props();

const contextEditor = useEditorContextSafe();
const editor = $derived(editorProp ?? contextEditor?.());

let menuElement = $state<HTMLElement | null>(null);

$effect(() => {
  if (!(editor && menuElement)) return;

  const plugin = BubbleMenuPlugin({
    pluginKey,
    editor,
    element: menuElement,
    updateDelay,
    shouldShow: shouldShow
      ? ({ editor: e, from, to }) => shouldShow({ editor: e as Editor, from, to })
      : undefined,
    options: {
      placement: "top",
    },
  });

  editor.registerPlugin(plugin);

  return () => {
    editor.unregisterPlugin(pluginKey);
  };
});

onDestroy(() => {
  if (editor) {
    editor.unregisterPlugin(pluginKey);
  }
});
</script>

{#if editor}
  <div
    bind:this={menuElement}
    class="vizel-bubble-menu {className ?? ''}"
    data-vizel-bubble-menu
    style="visibility: hidden"
  >
    {#if children}
      {@render children()}
    {:else if showDefaultToolbar}
      <BubbleMenuToolbar {editor} />
    {/if}
  </div>
{/if}
