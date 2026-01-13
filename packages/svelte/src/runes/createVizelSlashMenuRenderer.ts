import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type VizelSlashCommandItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelSlashMenu from "../components/VizelSlashMenu.svelte";

export type { VizelSlashMenuRendererOptions };

interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/** Type guard for SlashMenuRef */
const isSlashMenuRef = (value: unknown): value is SlashMenuRef =>
  typeof value === "object" && value !== null && "onKeyDown" in value;

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Svelte component lifecycle.
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
      let items: VizelSlashCommandItem[] = [];
      let commandFn: ((item: VizelSlashCommandItem) => void) | null = null;

      const mountComponent = () => {
        if (!suggestionContainer) return;
        component = mount(VizelSlashMenu, {
          target: suggestionContainer.menuContainer,
          props: {
            items,
            ...(options.className !== undefined && { class: options.className }),
            oncommand: (item: VizelSlashCommandItem) => {
              commandFn?.(item);
            },
          },
        });
      };

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          mountComponent();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          // Svelte 5 mount doesn't support updating props after mount
          // We need to remount the component with new props
          if (component && suggestionContainer) {
            unmount(component);
            mountComponent();
          }

          suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          if (component && isSlashMenuRef(component)) {
            return component.onKeyDown(props.event);
          }
          return false;
        },

        onExit: () => {
          if (component) {
            unmount(component);
          }
          suggestionContainer?.destroy();
          component = null;
          suggestionContainer = null;
        },
      };
    },
  };
}
