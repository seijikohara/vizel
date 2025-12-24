import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { Editor } from "@tiptap/vue-3";
import { onBeforeUnmount, type Ref, ref, watch } from "vue";

export interface UseBubbleMenuOptions {
  /** The editor instance */
  editor: Ref<Editor | undefined>;
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
}

export interface UseBubbleMenuReturn {
  /** Ref for the menu element - bind to the menu container */
  menuRef: Ref<HTMLElement | null>;
}

/**
 * Vue composable for managing a BubbleMenu.
 * Handles plugin registration and lifecycle automatically.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, useBubbleMenu, BubbleMenuToolbar } from '@vizel/vue';
 *
 * const editor = useVizelEditor({ placeholder: "Start typing..." });
 * const { menuRef } = useBubbleMenu({ editor });
 * </script>
 *
 * <template>
 *   <div ref="menuRef" class="vizel-bubble-menu" style="visibility: hidden">
 *     <BubbleMenuToolbar v-if="editor" :editor="editor" />
 *   </div>
 * </template>
 * ```
 */
export function useBubbleMenu(options: UseBubbleMenuOptions): UseBubbleMenuReturn {
  const { editor, pluginKey = "vizelBubbleMenu", updateDelay = 100, shouldShow } = options;

  const menuRef = ref<HTMLElement | null>(null);

  watch(
    [editor, menuRef],
    ([editorInstance, element], [oldEditor]) => {
      if (!(editorInstance && element)) return;

      // Unregister old plugin if editor changed
      if (oldEditor) {
        oldEditor.unregisterPlugin(pluginKey);
      }

      const plugin = BubbleMenuPlugin({
        pluginKey,
        editor: editorInstance,
        element,
        updateDelay,
        shouldShow: shouldShow
          ? ({ editor: e, from, to }) => shouldShow({ editor: e as Editor, from, to })
          : undefined,
        options: {
          placement: "top",
        },
      });

      editorInstance.registerPlugin(plugin);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.unregisterPlugin(pluginKey);
    }
  });

  return {
    menuRef,
  };
}
