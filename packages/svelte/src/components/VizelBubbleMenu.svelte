<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelBubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name for the menu container */
  class?: string;
  /** Whether to show the default formatting menu */
  showDefaultMenu?: boolean;
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
  /** Custom menu items (overrides default menu) */
  children?: Snippet;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import { BubbleMenuPlugin } from "@vizel/core";
import { untrack } from "svelte";
import VizelBubbleMenuDefault from "./VizelBubbleMenuDefault.svelte";
import { getVizelContextSafe } from "./VizelContext.js";

let {
  editor: editorProp,
  class: className,
  showDefaultMenu = true,
  pluginKey = "vizelBubbleMenu",
  updateDelay = 100,
  shouldShow,
  children,
  enableEmbed,
  locale,
}: VizelBubbleMenuProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.());

let menuElement = $state<HTMLElement | null>(null);

// Handle Escape key to hide bubble menu by collapsing selection
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && editor && !editor.view.state.selection.empty) {
    event.preventDefault();
    editor.commands.setTextSelection(editor.view.state.selection.to);
  }
}

$effect(() => {
  if (!(editor && menuElement)) return;

  const currentEditor = editor;
  const currentPluginKey = pluginKey;

  // Capture `shouldShow` without tracking so value updates flow through the
  // wrapper closure (read lazily, outside any reactive context) without
  // re-registering the plugin. Matches the React `shouldShowRef` pattern.
  const initialShouldShow = untrack(() => shouldShow);

  const plugin = BubbleMenuPlugin({
    pluginKey: currentPluginKey,
    editor: currentEditor,
    element: menuElement,
    updateDelay,
    ...(initialShouldShow && {
      shouldShow: ({ editor: e, from, to }) =>
        shouldShow?.({ editor: e as Editor, from, to }) ?? false,
    }),
    options: {
      placement: "top",
    },
  });

  currentEditor.registerPlugin(plugin);
  document.addEventListener("keydown", handleKeyDown);

  return () => {
    currentEditor.unregisterPlugin(currentPluginKey);
    document.removeEventListener("keydown", handleKeyDown);
  };
});
</script>

{#if editor}
  <div
    bind:this={menuElement}
    class="vizel-bubble-menu {className ?? ''}"
    data-vizel-bubble-menu
    role="toolbar"
    aria-label={locale?.bubbleMenu?.ariaLabel ?? "Text formatting"}
    style="visibility: hidden"
  >
    {#if children}
      {@render children()}
    {:else if showDefaultMenu}
      <VizelBubbleMenuDefault {editor} {...(enableEmbed ? { enableEmbed } : {})} {...(locale ? { locale } : {})} />
    {/if}
  </div>
{/if}
