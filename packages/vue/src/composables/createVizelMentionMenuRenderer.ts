import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSuggestionRendererOptions,
} from "@vizel/core";
import { type App, createApp, h, ref } from "vue";
import { VizelMentionMenu } from "../components/index.ts";

interface VizelMentionMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a suggestion render configuration for the Mention extension.
 * This handles the popup positioning and Vue component lifecycle.
 *
 * @example
 * ```ts
 * import { createVizelMentionMenuRenderer } from '@vizel/vue';
 *
 * const editor = useVizelEditor({
 *   features: {
 *     interaction: {
 *       mention: {
 *         items: async (query) => fetchUsers(query),
 *         suggestion: createVizelMentionMenuRenderer(),
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createVizelMentionMenuRenderer(
  options: VizelSuggestionRendererOptions = {}
): Partial<SuggestionOptions<VizelMentionItem>> {
  return {
    render: () => {
      const renderState: {
        app: App | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
      } = { app: null, suggestionContainer: null };
      const componentRef = ref<VizelMentionMenuRef | null>(null);
      const items = ref<VizelMentionItem[]>([]);
      const commandFn = ref<((item: VizelMentionItem) => void) | null>(null);

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          items.value = props.items;
          commandFn.value = props.command;

          const suggestionContainer = createVizelSuggestionContainer();
          renderState.suggestionContainer = suggestionContainer;

          const app = createApp({
            setup() {
              return () =>
                h(VizelMentionMenu, {
                  items: items.value,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onSelect: (item: VizelMentionItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });
          renderState.app = app;

          app.mount(suggestionContainer.menuContainer);
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
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
