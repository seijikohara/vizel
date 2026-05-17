# Section 5: Cross-Framework Parity — Implementation Plan

**Goal:** Catalog cross-framework parity rules and enforce them with a CI script. Update `.claude/rules/cross-framework.md` to carry six explicit parity tables. Extend `.claude/agents/cross-framework-reviewer.md` with four parity checks.

**Architecture:** Two sequential sub-PRs.

- **5a** — Docs only. Restructure `.claude/rules/cross-framework.md` to carry the 6 parity tables explicitly (Identifier / Component / Props / Return Type / Event Payload / Idiom Exception Catalog). Update `.claude/agents/cross-framework-reviewer.md` with the 4 new checks.
- **5b** — CI script. Add `scripts/check-cross-framework-parity.ts` that programmatically diffs the exports of `packages/{react,vue,svelte}/src/index.ts` and fails on unauthorized divergence. Wire it into `pre-push` lefthook and CI.

## Sub-PR 5a — Docs restructuring

### Task 5a-1 — Restructure cross-framework.md

Replace the current file with the six explicit parity tables per spec Section 5:

1. **Identifier Parity Table** — every hook / composable / rune name stem.
2. **Component Parity Table** — every component across the three frameworks (the existing table works; verify completeness).
3. **Props Parity Table** — every prop signature.
4. **Return Type Table** — Section 4 outcomes (full table from the spec).
5. **Event Payload Table** — `onUpdate(editor)`, `onError(err)`, etc.
6. **Idiom Exception Catalog** — Category B from the spec.

Keep existing prose (`Editor Accessor Convention`, `Suggestion Menu Ref Convention`, `Reactive vs Mount-time Editor Options`, `State Subscription Convention`, `Adding a New Feature`) as-is. Restructure only the table sections to make the six SSOT tables explicit and labeled.

### Task 5a-2 — Update cross-framework-reviewer agent

Add four parity checks to `.claude/agents/cross-framework-reviewer.md`:

- **Identifier parity**: function name stems match across `index.ts` exports.
- **Props parity**: per-component prop types match by name and shape.
- **Event payload parity**: callback argument types match.
- **Idiom exception whitelist**: any difference outside Category B becomes a defect.

### Task 5a-3 — Open and merge PR 5a.

## Sub-PR 5b — CI script

### Task 5b-1 — Write `scripts/check-cross-framework-parity.ts`

Programmatically check:

1. Each public symbol from `@vizel/core` is re-exported from each framework's `src/index.ts` (covered by Section 6 in part; this script does the symmetry check).
2. The set of framework-package-defined hook/composable/rune name stems matches across packages (allowing the `use*` / `create*` / `get*` idiom exception).
3. Each component file's `Props` interface contains the same prop names (modulo `class` vs `className`) across frameworks.

Use TypeScript Compiler API to parse `index.ts` files. Run as a Node script (`tsx scripts/check-cross-framework-parity.ts`).

### Task 5b-2 — Wire into pre-push hook and CI

- Add the script invocation to `lefthook.yml` `pre-push` stage.
- Add the script invocation to the GitHub Actions workflow that runs on PRs.

### Task 5b-3 — Open and merge PR 5b.

## Acceptance Criteria

- `.claude/rules/cross-framework.md` carries 6 explicitly labeled parity tables.
- `.claude/agents/cross-framework-reviewer.md` lists the 4 parity checks.
- `scripts/check-cross-framework-parity.ts` runs and passes on `main`.
- `pre-push` hook invokes the script.
- CI runs the script on every PR.
