import type { VizelMarkdownFlavor, VizelMarkSerializer, VizelNodeSerializer } from "../types.ts";

/**
 * Combine multiple flavors into a single derived flavor.
 *
 * Later entries override earlier ones:
 * - `markdownItPlugins` are concatenated in order, so a later parser
 *   plugin that conflicts with an earlier one wins.
 * - `nodeSerializers` / `markSerializers` are merged key-by-key with
 *   later values replacing earlier values.
 * - `config` is shallow-merged with later values winning.
 *
 * `name` defaults to a hyphenated concatenation of the input names
 * (`"gfm-obsidian"`); pass `name` to override.
 *
 * @example
 * ```ts
 * const custom = composeVizelMarkdownFlavors(
 *   [vizelGfmFlavor, vizelObsidianFlavor],
 *   "gfm-obsidian"
 * );
 * ```
 */
export function composeVizelMarkdownFlavors(
  flavors: readonly VizelMarkdownFlavor[],
  name?: string
): VizelMarkdownFlavor {
  const composedName = name ?? flavors.map((flavor) => flavor.name).join("-");

  const markdownItPlugins = flavors.flatMap((flavor) => flavor.markdownItPlugins ?? []);

  const nodeSerializers: Record<string, VizelNodeSerializer> = flavors.reduce(
    (acc, flavor) => ({ ...acc, ...flavor.nodeSerializers }),
    {} as Record<string, VizelNodeSerializer>
  );

  const markSerializers: Record<string, VizelMarkSerializer> = flavors.reduce(
    (acc, flavor) => ({ ...acc, ...flavor.markSerializers }),
    {} as Record<string, VizelMarkSerializer>
  );

  const config = flavors.reduce<Record<string, unknown>>(
    (acc, flavor) => ({ ...acc, ...flavor.config }),
    {}
  );

  return {
    name: composedName,
    ...(markdownItPlugins.length > 0 && { markdownItPlugins }),
    ...(Object.keys(nodeSerializers).length > 0 && { nodeSerializers }),
    ...(Object.keys(markSerializers).length > 0 && { markSerializers }),
    ...(Object.keys(config).length > 0 && { config }),
  };
}
