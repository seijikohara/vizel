# Section 1: Core Layering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `packages/core/src/` into the four-layer architecture (`extensions/`, `builders/`, `controllers/`, `utils/`) without changing runtime behavior.

**Architecture:** This section performs a structural refactor only. It renames `skeletons/` to `builders/`, moves `interactions/` into `controllers/`, relocates DOM-touching helpers from `utils/` into `controllers/`, extracts pure keyboard-navigation functions from `interactions/listboxController.ts` into `utils/keyboard-navigation.ts`, and introduces an empty `_internal/` directory. No public API changes; tests must continue to pass after each step.

**Tech Stack:** TypeScript, pnpm workspaces, Vite (for `@vizel/core` bundling), Biome (lint/format), Playwright CT.

**Spec section:** [Section 1 of the v2.0.0 design spec](../specs/2026-05-16-vizel-v2-ideal-interface-design.md#1-core-layering)

**Branch:** `refactor/v2-section-01-core-layering`

---

## File Structure

This PR performs file moves and import updates only. No new behavior.

### Directories created

```
packages/core/src/builders/         # ← renamed from skeletons/
packages/core/src/controllers/      # ← replaces interactions/ and absorbs DOM-touching utils/
packages/core/src/_internal/        # ← empty placeholder for future PRs
```

### Directories removed

```
packages/core/src/skeletons/        # ← contents moved to builders/
packages/core/src/interactions/     # ← contents moved to controllers/
```

### Files moved

| From | To |
|------|-----|
| `packages/core/src/skeletons/block-menu.ts` | `packages/core/src/builders/block-menu.ts` |
| `packages/core/src/skeletons/find-replace.ts` | `packages/core/src/builders/find-replace.ts` |
| `packages/core/src/skeletons/link-editor.ts` | `packages/core/src/builders/link-editor.ts` |
| `packages/core/src/skeletons/mention-menu.ts` | `packages/core/src/builders/mention-menu.ts` |
| `packages/core/src/skeletons/node-selector.ts` | `packages/core/src/builders/node-selector.ts` |
| `packages/core/src/skeletons/slash-menu.ts` | `packages/core/src/builders/slash-menu.ts` |
| `packages/core/src/skeletons/toolbar-dropdown.ts` | `packages/core/src/builders/toolbar-dropdown.ts` |
| `packages/core/src/skeletons/types.ts` | `packages/core/src/builders/types.ts` |
| `packages/core/src/skeletons/index.ts` | `packages/core/src/builders/index.ts` |
| `packages/core/src/interactions/dismissibleController.ts` | `packages/core/src/controllers/dismissibleController.ts` |
| `packages/core/src/interactions/transactionStore.ts` | `packages/core/src/controllers/transactionStore.ts` |
| `packages/core/src/interactions/editorSubscription.ts` | `packages/core/src/controllers/editorSubscription.ts` |
| `packages/core/src/interactions/index.ts` | `packages/core/src/controllers/index.ts` |
| `packages/core/src/utils/portal.ts` | `packages/core/src/controllers/portal.ts` |
| `packages/core/src/utils/suggestionContainer.ts` | `packages/core/src/controllers/suggestionContainer.ts` |

### Files split

| From | Into |
|------|------|
| `packages/core/src/interactions/listboxController.ts` | `packages/core/src/utils/keyboard-navigation.ts` (pure `resolveVizelListNavigation` and `resolveVizelGridNavigation` functions) — the rest of this file becomes a stub for Section 3 to replace |

### Files modified (imports only)

Every file under `packages/core/src/` that imports from `skeletons/`, `interactions/`, `utils/portal`, or `utils/suggestionContainer` gets its import paths updated. The compile-time check from `tsc` catches missed imports.

### Files updated (rule files)

| File | Change |
|------|--------|
| `.claude/rules/packages/core.md` | Add a "Four-Layer Structure" section near the top describing the new directories and their responsibilities |
| `.claude/rules/architecture.md` | Add a short note under "Concept 1" referencing the new four-layer structure |

---

## Pre-Flight

Establish the baseline before changing anything.

- [ ] **Step 0.1: Sync `main` and create the branch**

  ```bash
  git checkout main
  git pull --ff-only origin main
  git checkout -b refactor/v2-section-01-core-layering
  ```

- [ ] **Step 0.2: Establish the baseline**

  Run the full pre-push check set to confirm `main` is green before
  changes start.

  ```bash
  pnpm install
  pnpm typecheck
  pnpm lint
  pnpm test:ct
  ```

  Expected: all four commands exit 0. If any fail on `main`, stop and
  report the failure — do not begin the refactor on top of a broken
  baseline.

---

## Task 1: Rename `skeletons/` to `builders/`

The `skeletons/` directory holds pure builder functions that produce
framework-neutral specs. The spec's section 1 renames the directory to
`builders/` because "builder" describes the action (produce a spec) more
accurately than "skeleton" (which sounds structural and risks confusion
with framework components).

**Files:**
- Move all eight files from `packages/core/src/skeletons/` to
  `packages/core/src/builders/`
- Update imports in `packages/core/src/index.ts` and any consumer
  files

- [ ] **Step 1.1: Move the directory with git mv**

  ```bash
  git mv packages/core/src/skeletons packages/core/src/builders
  ```

  Verify the move with:

  ```bash
  ls packages/core/src/builders
  ```

  Expected output:

  ```
  block-menu.ts
  find-replace.ts
  index.ts
  link-editor.ts
  mention-menu.ts
  node-selector.ts
  slash-menu.ts
  toolbar-dropdown.ts
  types.ts
  ```

- [ ] **Step 1.2: Find all imports referencing the old path**

  ```bash
  grep -rln "skeletons" packages/core/src packages/react/src packages/vue/src packages/svelte/src
  ```

  Capture every file that needs an import update. Expected matches
  include `packages/core/src/index.ts` and likely framework component
  files in each package.

- [ ] **Step 1.3: Replace `skeletons/` with `builders/` in all imports**

  For each file from Step 1.2, replace import paths. The pattern is
  literal and safe with `sed` on macOS (BSD sed):

  ```bash
  grep -rln "skeletons" packages/core/src packages/react/src packages/vue/src packages/svelte/src \
    | xargs sed -i '' 's|skeletons|builders|g'
  ```

  On Linux (GNU sed) replace `-i ''` with `-i`.

- [ ] **Step 1.4: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: exit 0. If failures appear, inspect the failing file with
  `Read` (do not blindly re-run sed) and fix import paths manually.

- [ ] **Step 1.5: Run tests**

  ```bash
  pnpm test:ct
  ```

  Expected: all three frameworks pass. The behavior is identical; only
  paths changed.

- [ ] **Step 1.6: Commit**

  ```bash
  git add -A
  git commit -m "refactor(core): rename skeletons/ directory to builders/"
  ```

---

## Task 2: Consolidate `interactions/` and DOM-touching `utils/` into `controllers/`

The spec defines `controllers/` as the layer that owns all DOM side
effects through a `{ mount, unmount }` contract. The current
`interactions/` directory holds controllers already. Three files under
`utils/` perform DOM operations and belong in `controllers/`:
`portal.ts`, `suggestionContainer.ts`. The rest of `utils/` is pure.

**Files:**
- Move `packages/core/src/interactions/*` to
  `packages/core/src/controllers/*`
- Move `packages/core/src/utils/portal.ts` and
  `packages/core/src/utils/suggestionContainer.ts` into
  `packages/core/src/controllers/`
- Update imports across `packages/{core,react,vue,svelte}/src`

- [ ] **Step 2.1: Create the controllers directory by moving interactions**

  ```bash
  git mv packages/core/src/interactions packages/core/src/controllers
  ```

  Verify:

  ```bash
  ls packages/core/src/controllers
  ```

  Expected output:

  ```
  dismissibleController.ts
  editorSubscription.ts
  index.ts
  listboxController.ts
  transactionStore.ts
  ```

- [ ] **Step 2.2: Move DOM-touching utilities into controllers/**

  ```bash
  git mv packages/core/src/utils/portal.ts packages/core/src/controllers/portal.ts
  git mv packages/core/src/utils/suggestionContainer.ts packages/core/src/controllers/suggestionContainer.ts
  ```

- [ ] **Step 2.3: Update the `controllers/index.ts` to re-export the new entries**

  Open `packages/core/src/controllers/index.ts` and append the two new
  modules to the existing re-exports. The file should now export from
  every file in the directory. The exact form depends on the current
  contents; if the existing file lists each export by name, add:

  ```ts
  export * from "./portal.ts";
  export * from "./suggestionContainer.ts";
  ```

  If the existing file uses `export * from "./...";` patterns, simply
  add the two new lines at the end of the list.

- [ ] **Step 2.4: Replace `interactions/` and DOM `utils/` paths in imports**

  ```bash
  grep -rln "interactions/" packages/core/src packages/react/src packages/vue/src packages/svelte/src \
    | xargs sed -i '' 's|interactions/|controllers/|g'

  grep -rln "utils/portal" packages/core/src packages/react/src packages/vue/src packages/svelte/src \
    | xargs sed -i '' 's|utils/portal|controllers/portal|g'

  grep -rln "utils/suggestionContainer" packages/core/src packages/react/src packages/vue/src packages/svelte/src \
    | xargs sed -i '' 's|utils/suggestionContainer|controllers/suggestionContainer|g'
  ```

- [ ] **Step 2.5: Update the root `packages/core/src/index.ts`**

  Open `packages/core/src/index.ts` and update any direct re-exports
  from `./interactions/...` or from `./utils/portal` or
  `./utils/suggestionContainer` to the new paths. The earlier `sed`
  in Step 2.4 already handles import paths inside files; this step
  exists in case `index.ts` uses re-export shortcuts like
  `export * from "./interactions";` that the sed pattern would have
  changed but should verify.

  Read the file to confirm:

  ```bash
  grep -n "interactions\|utils/portal\|utils/suggestionContainer" packages/core/src/index.ts
  ```

  Expected: zero matches.

- [ ] **Step 2.6: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: exit 0. Investigate any failures with `Read` before
  re-running automated tools.

- [ ] **Step 2.7: Run tests**

  ```bash
  pnpm test:ct
  ```

  Expected: all three frameworks pass.

- [ ] **Step 2.8: Commit**

  ```bash
  git add -A
  git commit -m "refactor(core): consolidate interactions/ and DOM utils into controllers/"
  ```

---

## Task 3: Extract pure keyboard navigation into `utils/`

The current `controllers/listboxController.ts` (renamed from
`interactions/` in Task 2) contains both pure helper functions
(`resolveVizelListNavigation`, `resolveVizelGridNavigation`) and a
preview of a DOM controller. Section 1 of the spec mandates that pure
functions live in `utils/` while DOM-touching factories live in
`controllers/`. Section 3 will introduce the real `createVizelListboxController`
later; for now Section 1 only extracts the pure functions.

**Files:**
- Create: `packages/core/src/utils/keyboard-navigation.ts`
- Modify: `packages/core/src/controllers/listboxController.ts`
  (becomes a slim re-export shim until Section 3 replaces it)
- Modify: any callers of `resolveVizelListNavigation` /
  `resolveVizelGridNavigation` if they import from
  `controllers/listboxController` directly

- [ ] **Step 3.1: Inspect the current `listboxController.ts`**

  ```bash
  pnpm tsx --eval "console.log(require('fs').readFileSync('packages/core/src/controllers/listboxController.ts', 'utf8'))"
  ```

  Or use the `Read` tool. Identify:
  - Pure functions to extract: `resolveVizelListNavigation`,
    `resolveVizelGridNavigation`, plus any helper type or constant
    these depend on
  - Any DOM-touching code that stays in place for Section 3

  Most likely the file contains only pure functions and types today
  (the audit in the spec phase identified
  `controllers/listboxController.ts` as misnamed — it is pure).

- [ ] **Step 3.2: Create `utils/keyboard-navigation.ts` and copy the pure functions**

  Use the `Write` tool to create
  `packages/core/src/utils/keyboard-navigation.ts` with the pure
  contents of the current `listboxController.ts`. Preserve every
  exported name and signature exactly. Update any internal `import`
  paths in the moved code (they should resolve relative to the new
  location).

  Example header for the new file:

  ```ts
  /**
   * Pure keyboard navigation resolvers for one- and two-dimensional
   * lists. Returns the next index given the current state and a key
   * event. No DOM access; safe to call during SSR.
   */
  ```

- [ ] **Step 3.3: Replace the original file with a thin re-export shim**

  Open `packages/core/src/controllers/listboxController.ts` and
  replace its contents with:

  ```ts
  /**
   * Re-exports pure keyboard navigation helpers for backward
   * compatibility within this PR. Section 3 will replace this file
   * with the actual `createVizelListboxController` factory.
   */
  export {
    resolveVizelListNavigation,
    resolveVizelGridNavigation,
  } from "../utils/keyboard-navigation.ts";
  ```

  Adjust the re-exported names to match the pure functions that were
  actually present in the original.

- [ ] **Step 3.4: Move callers to the new path**

  ```bash
  grep -rln "controllers/listboxController" packages/core/src packages/react/src packages/vue/src packages/svelte/src \
    | xargs sed -i '' 's|controllers/listboxController|utils/keyboard-navigation|g'
  ```

  Note: this leaves the shim in place. Direct imports from
  `controllers/listboxController` are rewritten to import from
  `utils/keyboard-navigation`. The shim survives in case any external
  consumer outside this monorepo depended on the old path; Section 3
  rewrites the file entirely.

- [ ] **Step 3.5: Update `controllers/index.ts` to drop the listbox re-export**

  Open `packages/core/src/controllers/index.ts` and remove any
  `export * from "./listboxController.ts"` line. The pure functions
  now belong to `utils/`; their re-export from `controllers/` would
  violate the layer boundary.

- [ ] **Step 3.6: Update `utils/index.ts` to add the new module**

  Open `packages/core/src/utils/index.ts` (create it if absent) and
  add:

  ```ts
  export * from "./keyboard-navigation.ts";
  ```

  If the file uses named re-exports, add the specific names instead.

- [ ] **Step 3.7: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: exit 0.

- [ ] **Step 3.8: Run tests**

  ```bash
  pnpm test:ct
  ```

  Expected: all three frameworks pass.

- [ ] **Step 3.9: Commit**

  ```bash
  git add -A
  git commit -m "refactor(core): extract pure keyboard navigation into utils/"
  ```

---

## Task 4: Introduce empty `_internal/` directory

Section 1 of the spec introduces a `_internal/` directory that holds
implementation symbols that must not appear in the public API. Section
6 will populate this directory with helpers that the framework
packages should not re-export. This task creates the directory now so
later sections have a clear home for internal-only code.

**Files:**
- Create: `packages/core/src/_internal/.gitkeep`
- Create: `packages/core/src/_internal/README.md`

- [ ] **Step 4.1: Create the directory with a placeholder**

  ```bash
  mkdir -p packages/core/src/_internal
  touch packages/core/src/_internal/.gitkeep
  ```

- [ ] **Step 4.2: Create a README explaining the directory's purpose**

  Use the `Write` tool to create
  `packages/core/src/_internal/README.md`:

  ```markdown
  # `_internal/` — Implementation-private symbols

  This directory holds symbols that `@vizel/core` uses internally but
  that must not appear in the public API.

  ## Rules

  - Nothing in this directory is exported from `packages/core/src/index.ts`.
  - Framework packages (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`)
    must not re-export symbols from this directory.
  - The directory exists to give internal helpers a clear home and to
    let `scripts/check-reexport-mirror.ts` (introduced in Section 6)
    distinguish public from internal exports physically rather than by
    convention.

  ## Examples of suitable contents

  - Lazy-loader helper (`createLazyOptionalLoader`, Section 10)
  - Diagnostic emitter (`emitVizelError`, Section 7)
  - Test fixtures shared across internal tests but not exposed to
    consumers

  See `.claude/rules/packages/core.md` for the full policy.
  ```

- [ ] **Step 4.3: Verify no symbols slip into the public API yet**

  ```bash
  ls packages/core/src/_internal
  ```

  Expected:

  ```
  .gitkeep
  README.md
  ```

  The directory contains no code yet.

- [ ] **Step 4.4: Commit**

  ```bash
  git add packages/core/src/_internal
  git commit -m "refactor(core): introduce _internal/ directory for private symbols"
  ```

---

## Task 5: Update `.claude/rules/packages/core.md`

The spec requires this rule file to describe the four-layer
architecture as the SSOT. The existing content covers a subset; this
task replaces the relevant section without touching unrelated parts.

**Files:**
- Modify: `.claude/rules/packages/core.md`

- [ ] **Step 5.1: Read the current rule file**

  Read `.claude/rules/packages/core.md` and locate the section
  describing the directory structure. The current file lists Tiptap
  extension paths under a "Extension Catalog" table. The four-layer
  structure should appear above that table as a new "Four-Layer
  Structure" section.

- [ ] **Step 5.2: Insert the Four-Layer Structure section**

  Add the following section after the "Single Source of Truth" table
  and before the "Extension Development" section:

  ```markdown
  ## Four-Layer Structure

  The package organizes source code into four layers with strict
  dependency direction and explicit DOM-touch rules.

  ```
  packages/core/src/
  ├── extensions/      # Tiptap extensions only (createVizel*Extension)
  ├── commands/        # Tiptap chain command wrappers + VizelCommand type
  ├── builders/        # Pure spec builders (renamed from skeletons/)
  ├── controllers/     # DOM-owning controller factories
  ├── utils/           # Pure helpers. No DOM access.
  ├── _internal/       # Implementation-private symbols, not re-exported
  ├── styles/          # SCSS
  └── index.ts
  ```

  | Layer | Role | DOM access | May depend on |
  |-------|------|-----------|---------------|
  | `extensions/` | Define Tiptap extensions | Only inside ProseMirror plugins | `utils/`, `commands/`, Tiptap |
  | `commands/` | Wrap Tiptap chain commands; define `VizelCommand` type | None | `extensions/`, `utils/` |
  | `builders/` | Build framework-neutral specs | **None** | `utils/`, types, locale |
  | `controllers/` | Own DOM listeners through `{ mount, unmount }` | Only inside `mount()`, with SSR guard | `builders/`, `utils/` |
  | `utils/` | Pure helpers | **None** | Self, types |
  | `_internal/` | Implementation-private helpers | Per the surrounding layer's rule | Per the surrounding layer's rule |

  Naming conventions:

  - Extension: `createVizelXxxExtension(options)`
  - Command: `createVizelXxxCommand` or `applyVizel<Verb>` chain helper
  - Builder: `buildVizelXxxSpec(input)` returning `VizelXxxSpec`
  - Controller: `createVizelXxxController({...})` returning `{ mount, unmount }`
  ```

  The exact placement depends on the current file structure; preserve
  every existing section.

- [ ] **Step 5.3: Verify the rule file is well-formed**

  Use the `Read` tool to confirm the markdown still parses (no broken
  fences or orphaned list items).

- [ ] **Step 5.4: Commit**

  ```bash
  git add .claude/rules/packages/core.md
  git commit -m "docs(claude): document four-layer core package structure"
  ```

---

## Task 6: Update `.claude/rules/architecture.md`

The architecture rule already lists Core Concept 1 ("`@vizel/core` is
framework-agnostic"). Add a short paragraph that references the
four-layer structure introduced in this section.

**Files:**
- Modify: `.claude/rules/architecture.md`

- [ ] **Step 6.1: Locate Concept 1 in the rule file**

  Read `.claude/rules/architecture.md`. Find the bullet for Concept 1
  under "## Core Concepts (binding)". Today the bullet ends with:

  > Controller factories that own DOM side effects behind a
  > `{ mount(target), unmount() }` interface ...

- [ ] **Step 6.2: Append a structure pointer**

  Add a sentence at the end of Concept 1 (after the existing bullets)
  that points to the new structure:

  ```markdown
  Concrete directory layout for these three categories appears in
  `.claude/rules/packages/core.md` under "Four-Layer Structure".
  ```

  Keep the addition concise — the SSOT for the structure is the
  Core rule file, not the architecture rule.

- [ ] **Step 6.3: Commit**

  ```bash
  git add .claude/rules/architecture.md
  git commit -m "docs(claude): cross-reference core package four-layer structure"
  ```

---

## Task 7: Open the pull request

- [ ] **Step 7.1: Push the branch**

  ```bash
  git push -u origin refactor/v2-section-01-core-layering
  ```

- [ ] **Step 7.2: Create the PR**

  Use the `gh` command with a heredoc body:

  ```bash
  gh pr create --title "refactor(core): introduce four-layer directory structure" --body "$(cat <<'EOF'
  ## Summary

  - Renames `packages/core/src/skeletons/` to `builders/` to match the
    builder-function naming convention in the v2.0.0 design spec.
  - Moves `packages/core/src/interactions/` into `controllers/`. Brings
    `utils/portal.ts` and `utils/suggestionContainer.ts` into
    `controllers/` because they perform DOM side effects.
  - Extracts pure keyboard navigation helpers into
    `utils/keyboard-navigation.ts`. Leaves a thin re-export shim at
    the old controller path until Section 3 replaces it.
  - Introduces an empty `_internal/` directory for implementation-
    private symbols (populated in Sections 6, 7, and 10).
  - Documents the four-layer structure in
    `.claude/rules/packages/core.md` and cross-references it from
    `.claude/rules/architecture.md`.

  Pure file-move refactor; no runtime behavior changes.

  ## Spec section

  Implements [Section 1 of the v2.0.0 design spec](../docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md#1-core-layering).

  ## Master plan reference

  Phase 1 (Foundation), first PR. See [the master plan](../docs/superpowers/plans/2026-05-16-vizel-v2-master.md#phase-1--foundation-sections-1-7).

  ## Test Plan

  - [x] \`pnpm typecheck\` exits 0.
  - [x] \`pnpm lint\` exits 0.
  - [x] \`pnpm test:ct\` passes on React, Vue, and Svelte.
  - [x] \`git diff --stat main\` shows file moves with minimal content
    changes (only import paths and added doc files).
  EOF
  )"
  ```

- [ ] **Step 7.3: Wait for CI**

  GitHub Actions runs `typecheck`, `lint`, and `test:ct` on Chromium
  for all three frameworks. Wait until every check passes.

  ```bash
  gh pr checks --watch
  ```

- [ ] **Step 7.4: Merge after green CI and approval**

  Per the master plan, this PR represents Phase 1's first merge. Wait
  for human review approval before merging.

  ```bash
  gh pr merge --squash --delete-branch
  ```

---

## Self-Review Checklist

Before opening the PR, verify each item:

- [ ] `packages/core/src/skeletons/` no longer exists; `builders/`
  contains the same files.
- [ ] `packages/core/src/interactions/` no longer exists;
  `controllers/` contains its former contents.
- [ ] `packages/core/src/utils/portal.ts` and
  `packages/core/src/utils/suggestionContainer.ts` no longer exist;
  the corresponding files live under `controllers/`.
- [ ] `packages/core/src/utils/keyboard-navigation.ts` exists and
  exports the pure functions formerly inside the listbox file.
- [ ] `packages/core/src/_internal/` exists with `.gitkeep` and
  `README.md`.
- [ ] `git grep -E "skeletons/|interactions/|utils/portal|utils/suggestionContainer"` returns no matches in
  `packages/`.
- [ ] `pnpm typecheck` and `pnpm test:ct` both pass.
- [ ] `.claude/rules/packages/core.md` includes the "Four-Layer
  Structure" section.
- [ ] `.claude/rules/architecture.md` cross-references the new
  structure in Concept 1.
- [ ] Each Task above produced exactly one commit (six commits
  total). Commit messages start with imperative verbs and use the
  Conventional Commits format.

---

## Out-of-scope for this section

These items belong to later sections and must not appear in this PR:

- The `VizelError` class and `VizelErrorCode` literal union (Section 7)
- Actual builder logic changes (Section 2)
- Actual controller factory implementations beyond what already exists
  (Section 3)
- The `errors.ts` and `locale.ts` files at the top level of
  `packages/core/src/` (Sections 7 and 8)
- Adding any new external dependency (Section 10)

If any task tempts you toward these items, stop and confirm with the
master plan that the work belongs in a later section.
