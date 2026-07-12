import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Options for the Find & Replace extension
 */
export interface VizelFindReplaceOptions {
  /** Whether search is case-sensitive. Default: false */
  caseSensitive?: boolean;
  /** Callback when search results change */
  onResultsChange?: (results: { total: number; current: number }) => void;
}

/**
 * Represents a single match in the document
 */
export interface VizelFindMatch {
  from: number;
  to: number;
}

/**
 * Internal state for the Find & Replace plugin
 */
export interface VizelFindReplaceState {
  query: string;
  matches: VizelFindMatch[];
  activeIndex: number;
  caseSensitive: boolean;
  isOpen: boolean;
  mode: "find" | "replace";
}

type VizelFindReplaceMeta =
  | { type: "setQuery"; query: string }
  | { type: "setActiveIndex"; index: number }
  | { type: "setCaseSensitive"; caseSensitive: boolean }
  | { type: "setOpen"; mode: "find" | "replace" }
  | { type: "setClosed" }
  | { type: "clear" };

/**
 * Plugin key for accessing Find & Replace state
 */
export const vizelFindReplacePluginKey = new PluginKey<VizelFindReplaceState>("vizelFindReplace");

function createEmptyState(caseSensitive: boolean): VizelFindReplaceState {
  return {
    query: "",
    matches: [],
    activeIndex: -1,
    caseSensitive,
    isOpen: false,
    mode: "find",
  };
}

function isFindReplaceMeta(value: unknown): value is VizelFindReplaceMeta {
  return typeof value === "object" && value !== null && "type" in value;
}

function findAllOccurrences(haystack: string, needle: string): number[] {
  if (!needle) return [];
  const step = Math.max(needle.length, 1);
  const collect = (cursor: number, acc: readonly number[]): readonly number[] => {
    if (cursor > haystack.length - needle.length) return acc;
    const found = haystack.indexOf(needle, cursor);
    if (found === -1) return acc;
    return collect(found + step, [...acc, found]);
  };
  return [...collect(0, [])];
}

function buildMatches(
  doc: ProseMirrorNode,
  query: string,
  caseSensitive: boolean
): VizelFindMatch[] {
  if (!query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: VizelFindMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return true;

    const text = node.text ?? "";
    const haystack = caseSensitive ? text : text.toLowerCase();
    for (const found of findAllOccurrences(haystack, needle)) {
      matches.push({
        from: pos + found,
        to: pos + found + needle.length,
      });
    }

    return true;
  });

  return matches;
}

function clampActiveIndex(activeIndex: number, matches: VizelFindMatch[]): number {
  if (matches.length === 0) return -1;
  return Math.min(Math.max(activeIndex, 0), matches.length - 1);
}

function applyFindReplaceMeta(
  tr: import("@tiptap/pm/state").Transaction,
  value: VizelFindReplaceState,
  meta: VizelFindReplaceMeta
): VizelFindReplaceState {
  switch (meta.type) {
    case "setQuery": {
      const matches = buildMatches(tr.doc, meta.query, value.caseSensitive);
      return {
        ...value,
        query: meta.query,
        matches,
        activeIndex: matches.length > 0 ? 0 : -1,
      };
    }
    case "setActiveIndex":
      return {
        ...value,
        activeIndex: clampActiveIndex(meta.index, value.matches),
      };
    case "setCaseSensitive": {
      const matches = buildMatches(tr.doc, value.query, meta.caseSensitive);
      return {
        ...value,
        caseSensitive: meta.caseSensitive,
        matches,
        activeIndex: clampActiveIndex(value.activeIndex, matches),
      };
    }
    case "setOpen":
      return { ...value, isOpen: true, mode: meta.mode };
    case "setClosed":
      return { ...value, isOpen: false };
    case "clear":
      return createEmptyState(value.caseSensitive);
    default:
      return value;
  }
}

/**
 * Get the current Find & Replace state from the editor
 */
export function getVizelFindReplaceState(state: EditorState): VizelFindReplaceState | null {
  return vizelFindReplacePluginKey.getState(state) ?? null;
}

/**
 * Create the Find & Replace extension
 */
export function createVizelFindReplaceExtension(options: VizelFindReplaceOptions = {}): Extension {
  return Extension.create<VizelFindReplaceOptions>({
    name: "vizelFindReplace",

    addOptions() {
      return {
        caseSensitive: false,
        ...options,
      };
    },

    addCommands() {
      return {
        openFindReplace:
          (mode: "find" | "replace" = "find") =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              dispatch(tr.setMeta(vizelFindReplacePluginKey, { type: "setOpen", mode }));
            }
            return true;
          },

        closeFindReplace:
          () =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              dispatch(tr.setMeta(vizelFindReplacePluginKey, { type: "setClosed" }));
            }
            return true;
          },

        setFindCaseSensitive:
          (caseSensitive: boolean) =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              dispatch(
                tr.setMeta(vizelFindReplacePluginKey, {
                  type: "setCaseSensitive",
                  caseSensitive,
                })
              );
            }
            return true;
          },

        find:
          (query: string) =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              dispatch(tr.setMeta(vizelFindReplacePluginKey, { type: "setQuery", query }));
            }
            return true;
          },

        findNext:
          () =>
          ({ state, dispatch }) => {
            const pluginState = getVizelFindReplaceState(state);
            if (!pluginState || pluginState.matches.length === 0) return false;

            const nextIndex =
              (pluginState.activeIndex + 1 + pluginState.matches.length) %
              pluginState.matches.length;
            const match = pluginState.matches[nextIndex];
            if (!match) return false;

            const tr = state.tr
              .setSelection(TextSelection.create(state.doc, match.from, match.to))
              .setMeta(vizelFindReplacePluginKey, {
                type: "setActiveIndex",
                index: nextIndex,
              });

            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          },

        findPrevious:
          () =>
          ({ state, dispatch }) => {
            const pluginState = getVizelFindReplaceState(state);
            if (!pluginState || pluginState.matches.length === 0) return false;

            const prevIndex =
              (pluginState.activeIndex - 1 + pluginState.matches.length) %
              pluginState.matches.length;
            const match = pluginState.matches[prevIndex];
            if (!match) return false;

            const tr = state.tr
              .setSelection(TextSelection.create(state.doc, match.from, match.to))
              .setMeta(vizelFindReplacePluginKey, {
                type: "setActiveIndex",
                index: prevIndex,
              });

            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          },

        replace:
          (text: string) =>
          ({ state, dispatch }) => {
            const pluginState = getVizelFindReplaceState(state);
            if (!pluginState || pluginState.activeIndex < 0) return false;

            const match = pluginState.matches[pluginState.activeIndex];
            if (!match) return false;
            const tr = state.tr.insertText(text, match.from, match.to);

            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          },

        replaceAll:
          (text: string) =>
          ({ state, dispatch }) => {
            const pluginState = getVizelFindReplaceState(state);
            if (!pluginState || pluginState.matches.length === 0) return false;

            // Replace from back to front to preserve positions
            const tr = pluginState.matches
              .toReversed()
              .reduce((acc, match) => acc.insertText(text, match.from, match.to), state.tr);

            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          },

        clearFind:
          () =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              dispatch(tr.setMeta(vizelFindReplacePluginKey, { type: "clear" }));
            }
            return true;
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        "Mod-f": () => this.editor.commands.openFindReplace("find"),
        // Note: Mod-h may conflict with macOS "Hide" shortcut
        "Mod-Shift-h": () => this.editor.commands.openFindReplace("replace"),
      };
    },

    addProseMirrorPlugins() {
      const initialCaseSensitive = this.options.caseSensitive ?? false;
      const extensionOptions = this.options;

      return [
        new Plugin<VizelFindReplaceState>({
          key: vizelFindReplacePluginKey,

          state: {
            init: () => createEmptyState(initialCaseSensitive),
            apply: (tr, value) => {
              const metaRaw = tr.getMeta(vizelFindReplacePluginKey);
              const afterMeta = isFindReplaceMeta(metaRaw)
                ? applyFindReplaceMeta(tr, value, metaRaw)
                : value;

              // Rebuild matches if document changed and we have a query
              if (tr.docChanged && afterMeta.query) {
                const matches = buildMatches(tr.doc, afterMeta.query, afterMeta.caseSensitive);
                return {
                  ...afterMeta,
                  matches,
                  activeIndex: clampActiveIndex(afterMeta.activeIndex, matches),
                };
              }

              return afterMeta;
            },
          },

          props: {
            decorations(state) {
              const pluginState = vizelFindReplacePluginKey.getState(state);
              if (!pluginState || pluginState.matches.length === 0) {
                return DecorationSet.empty;
              }

              const decorations = pluginState.matches.map((match, index) => {
                const isCurrent = index === pluginState.activeIndex;
                return Decoration.inline(match.from, match.to, {
                  class: isCurrent ? "vizel-find-current" : "vizel-find-match",
                  "data-vizel-find-match": "true",
                });
              });

              return DecorationSet.create(state.doc, decorations);
            },
          },

          view: () => {
            const ref = { prev: { total: 0, current: 0 } };
            return {
              update: (view) => {
                const pluginState = vizelFindReplacePluginKey.getState(view.state);
                if (!pluginState) return;

                const next = {
                  total: pluginState.matches.length,
                  current: pluginState.activeIndex >= 0 ? pluginState.activeIndex + 1 : 0,
                };

                if (next.total !== ref.prev.total || next.current !== ref.prev.current) {
                  extensionOptions.onResultsChange?.(next);
                  ref.prev = next;
                }
              },
            };
          },
        }),
      ];
    },
  });
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vizelFindReplace: {
      /** Open the Find & Replace panel */
      openFindReplace: (mode?: "find" | "replace") => ReturnType;
      /** Close the Find & Replace panel */
      closeFindReplace: () => ReturnType;
      /** Toggle case-sensitive search */
      setFindCaseSensitive: (caseSensitive: boolean) => ReturnType;
      /** Search for text in the document */
      find: (query: string) => ReturnType;
      /** Navigate to the next match */
      findNext: () => ReturnType;
      /** Navigate to the previous match */
      findPrevious: () => ReturnType;
      /** Replace the current match with text */
      replace: (text: string) => ReturnType;
      /** Replace all matches with text */
      replaceAll: (text: string) => ReturnType;
      /** Clear the search state */
      clearFind: () => ReturnType;
    };
  }
}
