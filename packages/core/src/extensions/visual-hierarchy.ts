import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Options for the visual hierarchy extension.
 *
 * The extension attaches a `data-vizel-depth="N"` attribute to every
 * block-level node so that CSS in `styles/_block-hierarchy.scss` can
 * apply progressive indentation and guide lines per depth. Currently
 * shipping with no configurable knobs; the type exists so the
 * `features.interaction.visualHierarchy` field can move from `boolean`
 * to `boolean | VizelVisualHierarchyOptions` in a future release
 * without breaking consumers.
 */
// biome-ignore lint/suspicious/noEmptyInterface: reserved for future configurable knobs without breaking consumers
export interface VizelVisualHierarchyOptions {}

export const vizelVisualHierarchyPluginKey = new PluginKey("vizelVisualHierarchy");

/**
 * Create the visual hierarchy extension.
 *
 * Walks the document on every transaction and adds
 * `data-vizel-depth="N"` to each top-level child block node, where N
 * mirrors the ProseMirror nesting depth at that node's position. Lists
 * receive depth on their containing list item rather than on the
 * intermediate bullet/ordered list wrapper.
 */
export function createVizelVisualHierarchyExtension(
  _options: VizelVisualHierarchyOptions = {}
): Extension {
  return Extension.create({
    name: "vizelVisualHierarchy",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: vizelVisualHierarchyPluginKey,
          state: {
            init: (_, { doc }) => buildVizelDepthDecorations(doc),
            apply: (tr, prev) => (tr.docChanged ? buildVizelDepthDecorations(tr.doc) : prev),
          },
          props: {
            decorations(state) {
              return this.getState(state);
            },
          },
        }),
      ];
    },
  });
}

function buildVizelDepthDecorations(
  doc: Parameters<typeof DecorationSet.create>[0]
): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isBlock) return undefined;

    const resolved = doc.resolve(pos);
    const depth = resolved.depth;
    if (depth === 0) return undefined;

    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        "data-vizel-depth": String(depth),
      })
    );

    return undefined;
  });

  return DecorationSet.create(doc, decorations);
}
