import { type Editor, Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { vizelDefaultCommands } from "../commands/registry/index.ts";
import type { VizelCommand } from "../commands/types.ts";
import { vizelEnLocale } from "../i18n/en.ts";
import type { VizelLocale } from "../i18n/types.ts";

/**
 * Default slash command list: the subset of {@link vizelDefaultCommands}
 * that opts into the slash menu surface.
 *
 * Filtering by `surfaces.slashMenu` keeps mark-only format commands (bold,
 * italic, ...) out of the slash menu while letting block and insert
 * commands appear.
 */
export const vizelDefaultSlashMenuCommands: readonly VizelCommand[] = vizelDefaultCommands.filter(
  (command) => command.surfaces.slashMenu !== undefined
);

export interface VizelSlashCommandExtensionOptions {
  /**
   * Commands surfaced in the slash menu. Defaults to the slash-surfaced
   * subset of {@link vizelDefaultCommands}. The extension filters the list
   * by `surfaces.slashMenu` again so callers may pass a superset.
   */
  commands?: readonly VizelCommand[];
  /** Locale supplying command `label` / `description` strings. */
  locale?: VizelLocale;
  /** Suggestion options for customizing the popup behavior. */
  suggestion?: Partial<SuggestionOptions<VizelCommand>>;
}

/**
 * Reactive storage published to framework suggestion renderers.
 *
 * Svelte 5's `mount()` and the React / Vue renderers all read the locale
 * from `editor.extensionStorage.slashCommand` because the suggestion
 * `command` / `items` callbacks carry only the editor, not the locale.
 */
export interface VizelSlashCommandStorage {
  /** Locale used to derive `VizelCommandSpec` view data in the menu. */
  locale: VizelLocale;
}

/** Type guard for a {@link VizelCommand}. */
const isVizelCommand = (value: unknown): value is VizelCommand =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  "run" in value &&
  "surfaces" in value;

/** Type guard for the {@link VizelSlashCommandStorage} shape. */
const isVizelSlashCommandStorage = (value: unknown): value is VizelSlashCommandStorage =>
  typeof value === "object" && value !== null && "locale" in value;

/**
 * Return the locale the slash-command extension resolved at creation time.
 *
 * Framework suggestion renderers call this helper because the Tiptap
 * suggestion callbacks carry only the editor, not the locale. The function
 * falls back to {@link vizelEnLocale} when the extension is absent.
 */
export function getVizelSlashCommandLocale(editor: Editor): VizelLocale {
  // Tiptap types `extensionStorage` as the augmentable `Storage` interface,
  // which exposes no index signature. Read the keyed entry through
  // `Reflect.get` so the lookup stays type-safe without an `as` cast.
  const storage: unknown = Reflect.get(editor.extensionStorage, "slashCommand");
  return isVizelSlashCommandStorage(storage) ? storage.locale : vizelEnLocale;
}

export const VizelSlashCommand = Extension.create<
  VizelSlashCommandExtensionOptions,
  VizelSlashCommandStorage
>({
  name: "slashCommand",

  addOptions() {
    return {
      commands: vizelDefaultSlashMenuCommands,
      suggestion: {
        char: "/",
        startOfLine: false,
      },
    };
  },

  addStorage() {
    // Initialized in `onBeforeCreate` once `this.options.locale` resolves.
    return { locale: vizelEnLocale };
  },

  onBeforeCreate() {
    this.storage.locale = this.options.locale ?? vizelEnLocale;
  },

  addProseMirrorPlugins() {
    const slashCommands = (this.options.commands ?? vizelDefaultSlashMenuCommands).filter(
      (command) => command.surfaces.slashMenu !== undefined
    );

    return [
      Suggestion<VizelCommand>({
        editor: this.editor,
        char: this.options.suggestion?.char ?? "/",
        startOfLine: this.options.suggestion?.startOfLine ?? false,
        // Return the full slash list; the framework menu filters by query
        // through `buildVizelSlashMenuSpecFromCommands` and renders its own
        // empty state, so the popup stays open even when nothing matches.
        items: () => [...slashCommands],
        command: ({ editor, range, props }) => {
          if (!isVizelCommand(props)) return;
          // Delete the `/query` trigger text before running the command. The
          // unified `VizelCommand.run` never deletes the range itself, so the
          // single place that owns trigger-text deletion is here.
          editor.chain().focus().deleteRange(range).run();
          props.run(editor);
        },
        ...this.options.suggestion,
      }),
    ];
  },
});
