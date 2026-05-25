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

  // Use a single-pass `Object.assign` accumulator instead of spreading each
  // flavor into a new literal — the spread variant copies every previously
  // merged key on every flavor, making the merge O(n*k) where k grows with
  // each iteration. `Object.assign` mutates the locally-constructed `const`
  // accumulator, so the function stays referentially transparent from the
  // caller's perspective and biome's `noAccumulatingSpread` lint is happy.
  const nodeSerializers: Record<string, VizelNodeSerializer> = {};
  const markSerializers: Record<string, VizelMarkSerializer> = {};
  const config: Record<string, unknown> = {};
  for (const flavor of flavors) {
    if (flavor.nodeSerializers) Object.assign(nodeSerializers, flavor.nodeSerializers);
    if (flavor.markSerializers) Object.assign(markSerializers, flavor.markSerializers);
    if (flavor.config) Object.assign(config, flavor.config);
  }

  return {
    name: composedName,
    ...(markdownItPlugins.length > 0 && { markdownItPlugins }),
    ...(Object.keys(nodeSerializers).length > 0 && { nodeSerializers }),
    ...(Object.keys(markSerializers).length > 0 && { markSerializers }),
    ...(Object.keys(config).length > 0 && { config }),
  };
}
