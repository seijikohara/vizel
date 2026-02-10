import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSlashMenuRendererOptions,
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
 *     mention: {
 *       items: async (query) => fetchUsers(query),
 *       suggestion: createVizelMentionMenuRenderer(),
 *     },
 *   },
 * });
 * ```
 */
export function createVizelMentionMenuRenderer(
  options: VizelSlashMenuRendererOptions = {}
): Partial<SuggestionOptions<VizelMentionItem>> {
  return {
    render: () => {
      let app: App | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      const componentRef = ref<VizelMentionMenuRef | null>(null);
      const items = ref<VizelMentionItem[]>([]);
      const commandFn = ref<((item: VizelMentionItem) => void) | null>(null);

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          items.value = props.items;
          commandFn.value = props.command;

          suggestionContainer = createVizelSuggestionContainer();

          app = createApp({
            setup() {
              return () =>
                h(VizelMentionMenu, {
                  items: items.value,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onCommand: (item: VizelMentionItem) => {
                    commandFn.value?.(item);
                  },
                });
            },
          });

          app.mount(suggestionContainer.menuContainer);
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
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
