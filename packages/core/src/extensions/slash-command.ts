import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { SlashCommandItem } from "../commands/slash-items.ts";
import { defaultSlashCommands, filterSlashCommands } from "../commands/slash-items.ts";

export interface SlashCommandOptions {
  /** Custom slash command items (defaults to heading, list, quote, code) */
  items?: SlashCommandItem[];
  /** Suggestion options for customizing the popup behavior */
  suggestion?: Partial<SuggestionOptions>;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      items: defaultSlashCommands,
      suggestion: {
        char: "/",
        startOfLine: false,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: this.options.suggestion?.char ?? "/",
        startOfLine: this.options.suggestion?.startOfLine ?? false,
        items: ({ query }) => {
          return filterSlashCommands(this.options.items ?? [], query);
        },
        command: ({ editor, range, props }) => {
          const item = props as SlashCommandItem;
          item.command({ editor, range });
        },
        ...this.options.suggestion,
      }),
    ];
  },
});

export { defaultSlashCommands, filterSlashCommands, type SlashCommandItem };
