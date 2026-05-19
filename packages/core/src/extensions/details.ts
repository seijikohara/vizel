/**
 * Details Extension
 *
 * Provides collapsible content blocks (accordion/details) for the editor.
 * Uses HTML5 <details> and <summary> elements.
 */

import type { Extensions } from "@tiptap/core";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { MarkdownSerializerState } from "prosemirror-markdown";

/**
 * Options for the Details container extension
 */
export interface VizelDetailsNodeOptions {
  /**
   * HTML attributes to add to the details element
   */
  HTMLAttributes?: Record<string, unknown>;
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
 * Markdown round-trip uses raw HTML (`<details>` / `<summary>`), which
 * tiptap-markdown supports because `html: true` is enabled by default.
 * On the way in, markdown-it preserves the inline HTML and Tiptap's
 * `parseHTML` rules hydrate the nodes.
 *
 * @example
 * ```typescript
 * import { createVizelDetailsExtensions } from '@vizel/core'
 *
 * const extensions = createVizelDetailsExtensions({
 *   details: { HTMLAttributes: { "data-testid": "details" } }
 * })
 * ```
 */
export function createVizelDetailsExtensions(options: VizelDetailsOptions = {}): Extensions {
  const { details = {}, detailsContent = {}, detailsSummary = {} } = options;

  const VizelDetails = Details.extend({
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: PMNode) {
            const isOpen = node.attrs?.open === true;
            const openAttr = isOpen ? " open" : "";
            state.write(`<details${openAttr}>\n`);
            state.renderContent(node);
            state.ensureNewLine();
            state.write(`</details>`);
            state.closeBlock(node);
          },
          parse: {
            // <details> blocks pass through as raw HTML thanks to markdown-it's
            // html: true. The Tiptap parseHTML rules in @tiptap/extension-details
            // hydrate the node from the HTML structure.
          },
        },
      };
    },
  });

  const VizelDetailsSummary = DetailsSummary.extend({
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: PMNode) {
            state.write(`<summary>`);
            state.renderInline(node);
            state.write(`</summary>\n`);
          },
          parse: {},
        },
      };
    },
  });

  const VizelDetailsContent = DetailsContent.extend({
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: PMNode) {
            state.renderContent(node);
          },
          parse: {},
        },
      };
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

/**
 * Raw `@tiptap/extension-details` extensions, re-exported for advanced usage.
 *
 * Prefer {@link createVizelDetailsExtensions} unless you need direct access
 * to the underlying Tiptap extensions.
 */
export { Details, DetailsContent, DetailsSummary };
