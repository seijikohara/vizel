import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { VizelSlashCommandItem } from "@vizel/core";
import { createElement, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VizelSlashMenu, type VizelSlashMenuRef } from "../components/VizelSlashMenu.tsx";

export interface VizelSlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

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
      let container: HTMLDivElement | null = null;
      let menuContainer: HTMLDivElement | null = null;
      let items: VizelSlashCommandItem[] = [];
      let commandFn: ((item: VizelSlashCommandItem) => void) | null = null;
      const menuRef: RefObject<VizelSlashMenuRef | null> = { current: null };

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

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
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
