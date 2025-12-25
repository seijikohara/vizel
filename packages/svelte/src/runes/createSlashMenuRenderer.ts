import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { SlashCommandItem } from "@vizel/core";
import { mount, unmount } from "svelte";
import SlashMenu from "../components/SlashMenu.svelte";

export interface SlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Svelte component lifecycle.
 *
 * @example
 * ```ts
 * import { SlashCommand, createSlashMenuRenderer } from '@vizel/svelte';
 *
 * const editor = new Editor({
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
      let component: ReturnType<typeof mount> | null = null;
      let container: HTMLDivElement | null = null;
      let menuContainer: HTMLDivElement | null = null;
      let items: SlashCommandItem[] = [];
      let commandFn: ((item: SlashCommandItem) => void) | null = null;

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

          component = mount(SlashMenu, {
            target: menuContainer,
            props: {
              items,
              class: options.className,
              oncommand: (item: SlashCommandItem) => {
                commandFn?.(item);
              },
            },
          });

          updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          // Svelte 5 mount doesn't support updating props after mount
          // We need to remount the component with new props
          if (component && menuContainer) {
            unmount(component);
            component = mount(SlashMenu, {
              target: menuContainer,
              props: {
                items,
                class: options.className,
                oncommand: (item: SlashCommandItem) => {
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

          if (component) {
            const ref = component as unknown as SlashMenuRef;
            return ref.onKeyDown?.(props.event) ?? false;
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
