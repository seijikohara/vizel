import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { createElement, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VizelMentionMenu, type VizelMentionMenuRef } from "../components/VizelMentionMenu.tsx";

/**
 * Creates a suggestion render configuration for the Mention extension.
 * This handles the popup positioning and React component lifecycle.
 *
 * @example
 * ```tsx
 * import { createVizelMentionMenuRenderer } from '@vizel/react';
 *
 * const editor = useVizelEditor({
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
      let root: Root | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      let items: VizelMentionItem[] = [];
      let commandFn: ((item: VizelMentionItem) => void) | null = null;
      const menuRef: RefObject<VizelMentionMenuRef | null> = { current: null };

      const renderMenu = () => {
        if (!(root && commandFn)) return;
        root.render(
          createElement(VizelMentionMenu, {
            items,
            command: commandFn,
            ...(options.className !== undefined && { className: options.className }),
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          items = props.items;
          commandFn = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          root = createRoot(suggestionContainer.menuContainer);
          renderMenu();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
          items = props.items;
          commandFn = props.command;
          renderMenu();
          suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          return menuRef.current?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          root?.unmount();
          suggestionContainer?.destroy();
          root = null;
          suggestionContainer = null;
        },
      };
    },
  };
}
