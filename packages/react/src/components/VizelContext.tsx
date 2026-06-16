import { type Editor, VizelError } from "@vizel/core";
import { createContext, type ReactNode, useContext } from "react";

/**
 * React context that carries the editor instance from `VizelProvider` /
 * `Vizel` down to descendants.
 *
 * The context value is the editor itself (or `null` while it is still
 * initializing). The context carries no wrapping `{ editor }` object so the
 * public hook surface (`useVizelContext`) returns the editor directly,
 * matching the React idiom that "the hook is the value".
 *
 * A `symbol` sentinel disambiguates "no provider mounted" from "provider
 * mounted but the editor is still `null`" without requiring a wrapper object.
 */
const VIZEL_CONTEXT_UNSET = Symbol("vizel-context-unset");
type VizelContextValue = Editor | null | typeof VIZEL_CONTEXT_UNSET;

const VizelContext = createContext<VizelContextValue>(VIZEL_CONTEXT_UNSET);

export interface VizelInternalProviderProps {
  editor: Editor | null;
  children: ReactNode;
}

/**
 * Internal provider component that makes the editor instance available to child components.
 * @internal
 */
export function VizelInternalProvider({ editor, children }: VizelInternalProviderProps) {
  return <VizelContext.Provider value={editor}>{children}</VizelContext.Provider>;
}

/**
 * Hook to access the editor instance from context.
 *
 * Returns the editor directly (or `null` while it is still initializing).
 * Throws when called outside of a `VizelProvider` / `Vizel` boundary.
 *
 * @throws Error if used outside of VizelProvider
 *
 * @example
 * ```tsx
 * function BoldButton() {
 *   const editor = useVizelContext();
 *   if (!editor) return null;
 *
 *   return (
 *     <button onClick={() => editor.chain().focus().toggleBold().run()}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useVizelContext(): Editor | null {
  const context = useContext(VizelContext);
  if (context === VIZEL_CONTEXT_UNSET) {
    throw new VizelError(
      "MISSING_CONTEXT",
      "useVizelContext must be used within <VizelProvider> or <Vizel>. " +
        "Wrap the consumer in <VizelProvider editor={editor}>...</VizelProvider>."
    );
  }
  return context;
}

/**
 * Hook to access the editor instance from context.
 *
 * Returns `null` both when used outside of a provider and when the provider
 * has not yet produced an editor instance. The two cases are indistinguishable
 * by design — callers that need to render conditionally should treat `null`
 * uniformly as "no editor available". Use {@link useVizelContext} when the
 * absence of a provider is a programming error.
 */
export function useVizelContextSafe(): Editor | null {
  const context = useContext(VizelContext);
  if (context === VIZEL_CONTEXT_UNSET) return null;
  return context;
}
