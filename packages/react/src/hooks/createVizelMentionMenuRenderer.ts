import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSuggestionRendererOptions,
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
 *     interaction: {
 *       mention: {
 *         items: async (query) => fetchUsers(query),
 *         suggestion: createVizelMentionMenuRenderer(),
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createVizelMentionMenuRenderer(
  options: VizelSuggestionRendererOptions = {}
): Partial<SuggestionOptions<VizelMentionItem>> {
  return {
    render: () => {
      const rendererState: {
        root: Root | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
        items: VizelMentionItem[];
        commandFn: ((item: VizelMentionItem) => void) | null;
      } = {
        root: null,
        suggestionContainer: null,
        items: [],
        commandFn: null,
      };
      const menuRef: RefObject<VizelMentionMenuRef | null> = { current: null };

      const renderMenu = () => {
        const { root, commandFn } = rendererState;
        if (!(root && commandFn)) return;
        root.render(
          createElement(VizelMentionMenu, {
            items: rendererState.items,
            onSelect: commandFn,
            ...(options.className !== undefined && { className: options.className }),
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          rendererState.items = props.items;
          rendererState.commandFn = props.command;

          const suggestionContainer = createVizelSuggestionContainer();
          rendererState.suggestionContainer = suggestionContainer;
          rendererState.root = createRoot(suggestionContainer.menuContainer);
          renderMenu();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
          rendererState.items = props.items;
          rendererState.commandFn = props.command;
          renderMenu();
          rendererState.suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          return menuRef.current?.onKeyDown(props.event) ?? false;
        },

        onExit: () => {
          rendererState.root?.unmount();
          rendererState.suggestionContainer?.destroy();
          rendererState.root = null;
          rendererState.suggestionContainer = null;
        },
      };
    },
  };
}
