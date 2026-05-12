import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelSlashCommandItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelSlashMenu, { type VizelSlashMenuRef } from "../components/VizelSlashMenu.svelte";

export type { VizelSlashMenuRendererOptions };

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Svelte component lifecycle.
 *
 * The menu component is mounted once per suggestion session. Subsequent
 * `onUpdate` calls mutate the reactive props in place so the menu rerenders
 * without losing internal state like the selected index.
 *
 * @example
 * ```ts
 * import { createVizelSlashMenuRenderer } from '@vizel/svelte';
 * import { VizelSlashCommand } from '@vizel/core';
 *
 * const editor = new Editor({
 *   extensions: [
 *     VizelSlashCommand.configure({
 *       suggestion: createVizelSlashMenuRenderer(),
 *     }),
 *   ],
 * });
 * ```
 */
export function createVizelSlashMenuRenderer(
  options: VizelSlashMenuRendererOptions = {}
): Partial<SuggestionOptions<VizelSlashCommandItem>> {
  return {
    render: () => {
      let component: ReturnType<typeof mount> | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      // Reactive state passed to the menu component as props. Mutating these
      // fields drives the component's reactivity instead of remounting.
      const menuState = $state<{
        items: VizelSlashCommandItem[];
        oncommand: (item: VizelSlashCommandItem) => void;
      }>({
        items: [],
        oncommand: () => {
          // initial no-op; replaced by Tiptap's `props.command` in onStart.
        },
      });
      // Mutable ref the component populates with its `onKeyDown` handler.
      // Svelte 5 `mount()` does not return instance-script exports, so the
      // component writes into this object during setup.
      const menuRef: VizelSlashMenuRef = {};

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          menuState.items = props.items;
          menuState.oncommand = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          component = mount(VizelSlashMenu, {
            target: suggestionContainer.menuContainer,
            props: {
              ...(options.className !== undefined && { class: options.className }),
              get items() {
                return menuState.items;
              },
              get oncommand() {
                return menuState.oncommand;
              },
              ref: menuRef,
            },
          });
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
          menuState.items = props.items;
          menuState.oncommand = props.command;
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
