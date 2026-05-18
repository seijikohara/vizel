import {
  createVizelCollaborationHandlers,
  VIZEL_DEFAULT_COLLABORATION_OPTIONS,
  type VizelCollaborationOptions,
  type VizelCollaborationState,
  type VizelCollaborationUser,
  type VizelYjsProvider,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Frozen default so the hook does not synthesize a fresh options literal on
// every call (which would invalidate `useMemo` deps and tear down the
// underlying handlers each render).
const DEFAULT_USER: VizelCollaborationUser = Object.freeze({
  name: "Anonymous",
  color: "#6366f1",
});
const DEFAULT_OPTIONS: VizelCollaborationOptions = Object.freeze({ user: DEFAULT_USER });

/**
 * Collaboration hook result
 */
export interface UseVizelCollaborationResult {
  /** Whether connected to the collaboration server */
  isConnected: boolean;
  /** Whether the initial document sync is complete */
  isSynced: boolean;
  /** Number of currently connected peers (including self) */
  peerCount: number;
  /** Last error that occurred */
  error: Error | null;
  /** Connect to the collaboration server */
  connect: () => void;
  /** Disconnect from the collaboration server */
  disconnect: () => void;
  /** Update the current user's cursor information */
  updateUser: (user: VizelCollaborationUser) => void;
}

/**
 * Hook for tracking real-time collaboration state with a Yjs provider.
 *
 * This hook manages event listeners on the provider to track connection status,
 * sync state, and peer count. It does NOT create the Yjs document or provider —
 * users must create those themselves and pass them in.
 *
 * @param provider - The Yjs provider instance (or `null` while it is still initializing)
 * @param options - Collaboration options including user info and callbacks
 * @returns Collaboration state and controls
 *
 * @example
 * ```tsx
 * import * as Y from "yjs";
 * import { WebsocketProvider } from "y-websocket";
 * import Collaboration from "@tiptap/extension-collaboration";
 * import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
 * import { useVizelEditor, useVizelCollaboration } from "@vizel/react";
 *
 * function CollaborativeEditor() {
 *   const [doc] = useState(() => new Y.Doc());
 *   const [provider] = useState(
 *     () => new WebsocketProvider("ws://localhost:1234", "my-doc", doc)
 *   );
 *
 *   const { isConnected, peerCount } = useVizelCollaboration(
 *     provider,
 *     { user: { name: "Alice", color: "#ff0000" } }
 *   );
 *
 *   const editor = useVizelEditor({
 *     features: { collaboration: { provider: true } },
 *     extensions: [
 *       Collaboration.configure({ document: doc }),
 *       CollaborationCursor.configure({
 *         provider,
 *         user: { name: "Alice", color: "#ff0000" },
 *       }),
 *     ],
 *   });
 *
 *   return (
 *     <div>
 *       <span>{isConnected ? "Connected" : "Disconnected"} ({peerCount} peers)</span>
 *       <VizelEditor editor={editor} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useVizelCollaboration(
  provider: VizelYjsProvider | null | undefined,
  options: VizelCollaborationOptions = DEFAULT_OPTIONS
): UseVizelCollaborationResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const enabled = options.enabled ?? VIZEL_DEFAULT_COLLABORATION_OPTIONS.enabled;

  const [state, setState] = useState<VizelCollaborationState>({
    isConnected: false,
    isSynced: false,
    peerCount: 0,
    error: null,
  });

  // Keep a ref to the provider for the handlers so they always read the latest
  // value without forcing a memo rebuild on every render.
  const providerRef = useRef(provider);
  providerRef.current = provider;

  const handleStateChange = useCallback((partial: Partial<VizelCollaborationState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Depend on user primitives rather than the whole `options.user` object so
  // consumers that pass a fresh object literal each render don't tear down
  // and reattach the underlying collaboration provider.
  const userName = options.user.name;
  const userColor = options.user.color;
  const handlers = useMemo(
    () =>
      createVizelCollaborationHandlers(
        () => providerRef.current,
        {
          enabled,
          user: { name: userName, color: userColor },
          onConnect: () => optionsRef.current.onConnect?.(),
          onDisconnect: () => optionsRef.current.onDisconnect?.(),
          onSynced: () => optionsRef.current.onSynced?.(),
          onError: (error) => optionsRef.current.onError?.(error),
          onPeersChange: (count) => optionsRef.current.onPeersChange?.(count),
        },
        handleStateChange
      ),
    [enabled, userName, userColor, handleStateChange]
  );

  useEffect(() => {
    if (!(provider && enabled)) {
      return;
    }
    return handlers.subscribe();
  }, [provider, enabled, handlers]);

  const connect = useCallback(() => handlers.connect(), [handlers]);
  const disconnect = useCallback(() => handlers.disconnect(), [handlers]);
  const updateUser = useCallback(
    (user: VizelCollaborationUser) => handlers.updateUser(user),
    [handlers]
  );

  return {
    isConnected: state.isConnected,
    isSynced: state.isSynced,
    peerCount: state.peerCount,
    error: state.error,
    connect,
    disconnect,
    updateUser,
  };
}
