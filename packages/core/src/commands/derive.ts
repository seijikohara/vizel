import type { Editor } from "@tiptap/core";
import type { VizelCommandSpec } from "../builders/types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommand } from "./types.ts";

/**
 * Derive a {@link VizelCommandSpec} for a single editor instance.
 *
 * Surface builders call this helper for each command they include in
 * their output so the resulting spec carries the localized strings and
 * the runtime-evaluated `isEnabled` / `isActive` flags expected by the
 * Section 2 spec shapes.
 */
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
