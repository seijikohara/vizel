import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelSlashCommandItem,
  type VizelSuggestionRendererOptions,
} from "@vizel/core";
import { type App, createApp, h, ref } from "vue";
import { VizelSlashMenu } from "../components/index.ts";

export type { VizelSuggestionRendererOptions };

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
  options: VizelSuggestionRendererOptions = {}
): Partial<SuggestionOptions<VizelSlashCommandItem>> {
  return {
    render: () => {
      const renderState: {
        app: App | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
      } = { app: null, suggestionContainer: null };
      const componentRef = ref<VizelSlashMenuRef | null>(null);
      const items = ref<VizelSlashCommandItem[]>([]);
      const commandFn = ref<((item: VizelSlashCommandItem) => void) | null>(null);

      return {
        onStart: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;

          const suggestionContainer = createVizelSuggestionContainer();
          renderState.suggestionContainer = suggestionContainer;

          const app = createApp({
            setup() {
              return () =>
                h(VizelSlashMenu, {
                  items: items.value,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onSelect: (item: VizelSlashCommandItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });
          renderState.app = app;

          app.mount(suggestionContainer.menuContainer);
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelSlashCommandItem>) => {
          items.value = props.items;
          commandFn.value = props.command;
          renderState.suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          return componentRef.value?.onKeyDown(props.event) ?? false;
        },

        onExit: () => {
          renderState.app?.unmount();
          renderState.suggestionContainer?.destroy();
          renderState.app = null;
          renderState.suggestionContainer = null;
        },
      };
    },
  };
}
