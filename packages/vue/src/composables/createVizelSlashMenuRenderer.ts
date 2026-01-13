import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelSlashCommandItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { type App, createApp, h, ref } from "vue";
import { VizelSlashMenu } from "../components/index.ts";

export type { VizelSlashMenuRendererOptions };

interface VizelSlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Vue component lifecycle.
 *
 * @example
 * ```ts
 * import { createVizelSlashMenuRenderer } from '@vizel/vue';
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
      let app: App | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      const componentRef = ref<VizelSlashMenuRef | null>(null);
      const items = ref<VizelSlashCommandItem[]>([]);
      const commandFn = ref<((item: VizelSlashCommandItem) => void) | null>(null);

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;

          suggestionContainer = createVizelSuggestionContainer();

          app = createApp({
            setup() {
              return () =>
                h(VizelSlashMenu, {
                  items: items.value,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onCommand: (item: VizelSlashCommandItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });

          app.mount(suggestionContainer.menuContainer);
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;
          suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          return componentRef.value?.onKeyDown(props.event) ?? false;
        },

        onExit: () => {
          app?.unmount();
          suggestionContainer?.destroy();
          app = null;
          suggestionContainer = null;
        },
      };
    },
  };
}
