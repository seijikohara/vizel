/**
 * Details Extension
 *
 * Provides collapsible content blocks (accordion/details) for the editor.
 * Uses HTML5 <details> and <summary> elements.
 */

import type { Extensions, JSONContent } from "@tiptap/core";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";

/**
 * Options for the Details container extension
 */
export interface VizelDetailsNodeOptions {
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
 * Options for the VizelDetailsContent extension
 */
export interface VizelDetailsContentOptions {
  /**
   * HTML attributes to add to the details content element
   */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Options for the VizelDetailsSummary extension
 */
export interface VizelDetailsSummaryOptions {
  /**
   * HTML attributes to add to the details summary element
   */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Combined options for all VizelDetails extensions
 */
export interface VizelDetailsOptions {
  /**
   * Options for the details container extension
   */
  details?: VizelDetailsNodeOptions;
  /**
   * Options for the details content extension
   */
  detailsContent?: VizelDetailsContentOptions;
  /**
   * Options for the details summary extension
   */
  detailsSummary?: VizelDetailsSummaryOptions;
}

/**
 * Creates details extensions for collapsible content blocks.
 *
 * @example
 * ```typescript
 * import { createVizelDetailsExtensions } from '@vizel/core'
 *
 * const extensions = createVizelDetailsExtensions({
 *   details: { openByDefault: false }
 * })
 * ```
 */
export function createVizelDetailsExtensions(options: VizelDetailsOptions = {}): Extensions {
  const { details = {}, detailsContent = {}, detailsSummary = {} } = options;

  // Extend Details with markdown serialization
  const VizelDetails = Details.extend({
    renderMarkdown(node, helpers) {
      const isOpen = (node as JSONContent).attrs?.open === true;
      const openAttr = isOpen ? " open" : "";
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "");
      return `<details${openAttr}>\n${content}</details>\n\n`;
    },
  });

  // Extend DetailsSummary with markdown serialization
  const VizelDetailsSummary = DetailsSummary.extend({
    renderMarkdown(node, helpers) {
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "");
      return `<summary>${content}</summary>\n`;
    },
  });

  // Extend DetailsContent with markdown serialization
  const VizelDetailsContent = DetailsContent.extend({
    renderMarkdown(node, helpers) {
      const content = helpers.renderChildren((node as JSONContent).content ?? [], "\n\n");
      return `\n${content}\n`;
    },
  });

  return [
    VizelDetails.configure({
      HTMLAttributes: {
        class: "vizel-details",
        ...details.HTMLAttributes,
      },
      persist: true,
    }),
    VizelDetailsContent.configure({
      HTMLAttributes: {
        class: "vizel-details-content",
        ...detailsContent.HTMLAttributes,
      },
    }),
    VizelDetailsSummary.configure({
      HTMLAttributes: {
        class: "vizel-details-summary",
        ...detailsSummary.HTMLAttributes,
      },
    }),
  ];
}

// Re-export for advanced usage
export { Details, DetailsContent, DetailsSummary };
