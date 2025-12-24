import type { Extensions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

export interface VizelStarterKitOptions {
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Configure heading levels (default: [1, 2, 3]) */
  headingLevels?: (1 | 2 | 3 | 4 | 5 | 6)[];
}

/**
 * Create the default set of extensions for Vizel editor
 */
export function createVizelExtensions(options: VizelStarterKitOptions = {}): Extensions {
  const { placeholder = "Type '/' for commands...", headingLevels = [1, 2, 3] } = options;

  return [
    StarterKit.configure({
      heading: {
        levels: headingLevels,
      },
      // Disable some defaults we'll implement ourselves later
      dropcursor: {
        color: "#3b82f6",
        width: 2,
      },
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
  ];
}

export { StarterKit, Placeholder };
