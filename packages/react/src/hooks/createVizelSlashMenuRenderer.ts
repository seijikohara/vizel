import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type VizelSlashCommandItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { createElement, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VizelSlashMenu, type VizelSlashMenuRef } from "../components/VizelSlashMenu.tsx";

export type { VizelSlashMenuRendererOptions };

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
  options: VizelSlashMenuRendererOptions = {}
): Partial<SuggestionOptions<VizelSlashCommandItem>> {
  return {
    render: () => {
      let root: Root | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      let items: VizelSlashCommandItem[] = [];
      let commandFn: ((item: VizelSlashCommandItem) => void) | null = null;
      const menuRef: RefObject<VizelSlashMenuRef | null> = { current: null };

      const renderMenu = () => {
        if (!(root && commandFn)) return;
        root.render(
          createElement(VizelSlashMenu, {
            items,
            command: commandFn,
            ...(options.className !== undefined && { className: options.className }),
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          root = createRoot(suggestionContainer.menuContainer);
          renderMenu();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
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
