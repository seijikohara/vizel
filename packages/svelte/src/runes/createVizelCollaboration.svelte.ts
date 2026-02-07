import {
  createVizelCollaborationHandlers,
  VIZEL_DEFAULT_COLLABORATION_OPTIONS,
  type VizelCollaborationOptions,
  type VizelCollaborationState,
  type VizelCollaborationUser,
  type VizelYjsProvider,
} from "@vizel/core";

/**
 * Collaboration rune result
 */
export interface CreateVizelCollaborationResult {
  /** Whether connected to the collaboration server */
  readonly isConnected: boolean;
  /** Whether the initial document sync is complete */
  readonly isSynced: boolean;
  /** Number of currently connected peers (including self) */
  readonly peerCount: number;
  /** Last error that occurred */
  readonly error: Error | null;
  /** Connect to the collaboration server */
  connect: () => void;
  /** Disconnect from the collaboration server */
  disconnect: () => void;
  /** Update the current user's cursor information */
  updateUser: (user: VizelCollaborationUser) => void;
}

/**
 * Rune for tracking real-time collaboration state with a Yjs provider.
 *
 * This rune manages event listeners on the provider to track connection status,
 * sync state, and peer count. It does NOT create the Yjs document or provider —
 * users must create those themselves and pass them in.
 *
 * @param getProvider - Function that returns the Yjs provider instance
 * @param options - Collaboration options including user info and callbacks
 * @returns Collaboration state and controls
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import * as Y from "yjs";
 * import { WebsocketProvider } from "y-websocket";
 * import Collaboration from "@tiptap/extension-collaboration";
 * import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
 * import { createVizelEditor, createVizelCollaboration } from "@vizel/svelte";
 *
 * const doc = new Y.Doc();
 * const provider = new WebsocketProvider("ws://localhost:1234", "my-doc", doc);
 *
 * const collab = createVizelCollaboration(
 *   () => provider,
 *   { user: { name: "Alice", color: "#ff0000" } }
 * );
 *
 * const editor = createVizelEditor({
 *   features: { collaboration: true },
 *   extensions: [
 *     Collaboration.configure({ document: doc }),
 *     CollaborationCursor.configure({
 *       provider,
 *       user: { name: "Alice", color: "#ff0000" },
 *     }),
 *   ],
 * });
 * </script>
 *
 * <p>{collab.isConnected ? "Connected" : "Disconnected"} ({collab.peerCount} peers)</p>
 * ```
 */
export function createVizelCollaboration(
  getProvider: () => VizelYjsProvider | null | undefined,
  options: VizelCollaborationOptions = { user: { name: "Anonymous", color: "#6366f1" } }
): CreateVizelCollaborationResult {
  const enabled = options.enabled ?? VIZEL_DEFAULT_COLLABORATION_OPTIONS.enabled;

  let isConnected = $state(false);
  let isSynced = $state(false);
  let peerCount = $state(0);
  let error = $state<Error | null>(null);

  let handlers: ReturnType<typeof createVizelCollaborationHandlers> | null = null;

  const handleStateChange = (partial: Partial<VizelCollaborationState>) => {
    if (partial.isConnected !== undefined) isConnected = partial.isConnected;
    if (partial.isSynced !== undefined) isSynced = partial.isSynced;
    if (partial.peerCount !== undefined) peerCount = partial.peerCount;
    if (partial.error !== undefined) error = partial.error;
  };

  $effect(() => {
    const provider = getProvider();
    handlers = createVizelCollaborationHandlers(getProvider, options, handleStateChange);

    let unsubscribe: (() => void) | undefined;
    if (provider && enabled) {
      unsubscribe = handlers.subscribe();
    }

    return () => {
      unsubscribe?.();
      handlers = null;
    };
  });

  return {
    get isConnected() {
      return isConnected;
    },
    get isSynced() {
      return isSynced;
    },
    get peerCount() {
      return peerCount;
    },
    get error() {
      return error;
    },
    connect: () => handlers?.connect(),
    disconnect: () => handlers?.disconnect(),
    updateUser: (user) => handlers?.updateUser(user),
  };
}
