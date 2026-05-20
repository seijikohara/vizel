# Section 11 — Block UX Advancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full Notion-like block editing surface in v2.0.0 — block-level operations, multi-block selection, block-aware clipboard, block path API, and the `VizelOutline` / `VizelMinimap` companion components.

**Architecture:** All changes flow through `@vizel/core` for shared logic; framework packages add thin `VizelOutline` / `VizelMinimap` adapters. The block operation commands plug into the Section 9 `VizelCommand` registry without new types.

**Tech Stack:** Tiptap v3, ProseMirror plugins, `VizelCommand` infrastructure (Section 9), `VizelMenuSpec` / canvas rendering.

---

## Already-shipped items (Sections 8-10)

Spec items 1, 6, 10 are already complete and require no work in Section 11:

- **Slash menu / block menu auto-expansion** — `vizelCommandsFromNodeTypes` shipped in Section 9d.
- **Visual hierarchy indicator** — `createVizelVisualHierarchyExtension` shipped in Section 8d.
- **Real-time collaborative cursor** — `createVizelPresenceExtension` shipped in Section 8e.

---

## Sub-PR breakdown

The remaining work splits into five PRs sized for one focused review each:

- **11a — Block operation commands.** Add seven `VizelCommand` entries
  to the registry: `block/merge-previous`, `block/promote`,
  `block/demote`, `block/split`, `block/duplicate`, `block/move-up`,
  `block/move-down`. Each lives in `commands/registry/block-ops.ts`
  and joins the shortcut + block menu surfaces. Locale strings land
  under `locale.commands.block.*`.

- **11b — Multi-block range selection.**
  `createVizelMultiBlockSelectionExtension` (ProseMirror plugin)
  implements Shift+Click and Shift+Arrow range selection across block
  boundaries. Selection state exposes copy / cut / delete / Tab /
  Shift+Tab semantics over the entire range. The extension joins the
  always-on core (no feature flag).

- **11c — Multi-block drag-and-drop + block-aware clipboard.**
  The drag handle extension forwards multi-block selections so drops
  move the entire range. Clipboard writes
  `application/x-vizel-blocks` (JSON) for internal copy/cut. Paste
  handler parses HTML, Markdown (via the new pipeline), or plain
  text; lossy transitions emit `VizelError("MARKDOWN_LOSSY")`.

- **11d — Block path API + `VizelOutline` component.**
  `getVizelBlockPath(editor)` returns the path from root to the
  cursor block. `buildVizelOutlineSpec(editor, currentNodePos,
  locale)` returns `VizelOutlineSpec`. Framework `VizelOutline`
  components for React / Vue / Svelte consume the spec.

- **11e — `VizelMinimap` component.**
  `renderVizelMinimapToCanvas(canvas, spec, theme)` performs the
  canvas reduction in framework-neutral code. Framework `VizelMinimap`
  components own the `<canvas>` lifecycle only and forward DOM events
  for the viewport indicator.

Each sub-PR ends green on `pnpm lint && pnpm typecheck && pnpm build &&
pnpm check:parity` plus the full Playwright matrix on CI.

---

## Spec mapping (binding)

The seven block operation commands:

```ts
export const vizelBlockOperationCommands: readonly VizelCommand[] = [
  // block/merge-previous — Backspace at block start
  // block/promote — Shift+Tab
  // block/demote — Tab
  // block/split — Enter at block middle
  // block/duplicate — Mod+D
  // block/move-up — Alt+ArrowUp
  // block/move-down — Alt+ArrowDown
];
```

The block path API:

```ts
export interface VizelBlockPathSegment {
  readonly nodeType: string;
  readonly pos: number;
  readonly attrs?: Readonly<Record<string, unknown>>;
}

export function getVizelBlockPath(editor: Editor): readonly VizelBlockPathSegment[];
```

The outline spec (Section 2-style):

```ts
export interface VizelOutlineSpec {
  readonly root: VizelMenuRootAttrs;
  readonly items: readonly VizelOutlineItemSpec[];
}

export interface VizelOutlineItemSpec {
  readonly key: string;
  readonly level: number;        // heading level 1..6
  readonly label: string;
  readonly pos: number;
  readonly isCurrent: boolean;
  readonly children: readonly VizelOutlineItemSpec[];
}
```

The minimap rendering helper:

```ts
export interface VizelMinimapSpec {
  readonly blocks: readonly {
    readonly type: string;
    readonly depth: number;
    readonly approxHeight: number;
  }[];
  readonly viewport: { readonly top: number; readonly bottom: number };
}

export function buildVizelMinimapSpec(editor: Editor): VizelMinimapSpec;

export function renderVizelMinimapToCanvas(
  canvas: HTMLCanvasElement,
  spec: VizelMinimapSpec,
  theme: VizelResolvedTheme
): void;
```

---

## Task 11a-1: Block operation commands

**Files:**
- Create: `packages/core/src/commands/registry/block-ops.ts`
- Modify: `packages/core/src/commands/registry/index.ts`
- Modify: `packages/core/src/i18n/types.ts` (add `commands.block.*`)
- Modify: `packages/core/src/i18n/default-locale.ts` (English defaults)
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add the locale shape** under `VizelLocale.commands.block`:
  - `mergePrevious`, `promote`, `demote`, `split`, `duplicate`,
    `moveUp`, `moveDown` — each `{ title: string; description: string }`.

- [ ] **Step 2: Implement the seven commands** in `block-ops.ts`. Each
  follows the `VizelCommand` shape:

```ts
{
  id: "block/move-up",
  label: (locale) => locale.commands.block.moveUp.title,
  description: (locale) => locale.commands.block.moveUp.description,
  icon: "arrowUp",
  shortcut: { mac: "Alt-ArrowUp", other: "Alt-ArrowUp" },
  canRun: (editor) => /* moveBlockUp returns true */,
  isActive: () => false,
  run: (editor) => /* move the selected block(s) up */,
  surfaces: { blockMenu: { priority: 200 }, shortcut: true },
}
```

- [ ] **Step 3: Export** `vizelBlockOperationCommands` from
  `registry/index.ts` and root `index.ts`. `vizelDefaultCommands`
  concatenates the new registry.

- [ ] **Step 4: Run `pnpm exec biome check --write && pnpm typecheck && pnpm build && pnpm check:parity`.**

- [ ] **Step 5: Commit and open PR 11a.**

```bash
git checkout -b feat/v2-section-11a-block-operation-commands
git add packages/core/src/commands/registry/block-ops.ts \
        packages/core/src/commands/registry/index.ts \
        packages/core/src/i18n/types.ts \
        packages/core/src/i18n/default-locale.ts \
        packages/core/src/index.ts
git commit -m "feat(core): add block operation commands to VizelCommand registry"
```

---

## Task 11b-1: Multi-block range selection extension

**Files:**
- Create: `packages/core/src/extensions/multi-block-selection.ts`
- Modify: `packages/core/src/extensions/base.ts` (load unconditionally)
- Modify: `packages/core/src/index.ts`
- Modify: `.claude/rules/packages/core.md` (Extension Catalog)

- [ ] **Step 1: Implement `createVizelMultiBlockSelectionExtension()`** as a Tiptap `Extension.create` with a ProseMirror plugin that:
  - Tracks `Selection` transitions.
  - On Shift+Click or Shift+Arrow that crosses a block boundary,
    expands the selection to a `NodeSelection` range covering whole
    blocks.
  - Decorates each block in the range with `data-vizel-block-selected`.

- [ ] **Step 2: Hook block-aware commands** — Tab, Shift+Tab, Backspace,
  Delete check the range and apply to every block in it.

- [ ] **Step 3: Wire into `createBaseExtensions`** unconditionally (no
  feature flag — block-range selection is fundamental).

- [ ] **Step 4: Add to the Extension Catalog** in
  `.claude/rules/packages/core.md`.

- [ ] **Step 5: Verify with Playwright CT** — write at least one
  scenario per framework that selects two paragraphs with Shift+Down
  and verifies Tab demotes both into the same list.

- [ ] **Step 6: Commit and open PR 11b.**

---

## Task 11c-1: Multi-block drag-and-drop + clipboard

**Files:**
- Modify: `packages/core/src/extensions/drag-handle.ts`
- Create: `packages/core/src/extensions/block-clipboard.ts`
- Modify: `packages/core/src/extensions/base.ts`

- [ ] **Step 1:** Drag handle's drop handler reads the current block range
  (from 11b) and moves all blocks together at the drop target's depth.

- [ ] **Step 2:** Block clipboard extension writes
  `application/x-vizel-blocks` (JSON of the selected nodes) plus
  `text/html` and `text/markdown` mirrors on copy / cut. Paste
  handler:
  - Prefers `application/x-vizel-blocks` (lossless).
  - Falls back to `text/html` parsed via Tiptap schema.
  - Falls back to `text/markdown` parsed via the new markdown
    pipeline. Emits `VizelError("MARKDOWN_LOSSY")` when the markdown
    pipeline drops content.
  - Falls back to `text/plain`.

- [ ] **Step 3:** Wire both into `createBaseExtensions` (always-on).

- [ ] **Step 4: Playwright CT scenarios** for cross-framework parity:
  - Copy two paragraphs, paste — both arrive intact.
  - Cut a list item, paste at a heading — list nesting preserved.
  - Paste GFM markdown from external source — converts via flavor.

- [ ] **Step 5: Commit and open PR 11c.**

---

## Task 11d-1: Block path API + `VizelOutline`

**Files:**
- Create: `packages/core/src/utils/block-path.ts`
- Create: `packages/core/src/builders/outline.ts`
- Create: `packages/react/src/components/VizelOutline.tsx`
- Create: `packages/vue/src/components/VizelOutline.vue`
- Create: `packages/svelte/src/components/VizelOutline.svelte`
- Modify: cross-framework parity tables in `.claude/rules/cross-framework.md`

- [ ] **Step 1:** Implement `getVizelBlockPath(editor)` returning
  `readonly VizelBlockPathSegment[]` — root → cursor.

- [ ] **Step 2:** Implement `buildVizelOutlineSpec(editor,
  currentNodePos, locale)` returning a Section 2-style spec.
  Builder walks `editor.state.doc` collecting headings into a tree by
  level.

- [ ] **Step 3: Framework `VizelOutline` components.** Each iterates
  `spec.items` recursively, renders a `<nav>` with `role="tree"` /
  `role="treeitem"`, and exposes `onclick={(item) => editor.commands.focus(item.pos)}`.

- [ ] **Step 4: Update cross-framework.md tables.** Component Parity
  Table gains `VizelOutline`.

- [ ] **Step 5: Playwright CT.** Mount `VizelOutline`, type
  `# Heading 1\n## Heading 1.1`, click the H1.1 entry, expect editor
  caret near pos.

- [ ] **Step 6: Commit and open PR 11d.**

---

## Task 11e-1: `VizelMinimap`

**Files:**
- Create: `packages/core/src/builders/minimap.ts`
- Create: `packages/core/src/utils/minimap-render.ts`
- Create: `packages/react/src/components/VizelMinimap.tsx`
- Create: `packages/vue/src/components/VizelMinimap.vue`
- Create: `packages/svelte/src/components/VizelMinimap.svelte`
- Modify: cross-framework parity tables

- [ ] **Step 1:** `buildVizelMinimapSpec(editor)` walks the doc and
  collects per-block `{ type, depth, approxHeight }` plus the current
  viewport top/bottom.

- [ ] **Step 2:** `renderVizelMinimapToCanvas(canvas, spec, theme)`
  draws colored rectangles per block (color from theme; height scaled
  to canvas; depth → horizontal offset).

- [ ] **Step 3:** Framework `VizelMinimap` components own the canvas
  ref + `requestAnimationFrame` loop, call `renderVizelMinimapToCanvas`
  on every editor transaction, and translate mousedown / wheel events
  on the viewport indicator into `editor.commands.scrollIntoView`
  calls.

- [ ] **Step 4: Update cross-framework.md tables.** Component Parity
  Table gains `VizelMinimap`.

- [ ] **Step 5: Playwright CT.** Mount `VizelMinimap`, verify the
  canvas has non-empty pixels after typing several blocks.

- [ ] **Step 6: Commit and open PR 11e.**

---

## Out of scope (deferred to later sections)

- Outline / Minimap polishing (scroll spy, animations, drag-resize)
  belongs to Section 16 (demo overhaul).
- Full Playwright round-trip suite for the new clipboard / paste paths
  belongs to Section 14 (Playwright CT audit).
