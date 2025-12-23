import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { SlashMenu, type SlashMenuRef } from "./SlashMenu.tsx";
import type { SlashCommandItem } from "@vizel/core";

export interface SlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and React component lifecycle.
 *
 * @example
 * ```tsx
 * import { SlashCommand } from '@vizel/core';
 * import { createSlashMenuRenderer } from '@vizel/react';
 *
 * const editor = useEditor({
 *   extensions: [
 *     SlashCommand.configure({
 *       suggestion: createSlashMenuRenderer(),
 *     }),
 *   ],
 * });
 * ```
 */
export function createSlashMenuRenderer(
  options: SlashMenuRendererOptions = {}
): Partial<SuggestionOptions<SlashCommandItem>> {
  return {
    render: () => {
      let component: ReactRenderer<SlashMenuRef> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          component = new ReactRenderer(SlashMenu, {
            props: {
              items: props.items,
              command: props.command,
              className: options.className,
            },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }

          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
