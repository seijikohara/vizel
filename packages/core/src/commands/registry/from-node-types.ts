import type { VizelNodeTypeOption } from "../../extensions/node-types.ts";
import type { VizelCommand } from "../types.ts";

/**
 * Derive a {@link VizelCommand} array from a {@link VizelNodeTypeOption}
 * array.
 *
 * Each node-type option becomes a slash-menu and block-menu entry that
 * uses the option's `command` callback as `run` and its `isActive`
 * callback as `isActive`. The derived `canRun` returns `true` — node
 * types are expected to be applicable wherever the block menu is
 * shown. Add a `canRun` predicate at the callsite when a node type
 * needs finer gating.
 *
 * The derived `id` namespace is `nodeType/<option.name>` so the
 * generated commands cannot collide with the hand-rolled registries.
 * `label` uses the option's `label` directly; consumers that need
 * locale-aware labels should pass `createVizelNodeTypes(locale)` here.
 */
export function vizelCommandsFromNodeTypes(
  nodeTypes: readonly VizelNodeTypeOption[]
): readonly VizelCommand[] {
  return nodeTypes.map((option, index) => ({
    id: `nodeType/${option.name}`,
    label: () => option.label,
    icon: option.icon,
    canRun: () => true,
    isActive: option.isActive,
    run: (editor) => {
      option.command(editor);
      return true;
    },
    surfaces: {
      slashMenu: { priority: 1000 + index },
      blockMenu: { priority: 1000 + index },
    },
  }));
}
