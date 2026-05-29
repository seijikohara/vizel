import type { VizelFeatureOptions } from "../types.ts";

/**
 * Curated `VizelFeatureOptions` value that enables every opt-in feature
 * Vizel ships with reasonable defaults. Use this when you want the full
 * Notion-like surface without enumerating each toggle yourself.
 *
 * Features that require consumer-supplied configuration to be useful
 * (`interaction.mention`, `collaboration.provider`, `collaboration.comments`,
 * `collaboration.presence`, `collaboration.versionHistory`) are deliberately
 * NOT enabled here — turning them on without their dependencies would
 * throw at editor-construction time.
 *
 * @example
 * ```ts
 * const editor = useVizelEditor({
 *   features: vizelDefaultFeatures(),
 * });
 * ```
 */
export function vizelDefaultFeatures(): VizelFeatureOptions {
  return {
    content: {
      image: true,
      table: true,
      mathematics: true,
      diagram: true,
      embed: true,
      callout: true,
      details: true,
      textColor: true,
      highlight: true,
      underline: true,
      superscript: true,
      subscript: true,
      taskList: true,
      wikiLink: true,
      tableOfContents: true,
    },
    interaction: {
      slashMenu: true,
      dragHandle: true,
      characterCount: true,
      typography: true,
    },
  };
}
