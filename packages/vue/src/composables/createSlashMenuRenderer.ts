import { createApp, h, ref, type App } from "vue";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { SlashCommandItem } from "@vizel/core";
import { SlashMenu } from "../components/index.ts";

export interface SlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Vue component lifecycle.
 *
 * @example
 * ```ts
 * import { SlashCommand, createSlashMenuRenderer } from '@vizel/vue';
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
      let app: App | null = null;
      let popup: TippyInstance[] | null = null;
      let container: HTMLElement | null = null;
      let componentRef = ref<SlashMenuRef | null>(null);
      const items = ref<SlashCommandItem[]>([]);
      const commandFn = ref<((item: SlashCommandItem) => void) | null>(null);

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;

          container = document.createElement("div");

          app = createApp({
            setup() {
              return () =>
                h(SlashMenu, {
                  items: items.value,
                  class: options.className,
                  ref: componentRef,
                  onCommand: (item: SlashCommandItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });

          app.mount(container);

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
          items.value = props.items;
          commandFn.value = props.command;

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

          return componentRef.value?.onKeyDown(props.event) ?? false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          app?.unmount();
          container?.remove();
          app = null;
          container = null;
        },
      };
    },
  };
}
