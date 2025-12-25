import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { SlashCommandItem } from "@vizel/core";
import { type App, createApp, h, ref } from "vue";
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
      let container: HTMLDivElement | null = null;
      let menuContainer: HTMLDivElement | null = null;
      const componentRef = ref<SlashMenuRef | null>(null);
      const items = ref<SlashCommandItem[]>([]);
      const commandFn = ref<((item: SlashCommandItem) => void) | null>(null);

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
          items.value = props.items;
          commandFn.value = props.command;

          // Create positioned container
          container = document.createElement("div");
          container.style.position = "absolute";
          container.style.zIndex = "50";
          document.body.appendChild(container);

          menuContainer = document.createElement("div");
          container.appendChild(menuContainer);

          app = createApp({
            setup() {
              return () =>
                h(SlashMenu, {
                  items: items.value,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onCommand: (item: SlashCommandItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });

          app.mount(menuContainer);
          updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;
          updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
            return true;
          }

          return componentRef.value?.onKeyDown(props.event) ?? false;
        },

        onExit: () => {
          app?.unmount();
          container?.remove();
          app = null;
          container = null;
          menuContainer = null;
        },
      };
    },
  };
}
