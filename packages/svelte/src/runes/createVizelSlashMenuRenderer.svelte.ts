import {
  createVizelSuggestionContainer,
  type Editor,
  getVizelSlashCommandLocale,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelCommand,
  type VizelLocale,
  type VizelSuggestionRendererOptions,
  vizelEnLocale,
} from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelSlashMenu, { type VizelSlashMenuRef } from "../components/VizelSlashMenu.svelte";

export type { VizelSuggestionRendererOptions };

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Svelte component lifecycle.
 *
 * The menu component is mounted once per suggestion session. Subsequent
 * `onUpdate` calls mutate the reactive props in place so the menu rerenders
 * without losing internal state like the selected index. The menu renders
 * `VizelCommandSpec` items derived from the unified `VizelCommand` registry;
 * selecting an item maps its id back to the matching command and forwards it
 * to Tiptap's `props.command`.
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
  options: VizelSuggestionRendererOptions = {}
): Partial<SuggestionOptions<VizelCommand>> {
  return {
    render: () => {
      let component: ReturnType<typeof mount> | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      // Reactive state passed to the menu component as props. Mutating these
      // fields drives the component's reactivity instead of remounting.
      const menuState = $state<{
        commands: readonly VizelCommand[];
        editor: Editor | null;
        locale: VizelLocale;
        query: string;
        onselect: (id: string) => void;
      }>({
        commands: [],
        editor: null,
        locale: vizelEnLocale,
        query: "",
        onselect: () => {
          // initial no-op; replaced by the id-to-command mapper in onStart.
        },
      });
      // Mutable ref the component populates with its `onKeyDown` handler.
      // Svelte 5 `mount()` does not return instance-script exports, so the
      // component writes into this object during setup.
      const menuRef: VizelSlashMenuRef = {};

      const sync = (props: SuggestionProps<VizelCommand>) => {
        menuState.commands = props.items;
        menuState.editor = props.editor;
        menuState.locale = getVizelSlashCommandLocale(props.editor);
        menuState.query = props.query;
        menuState.onselect = (id: string) => {
          const command = props.items.find((c) => c.id === id);
          if (command) props.command(command);
        };
      };

      return {
        onStart: (props: SuggestionProps<VizelCommand>) => {
          sync(props);

          suggestionContainer = createVizelSuggestionContainer();
          component = mount(VizelSlashMenu, {
            target: suggestionContainer.menuContainer,
            props: {
              ...(options.className !== undefined && { class: options.className }),
              get commands() {
                return menuState.commands;
              },
              get editor() {
                // `onStart` always sets the editor before mount, so the
                // non-null assertion holds for the menu's required prop.
                return props.editor;
              },
              get locale() {
                return menuState.locale;
              },
              get query() {
                return menuState.query;
              },
              get onselect() {
                return menuState.onselect;
              },
              ref: menuRef,
            },
          });
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelCommand>) => {
          sync(props);
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
