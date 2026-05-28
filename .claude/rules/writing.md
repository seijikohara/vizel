---
paths:
  - "**/*.{ts,tsx,vue,svelte,scss,css}"
  - "**/*.md"
  - "**/*.{json,yml,yaml}"
---

# Technical Writing Style

Every authored sentence in this repository follows a single technical-writing standard. The standard covers source-code comments, JSDoc, README files, design documents, ADRs, the migration guide, demo descriptions, commit messages, pull-request bodies, and rule files under `.claude/rules/**`.

The full rationale lives in [ADR-0011](../../docs/adr/ADR-0011-technical-writing-style.md).

## Binding principles

- Write one idea per sentence. Remove filler words.
- Avoid ambiguous pronouns (`it`, `this`, `that`). Name the noun instead.
- Define abbreviations at first use, e.g. `Application Programming Interface (API)`.
- Use the active voice. Write "The function throws ValidationError", not "ValidationError is thrown by the function".
- Use the present tense in comments and docstrings.
- Make the subject explicit.
- Start function and class docstrings with a verb in the infinitive form: "Return the merged Markdown".
- Comments explain *why*, not *what*. Skip self-evident comments. Reference the cause — a constraint, a past bug, an external standard — when relevant. Do not narrate the code.
- Commit messages and pull-request titles follow Conventional Commits (`<type>(<scope>): <description>`). The subject is imperative, lower-case, has no trailing period, and stays at or under 72 characters.
- Markdown documents use a hierarchical heading structure. Avoid passive constructions.

## Mechanical enforcement

- Biome enforces line length and formatting.
- Lefthook's `commit-msg` hook enforces Conventional Commits.
- CI runs the same lint job.

## Semantic enforcement

Reviewers cite this rule when they request changes for passive voice, narrative comments, ambiguous pronouns, or undefined abbreviations. The rule itself is the checklist.

## Examples

### Comments

```ts
// Bad: narrates the code.
// Increment the counter.
counter += 1;

// Good: explains why.
// Tiptap re-emits the transaction synchronously when the selection
// collapses; bump the counter so useSyncExternalStore re-runs the
// selector even though the editor identity has not changed.
counter += 1;
```

### Commit subjects

```
feat(react): add useVizelEditorState selector subscription
fix(svelte): re-attach createSubscriber after editor reassignment
docs: add ADR-0001 for feature parity over API symmetry
```

### Function docstrings

```ts
/**
 * Return the editor's current Markdown serialisation.
 *
 * The Markdown reflects the latest committed transaction; calls made
 * during a transaction read the pre-transaction state.
 */
function getMarkdown(editor: Editor): string { /* ... */ }
```
