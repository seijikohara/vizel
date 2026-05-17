# Section 4: Return Type Symmetry (Option B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Option B (idiom-respecting) return-type symmetry to every Vizel hook / composable / rune. Preserve all current consumer-facing functionality (`setMarkdown`, `isPending`, `save`, `restore`, `hasUnsavedChanges`, `error`) — only the *shape* of the reactive wrapper changes per framework. Add `useVizelEditorState` to the spec Section 4 table and apply the same Option B treatment.

**Architecture:** Four sequential sub-PRs.

- **4a** — Spec/docs update only. Rewrite the Section 4 return-type table to incorporate the preserved extras and the added `useVizelEditorState` row. Add a "Return Type Table" section to `.claude/rules/cross-framework.md` mirroring the new spec table. Add a Vue destructure caveat reference to `.claude/rules/packages/vue.md`. **No code changes.**
- **4b** — Vue. Migrate Vue composables to the spec's reactive primitive choice: `useVizelState` → `ComputedRef<number>`; `useVizelMarkdown.markdown` → `Readonly<ShallowRef<string>>`; `useVizelContext` → `ShallowRef<Editor | null>`; `useVizelTheme` flatten from `VizelThemeState` to `{ theme: ComputedRef<VizelTheme>; setTheme }`. Update demo callers and tests.
- **4c** — React. Migrate `useVizelContext` from `{ editor }` to raw `Editor | null`. Flatten `useVizelTheme` from `VizelThemeState` to `{ theme, setTheme }`. Update demo callers and tests.
- **4d** — Svelte. Rename `createVizelState`'s `current` field to `version`. Rename `createVizelMarkdown`'s `markdown` field to `current`. Flatten `getVizelTheme` to `{ readonly current: VizelTheme; setTheme }`. Update demo callers and tests.

After 4d merges, Section 4 closes. Cross-FW parity audit (Section 5) becomes possible because every public hook now reads from the same row in the new Section 4 table.

**Tech Stack:** TypeScript 5.x, React 19, Vue 3, Svelte 5, Tiptap.

---

## Decisions captured from user (resolves earlier spec ambiguity)

1. **Preserve consumer extras.** `useVizelMarkdown` keeps `setMarkdown` and `isPending`. `useVizelAutoSave` keeps `hasUnsavedChanges`, `error`, `save`, `restore`. The spec's "Option B minimal" shape is *too* minimal — update the spec to match the kept shape.
2. **`useVizelEditorState`** is in scope. Each framework adopts its own idiom: React returns `VizelEditorState` directly, Vue returns `ComputedRef<VizelEditorState>`, Svelte returns `{ readonly current: VizelEditorState }`.
3. **No backward compatibility shims.** Direct rename / reshape; consumers update at v2.0.0.

---

## Final Section 4 Return-Type Table (target after this plan)

| API | React | Vue | Svelte |
|-----|-------|-----|--------|
| `useVizelEditor` / `createVizelEditor` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| `useVizelState` / `createVizelState` | `number` | `ComputedRef<number>` | `{ readonly version: number }` |
| `useVizelEditorState` / `createVizelEditorState` | `VizelEditorState` | `ComputedRef<VizelEditorState>` | `{ readonly current: VizelEditorState }` |
| `useVizelMarkdown` / `createVizelMarkdown` | `{ markdown: string; setMarkdown: (md: string) => void; isPending: boolean; flush: () => void }` | `{ markdown: Readonly<ShallowRef<string>>; setMarkdown: (md: string) => void; isPending: ComputedRef<boolean>; flush: () => void }` | `{ readonly current: string; setMarkdown: (md: string) => void; readonly isPending: boolean; flush: () => void }` |
| `useVizelTheme` / `getVizelTheme` | `{ theme: VizelTheme; setTheme: (next: "light" \| "dark") => void }` | `{ theme: ComputedRef<VizelTheme>; setTheme: (next: "light" \| "dark") => void }` | `{ readonly current: VizelTheme; setTheme: (next: "light" \| "dark") => void }` |
| `useVizelAutoSave` / `createVizelAutoSave` | `{ status: VizelSaveStatus; hasUnsavedChanges: boolean; lastSaved: Date \| null; error: Error \| null; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` | `{ status: ComputedRef<VizelSaveStatus>; hasUnsavedChanges: ComputedRef<boolean>; lastSaved: ComputedRef<Date \| null>; error: ComputedRef<Error \| null>; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` | `{ readonly status: VizelSaveStatus; readonly hasUnsavedChanges: boolean; readonly lastSaved: Date \| null; readonly error: Error \| null; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` |
| `useVizelContext` / `getVizelContext` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| Suggestion menu imperative ref | `RefObject<{ onKeyDown: (e: KeyboardEvent) => boolean }>` | `Ref<{ onKeyDown: (e: KeyboardEvent) => boolean } \| null>` | `{ onKeyDown: (e: KeyboardEvent) => boolean } \| null` (mutable prop) |

Notes:
- The Svelte `version` field name on `createVizelState` distinguishes it from the editor-instance accessor.
- The Vue `Readonly<ShallowRef<...>>` choice (not `Ref`) signals read-only intent at the type level.
- `useVizelAutoSave`'s return is unwrapped in React (snapshot-on-render), `Computed`-wrapped per-field in Vue (lets templates use `.value` directly), and `readonly`-wrapped in Svelte runes (rune-getter idiom).

---

## Sub-PR 4a — Spec & rules update (docs-only)

### Task 4a-1 — Rewrite Section 4 of the spec

**Files:**
- Modify: `docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md` (lines 260–298)

- [ ] **Step 1: Replace the existing Section 4 table** with the "Final Section 4 Return-Type Table" above. Keep the existing Rationale paragraph. Insert a paragraph under the table noting the user's resolved decisions (preserve consumer extras; `useVizelEditorState` adopted).

- [ ] **Step 2: Commit**

  ```bash
  git add docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md
  git commit -m "docs(spec): expand Section 4 table to preserve consumer extras and add useVizelEditorState"
  ```

### Task 4a-2 — Add Return Type Table to cross-framework rule

**Files:**
- Modify: `.claude/rules/cross-framework.md`

- [ ] **Step 1: Find or create the "Return Type Table" section** at the end of the file (before any closing footer). Embed a condensed reference table linking back to `docs/superpowers/specs/...#4-return-type-symmetry--option-b-idiom-respecting`. Bullet-point the binding rules:
  - "React, Vue, and Svelte each use their framework's native reactivity primitive for the same API."
  - "When adding a new hook / composable / rune to a framework package, add the corresponding entry in all three packages and update the Return Type Table in the same PR."
  - "Vue users: destructuring `{ value } = ref` loses reactivity — see `.claude/rules/packages/vue.md` Composable Destructure Caveat."

- [ ] **Step 2:** Add the same warning to `.claude/rules/packages/vue.md` under a new "Composable Destructure Caveat" section (3–5 lines max).

- [ ] **Step 3: Commit**

  ```bash
  git add .claude/rules/cross-framework.md .claude/rules/packages/vue.md
  git commit -m "docs: document Option B return-type table and Vue destructure caveat"
  ```

### Task 4a-3 — Open and merge PR 4a

- [ ] **Step 1:** Branch from `main`. Push. Open PR titled `docs: update Section 4 return-type table to preserve consumer extras`. Body must enumerate the additions (`useVizelEditorState`, preserved extras) and note "no code changes".

- [ ] **Step 2:** Wait for CI; merge when green.

---

## Sub-PR 4b — Vue composables

### Task 4b-1 — `useVizelState`: `Ref<number>` → `ComputedRef<number>`

**Files:**
- Modify: `packages/vue/src/composables/useVizelState.ts`

- [ ] **Step 1:** Find the current implementation. It likely uses `ref<number>(0)` and increments it on `editor.on("update", ...)`. Restructure to:
  - Hold the tick in a private `ref<number>(0)` inside the composable.
  - Return a `ComputedRef<number>` (`computed(() => internalRef.value)`).

- [ ] **Step 2:** Update the return type annotation: `function useVizelState(editor: MaybeRefOrGetter<Editor | null>): ComputedRef<number>`.

- [ ] **Step 3:** `pnpm typecheck`. Expect pass (consumer callers may break — fix them in Task 4b-6).

- [ ] **Step 4: Commit**

  ```bash
  git add packages/vue/src/composables/useVizelState.ts
  git commit -m "refactor(vue): return ComputedRef from useVizelState"
  ```

### Task 4b-2 — `useVizelMarkdown`: `Ref<string>` → `Readonly<ShallowRef<string>>`

**Files:**
- Modify: `packages/vue/src/composables/useVizelMarkdown.ts`

- [ ] **Step 1:** Change the internal `ref<string>(...)` to `shallowRef<string>(...)`. Return a `Readonly<ShallowRef<string>>` (cast via `readonly()` from Vue if available, or via a `Readonly<...>` type assertion on the return).

- [ ] **Step 2:** Keep `setMarkdown` and `isPending` exactly as today. The return shape is:

  ```ts
  return {
    markdown: markdownRef as Readonly<ShallowRef<string>>,
    setMarkdown,
    isPending: computed(() => /* existing logic */),
    flush,
  };
  ```

- [ ] **Step 3:** `pnpm typecheck`. Expect pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/vue/src/composables/useVizelMarkdown.ts
  git commit -m "refactor(vue): expose readonly shallow ref from useVizelMarkdown"
  ```

### Task 4b-3 — `useVizelContext`: `ComputedRef<Editor | null>` → `ShallowRef<Editor | null>`

**Files:**
- Modify: `packages/vue/src/composables/useVizelEditor.ts` (or wherever `useVizelContext` lives — search with `grep -rn "useVizelContext" packages/vue/src/`)

- [ ] **Step 1:** Replace the `computed(() => injected.editor)` with the underlying `ShallowRef<Editor | null>` that Vue's `provide` / `inject` carries. The provider in `packages/vue/src/components/Vizel.vue` likely calls `provide(VIZEL_CONTEXT_KEY, { editor: shallowRef(...) })` — adjust so that what is provided IS the shallow ref, not an object wrapping it.

- [ ] **Step 2:** Update the return type: `function useVizelContext(): ShallowRef<Editor | null>`.

- [ ] **Step 3:** `pnpm typecheck`. Adjust the Vizel.vue provider in the same commit if needed.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/vue/src/composables/useVizelEditor.ts packages/vue/src/components/Vizel.vue
  git commit -m "refactor(vue): expose useVizelContext as ShallowRef instead of ComputedRef"
  ```

### Task 4b-4 — `useVizelTheme`: flatten `VizelThemeState` to `{ theme: ComputedRef<VizelTheme>; setTheme }`

**Files:**
- Modify: `packages/vue/src/composables/useVizelTheme.ts`

- [ ] **Step 1:** The current composable returns the whole context object (`VizelThemeState`) — likely with fields like `theme`, `resolvedTheme`, `setTheme`, `system`. Audit `VizelThemeState` shape first. The new return is:

  ```ts
  return {
    theme: computed(() => themeContext.resolvedTheme.value), // or whatever the source-of-truth is
    setTheme: themeContext.setTheme,
  };
  ```

  Use the *resolved* theme (after system-mode is collapsed to "light" / "dark"), not the user's setting which could be "system".

- [ ] **Step 2:** Update the return type: `function useVizelTheme(): { theme: ComputedRef<VizelTheme>; setTheme: (next: "light" | "dark") => void }`.

- [ ] **Step 3:** `pnpm typecheck`. Expect pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/vue/src/composables/useVizelTheme.ts
  git commit -m "refactor(vue): flatten useVizelTheme return to { theme, setTheme }"
  ```

### Task 4b-5 — `useVizelEditorState`: confirm shape is `ComputedRef<VizelEditorState>`

**Files:**
- Modify (if needed): `packages/vue/src/composables/useVizelEditorState.ts`

- [ ] **Step 1:** The audit showed Vue already returns `ComputedRef<VizelEditorState>`. Confirm by reading the file. If it matches, no change. If it differs, align with the spec table.

- [ ] **Step 2:** If a change was needed, commit; otherwise skip.

### Task 4b-6 — Update Vue demo + tests for new return shapes

**Files:**
- Modify: `apps/demo/vue/src/**/*.vue` — any consumer of the changed composables
- Modify: `tests/ct/vue/**/*.spec.ts` — any test that destructures the changed composables

- [ ] **Step 1:** `pnpm typecheck` will surface most call-site breakage. For each breakage:
  - `useVizelState` callers reading `.value` still work (`ComputedRef` and `Ref` both expose `.value`).
  - `useVizelMarkdown` callers writing via `markdownRef.value = "..."` must switch to calling `setMarkdown("...")`.
  - `useVizelContext` callers reading `.editor` must switch to reading `.value` directly (since the return IS the ref now).
  - `useVizelTheme` callers reading anything other than `theme` / `setTheme` must use the underlying context primitives if those fields existed.

- [ ] **Step 2:** Run `pnpm typecheck && pnpm lint && pnpm test:ct:vue`. All must pass.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/demo/vue tests/ct/vue
  git commit -m "refactor(demo,test): align Vue callers with new composable return shapes"
  ```

### Task 4b-7 — Open and merge PR 4b

- [ ] **Step 1:** Push. Open PR titled `refactor(vue): apply Option B return-type symmetry`. Body lists each composable's pre/post return shape.

- [ ] **Step 2:** Wait for CI; merge when green.

---

## Sub-PR 4c — React hooks

### Task 4c-1 — `useVizelContext`: `{ editor }` → raw `Editor | null`

**Files:**
- Modify: `packages/react/src/hooks/useVizelContext.ts` (if exists) or whichever file exports it (`grep -rn "useVizelContext" packages/react/src/`)
- Modify: provider component (likely `packages/react/src/components/Vizel.tsx`)

- [ ] **Step 1:** Audit the existing context shape. If the React context value is `VizelReactContext = { editor: Editor | null; ... }`, change the context type to be just `Editor | null` (or restructure so `useVizelContext` returns `context.editor`).

  Important: if other hooks (e.g. `useVizelState`, `useVizelMarkdown`) depend on the context shape internally, refactor in the same commit so they read the editor directly from the simplified context.

- [ ] **Step 2:** `pnpm typecheck`. Surface and fix all internal consumers.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/react/src/hooks/useVizelContext.ts packages/react/src/components/Vizel.tsx packages/react/src/hooks/*.ts
  git commit -m "refactor(react): return raw Editor from useVizelContext"
  ```

### Task 4c-2 — `useVizelTheme`: flatten `VizelThemeState` to `{ theme, setTheme }`

**Files:**
- Modify: `packages/react/src/hooks/useVizelTheme.ts`

- [ ] **Step 1:** Same treatment as Vue Task 4b-4: return only `{ theme, setTheme }`. `theme` is the resolved theme (`"light" | "dark"`), `setTheme` accepts `"light" | "dark"`.

- [ ] **Step 2:** `pnpm typecheck`. Expect pass.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/react/src/hooks/useVizelTheme.ts
  git commit -m "refactor(react): flatten useVizelTheme return to { theme, setTheme }"
  ```

### Task 4c-3 — Confirm other React hooks already match

- [ ] **Step 1:** Per the audit, `useVizelEditor`, `useVizelState`, `useVizelEditorState`, `useVizelMarkdown` (modulo extras), `useVizelAutoSave` (modulo extras) already match. Confirm by re-reading each file. No change expected.

### Task 4c-4 — Update React demo + tests

**Files:**
- Modify: `apps/demo/react/src/**/*.tsx`
- Modify: `tests/ct/react/**/*.spec.ts`

- [ ] **Step 1:** Fix call sites that destructure `useVizelContext().editor` (now use the return value directly) and `useVizelTheme()` consumers that read removed fields.

- [ ] **Step 2:** `pnpm typecheck && pnpm lint && pnpm test:ct:react`. All pass.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/demo/react tests/ct/react
  git commit -m "refactor(demo,test): align React callers with new hook return shapes"
  ```

### Task 4c-5 — Open and merge PR 4c

- [ ] **Step 1:** Push. Open PR titled `refactor(react): apply Option B return-type symmetry`. Body lists each hook's pre/post return shape.

- [ ] **Step 2:** Wait for CI; merge when green.

---

## Sub-PR 4d — Svelte runes

### Task 4d-1 — `createVizelState`: rename `current` → `version`

**Files:**
- Modify: `packages/svelte/src/runes/createVizelState.svelte.ts`

- [ ] **Step 1:** Rename the getter from `current` to `version`. The internal `$state` / `$derived` plumbing stays the same.

  ```ts
  return {
    get version(): number {
      return tick;
    },
  };
  ```

- [ ] **Step 2:** `pnpm typecheck`. Expect pass.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/svelte/src/runes/createVizelState.svelte.ts
  git commit -m "refactor(svelte): rename createVizelState getter current to version"
  ```

### Task 4d-2 — `createVizelMarkdown`: rename `markdown` → `current`

**Files:**
- Modify: `packages/svelte/src/runes/createVizelMarkdown.svelte.ts`

- [ ] **Step 1:** Rename the getter from `markdown` to `current`. Keep `setMarkdown`, `isPending`, `flush` as-is.

- [ ] **Step 2:** `pnpm typecheck`. Expect pass.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/svelte/src/runes/createVizelMarkdown.svelte.ts
  git commit -m "refactor(svelte): rename createVizelMarkdown getter markdown to current"
  ```

### Task 4d-3 — `getVizelTheme`: flatten `VizelThemeState` to `{ readonly current; setTheme }`

**Files:**
- Modify: `packages/svelte/src/runes/getVizelTheme.ts`

- [ ] **Step 1:** Same treatment as React/Vue: return only `{ readonly current: VizelTheme; setTheme }`. `current` is the resolved theme.

- [ ] **Step 2:** `pnpm typecheck`. Expect pass.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/svelte/src/runes/getVizelTheme.ts
  git commit -m "refactor(svelte): flatten getVizelTheme return to { current, setTheme }"
  ```

### Task 4d-4 — Confirm other Svelte runes already match

- [ ] **Step 1:** Per the audit, `createVizelEditor`, `createVizelEditorState`, `createVizelAutoSave`, `getVizelContext` already match. Confirm by re-reading. No change expected.

### Task 4d-5 — Update Svelte demo + tests

**Files:**
- Modify: `apps/demo/svelte/src/**/*.{ts,svelte}`
- Modify: `tests/ct/svelte/**/*.spec.ts`

- [ ] **Step 1:** Fix call sites reading the renamed fields:
  - `state.current` → `state.version`
  - `mdRune.markdown` → `mdRune.current`
  - `themeRune.<removed-field>` → derive from `{ current, setTheme }`

- [ ] **Step 2:** `pnpm typecheck && pnpm lint && pnpm test:ct:svelte`. All pass.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/demo/svelte tests/ct/svelte
  git commit -m "refactor(demo,test): align Svelte callers with new rune return shapes"
  ```

### Task 4d-6 — Open and merge PR 4d

- [ ] **Step 1:** Push. Open PR titled `refactor(svelte): apply Option B return-type symmetry`. Body lists each rune's pre/post return shape.

- [ ] **Step 2:** Wait for CI; merge when green.

---

## Acceptance Criteria

After all four sub-PRs merge:

1. Every public hook / composable / rune in `packages/{react,vue,svelte}/src/` returns the type shown in the Final Section 4 Return-Type Table.
2. `pnpm typecheck && pnpm lint && pnpm test:ct` passes on `main`.
3. The spec's Section 4 table matches the final shape (4a).
4. `.claude/rules/cross-framework.md` carries a "Return Type Table" section referencing the spec (4a).
5. `.claude/rules/packages/vue.md` mentions the destructure caveat (4a).
6. Demo apps under `apps/demo/{react,vue,svelte}/` render and behave identically to before the refactor — no UI regression.

## Cross-section dependencies

- Section 4 unblocks Section 5 (Cross-framework parity enforcement) because parity is now anchored to a single spec table.
- Section 4 unblocks Section 6 (Public API single import) because `useVizelContext` no longer leaks the internal context shape — the public surface is the editor itself.
