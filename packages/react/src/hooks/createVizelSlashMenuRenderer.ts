import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelSlashCommandItem,
  type VizelSuggestionRendererOptions,
} from "@vizel/core";
import { createElement, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VizelSlashMenu, type VizelSlashMenuRef } from "../components/VizelSlashMenu.tsx";

export type { VizelSuggestionRendererOptions };

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and React component lifecycle.
 *
 * @example
 * ```tsx
 * import { VizelSlashCommand } from '@vizel/core';
 * import { createVizelSlashMenuRenderer } from '@vizel/react';
 *
 * const editor = useEditor({
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
): Partial<SuggestionOptions<VizelSlashCommandItem>> {
  return {
    render: () => {
      const rendererState: {
        root: Root | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
        items: VizelSlashCommandItem[];
        commandFn: ((item: VizelSlashCommandItem) => void) | null;
      } = {
        root: null,
        suggestionContainer: null,
        items: [],
        commandFn: null,
      };
      const menuRef: RefObject<VizelSlashMenuRef | null> = { current: null };

      const renderMenu = () => {
        const { root, commandFn } = rendererState;
        if (!(root && commandFn)) return;
        root.render(
          createElement(VizelSlashMenu, {
            items: rendererState.items,
            onSelect: commandFn,
            ...(options.className !== undefined && { className: options.className }),
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          rendererState.items = props.items;
          rendererState.commandFn = props.command;

          const suggestionContainer = createVizelSuggestionContainer();
          rendererState.suggestionContainer = suggestionContainer;
          rendererState.root = createRoot(suggestionContainer.menuContainer);
          renderMenu();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
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
