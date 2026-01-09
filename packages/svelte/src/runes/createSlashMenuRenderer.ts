import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { VizelSlashCommandItem } from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelSlashMenu from "../components/VizelSlashMenu.svelte";

export interface VizelSlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

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
      let container: HTMLDivElement | null = null;
      let menuContainer: HTMLDivElement | null = null;
      let items: VizelSlashCommandItem[] = [];
      let commandFn: ((item: VizelSlashCommandItem) => void) | null = null;

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

          component = mount(VizelSlashMenu, {
            target: menuContainer,
            props: {
              items,
              ...(options.className !== undefined && { class: options.className }),
              oncommand: (item: VizelSlashCommandItem) => {
                commandFn?.(item);
              },
            },
          });

          updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          // Svelte 5 mount doesn't support updating props after mount
          // We need to remount the component with new props
          if (component && menuContainer) {
            unmount(component);
            component = mount(VizelSlashMenu, {
              target: menuContainer,
              props: {
                items,
                ...(options.className !== undefined && { class: options.className }),
                oncommand: (item: VizelSlashCommandItem) => {
                  commandFn?.(item);
                },
              },
            });
          }

          updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
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
          container?.remove();
          component = null;
          container = null;
          menuContainer = null;
        },
      };
    },
  };
}
