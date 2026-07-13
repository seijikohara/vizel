import {
  createVizelSuggestionContainer,
  getVizelSlashCommandLocale,
  handleVizelSuggestionEscape,
  type SuggestionOptions,
  type SuggestionProps,
  type VizelCommand,
  type VizelSuggestionRendererOptions,
} from "@vizel/core";
import { type App, createApp, h, ref, shallowRef } from "vue";

import { VizelSlashMenu } from "../components/index.ts";

export type { VizelSuggestionRendererOptions };

interface VizelSlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * Creates a suggestion render configuration for the SlashCommand extension.
 * This handles the popup positioning and Vue component lifecycle.
 *
 * The menu renders `VizelCommandSpec` items derived from the unified
 * `VizelCommand` registry. Selecting an item maps its id back to the
 * matching command and forwards it to Tiptap's `props.command`, which runs
 * the command after the extension deletes the slash trigger text.
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
): Partial<SuggestionOptions<VizelCommand>> {
  return {
    render: () => {
      const renderState: {
        app: App | null;
        suggestionContainer: ReturnType<typeof createVizelSuggestionContainer> | null;
      } = { app: null, suggestionContainer: null };
      const componentRef = ref<VizelSlashMenuRef | null>(null);
      // `shallowRef` keeps the Tiptap `Editor` instance opaque; a deep `ref`
      // would unwrap the editor's nested refs and mangle its type.
      const current = shallowRef<SuggestionProps<VizelCommand> | null>(null);

      const runById = (id: string) => {
        const props = current.value;
        if (!props) return;
        const command = props.items.find((c) => c.id === id);
        if (command) props.command(command);
      };

      return {
        onStart: (props: SuggestionProps<VizelCommand>) => {
          current.value = props;

          const suggestionContainer = createVizelSuggestionContainer();
          renderState.suggestionContainer = suggestionContainer;

          const app = createApp({
            setup() {
              return () => {
                const latestProps = current.value;
                if (!latestProps) return null;
                return h(VizelSlashMenu, {
                  commands: latestProps.items,
                  editor: latestProps.editor,
                  locale: getVizelSlashCommandLocale(latestProps.editor),
                  query: latestProps.query,
                  ...(options.className !== undefined && { class: options.className }),
                  ref: componentRef,
                  onSelect: runById,
                });
              };
            },
          });
          renderState.app = app;

          app.mount(suggestionContainer.menuContainer);
          suggestionContainer.updatePosition(props.clientRect);
        },

        onUpdate: (props: SuggestionProps<VizelCommand>) => {
          current.value = props;
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
