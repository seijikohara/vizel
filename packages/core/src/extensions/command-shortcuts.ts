import { Extension } from "@tiptap/core";

import type { VizelCommand } from "../commands/types.ts";
import { isVizelMacPlatform } from "../utils/keyboard.ts";

/**
 * Options accepted by {@link createVizelCommandShortcutsExtension}.
 */
export interface VizelCommandShortcutsOptions {
  /**
   * Commands to scan. Only entries with both `surfaces.shortcut === true`
   * and a `shortcut` field contribute a keybinding.
   */
  readonly commands: readonly VizelCommand[];
}

/**
 * Create a Tiptap extension that binds the keyboard shortcuts declared
 * by a {@link VizelCommand} array.
 *
 * For every command with `surfaces.shortcut === true` and a `shortcut`
 * field, the extension registers a binding using the platform-specific
 * string: `shortcut.mac` on macOS, `shortcut.other` elsewhere. The
 * bound callback runs `command.run(editor)`; the return value follows
 * Tiptap's keybinding contract — `true` signals the editor consumed
 * the key event.
 */
export function createVizelCommandShortcutsExtension(
  options: VizelCommandShortcutsOptions
): Extension {
  return Extension.create({
    name: "vizelCommandShortcuts",
    addKeyboardShortcuts() {
      const isMac = isVizelMacPlatform();
      const bindings: Record<string, () => boolean> = {};

      for (const command of options.commands) {
        if (command.surfaces.shortcut !== true) continue;
        if (!command.shortcut) continue;
        const key = isMac ? command.shortcut.mac : command.shortcut.other;
        if (!key) continue;
        bindings[key] = () => command.run(this.editor);
      }

      return bindings;
    },
  });
}
