<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelBubbleMenuProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
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
import { BubbleMenuPlugin, createVizelBubbleMenuEscapeController } from "@vizel/core";
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
const editor = $derived(editorProp ?? contextEditor?.current);

let menuElement = $state<HTMLElement | null>(null);

$effect(() => {
  if (!(editor && menuElement)) return;

  const currentEditor = editor;
  const currentPluginKey = pluginKey;

  // Track `shouldShow` *presence* (not identity) so the effect re-runs when
  // the prop toggles between `undefined` and a function. An identity-stable
  // change of a continuously-defined `shouldShow` still flows through the
  // wrapper closure without re-registering the plugin (the wrapper reads
  // `shouldShow` lazily at fire time). The previous shape captured presence
  // via `untrack(...)`, so toggling from `undefined` → defined silently
  // skipped the wrapper and the reverse pinned the bubble menu hidden.
  const hasShouldShow = shouldShow !== undefined;

  const plugin = BubbleMenuPlugin({
    pluginKey: currentPluginKey,
    editor: currentEditor,
    element: menuElement,
    updateDelay,
    ...(hasShouldShow && {
      shouldShow: ({ editor: e, from, to }) =>
        shouldShow?.({ editor: e as Editor, from, to }) ?? false,
    }),
    options: {
      placement: "top",
    },
  });

  currentEditor.registerPlugin(plugin);

  // Escape collapses the selection so the bubble menu hides via its
  // shouldShow predicate. The listener lives in a Core controller so
  // this component never attaches the `keydown` listener directly
  // (ADR-0003, ADR-0007).
  const escapeController = createVizelBubbleMenuEscapeController({
    getEditor: () => editor,
  });
  escapeController.mount();

  return () => {
    currentEditor.unregisterPlugin(currentPluginKey);
    escapeController.unmount();
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
