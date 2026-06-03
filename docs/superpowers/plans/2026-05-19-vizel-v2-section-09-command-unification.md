# Section 9 — Command Abstraction Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a single runtime-bearing `VizelCommand` type that
replaces the five legacy item types (slash item, toolbar action, bubble
menu action, block menu action, keyboard shortcut). Default command
registries (`vizelFormatCommands`, `vizelBlockCommands`,
`vizelInsertCommands`, `vizelDefaultCommands`) emit `VizelCommand[]`,
and surface builders derive existing spec types (Section 2) from those
commands plus a `VizelCommandSurfaceSet`.

**Architecture:** All changes flow through `@vizel/core`. The new type
lives in `commands/types.ts`; default registries live in
`commands/registry/`; surface builders gain `VizelCommand`-aware entry
points that produce the existing spec shapes (`VizelMenuSpec`,
`readonly VizelCommandSpec[]`, etc.). Existing `SlashCommandItem` keeps
working as an alternative input for backward compatibility within
v2.0.0 development but is deprecated in favor of `VizelCommand`.

**Tech Stack:** TypeScript, Tiptap v2 keymap, locale system, Section 2
spec types.

---

## Spec mapping (binding)

```ts
export type VizelCommand = {
  readonly id: string;
  readonly label: (locale: VizelLocale) => string;
  readonly description?: (locale: VizelLocale) => string;
  readonly icon?: VizelIconName;
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly shortcut?: VizelShortcut;
  readonly canRun: (editor: Editor) => boolean;
  readonly isActive?: (editor: Editor) => boolean;
  readonly run: (editor: Editor) => boolean;
  readonly surfaces: VizelCommandSurfaceSet;
};

export type VizelCommandSurfaceSet = {
  readonly slashMenu?: { readonly priority?: number };
  readonly toolbar?: { readonly priority?: number };
  readonly bubbleMenu?: {
    readonly priority?: number;
    readonly showWhen?: (editor: Editor) => boolean;
  };
  readonly blockMenu?: { readonly priority?: number };
  readonly shortcut?: true;
};

export type VizelShortcut = {
  readonly mac: string;
  readonly other: string;
};
```

Surface derivation:

- `buildVizelSlashMenuSpec` — filters `surfaces.slashMenu`, applies the
  query filter, groups by `group`, returns
  `VizelMenuSpec<VizelCommandSpec>`.
- `buildVizelToolbarSpec` — filters `surfaces.toolbar`, sorts by
  priority, returns `readonly VizelCommandSpec[]`.
- `buildVizelBubbleMenuSpec` — filters `surfaces.bubbleMenu` and the
  `showWhen` predicate.
- `buildVizelBlockMenuSpec` — filters `surfaces.blockMenu`.
- `registerVizelShortcuts` — walks every command with
  `surfaces.shortcut` and a `shortcut` field, registers Tiptap key
  bindings, choosing `mac` or `other` from `isVizelMacPlatform()`.

Default registries:

```ts
export const vizelFormatCommands: readonly VizelCommand[];
export const vizelBlockCommands: readonly VizelCommand[];
export const vizelInsertCommands: readonly VizelCommand[];
export const vizelDefaultCommands: readonly VizelCommand[];
```

`vizelCommandsFromNodeTypes(nodeTypes)` derives `VizelCommand[]` from
`VizelNodeTypeOption[]`.

---

## Sub-PR breakdown

The work splits into four PRs sized for one focused review each:

- **9a — Type foundation.** `VizelCommand`, `VizelCommandSurfaceSet`,
  `VizelShortcut` in `commands/types.ts`; pure helper
  `deriveVizelCommandSpec(command, editor, locale)` returning the
  Section 2 `VizelCommandSpec`; one tiny default registry
  (`vizelFormatCommands` — bold, italic, code, strike) wired up just to
  exercise the type. No surface builders change yet.

- **9b — Default registries + slash menu derivation.** Full
  `vizelFormatCommands`, `vizelBlockCommands`, `vizelInsertCommands`,
  `vizelDefaultCommands`. New entry point
  `buildVizelSlashMenuSpecFromCommands(commands, query, editor, locale,
  selectedIndex, options)` returning
  `VizelMenuSpec<VizelCommandSpec>`. Legacy `SlashCommandItem` path
  stays for callers that still pass items directly.

- **9c — Toolbar / bubble / block surface builders + shortcuts.**
  - `buildVizelToolbarSpec(commands, editor, locale)`
  - `buildVizelBubbleMenuSpec(commands, editor, locale)`
  - `buildVizelBlockMenuSpec(commands, editor, locale)`
  - `registerVizelShortcuts(commands)` Tiptap extension factory.

- **9d — Auto node-type expansion + docs.**
  `vizelCommandsFromNodeTypes(nodeTypes)` plus a "Command Layer"
  section in `.claude/rules/packages/core.md` with surface-set rules,
  locale integration rules, and shortcut OS-branching rules.

Each sub-PR ends green on `pnpm lint && pnpm typecheck && pnpm build`
plus the full Playwright matrix on CI.

---

## Task 9a-1: Add VizelCommand type foundation

**Files:**
- Create: `packages/core/src/commands/types.ts`
- Modify: `packages/core/src/commands/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the type module**

```ts
// packages/core/src/commands/types.ts
import type { Editor } from "@tiptap/core";
import type { VizelIconName } from "../icons/types.ts";
import type { VizelLocale } from "../i18n/types.ts";

export interface VizelShortcut {
  readonly mac: string;
  readonly other: string;
}

export interface VizelCommandSurfaceSet {
  readonly slashMenu?: { readonly priority?: number };
  readonly toolbar?: { readonly priority?: number };
  readonly bubbleMenu?: {
    readonly priority?: number;
    readonly showWhen?: (editor: Editor) => boolean;
  };
  readonly blockMenu?: { readonly priority?: number };
  readonly shortcut?: true;
}

export interface VizelCommand {
  readonly id: string;
  readonly label: (locale: VizelLocale) => string;
  readonly description?: (locale: VizelLocale) => string;
  readonly icon?: VizelIconName;
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly shortcut?: VizelShortcut;
  readonly canRun: (editor: Editor) => boolean;
  readonly isActive?: (editor: Editor) => boolean;
  readonly run: (editor: Editor) => boolean;
  readonly surfaces: VizelCommandSurfaceSet;
}
```

- [ ] **Step 2: Re-export from `commands/index.ts` and root `index.ts`**

- [ ] **Step 3: Add `deriveVizelCommandSpec` helper in `commands/derive.ts`**

```ts
import type { Editor } from "@tiptap/core";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommandSpec } from "../builders/types.ts";
import type { VizelCommand } from "./types.ts";

export function deriveVizelCommandSpec(
  command: VizelCommand,
  editor: Editor,
  locale: VizelLocale
): VizelCommandSpec {
  return {
    id: command.id,
    label: command.label(locale),
    ...(command.description && { description: command.description(locale) }),
    ...(command.icon && { icon: command.icon }),
    ...(command.shortcut && { shortcut: command.shortcut }),
    ...(command.group && { group: command.group }),
    ...(command.keywords && { keywords: command.keywords }),
    isEnabled: command.canRun(editor),
    isActive: command.isActive?.(editor) ?? false,
  };
}
```

- [ ] **Step 4: Run `pnpm check && pnpm typecheck && pnpm build`**

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/v2-section-09a-vizel-command-types
git add packages/core/src/commands/types.ts packages/core/src/commands/derive.ts \
        packages/core/src/commands/index.ts packages/core/src/index.ts
git commit -m "feat(core): add VizelCommand type foundation"
```

- [ ] **Step 6: Open PR 9a**

---

## Task 9b-1: Default command registries

**Files:**
- Create: `packages/core/src/commands/registry/format.ts`
- Create: `packages/core/src/commands/registry/block.ts`
- Create: `packages/core/src/commands/registry/insert.ts`
- Create: `packages/core/src/commands/registry/index.ts`
- Modify: `packages/core/src/commands/index.ts`

Each registry exports `readonly VizelCommand[]`. `vizelDefaultCommands`
is the concatenation. Use `command.canRun` to gate on `editor.can()`
calls and reuse the same `run` closures the legacy
`SlashCommandItem.command` closures used (read off `defaultSlashCommands`).

- [ ] **Step 1: Port format commands (bold, italic, strike, underline, code, superscript, subscript, link-toggle).**

Each command sets `surfaces: { slashMenu: { priority: ... }, toolbar: { priority: ... }, bubbleMenu: { priority: ... }, shortcut: true }` with appropriate `shortcut` strings.

- [ ] **Step 2: Port block commands (heading1..6, bulletList, orderedList, taskList, quote, codeBlock, divider, details, callout).**

- [ ] **Step 3: Port insert commands (table, image, uploadImage, embed, tableOfContents, math, mermaid, graphviz).**

- [ ] **Step 4: Concatenate into `vizelDefaultCommands`.**

- [ ] **Step 5: Run `pnpm check && pnpm typecheck && pnpm build`**

- [ ] **Step 6: Commit and open PR 9b (after task 9b-2).**

---

## Task 9b-2: Slash menu derivation from VizelCommand

**Files:**
- Modify: `packages/core/src/builders/slash-menu.ts`
- Test: existing slash menu Playwright CT scenarios still pass

- [ ] **Step 1: Add new entry point**

```ts
export function buildVizelSlashMenuSpecFromCommands(
  commands: readonly VizelCommand[],
  options: {
    readonly editor: Editor;
    readonly locale: VizelLocale;
    readonly query: string;
    readonly selectedIndex: number;
    readonly showGroups?: boolean;
    readonly groupOrder?: readonly string[];
  }
): VizelMenuSpec<VizelCommandSpec>;
```

- [ ] **Step 2: Implement**: filter by `surfaces.slashMenu`, sort by
  priority, apply query (reuse existing fuse.js path via lightweight
  adapter or replicate substring fallback), group by `command.group`,
  derive each item with `deriveVizelCommandSpec`.

- [ ] **Step 3: Add `selectedIndex` flag to spec items via the existing
  `VizelMenuItemSpec.data` shape — extend `VizelCommandSpec` consumers
  on the framework side to read `selected` from the menu spec, not the
  command spec.**

- [ ] **Step 4: Verify slash menu Playwright CTs still pass against the
  legacy path (the new path is opt-in).**

- [ ] **Step 5: Run `pnpm check && pnpm typecheck && pnpm build`.**

- [ ] **Step 6: Commit and open PR 9b.**

```bash
git checkout -b feat/v2-section-09b-default-registries
git add packages/core/src/commands/registry/ packages/core/src/builders/slash-menu.ts
git commit -m "feat(core): add default command registries and slash-menu derivation"
```

---

## Task 9c-1: Toolbar / Bubble / Block surface builders

**Files:**
- Create: `packages/core/src/builders/toolbar.ts`
- Create: `packages/core/src/builders/bubble-menu.ts`
- Modify: `packages/core/src/builders/block-menu.ts`
- Modify: `packages/core/src/builders/index.ts`

- [ ] **Step 1: `buildVizelToolbarSpec`**

```ts
export function buildVizelToolbarSpec(
  commands: readonly VizelCommand[],
  options: { readonly editor: Editor; readonly locale: VizelLocale }
): readonly VizelCommandSpec[] {
  const filtered = commands
    .filter((c) => c.surfaces.toolbar !== undefined)
    .slice()
    .sort(
      (a, b) =>
        (a.surfaces.toolbar?.priority ?? 0) -
        (b.surfaces.toolbar?.priority ?? 0)
    );
  return filtered.map((c) => deriveVizelCommandSpec(c, options.editor, options.locale));
}
```

- [ ] **Step 2: `buildVizelBubbleMenuSpec`**

Identical shape to toolbar but filters by `surfaces.bubbleMenu` and
respects `showWhen`.

- [ ] **Step 3: `buildVizelBlockMenuSpec`**

Existing builder produces `VizelPopoverSpec + VizelMenuSpec`. Add a
`buildVizelBlockMenuSpecFromCommands` overload that consumes
`readonly VizelCommand[]` instead of legacy items and reuses the existing
popover assembly.

- [ ] **Step 4: Run `pnpm check && pnpm typecheck && pnpm build`.**

- [ ] **Step 5: Commit and open PR 9c (after 9c-2).**

---

## Task 9c-2: Shortcut registration

**Files:**
- Create: `packages/core/src/extensions/command-shortcuts.ts`
- Modify: `packages/core/src/extensions/base.ts` (register conditionally)

- [ ] **Step 1: Implement `createVizelCommandShortcutsExtension(commands)`**

Returns a Tiptap `Extension.create` with `addKeyboardShortcuts()` that
walks the commands, picks `mac` vs `other` via `isVizelMacPlatform()`,
and binds each entry that has both `surfaces.shortcut === true` and a
`shortcut` field. The bound callback runs `command.run(this.editor)`.

- [ ] **Step 2: Wire it through `createVizelExtensions` behind a new
  `commands?: readonly VizelCommand[]` option (default: skip — no
  behavior change for existing consumers).**

- [ ] **Step 3: Run `pnpm check && pnpm typecheck && pnpm build`.**

- [ ] **Step 4: Commit and open PR 9c.**

```bash
git checkout -b feat/v2-section-09c-surface-builders
git add packages/core/src/builders/toolbar.ts packages/core/src/builders/bubble-menu.ts \
        packages/core/src/builders/block-menu.ts packages/core/src/builders/index.ts \
        packages/core/src/extensions/command-shortcuts.ts packages/core/src/extensions/base.ts
git commit -m "feat(core): add toolbar/bubble/block command builders and shortcut registry"
```

---

## Task 9d-1: Auto node-type expansion

**Files:**
- Create: `packages/core/src/commands/registry/from-node-types.ts`
- Modify: `packages/core/src/commands/index.ts`

- [ ] **Step 1: Implement**

```ts
export function vizelCommandsFromNodeTypes(
  nodeTypes: readonly VizelNodeTypeOption[]
): readonly VizelCommand[] {
  return nodeTypes.map((nt) => ({
    id: `nodeType/${nt.id}`,
    label: (locale) => locale.nodeTypes[nt.id] ?? nt.label,
    ...(nt.description && { description: () => nt.description }),
    ...(nt.icon && { icon: nt.icon }),
    group: nt.group ?? "Blocks",
    canRun: (editor) => editor.can().setNode(nt.id),
    isActive: (editor) => editor.isActive(nt.id),
    run: (editor) => editor.chain().focus().setNode(nt.id).run(),
    surfaces: {
      slashMenu: { priority: nt.priority ?? 0 },
      blockMenu: { priority: nt.priority ?? 0 },
      shortcut: nt.shortcut ? true : undefined,
    },
  }));
}
```

- [ ] **Step 2: Run `pnpm check && pnpm typecheck && pnpm build`.**

---

## Task 9d-2: .claude/rules/packages/core.md — Command Layer section

**Files:**
- Modify: `.claude/rules/packages/core.md`

- [ ] **Step 1: Append a Command Layer section after "Feature Categories"** documenting:
  - The five surfaces and their builder names.
  - The `surfaces.shortcut` + `shortcut.mac`/`shortcut.other` OS-branching rule.
  - The locale rule: `label`/`description` receive `VizelLocale`; callers
    pass the editor's locale to surface builders.
  - The categorization rule: a command lives in a single registry
    (`vizelFormatCommands` / `vizelBlockCommands` / `vizelInsertCommands`)
    based on whether it changes a mark, changes a node type, or inserts
    a new structure.

- [ ] **Step 2: Commit and open PR 9d.**

```bash
git checkout -b feat/v2-section-09d-node-type-expansion
git add packages/core/src/commands/registry/from-node-types.ts \
        packages/core/src/commands/index.ts \
        .claude/rules/packages/core.md
git commit -m "feat(core): add command auto-derivation from node types and Command Layer docs"
```

---

## Out of scope (deferred to a later section)

- ~~Migrating `@vizel/react`, `@vizel/vue`, `@vizel/svelte` components to
  consume the new toolbar/bubble/block builders directly. That swap
  retires the legacy `SlashCommandItem` import path and is a separate
  cross-framework PR after Section 9 stabilizes.~~ **Completed by WI-6.**
  The slash-menu trio (`VizelSlashMenu` + `VizelSlashMenuItem` +
  `createVizelSlashMenuRenderer`) now consumes
  `VizelMenuSpec<VizelCommandSpec>` from
  `buildVizelSlashMenuSpecFromCommands` in all three adapters.
- ~~Removing `SlashCommandItem` entirely. The legacy item type continues
  to exist as an alternative input to the legacy slash menu builder
  path until the framework migration above completes.~~ **Completed by
  WI-6.** `packages/core/src/commands/slash-items.ts` is deleted and the
  public exports `createVizelSlashCommands`, `vizelDefaultSlashCommands`,
  `vizelDefaultGroupOrder`, `VizelSlashItemView`,
  `buildVizelSlashMenuSpec`, and `VizelSlashCommandItem` are removed
  ([ADR-0005](../../adr/ADR-0005-v2-breaking-release.md)).
