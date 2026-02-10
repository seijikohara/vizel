import {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelMentionItem,
  type VizelSlashMenuRendererOptions,
} from "@vizel/core";
import { mount, unmount } from "svelte";
import VizelMentionMenu from "../components/VizelMentionMenu.svelte";

export type { VizelSlashMenuRendererOptions };

interface MentionMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const isMentionMenuRef = (value: unknown): value is MentionMenuRef =>
  typeof value === "object" && value !== null && "onKeyDown" in value;

/**
 * Creates a suggestion render configuration for the Mention extension.
 * This handles the popup positioning and Svelte component lifecycle.
 *
 * @example
 * ```ts
 * import { createVizelMentionMenuRenderer } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({
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
      let component: ReturnType<typeof mount> | null = null;
      let suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null = null;
      let items: VizelMentionItem[] = [];
      let commandFn: ((item: VizelMentionItem) => void) | null = null;

      const mountComponent = () => {
        if (!suggestionContainer) return;
        component = mount(VizelMentionMenu, {
          target: suggestionContainer.menuContainer,
          props: {
            items,
            ...(options.className !== undefined && { class: options.className }),
            oncommand: (item: VizelMentionItem) => {
              commandFn?.(item);
            },
          },
        });
      };

      return {
        onStart: (props: SuggestionProps<VizelMentionItem>) => {
          items = props.items;
          commandFn = props.command;

          suggestionContainer = createVizelSuggestionContainer();
          mountComponent();
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelMentionItem>) => {
          items = props.items;
          commandFn = props.command;

          if (component && suggestionContainer) {
            unmount(component);
            mountComponent();
          }

          suggestionContainer?.updatePosition(props.clientRect);
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (handleVizelSuggestionEscape(props.event)) {
            return true;
          }
          if (component && isMentionMenuRef(component)) {
            return component.onKeyDown(props.event);
          }
          return false;
        },

        onExit: () => {
          if (component) {
            unmount(component);
          }
          suggestionContainer?.destroy();
          component = null;
          suggestionContainer = null;
        },
      };
    },
  };
}
