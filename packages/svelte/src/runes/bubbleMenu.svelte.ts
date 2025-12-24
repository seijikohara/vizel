import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { Editor } from "@vizel/core";

export interface CreateBubbleMenuOptions {
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
}

export interface BubbleMenuState {
  /** The menu element - bind to this */
  element: HTMLElement | null;
  /** Whether the plugin is registered */
  isRegistered: boolean;
  /** Register the plugin with the editor */
  register: (editor: Editor, element: HTMLElement) => void;
  /** Unregister the plugin from the editor */
  unregister: (editor: Editor) => void;
}

/**
 * Creates a reactive BubbleMenu state using Svelte 5 runes.
 * Manages plugin registration and provides element binding.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createBubbleMenu, BubbleMenuToolbar } from '@vizel/svelte';
 *
 * let { editor } = $props();
 * const bubbleMenu = createBubbleMenu();
 *
 * $effect(() => {
 *   if (editor && bubbleMenu.element) {
 *     bubbleMenu.register(editor, bubbleMenu.element);
 *     return () => bubbleMenu.unregister(editor);
 *   }
 * });
 * </script>
 *
 * <div bind:this={bubbleMenu.element} class="vizel-bubble-menu">
 *   <BubbleMenuToolbar {editor} />
 * </div>
 * ```
 */
export function createBubbleMenu(
  options: CreateBubbleMenuOptions = {}
): BubbleMenuState {
  const {
    pluginKey = "vizelBubbleMenu",
    updateDelay = 100,
    shouldShow,
  } = options;

  let element = $state<HTMLElement | null>(null);
  let isRegistered = $state(false);

  function register(editor: Editor, el: HTMLElement) {
    if (isRegistered) return;

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: el,
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
    isRegistered = true;
  }

  function unregister(editor: Editor) {
    if (!isRegistered) return;
    editor.unregisterPlugin(pluginKey);
    isRegistered = false;
  }

  return {
    get element() {
      return element;
    },
    set element(value: HTMLElement | null) {
      element = value;
    },
    get isRegistered() {
      return isRegistered;
    },
    register,
    unregister,
  };
}
