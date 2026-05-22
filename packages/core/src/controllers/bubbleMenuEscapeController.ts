import type { Editor } from "@tiptap/core";

/**
 * Options for {@link createVizelBubbleMenuEscapeController}.
 */
export interface VizelBubbleMenuEscapeControllerOptions {
  /**
   * Lazily resolves the bound editor. Called inside the keydown handler so
   * the controller follows late-mounting editors without a remount.
   */
  readonly getEditor: () => Editor | null | undefined;
}

/**
 * Returned by {@link createVizelBubbleMenuEscapeController}.
 *
 * Follows the canonical controller contract: `mount()` attaches the
 * document keydown listener, `unmount()` removes it. Both methods are
 * idempotent and Server-Side Rendering (SSR) safe.
 */
export interface VizelBubbleMenuEscapeController {
  /** Attach the Escape listener on `document`. */
  readonly mount: () => void;
  /** Remove the attached listener. Safe to call multiple times. */
  readonly unmount: () => void;
}

/**
 * Build a controller that collapses the editor's selection when the user
 * presses Escape while the bubble menu is open.
 *
 * Encapsulating the DOM listener in core keeps framework adapters
 * (`VizelBubbleMenu` in React, Vue, and Svelte) compliant with the
 * architecture rule that bans direct `document.addEventListener` from
 * framework code. Each adapter feeds in its own editor reference and
 * lets the controller own the listener lifecycle.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const controller = createVizelBubbleMenuEscapeController({
 *     getEditor: () => editor,
 *   });
 *   controller.mount();
 *   return () => controller.unmount();
 * }, [editor]);
 * ```
 */
export function createVizelBubbleMenuEscapeController(
  options: VizelBubbleMenuEscapeControllerOptions
): VizelBubbleMenuEscapeController {
  const { getEditor } = options;
  const state = { isMounted: false };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    const editor = getEditor();
    if (!editor) return;
    if (editor.view.state.selection.empty) return;
    event.preventDefault();
    editor.commands.setTextSelection(editor.view.state.selection.to);
  };

  return {
    mount: (): void => {
      // SSR guard: skip DOM work when `document` is unavailable.
      if (typeof document === "undefined") return;
      if (state.isMounted) return;
      document.addEventListener("keydown", handleKeyDown);
      state.isMounted = true;
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (!state.isMounted) return;
      document.removeEventListener("keydown", handleKeyDown);
      state.isMounted = false;
    },
  };
}
