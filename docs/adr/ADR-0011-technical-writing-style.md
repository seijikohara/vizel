# ADR-0011: Technical-writing style governs every artefact

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

v1 artefacts drift in tone. Some source comments narrate the code instead of the rationale. Some doc pages slip into passive voice. Some commit messages use past tense and end with periods. The global `~/.claude/CLAUDE.md` already prescribes a single technical-writing standard, but the repository never codified it.

The maintainer's directive: "全ファイルの文章はテクニカルライティングの文体としてください。各種ドキュメントファイルからソースコードのコメントまで含みます".

## Decision

Vizel adopts a single technical-writing standard for every authored artefact: source-code comments, JSDoc, README files, design documents, ADRs, migration guides, demo descriptions, commit messages, pull-request bodies, and rule files under `.claude/rules/**`.

The standard codifies into `.claude/rules/writing.md` with `paths:` frontmatter that auto-loads the rule whenever any source, test, or doc file is edited.

Binding principles:

- One idea per sentence. Remove filler words.
- Avoid ambiguous pronouns (`it`, `this`, `that`); name the noun.
- Define abbreviations at first use, e.g. `Application Programming Interface (API)`.
- Use the active voice ("The function throws ValidationError" instead of "ValidationError is thrown by the function").
- Use the present tense in comments and docstrings.
- Make the subject explicit.
- Start function or class docstrings with a verb in the infinitive form ("Return the merged Markdown").
- Comments explain *why*, not *what*. Skip self-evident comments. Reference the cause (a constraint, a past bug, an external standard) when relevant; do not narrate the code.
- Commit messages and pull-request titles follow Conventional Commits (`<type>(<scope>): <description>`); the subject is imperative, lower-case, no trailing period, ≤72 characters.
- Markdown documents use a hierarchical heading structure and avoid passive constructions.

Mechanical enforcement runs through Biome (line length, formatting), lefthook (`commit-msg` Conventional Commits check), and CI (lint job). Semantic enforcement happens at code review; reviewers cite the rule when they request changes.

## Consequences

Positive:

- Documentation tone stabilises. Reviewers gain a concrete reference instead of an implicit standard.
- New contributors find the writing rules in the same place they find the architecture rules.
- The `paths:` frontmatter on `.claude/rules/writing.md` keeps the rule in Claude Code's context whenever an editable file is open, which prevents drift during long sessions.

Negative:

- Existing artefacts that violate the rules must be updated. The migration to v2 absorbs most of these updates because Phase 3 rewrites adapter code wholesale; older docs are revisited in Phase 4.
- Reviewers need to spot semantic violations the formatter cannot catch (passive voice, narrative comments, ambiguous pronouns). The rule itself serves as the checklist.

Follow-up:

- Phase 0b writes `.claude/rules/writing.md`.
- Phase 4 rewrites `docs/guide/` and `docs/api/` against the rule.
- The migration guide notes that v2 doc tone tightens; v1 doc passages do not carry over verbatim.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R8)
- External: `~/.claude/CLAUDE.md` (the global standard this ADR codifies for Vizel)
- Related: [ADR-0010](./ADR-0010-claude-config-official-format.md)
