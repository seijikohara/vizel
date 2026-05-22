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
 * Block-node types that participate in the visual hierarchy.
 *
 * The decoration only targets container-style nodes — the elements
 * whose role is to *hold* nested content. Leaf-style blocks
 * (paragraphs, headings, code blocks, images, …) sit *inside* one of
 * these containers, so the container's left padding plus a thin
 * guide line is enough to convey the nesting depth. Decorating leaf
 * blocks as well stacked padding on top of the container's own
 * marker offset (the most visible case: list bullets ended up far
 * to the right of their row text) and drew a redundant guide line
 * per child that no longer aligned with the actual indent step.
 *
 * Keep this list narrow. Adding new node types here changes how the
 * editor looks for every consumer, so the decision belongs in this
 * file alongside the rest of the visual-hierarchy contract.
 */
const VIZEL_HIERARCHY_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "blockquote",
  "details",
  "detailsContent",
  "callout",
  "bulletList",
  "orderedList",
  "taskList",
]);

/**
 * Create the visual hierarchy extension.
 *
 * Walks the document on every transaction and adds
 * `data-vizel-depth="N"` to each *container* block node whose type
 * appears in {@link VIZEL_HIERARCHY_CONTAINER_TYPES}, where N mirrors
 * the ProseMirror nesting depth at that node's position. Leaf
 * blocks (paragraphs, headings, code blocks, …) are intentionally
 * left undecorated so the CSS in `_block-hierarchy.scss` can apply
 * a single indent step + guide line per container without colliding
 * with the container's own marker offset.
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
    if (!VIZEL_HIERARCHY_CONTAINER_TYPES.has(node.type.name)) return undefined;

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
