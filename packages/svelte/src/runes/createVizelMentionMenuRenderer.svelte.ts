import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelMentionMenu, { type VizelMentionMenuRef } from "../components/VizelMentionMenu.svelte";

export type { VizelSlashMenuRendererOptions };

/**
 * Creates a suggestion render configuration for the Mention extension.
 * This handles the popup positioning and Svelte component lifecycle.
 *
 * The menu component is mounted once per suggestion session. Subsequent
 * `onUpdate` calls mutate the reactive props in place so the menu rerenders
 * without losing internal state like the selected index.
 *
 * @example
 * ```ts
 * import { createVizelMentionMenuRenderer } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({
 *   features: {
 *     mention: {
 *       items: async (query) => fetchUsers(query),
 *       suggestion: createVizelMentionMenuRenderer(),
 *     },
 *   },
 * });
 * ```
 */
export function createVizelMentionMenuRenderer(
  options: VizelSlashMenuRendererOptions = {}
): Partial<SuggestionOptions<VizelMentionItem>> {
  return {
    render: () => {
      let component: ReturnType<typeof mount> | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      const menuState = $state<{
        items: VizelMentionItem[];
        onselect: (item: VizelMentionItem) => void;
      }>({
        items: [],
        onselect: () => {
          // initial no-op; replaced by Tiptap's `props.command` in onStart.
        },
      });
      const menuRef: VizelMentionMenuRef = {};

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          menuState.items = props.items;
          menuState.onselect = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          component = mount(VizelMentionMenu, {
            target: suggestionContainer.menuContainer,
            props: {
              ...(options.className !== undefined && { class: options.className }),
              get items() {
                return menuState.items;
              },
              get onselect() {
                return menuState.onselect;
              },
              ref: menuRef,
            },
          });
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
          menuState.items = props.items;
          menuState.onselect = props.command;
          suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          return menuRef.onKeyDown?.(props.event) ?? false;
        },

        onExit: () => {
          if (component) {
            unmount(component);
          }
          suggestionContainer?.destroy();
          component = null;
          suggestionContainer = null;
          delete menuRef.onKeyDown;
        },
      };
    },
  };
}
