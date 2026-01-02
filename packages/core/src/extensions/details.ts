/**
 * Details Extension
 *
 * Provides collapsible content blocks (accordion/details) for the editor.
 * Uses HTML5 <details> and <summary> elements.
 */

import type { Extensions, JSONContent } from "@tiptap/core";
import Details from "@tiptap/extension-details";
import DetailsContent from "@tiptap/extension-details-content";
import DetailsSummary from "@tiptap/extension-details-summary";

/**
 * Options for the Details container extension
 */
export interface DetailsNodeOptions {
  /**
   * HTML attributes to add to the details element
   */
  HTMLAttributes?: Record<string, unknown>;
  /**
   * Whether the details should be open by default
   * @default false
   */
  openByDefault?: boolean;
}

/**
 * Options for the DetailsContent extension
 */
export interface DetailsContentOptions {
  /**
   * HTML attributes to add to the details content element
   */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Options for the DetailsSummary extension
 */
export interface DetailsSummaryOptions {
  /**
   * HTML attributes to add to the details summary element
   */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Combined options for all Details extensions
 */
export interface VizelDetailsOptions {
  /**
   * Options for the details container extension
   */
  details?: DetailsNodeOptions;
  /**
   * Options for the details content extension
   */
  detailsContent?: DetailsContentOptions;
  /**
   * Options for the details summary extension
   */
  detailsSummary?: DetailsSummaryOptions;
}

/**
 * Creates details extensions for collapsible content blocks.
 *
 * @example
 * ```typescript
 * import { createDetailsExtensions } from '@vizel/core'
 *
 * const extensions = createDetailsExtensions({
 *   details: { openByDefault: false }
 * })
 * ```
 */
export function createDetailsExtensions(options: VizelDetailsOptions = {}): Extensions {
  const { details = {}, detailsContent = {}, detailsSummary = {} } = options;

  // Extend Details with markdown serialization
  const DetailsWithMarkdown = Details.extend({
    renderMarkdown(node, helpers) {
      const isOpen = (node as JSONContent).attrs?.open === true;
      const openAttr = isOpen ? " open" : "";
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "");
      return `<details${openAttr}>\n${content}</details>\n\n`;
    },
  });

  // Extend DetailsSummary with markdown serialization
  const DetailsSummaryWithMarkdown = DetailsSummary.extend({
    renderMarkdown(node, helpers) {
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "");
      return `<summary>${content}</summary>\n`;
    },
  });

  // Extend DetailsContent with markdown serialization
  const DetailsContentWithMarkdown = DetailsContent.extend({
    renderMarkdown(node, helpers) {
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "\n\n");
      return `\n${content}\n`;
    },
  });

  return [
    DetailsWithMarkdown.configure({
      HTMLAttributes: {
        class: "vizel-details",
        ...details.HTMLAttributes,
      },
      persist: true,
    }),
    DetailsContentWithMarkdown.configure({
      HTMLAttributes: {
        class: "vizel-details-content",
        ...detailsContent.HTMLAttributes,
      },
    }),
    DetailsSummaryWithMarkdown.configure({
      HTMLAttributes: {
        class: "vizel-details-summary",
        ...detailsSummary.HTMLAttributes,
      },
    }),
  ];
}

// Re-export for advanced usage
export { Details, DetailsContent, DetailsSummary };
