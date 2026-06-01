import type { Editor } from "@tiptap/core";
import { detectVizelEmbedProvider } from "../extensions/embed.ts";
import type { VizelLocale } from "../i18n/types.ts";

/**
 * Localized labels for the `VizelLinkEditor` form, resolved from a
 * `VizelLocale` (with sensible English fallbacks).
 *
 * Each framework's `VizelLinkEditor` reads these strings directly
 * rather than re-evaluating the `locale?.linkEditor?.* ?? "..."`
 * chain inline. This guarantees the three frameworks ship identical
 * label strings and consolidates the fallback list to one place.
 */
export interface VizelLinkEditorLabels {
  urlAriaLabel: string;
  urlPlaceholder: string;
  apply: string;
  applyAriaLabel: string;
  removeLink: string;
  removeLinkAriaLabel: string;
  openInNewTab: string;
  visit: string;
  visitTitle: string;
  embedAsRichContent: string;
}

/**
 * Resolve the link-editor labels from a locale (or fall back to English).
 */
export function resolveVizelLinkEditorLabels(
  locale: VizelLocale | undefined
): VizelLinkEditorLabels {
  const le = locale?.linkEditor;
  return {
    // The URL input's aria-label has no locale field today — the
    // component baselines have always shipped "Link URL". Keep the
    // aria-label hardcoded here so framework components can drop the
    // inline literal.
    urlAriaLabel: "Link URL",
    urlPlaceholder: le?.urlPlaceholder ?? "Enter URL...",
    apply: le?.apply ?? "Apply",
    applyAriaLabel: le?.applyAriaLabel ?? "Apply link",
    removeLink: le?.removeLink ?? "Remove link",
    removeLinkAriaLabel: le?.removeLinkAriaLabel ?? "Remove link",
    openInNewTab: le?.openInNewTab ?? "Open in new tab",
    visit: le?.visit ?? "Visit",
    visitTitle: le?.visitTitle ?? "Open URL in new tab",
    embedAsRichContent: le?.embedAsRichContent ?? "Embed as rich content",
  };
}

/**
 * Derived display state for the `VizelLinkEditor` form. The framework
 * component recomputes this whenever `url` (or the editor selection)
 * changes, then drives conditional rendering from the boolean flags.
 */
export interface VizelLinkEditorSpec {
  /** Initial URL extracted from the current link mark (empty if none). */
  initialUrl: string;
  /** Initial open-in-new-tab flag derived from `target === "_blank"`. */
  initialOpenInNewTab: boolean;
  /** Whether the editor has the embed extension loaded. */
  canEmbed: boolean;
  /** Whether the current URL matches a known embed provider. */
  isEmbedProvider: boolean;
  /** Whether the remove button should be rendered (link mark present). */
  showRemoveButton: boolean;
  /** Whether the visit button should be rendered (URL non-empty). */
  showVisitButton: boolean;
  /** Whether the embed-as-rich-content toggle should be rendered. */
  showEmbedToggle: boolean;
}

/**
 * Compute the link-editor display state from the live editor + URL input.
 *
 * @param editor       Current editor instance.
 * @param url          Current value of the URL input (may be untrimmed).
 * @param enableEmbed  Whether the consumer wants the embed toggle.
 */
export function buildVizelLinkEditorSpec(
  editor: Editor,
  url: string,
  enableEmbed: boolean
): VizelLinkEditorSpec {
  const linkAttrs = editor.getAttributes("link");
  const initialUrl = (linkAttrs.href as string | undefined) ?? "";
  const initialOpenInNewTab = linkAttrs.target === "_blank";
  const canEmbed =
    enableEmbed && editor.extensionManager.extensions.some((ext) => ext.name === "embed");
  const trimmed = url.trim();
  const isEmbedProvider = trimmed ? detectVizelEmbedProvider(trimmed) !== null : false;

  return {
    initialUrl,
    initialOpenInNewTab,
    canEmbed,
    isEmbedProvider,
    showRemoveButton: Boolean(initialUrl),
    showVisitButton: trimmed.length > 0,
    showEmbedToggle: canEmbed && isEmbedProvider,
  };
}

/**
 * Parameters accepted by {@link applyVizelLinkEdit}.
 */
export interface VizelLinkSubmitParams {
  /** URL entered into the input (will be trimmed). */
  url: string;
  /** Whether the link should open in a new tab. */
  openInNewTab: boolean;
  /** Whether to convert the link to an embed (requires `canEmbed`). */
  asEmbed: boolean;
}

/**
 * Apply the link-editor submission to the editor.
 *
 * An empty (trimmed) URL removes the current link. When `asEmbed` is
 * true and the embed extension is loaded (`canEmbed`), the link is
 * removed and an embed is inserted instead. Otherwise the link mark
 * is set with the appropriate `target`.
 *
 * @returns The trimmed URL that was applied (empty string when removed).
 */
export function applyVizelLinkEdit(
  editor: Editor,
  params: VizelLinkSubmitParams,
  canEmbed: boolean
): string {
  const trimmed = params.url.trim();
  if (!trimmed) {
    editor.chain().focus().unsetLink().run();
    return "";
  }
  if (params.asEmbed && canEmbed) {
    // setEmbed is provided by the embed extension; the canEmbed guard
    // above ensures it exists, but TypeScript can't statically prove
    // that from the embed extension's loose typing. The cast is
    // narrow and lives next to the guard.
    (
      editor.chain().focus().unsetLink() as ReturnType<typeof editor.chain> & {
        setEmbed: (attrs: { url: string }) => ReturnType<typeof editor.chain>;
      }
    )
      .setEmbed({ url: trimmed })
      .run();
    return trimmed;
  }
  editor
    .chain()
    .focus()
    .setLink({
      href: trimmed,
      target: params.openInNewTab ? "_blank" : null,
    })
    .run();
  return trimmed;
}
