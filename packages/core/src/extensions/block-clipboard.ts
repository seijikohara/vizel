/**
 * Block-aware clipboard extension.
 *
 * The clipboard pipeline is part of the always-on core. The extension
 * hooks `copy`, `cut`, and `paste` DOM events on the editor view
 * through a single ProseMirror plugin and:
 *
 * - **Copy / Cut.** When the active selection covers a multi-block
 *   range (resolved via `getVizelMultiBlockSelectionState`), it writes
 *   four clipboard mirrors of the slice:
 *     - `application/x-vizel-blocks` — JSON-serialized ProseMirror
 *       slice. The lossless internal channel.
 *     - `text/html` — Tiptap's HTML serialization of the slice.
 *     - `text/markdown` — `editor.getMarkdown()` of the slice.
 *     - `text/plain` — plain text fallback.
 *   `cut` additionally clears the selection in a single transaction
 *   after the data is written.
 *
 * - **Paste.** When the clipboard payload carries Vizel-specific or
 *   Markdown data, the extension takes over:
 *     - Prefer `application/x-vizel-blocks` (lossless).
 *     - Else fall through to Tiptap's default `text/html` handler.
 *     - Else parse `text/markdown` via `editor.markdown.parse(md)` and
 *       insert the result. When parsing drops content, emit
 *       `VizelError("MARKDOWN_LOSSY")` through `options.onError` with
 *       `severity: "warning"`.
 *     - Else fall through.
 *
 * The extension is always-on (no feature flag) and ships under
 * `createBaseExtensions` in `extensions/base.ts`.
 */
import type { Editor, JSONContent } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

import { emitVizelError, VizelError } from "../utils/errorHandling.ts";
import { getVizelMultiBlockSelectionState } from "./multi-block-selection.ts";

/**
 * MIME type used for the internal lossless clipboard payload. Vizel
 * pastes that recognize this type bypass HTML / Markdown coercion and
 * reconstruct the ProseMirror slice byte-for-byte.
 */
const VIZEL_BLOCKS_MIME = "application/x-vizel-blocks";
const HTML_MIME = "text/html";
const MARKDOWN_MIME = "text/markdown";
const PLAIN_MIME = "text/plain";

/**
 * Options for the block-aware clipboard extension.
 */
export interface VizelBlockClipboardOptions {
  /**
   * Callback invoked when the extension emits a runtime warning or
   * error (currently only `MARKDOWN_LOSSY` on paste). Falls back to
   * the global `emitVizelError` console route when omitted.
   */
  onError?: (err: VizelError) => void;
}

/**
 * Plugin key for the block-aware clipboard plugin. The plugin holds no
 * persistent state — the key exists so consumers can detect that the
 * plugin is installed.
 */
export const vizelBlockClipboardPluginKey = new PluginKey("vizelBlockClipboard");

/**
 * Editor surface that exposes the Markdown helpers added by the
 * always-on augmentation in `markdown/augment.ts`. The augmentation
 * declares the same shape on `Editor`, but this alias documents the
 * exact members the block clipboard reaches for and keeps the helper
 * signatures self-contained.
 */
interface EditorWithMarkdown extends Editor {
  getMarkdown: () => string;
  markdown: { parse: (md: string) => JSONContent };
}

function hasMarkdownSurface(editor: Editor): editor is EditorWithMarkdown {
  const candidate = editor as Partial<EditorWithMarkdown>;
  return typeof candidate.getMarkdown === "function" && typeof candidate.markdown === "object";
}

/**
 * Write copy / cut payloads onto the supplied `DataTransfer`. Returns
 * the slice that was serialized so the cut handler can issue the
 * follow-up deletion in the same transaction.
 *
 * The function snaps the slice boundaries to the canonical multi-block
 * range (whole-block outer positions exposed by
 * `getVizelMultiBlockSelectionState`). Without this snap, a selection
 * that begins mid-paragraph would serialize with `openStart > 0`,
 * causing the paste handler on the receiving side to merge the leading
 * text into the destination block instead of inserting a fresh
 * paragraph.
 *
 * The function uses `view.serializeForClipboard(slice)` to produce the
 * HTML mirror that Tiptap's own copy path produces, so external
 * editors see identical markup whether the user copies via the
 * browser's native keystroke or via the block clipboard.
 */
function writeClipboardPayload(view: EditorView, editor: Editor, data: DataTransfer): Slice | null {
  const rangeState = getVizelMultiBlockSelectionState(editor.state);
  const slice = rangeState
    ? editor.state.doc.slice(rangeState.from, rangeState.to, false)
    : editor.state.selection.content();
  if (slice.size === 0) return null;

  // 1) Lossless internal channel.
  data.setData(VIZEL_BLOCKS_MIME, JSON.stringify(slice.toJSON()));

  // 2) HTML mirror via the view's standard clipboard serializer.
  const serialized = view.serializeForClipboard(slice);
  data.setData(HTML_MIME, serialized.dom.innerHTML);

  // 3) Plain text mirror.
  data.setData(PLAIN_MIME, serialized.text);

  // 4) Markdown mirror.
  if (hasMarkdownSurface(editor)) {
    const markdown = serializeSliceToMarkdown(editor, slice);
    if (markdown.length > 0) {
      data.setData(MARKDOWN_MIME, markdown);
    }
  }

  return slice;
}

/**
 * Serialize a ProseMirror slice to Markdown by isolating the slice in
 * a throwaway document built from the editor's schema, then asking the
 * Markdown extension to serialize that document. This keeps the
 * Markdown output identical to what `editor.getMarkdown()` would emit
 * for the same content.
 */
function serializeSliceToMarkdown(editor: EditorWithMarkdown, slice: Slice): string {
  const { schema } = editor.state;
  const docNode = schema.topNodeType.create(null, slice.content);

  // `tiptap-markdown` stores a serializer keyed on the editor that
  // owns it. We avoid touching that internal surface by temporarily
  // swapping `editor.state.doc` is not possible (state is immutable),
  // so the simpler route is to read the storage's serializer
  // directly. The storage shape mirrors what `markdown.ts` documents.
  const storage = (
    editor.storage as unknown as {
      markdown?: { serializer?: { serialize: (doc: unknown) => string } };
    }
  ).markdown;
  if (!storage?.serializer?.serialize) return "";
  try {
    return storage.serializer.serialize(docNode);
  } catch {
    // If the slice contains content the serializer cannot represent,
    // fall back to the empty string — the HTML and plain text mirrors
    // remain on the clipboard so the consumer still has fallbacks.
    return "";
  }
}

/**
 * Insert a JSON-serialized slice into the editor at the current
 * selection. Returns `true` when the slice was applied so the caller
 * can `preventDefault()` the paste event.
 */
function insertSliceFromJson(view: EditorView, raw: string): boolean {
  const parsed = tryParseJson(raw);
  if (parsed === null || typeof parsed !== "object") return false;
  const slice = tryBuildSlice(view.state.schema, parsed);
  if (!slice) return false;
  const tr = view.state.tr.replaceSelection(slice).scrollIntoView();
  view.dispatch(tr);
  return true;
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tryBuildSlice(schema: EditorView["state"]["schema"], parsed: unknown): Slice | null {
  try {
    return Slice.fromJSON(schema, parsed);
  } catch {
    return null;
  }
}

/**
 * Insert Markdown content using the augmented `editor.markdown.parse`
 * surface. Returns `true` when the insertion ran. When the parsed
 * document drops content (lighter than a trivial source string),
 * emits a `MARKDOWN_LOSSY` warning so consumers can surface it.
 */
function tryParseMarkdown(
  editor: EditorWithMarkdown,
  markdown: string,
  onError: ((err: VizelError) => void) | undefined
): JSONContent | null {
  try {
    return editor.markdown.parse(markdown);
  } catch (cause) {
    emitVizelError(
      new VizelError("INVALID_MARKDOWN", "Failed to parse pasted Markdown", {
        cause,
        context: { length: markdown.length },
      }),
      onError
    );
    return null;
  }
}

function insertMarkdown(
  editor: Editor,
  markdown: string,
  onError: ((err: VizelError) => void) | undefined
): boolean {
  if (!hasMarkdownSurface(editor)) return false;
  const trimmed = markdown.trim();
  if (trimmed.length === 0) return false;

  const parsed = tryParseMarkdown(editor, markdown, onError);
  if (parsed === null) return false;

  const inserted = editor.commands.insertContent(parsed);
  if (!inserted) return false;

  // After insertion, compare the parsed length to the source as a
  // coarse lossiness check. The parser sometimes emits zero nodes for
  // markdown that consists entirely of whitespace + a single newline,
  // which we treat as benign (already filtered above).
  const renderedLength = approximateRenderedLength(parsed);
  if (renderedLength === 0) {
    emitVizelError(
      new VizelError("MARKDOWN_LOSSY", "Pasted Markdown produced no content", {
        severity: "warning",
        context: { length: markdown.length },
      }),
      onError
    );
  } else if (renderedLength * 4 < trimmed.length) {
    // A radical shrink (rendered length less than a quarter of the
    // source) signals that significant content was dropped. The 4x
    // ratio is a heuristic that empirically catches dropped tables,
    // dropped diagrams, and dropped raw HTML while leaving normal
    // text intact (markdown source is typically only ~1.1-1.5x the
    // length of its rendered text content).
    emitVizelError(
      new VizelError("MARKDOWN_LOSSY", "Pasted Markdown lost content during parsing", {
        severity: "warning",
        context: { sourceLength: trimmed.length, renderedLength },
      }),
      onError
    );
  }

  return true;
}

/**
 * Coarse measurement of the visible text length of a parsed Markdown
 * result. Counts text nodes recursively without relying on any
 * specific schema, so the heuristic survives unknown node types.
 */
function approximateRenderedLength(content: unknown): number {
  if (content === null || typeof content !== "object") return 0;
  const node = content as { text?: unknown; content?: unknown };
  const textLength = typeof node.text === "string" ? node.text.length : 0;
  const childrenLength = Array.isArray(node.content)
    ? node.content.reduce<number>((sum, child) => sum + approximateRenderedLength(child), 0)
    : 0;
  return textLength + childrenLength;
}

/**
 * Create the block-aware clipboard extension. The extension is part
 * of the always-on core and is wired into `createBaseExtensions`.
 *
 * @example
 * ```ts
 * import { createVizelBlockClipboardExtension } from "@vizel/core";
 *
 * const extensions = [
 *   createVizelBlockClipboardExtension({
 *     onError: (err) => console.warn(err.code, err.message),
 *   }),
 * ];
 * ```
 */
export function createVizelBlockClipboardExtension(
  options: VizelBlockClipboardOptions = {}
): Extension<VizelBlockClipboardOptions> {
  return Extension.create<VizelBlockClipboardOptions>({
    name: "vizelBlockClipboard",

    addOptions() {
      return {
        ...(options.onError !== undefined && { onError: options.onError }),
      } satisfies VizelBlockClipboardOptions;
    },

    addProseMirrorPlugins() {
      // oxlint-disable-next-line typescript/no-this-alias -- the nested Plugin event handlers below run with their own `this` binding and need the extension instance captured from the enclosing method
      const extension = this;

      return [
        new Plugin({
          key: vizelBlockClipboardPluginKey,
          props: {
            handleDOMEvents: {
              copy(view, event) {
                if (getVizelMultiBlockSelectionState(extension.editor.state) === null) {
                  return false;
                }
                const data = event.clipboardData;
                if (!data) return false;
                const slice = writeClipboardPayload(view, extension.editor, data);
                if (!slice) return false;
                event.preventDefault();
                return true;
              },

              cut(view, event) {
                const rangeState = getVizelMultiBlockSelectionState(extension.editor.state);
                if (!rangeState) return false;
                const data = event.clipboardData;
                if (!data) return false;
                const slice = writeClipboardPayload(view, extension.editor, data);
                if (!slice) return false;
                event.preventDefault();
                // Delete the whole multi-block range in a single
                // transaction so cut is atomic from the user's
                // perspective. Snap to the canonical range boundaries
                // — `deleteSelection` would only clear the partial
                // text selection a user dragged across the blocks.
                const { tr } = view.state;
                view.dispatch(tr.deleteRange(rangeState.from, rangeState.to).scrollIntoView());
                return true;
              },

              paste(view, event) {
                const data = event.clipboardData;
                if (!data) return false;

                // 1) Lossless internal payload — always wins when
                //    present.
                const vizelPayload = data.getData(VIZEL_BLOCKS_MIME);
                if (vizelPayload) {
                  if (insertSliceFromJson(view, vizelPayload)) {
                    event.preventDefault();
                    return true;
                  }
                }

                // 2) Plain HTML falls through to Tiptap's default
                //    paste handling. We only intercept when the
                //    clipboard contains Markdown without HTML.
                const html = data.getData(HTML_MIME);
                if (html) return false;

                // 3) Markdown channel.
                const markdown = data.getData(MARKDOWN_MIME);
                if (markdown) {
                  if (insertMarkdown(extension.editor, markdown, extension.options.onError)) {
                    event.preventDefault();
                    return true;
                  }
                }

                return false;
              },
            },
          },
        }),
      ];
    },
  });
}
