<script lang="ts">
  import { onDestroy } from "svelte";
  import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
  import type { Editor } from "@vizel/core";
  import type { Snippet } from "svelte";
  import BubbleMenuToolbar from "./BubbleMenuToolbar.svelte";

  interface Props {
    editor: Editor | null;
    class?: string;
    showDefaultToolbar?: boolean;
    pluginKey?: string;
    updateDelay?: number;
    shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
    children?: Snippet;
  }

  let {
    editor,
    class: className,
    showDefaultToolbar = true,
    pluginKey = "vizelBubbleMenu",
    updateDelay = 100,
    shouldShow,
    children,
  }: Props = $props();

  let menuElement = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!editor || !menuElement) return;

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuElement,
      updateDelay,
      shouldShow: shouldShow
        ? ({ editor: e, from, to }) =>
            shouldShow({ editor: e as Editor, from, to })
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
