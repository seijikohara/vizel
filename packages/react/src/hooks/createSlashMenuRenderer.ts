import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { SlashCommandItem } from "@vizel/core";
import { createElement, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SlashMenu, type SlashMenuRef } from "../components/SlashMenu.tsx";

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
      let root: Root | null = null;
      let container: HTMLDivElement | null = null;
      let menuContainer: HTMLDivElement | null = null;
      let items: SlashCommandItem[] = [];
      let commandFn: ((item: SlashCommandItem) => void) | null = null;
      const menuRef: RefObject<SlashMenuRef | null> = { current: null };

      const updatePosition = (clientRect: (() => DOMRect | null) | null | undefined) => {
        if (!(container && clientRect)) return;

        const rect = clientRect();
        if (!rect) return;

        // Position below the cursor
        const top = rect.bottom + window.scrollY;
        const left = rect.left + window.scrollX;

        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
      };

      const renderMenu = () => {
        if (!(root && commandFn)) return;
        root.render(
          createElement(SlashMenu, {
            items,
            command: commandFn,
            className: options.className,
            ref: menuRef,
          })
        );
      };

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          // Create positioned container
          container = document.createElement("div");
          container.style.position = "absolute";
          container.style.zIndex = "50";
          document.body.appendChild(container);

          menuContainer = document.createElement("div");
          container.appendChild(menuContainer);

          root = createRoot(menuContainer);
          renderMenu();

          updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;
          renderMenu();

          updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
            return true;
          }

          return menuRef.current?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          root?.unmount();
          container?.remove();
          root = null;
          container = null;
          menuContainer = null;
        },
      };
    },
  };
}
