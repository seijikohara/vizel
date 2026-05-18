import type { TypographyOptions } from "@tiptap/extension-typography";
import Typography from "@tiptap/extension-typography";

/**
 * Options for the typography extension.
 *
 * Re-exports the Tiptap `TypographyOptions` shape under a Vizel-branded
 * name so consumers can configure smart quotes, em-dash conversion,
 * ellipsis substitution, and other auto-correct replacements through
 * `features.interaction.typography`.
 */
export type VizelTypographyOptions = TypographyOptions;

/**
 * Create the typography extension.
 */
export function createVizelTypographyExtension(
  options: Partial<VizelTypographyOptions> = {}
): typeof Typography {
  return Typography.configure(options);
}
