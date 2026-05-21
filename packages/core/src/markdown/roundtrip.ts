import { Editor } from "@tiptap/core";
import { createVizelExtensions } from "../extensions/base.ts";
import { createVizelError } from "../utils/errorHandling.ts";
import { getVizelMarkdown, setVizelMarkdown } from "../utils/markdown.ts";
import type { VizelMarkdownFlavor } from "./types.ts";

/**
 * A single Markdown round-trip sample.
 */
export interface VizelRoundtripSample {
  /** Stable identifier (surfaced in error messages). */
  readonly name: string;
  /** Source Markdown text that must round-trip losslessly. */
  readonly input: string;
}

/**
 * Assert that every sample round-trips losslessly through the given
 * flavor.
 *
 * Each sample is parsed into the editor with the flavor's parser and
 * then re-serialized; if the output differs (after `.trim()`-equivalent
 * whitespace normalisation), the helper throws a typed
 * {@link VizelError} with code `"MARKDOWN_LOSSY"` carrying the sample
 * name and flavor in the error context.
 *
 * Flavor authors call this helper from their own tests to verify that
 * a custom flavor preserves its inputs.
 *
 * @example
 * ```ts
 * import { assertMarkdownRoundtrip, vizelGfmFlavor } from "@vizel/core";
 *
 * await assertMarkdownRoundtrip(vizelGfmFlavor, [
 *   { name: "heading", input: "# Hello" },
 *   { name: "list", input: "- a\n- b\n" },
 * ]);
 * ```
 */
export async function assertMarkdownRoundtrip(
  flavor: VizelMarkdownFlavor,
  samples: readonly VizelRoundtripSample[]
): Promise<void> {
  // Enable every opt-in content feature so flavor-specific syntax
  // (wiki-links, embeds, mentions, callouts, etc.) is exercised
  // through the same parser/serializer pair that consumer code uses.
  const extensions = await createVizelExtensions({
    flavor,
    features: {
      content: {
        wikiLink: true,
      },
      interaction: {
        mention: true,
      },
    },
  });
  // Tiptap initializes extension storage and `onCreate` callbacks only
  // when the editor mounts to a host element. Use a detached
  // `<div>` so the markdown extension can attach
  // `editor.getMarkdown()` and `editor.markdown.parse`. The Tiptap
  // constructor fires its `create` event in a `setTimeout(0)`, so
  // await the event before driving any sample through the editor.
  const host = typeof document === "undefined" ? undefined : document.createElement("div");
  const editor = new Editor(host === undefined ? { extensions } : { element: host, extensions });
  if (host !== undefined) {
    await new Promise<void>((resolve) => {
      if ((editor as unknown as { isInitialized?: boolean }).isInitialized) {
        resolve();
        return;
      }
      editor.once("create", () => resolve());
    });
  }
  try {
    for (const sample of samples) {
      setVizelMarkdown(editor, sample.input);
      const serialized = getVizelMarkdown(editor);
      if (normalize(serialized) !== normalize(sample.input)) {
        throw createVizelError(
          "MARKDOWN_LOSSY",
          `Round-trip mismatch in sample "${sample.name}" for flavor "${flavor.name}".`,
          {
            context: {
              flavor: flavor.name,
              sample: sample.name,
              expected: sample.input,
              received: serialized,
            },
          }
        );
      }
    }
  } finally {
    editor.destroy();
  }
}

function normalize(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}
