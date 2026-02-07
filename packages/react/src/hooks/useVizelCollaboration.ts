import {
  createVizelCollaborationHandlers,
  VIZEL_DEFAULT_COLLABORATION_OPTIONS,
  type VizelCollaborationOptions,
  type VizelCollaborationState,
  type VizelCollaborationUser,
  type VizelYjsProvider,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
 * @param getProvider - Function that returns the Yjs provider instance
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
 *     () => provider,
 *     { user: { name: "Alice", color: "#ff0000" } }
 *   );
 *
 *   const editor = useVizelEditor({
 *     features: { collaboration: true },
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
  getProvider: () => VizelYjsProvider | null | undefined,
  options: VizelCollaborationOptions = { user: { name: "Anonymous", color: "#6366f1" } }
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

  const getProviderRef = useRef(getProvider);
  getProviderRef.current = getProvider;

  const handleStateChange = useCallback((partial: Partial<VizelCollaborationState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handlers = useMemo(
    () =>
      createVizelCollaborationHandlers(
        () => getProviderRef.current(),
        {
          enabled,
          user: options.user,
          onConnect: () => optionsRef.current.onConnect?.(),
          onDisconnect: () => optionsRef.current.onDisconnect?.(),
          onSynced: () => optionsRef.current.onSynced?.(),
          onError: (error) => optionsRef.current.onError?.(error),
          onPeersChange: (count) => optionsRef.current.onPeersChange?.(count),
        },
        handleStateChange
      ),
    [enabled, options.user, handleStateChange]
  );

  useEffect(() => {
    const provider = getProvider();
    if (!(provider && enabled)) {
      return;
    }
    return handlers.subscribe();
  }, [getProvider, enabled, handlers]);

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
