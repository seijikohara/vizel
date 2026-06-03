import {
  createVizelSuggestionContainer,
  getVizelSlashCommandLocale,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelCommand,
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
 * The menu renders `VizelCommandSpec` items derived from the unified
 * `VizelCommand` registry. Selecting an item maps its id back to the
 * matching command and forwards it to Tiptap's `props.command`, which runs
 * the command after the extension deletes the slash trigger text.
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
): Partial<SuggestionOptions<VizelCommand>> {
  return {
    render: () => {
      const rendererState: {
        root: Root | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
        props: SuggestionProps<VizelCommand> | null;
      } = {
        root: null,
        suggestionContainer: null,
        props: null,
      };
      const menuRef: RefObject<VizelSlashMenuRef | null> = { current: null };

      const renderMenu = () => {
        const { root, props } = rendererState;
        if (!(root && props)) return;
        root.render(
          createElement(VizelSlashMenu, {
            commands: props.items,
            editor: props.editor,
            locale: getVizelSlashCommandLocale(props.editor),
            query: props.query,
            onSelect: (id: string) => {
              const command = props.items.find((c) => c.id === id);
              if (command) props.command(command);
            },
            ...(options.className !== undefined && { className: options.className }),
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<VizelCommand>) => {
          rendererState.props = props;

          const suggestionContainer = createVizelSuggestionContainer();
          rendererState.suggestionContainer = suggestionContainer;
          rendererState.root = createRoot(suggestionContainer.menuContainer);
          renderMenu();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelCommand>) => {
          rendererState.props = props;
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
