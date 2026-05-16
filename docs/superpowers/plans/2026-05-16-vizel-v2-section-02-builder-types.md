# Section 2: Builder Type Normalization Implementation Plan

> **For agentic workers:** This plan covers Section 2 of the v2.0.0 redesign. Section 2 is large enough that it decomposes into four pull requests (2a–2d) that land sequentially.

**Goal:** Replace the seven ad-hoc spec types under `packages/core/src/builders/` with five canonical spec types (`VizelMenuSpec`, `VizelPopoverSpec`, `VizelFormSpec`, `VizelCommandSpec`, `VizelGridSpec`).

**Architecture:** The four new spec types arrive additive (PR 2a). The existing builders then migrate to the canonical shapes across three PRs grouped by complexity: menu-style builders (PR 2b), the composite block-menu builder (PR 2c), and form-style builders (PR 2d). Each migration PR updates Core types, builder functions, and the three framework components in lock-step so `pnpm typecheck` stays green at every commit.

**Tech Stack:** TypeScript, Tiptap 3.x, Vite (Core bundling).

**Spec section:** [Section 2 of the v2.0.0 design spec](../specs/2026-05-16-vizel-v2-ideal-interface-design.md#2-builder-type-normalization).

**Master plan reference:** Phase 2 of [the master plan](2026-05-16-vizel-v2-master.md#phase-2--core-types-sections-2-3-4).

---

## PR Sequence

| Sub-section | Branch | Scope | Breaking |
|-------------|--------|-------|----------|
| 2a | `feat/v2-section-02a-spec-types` | Add `VizelPopoverSpec`, `VizelFormSpec`, `VizelCommandSpec`, `VizelGridSpec` to `builders/types.ts`. Export from `core/src/index.ts`. Existing builders untouched. | No |
| 2b | `feat/v2-section-02b-menu-builders` | Migrate `slash-menu`, `mention-menu`, `node-selector`, `toolbar-dropdown` builders to canonical shapes. Update Core builder functions + 3 framework components per builder. Rename `*Skeleton` → `*Spec`. | Yes |
| 2c | `feat/v2-section-02c-block-menu-builder` | Migrate `block-menu` builder (composite: popover + listbox + optional submenu). Update Core builder + 3 framework components. | Yes |
| 2d | `feat/v2-section-02d-form-builders` | Migrate `link-editor` and `find-replace` builders to `VizelFormSpec<TFields>`. Update Core builders + 3 framework components. Remove all legacy `*Skeleton` type aliases left for transition. | Yes |

Each PR carries its own commit history, CI green requirement, and PR description. PR 2a lands first; PR 2b–2d land sequentially after rebasing on the latest `main`.

---

## PR 2a — Additive spec types

### Goal

Introduce four new framework-neutral spec types alongside the existing `VizelMenuSpec`. Export them from `@vizel/core`. The existing builders, framework components, and tests stay untouched.

### Branch

`feat/v2-section-02a-spec-types`

### Files

| File | Change |
|------|--------|
| `packages/core/src/builders/types.ts` | Append 4 new spec type definitions and a small number of supporting types. |
| `packages/core/src/index.ts` | Add the new types to the "UI Skeletons" export block. |
| `.claude/rules/packages/core.md` | Add a "Builder Layer" subsection enumerating the five canonical spec types. |

### Tasks

#### 2a-T1: Add the four new spec types

**File:** `packages/core/src/builders/types.ts`

- [ ] Add `VizelPopoverSpec` for the trigger + body popover shape:

  ```ts
  /**
   * Trigger + anchored body popover spec.
   *
   * Used by block menu, toolbar dropdown, node selector, color picker, and
   * other components that open a floating body element when their trigger
   * activates.
   */
  export interface VizelPopoverTriggerSpec {
    /** Stable id used as the body's `aria-labelledby` and the trigger's anchor. */
    id: string;
    /** Role of the popup element this trigger opens. */
    "aria-haspopup": "listbox" | "menu" | "dialog";
    /** Whether the body is currently visible. */
    "aria-expanded": boolean;
    /** Id of the body element this trigger controls. */
    "aria-controls": string;
  }

  export interface VizelPopoverBodySpec {
    /** Stable id matching the trigger's `aria-controls`. */
    id: string;
    /** Body's ARIA role; aligns with the trigger's `aria-haspopup`. */
    role: "dialog" | "listbox" | "menu";
    /** Optional label source for assistive tech. */
    "aria-labelledby"?: string;
  }

  export interface VizelPopoverSpec {
    readonly trigger: VizelPopoverTriggerSpec;
    readonly body: VizelPopoverBodySpec;
    /** Whether the body is currently rendered (visible / mounted). */
    readonly isOpen: boolean;
  }
  ```

- [ ] Add `VizelCommandSpec` for the actionable item shared across slash menu, toolbar, bubble menu, block menu, and shortcut:

  ```ts
  /**
   * Pair of platform-specific shortcut strings. `mac` runs on macOS;
   * `other` runs on Windows / Linux. The format matches Tiptap's keymap
   * notation: `Mod-B`, `Mod-Shift-1`, `Alt-ArrowUp`, etc.
   */
  export interface VizelShortcutSpec {
    readonly mac: string;
    readonly other: string;
  }

  /**
   * Actionable item in a command surface (slash menu item, toolbar button,
   * bubble menu button, block menu item, keyboard shortcut handler).
   *
   * Section 9 introduces `VizelCommand`, the runtime-bearing form that
   * produces a `VizelCommandSpec` for a given editor instance. Until
   * Section 9 lands, builders construct `VizelCommandSpec` values
   * directly from the legacy item-view types.
   */
  export interface VizelCommandSpec {
    readonly id: string;
    readonly label: string;
    readonly description?: string;
    readonly icon?: string;
    readonly shortcut?: VizelShortcutSpec;
    readonly group?: string;
    readonly keywords?: readonly string[];
    readonly isEnabled: boolean;
    readonly isActive: boolean;
  }
  ```

- [ ] Add `VizelFormSpec<TFields>` for inline forms (link editor, find/replace):

  ```ts
  export interface VizelFormFieldAttrs {
    id: string;
    name: string;
    "aria-label": string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }

  export interface VizelFormFieldSpec<TValue> {
    readonly attrs: VizelFormFieldAttrs;
    readonly value: TValue;
    /** Localized error message when `attrs["aria-invalid"]` is true. */
    readonly errorMessage?: string;
  }

  export interface VizelFormRootAttrs {
    id: string;
    role: "form";
    "aria-label": string;
  }

  export interface VizelFormSpec<TFields extends Record<string, VizelFormFieldSpec<unknown>>> {
    readonly root: VizelFormRootAttrs;
    readonly fields: TFields;
    readonly submitLabel: string;
    readonly cancelLabel?: string;
    /** Whether the submit action should be enabled. */
    readonly canSubmit: boolean;
  }
  ```

- [ ] Add `VizelGridSpec<TCell>` for two-dimensional pickers (color picker, future emoji picker):

  ```ts
  export interface VizelGridRootAttrs {
    id: string;
    role: "grid";
    "aria-label": string;
  }

  export interface VizelGridCellAttrs {
    role: "gridcell";
    id: string;
    "aria-selected"?: boolean;
    tabIndex: -1 | 0;
  }

  export interface VizelGridCellSpec<TCell> {
    readonly key: string;
    readonly row: number;
    readonly col: number;
    readonly attrs: VizelGridCellAttrs;
    readonly data: TCell;
  }

  export interface VizelGridSpec<TCell> {
    readonly root: VizelGridRootAttrs;
    readonly rows: readonly (readonly VizelGridCellSpec<TCell>[])[];
    readonly focusedPosition: { readonly row: number; readonly col: number };
  }
  ```

- [ ] Verify `pnpm typecheck` exits 0.

#### 2a-T2: Export new types from `packages/core/src/index.ts`

**File:** `packages/core/src/index.ts`

- [ ] Add the new type names to the existing "UI Skeletons" export block (the section that re-exports from `./builders/index.ts`).

- [ ] Update `packages/core/src/builders/index.ts` to re-export the new types from `./types.ts` if it does not already use `export * from`.

- [ ] Verify `pnpm typecheck` exits 0.

#### 2a-T3: Document the Builder Layer in `.claude/rules/packages/core.md`

**File:** `.claude/rules/packages/core.md`

- [ ] Append a "Builder Layer" subsection under the existing "Four-Layer Structure" entry. List the five canonical spec types and the rule that every future builder targets one of these shapes:

  ```markdown
  ### Builder Layer

  Every UI scaffold consumes one of five canonical spec types. New builders
  produce one of these shapes; do not introduce ad-hoc spec types.

  | Spec | Purpose | Examples |
  |------|---------|----------|
  | `VizelMenuSpec<TData>` | Listbox or menu | slash menu, mention menu, dropdown body |
  | `VizelPopoverSpec` | Anchored popover (trigger + body) | block menu wrapper, toolbar dropdown, node selector wrapper, color picker wrapper |
  | `VizelFormSpec<TFields>` | Inline input form | link editor, find/replace |
  | `VizelCommandSpec` | Actionable item shared across command surfaces | slash item, toolbar action, bubble menu action, block menu item |
  | `VizelGridSpec<TCell>` | Two-dimensional cell grid | color picker grid, future emoji picker |

  Builder function names follow the pattern `buildVizel<Component>Spec(...)`.
  Section 2 of the v2.0.0 redesign retires the legacy `*Skeleton` naming.
  ```

#### 2a-T4: Open PR

- [ ] Push branch `feat/v2-section-02a-spec-types`.
- [ ] Create PR titled `feat(core): add canonical spec types (Popover, Form, Command, Grid)`.
- [ ] Wait for CI (typecheck + lint + 11 Playwright matrices).
- [ ] Merge `--squash --delete-branch` once green.

### Self-Review

- [ ] `builders/types.ts` exports `VizelPopoverSpec`, `VizelCommandSpec`, `VizelFormSpec`, `VizelGridSpec` and their helper types.
- [ ] `packages/core/src/index.ts` re-exports all new types.
- [ ] Existing builders, framework components, and tests are untouched (this is an additive PR).
- [ ] `pnpm typecheck` and `pnpm lint` exit 0.

---

## PR 2b — Migrate menu-style builders

(Detailed task list written immediately before this PR begins, after PR 2a merges. Outline:)

- Migrate `buildVizelSlashMenuSkeleton` → `buildVizelSlashMenuSpec` returning `VizelMenuSpec<VizelCommandSpec>` derived from the existing `VizelSlashItemView`.
- Migrate `buildVizelMentionMenuSkeleton` → `buildVizelMentionMenuSpec` returning `VizelMenuSpec<VizelMentionItemView>`.
- Migrate `buildVizelNodeSelectorSkeleton` → `buildVizelNodeSelectorSpec` returning `VizelPopoverSpec + VizelMenuSpec<VizelNodeTypeOption>`.
- Migrate `buildVizelToolbarDropdownSkeleton` → `buildVizelToolbarDropdownSpec` returning `VizelPopoverSpec + VizelMenuSpec<VizelCommandSpec>`.
- Update all 12 framework component files (4 menus × 3 FW) to consume the new shapes.
- Verify CT (`pnpm test:ct`) passes for each FW.

---

## PR 2c — Migrate block-menu builder

(Detailed task list written immediately before this PR begins.) Outline:

- Migrate `buildVizelBlockMenuSkeleton` → `buildVizelBlockMenuSpec` returning a record of `{ popover, menu, turnInto? }` where:
  - `popover: VizelPopoverSpec`
  - `menu: VizelMenuSpec<VizelCommandSpec>`
  - `turnInto?: { popover: VizelPopoverSpec; menu: VizelMenuSpec<VizelTurnIntoOption> }`
- Update `VizelBlockMenu` in React, Vue, and Svelte to consume the new shape.

---

## PR 2d — Migrate form-style builders, finalize

(Detailed task list written immediately before this PR begins.) Outline:

- Migrate `buildVizelLinkEditorViewState` → `buildVizelLinkEditorSpec` returning `VizelFormSpec<{ url, text, embed }>` (and embed-availability metadata).
- Migrate `buildVizelFindReplaceViewState` → `buildVizelFindReplaceSpec` returning `VizelFormSpec<{ find, replace }>` + match-state derived data.
- Retire the `VizelFindReplaceViewState` and `VizelLinkEditorViewState` type aliases left as transition shims.
- Update `VizelLinkEditor` and `VizelFindReplace` in React, Vue, and Svelte.
- Cross-framework reviewer subagent inspects parity at the end.
- Final Section 2 PR description summarizes the four-PR migration.
