# ADR-0010: `.claude/` artefacts follow Anthropic's official reference

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

The `.claude/` directory contains skills, subagents, rules, and settings that drive how Claude Code interacts with this repository. v1's artefacts mix official conventions with bespoke patterns:

- Skills declare `description` but omit `when_to_use` and `paths:`.
- The subagent declares `name`, `description`, `tools` but omits `disallowedTools`, `color`, `model`, and `memory`.
- Rule files use the official auto-discovery mechanism (`paths:`) but several files omit the frontmatter.
- The custom skill `lint-instructions` enumerates rule contents that the auto-discovery mechanism would surface naturally.

The maintainer's directive: "`.claude/` 配下も対象にしてください。公式リファレンスに沿った適切な形式でなければなりません".

## Decision

Every file under `.claude/` conforms to the latest official Claude Code specification. Bespoke conventions remain only when a documented exception applies.

Concrete rules:

- **Skills** (`.claude/skills/<name>/SKILL.md`) carry `name`, `description`, `when_to_use`, and `paths:` (when path-scoped). Supporting files use the documented structure (`reference.md`, `examples.md`, `scripts/`). The combined `description` + `when_to_use` fits within 1,536 characters. Manual-only skills declare `disable-model-invocation: true`.
- **Subagents** (`.claude/agents/<name>.md`) declare `name`, `description`, `tools` (or omit for inherit-all), and SHOULD declare `disallowedTools`, `model`, `color`, `memory`, and `isolation` when the use case calls for them. The system-prompt body stays task-specific and concise (≤80 lines). Detailed reference defers to `.claude/rules/*.md`.
- **Rules** (`.claude/rules/**/*.md`) carry `paths:` frontmatter for path-scoped rules. Always-on rules omit `paths:` and load with the same priority as `CLAUDE.md`. `CLAUDE.md` lists the rules in a table but never duplicates rule content.
- **Settings** (`.claude/settings.json`, `.claude/settings.local.json`) declare `$schema`. Claude-Code-aware hooks live under `.claude/settings.json` `hooks`. Project-wide git hooks remain in `lefthook.yml`. The split is explicit and documented in this ADR.
- **Slash commands**: absent. Vizel uses skills, which the official guidance prefers for new authoring.

## Consequences

Positive:

- `.claude/` artefacts work the same way for every contributor and on every machine. No bespoke loader is required.
- Path-scoped rules and skills load only when relevant, which reduces context cost on unrelated edits.
- The subagent frontmatter unlocks read-only enforcement (`disallowedTools`), cumulative learning (`memory`), and isolation (`isolation: worktree`).

Negative:

- Existing skill bodies must split into `SKILL.md` + `reference.md` + `examples.md`. The migration is a Phase 0b task.
- Hooks are split between `.claude/settings.json` (Claude-Code-aware) and `lefthook.yml` (git-aware). Contributors must know which file owns which hook. This ADR records the split.

Follow-up:

- Phase 0b rewrites every `.claude/` artefact to match this ADR.
- `CLAUDE.md` becomes a slim index that references rules, skills, subagents, and settings tables.
- The new `.claude/rules/writing.md` (see [ADR-0011](./ADR-0011-technical-writing-style.md)) carries `paths:` covering all source and documentation files.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R7, Phase 0b)
- External: [Claude Code Skills reference](https://docs.anthropic.com/), [Claude Code Subagents reference](https://docs.anthropic.com/)
- Related: [ADR-0011](./ADR-0011-technical-writing-style.md)
