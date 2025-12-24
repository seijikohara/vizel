import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { SlashCommandItem } from "@vizel/core";
import { mount, unmount } from "svelte";
import tippy, { type Instance as TippyInstance } from "tippy.js";
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
      let popup: TippyInstance[] | null = null;
      let container: HTMLElement | null = null;
      let items: SlashCommandItem[] = [];
      let commandFn: ((item: SlashCommandItem) => void) | null = null;

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          container = document.createElement("div");

          component = mount(SlashMenu, {
            target: container,
            props: {
              items,
              class: options.className,
              oncommand: (item: SlashCommandItem) => {
                commandFn?.(item);
              },
            },
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: container,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          items = props.items;
          commandFn = props.command;

          // Update component props
          if (component) {
            // Svelte 5 mount returns the component instance
            // We need to update props through the returned object
            (component as unknown as { items: SlashCommandItem[] }).items = items;
          }

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

          if (component) {
            const ref = component as unknown as SlashMenuRef;
            return ref.onKeyDown?.(props.event) ?? false;
          }
          return false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          if (component) {
            unmount(component);
          }
          container?.remove();
          component = null;
          container = null;
        },
      };
    },
  };
}
