import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { VizelLocale } from "../i18n/types.ts";

/**
 * One entry in a document outline tree.
 *
 * Each entry corresponds to a single `heading` node from the editor's
 * document. Entries are nested by heading level: an `h2` becomes a child
 * of the nearest preceding `h1`, an `h3` becomes a child of the nearest
 * preceding `h2`, and so on. Entries at the highest level encountered in
 * the document appear at the top of {@link VizelOutlineSpec.items}.
 */
export interface VizelOutlineItemSpec {
  /** Stable identifier for keyed rendering (`heading-${pos}`). */
  readonly key: string;
  /** Heading level, 1-6, as stored in the node's `level` attribute. */
  readonly level: number;
  /** Plain-text label derived from the heading's text content. */
  readonly label: string;
  /** Document position of the heading node start. */
  readonly pos: number;
  /** Whether the current selection sits inside this heading's node range. */
  readonly isCurrent: boolean;
  /** Headings nested under this entry, in document order. */
  readonly children: readonly VizelOutlineItemSpec[];
}

/**
 * Framework-neutral spec for the `VizelOutline` component.
 */
export interface VizelOutlineSpec {
  /** Root container ARIA wiring. */
  readonly root: {
    readonly role: "tree";
    readonly "aria-label": string;
  };
  /** Top-level outline entries, in document order. */
  readonly items: readonly VizelOutlineItemSpec[];
}

interface OutlineCollectorEntry {
  readonly node: ProseMirrorNode;
  readonly pos: number;
  readonly endPos: number;
}

/**
 * Build the outline spec from an editor's current document.
 *
 * Walks every node in `editor.state.doc`, collects each `heading`, and
 * nests them by `level`. The active entry is the one whose document
 * range contains `currentNodePos`; when `currentNodePos` is `null` or
 * sits outside every heading, no entry is marked current.
 */
export function buildVizelOutlineSpec(
  editor: Editor,
  currentNodePos: number | null,
  locale: VizelLocale
): VizelOutlineSpec {
  const collected: OutlineCollectorEntry[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      collected.push({ node, pos, endPos: pos + node.nodeSize });
    }
    return node.type.name !== "heading";
  });

  const items = buildOutlineTree(collected, currentNodePos);

  return {
    root: {
      role: "tree",
      "aria-label": locale.outline.ariaLabel,
    },
    items,
  };
}

function buildOutlineTree(
  entries: readonly OutlineCollectorEntry[],
  currentNodePos: number | null
): readonly VizelOutlineItemSpec[] {
  interface Frame {
    readonly level: number;
    readonly children: VizelOutlineItemSpec[];
  }

  const root: VizelOutlineItemSpec[] = [];
  const stack: Frame[] = [{ level: 0, children: root }];

  for (const entry of entries) {
    const rawLevel = (entry.node.attrs as { level?: number }).level;
    const level = typeof rawLevel === "number" ? rawLevel : 1;
    const label = entry.node.textContent;
    const isCurrent =
      currentNodePos !== null && currentNodePos >= entry.pos && currentNodePos < entry.endPos;

    // Pop frames whose level is at or above the new entry. The root
    // frame at level 0 stays so we always have a parent to push into.
    let top = stack.at(-1);
    while (top !== undefined && stack.length > 1 && top.level >= level) {
      stack.pop();
      top = stack.at(-1);
    }

    const children: VizelOutlineItemSpec[] = [];
    const item: VizelOutlineItemSpec = {
      key: `heading-${entry.pos}`,
      level,
      label,
      pos: entry.pos,
      isCurrent,
      children,
    };

    const parent = stack.at(-1);
    if (parent !== undefined) {
      parent.children.push(item);
    }
    stack.push({ level, children });
  }

  return root;
}
