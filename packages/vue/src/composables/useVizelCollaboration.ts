import {
  createVizelCollaborationHandlers,
  VIZEL_DEFAULT_COLLABORATION_OPTIONS,
  type VizelCollaborationOptions,
  type VizelCollaborationState,
  type VizelCollaborationUser,
  type VizelYjsProvider,
} from "@vizel/core";
import { type ComputedRef, computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";

/**
 * Collaboration composable result
 */
export interface UseVizelCollaborationResult {
  /** Whether connected to the collaboration server */
  isConnected: ComputedRef<boolean>;
  /** Whether the initial document sync is complete */
  isSynced: ComputedRef<boolean>;
  /** Number of currently connected peers (including self) */
  peerCount: ComputedRef<number>;
  /** Last error that occurred */
  error: ComputedRef<Error | null>;
  /** Connect to the collaboration server */
  connect: () => void;
  /** Disconnect from the collaboration server */
  disconnect: () => void;
  /** Update the current user's cursor information */
  updateUser: (user: VizelCollaborationUser) => void;
}

/**
 * Composable for tracking real-time collaboration state with a Yjs provider.
 *
 * This composable manages event listeners on the provider to track connection status,
 * sync state, and peer count. It does NOT create the Yjs document or provider —
 * users must create those themselves and pass them in.
 *
 * @param getProvider - Function that returns the Yjs provider instance
 * @param options - Collaboration options including user info and callbacks
 * @returns Collaboration state and controls
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import * as Y from "yjs";
 * import { WebsocketProvider } from "y-websocket";
 * import Collaboration from "@tiptap/extension-collaboration";
 * import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
 * import { useVizelEditor, useVizelCollaboration } from "@vizel/vue";
 *
 * const doc = new Y.Doc();
 * const provider = new WebsocketProvider("ws://localhost:1234", "my-doc", doc);
 *
 * const { isConnected, peerCount } = useVizelCollaboration(
 *   () => provider,
 *   { user: { name: "Alice", color: "#ff0000" } }
 * );
 *
 * const editor = useVizelEditor({
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
 * ```
 */
export function useVizelCollaboration(
  getProvider: () => VizelYjsProvider | null | undefined,
  options: VizelCollaborationOptions = { user: { name: "Anonymous", color: "#6366f1" } }
): UseVizelCollaborationResult {
  const enabled = options.enabled ?? VIZEL_DEFAULT_COLLABORATION_OPTIONS.enabled;

  const state = reactive<VizelCollaborationState>({
    isConnected: false,
    isSynced: false,
    peerCount: 0,
    error: null,
  });

  let handlers: ReturnType<typeof createVizelCollaborationHandlers> | null = null;
  let unsubscribe: (() => void) | null = null;

  function handleStateChange(partial: Partial<VizelCollaborationState>) {
    if (partial.isConnected !== undefined) state.isConnected = partial.isConnected;
    if (partial.isSynced !== undefined) state.isSynced = partial.isSynced;
    if (partial.peerCount !== undefined) state.peerCount = partial.peerCount;
    if (partial.error !== undefined) state.error = partial.error;
  }

  function setup() {
    cleanup();
    handlers = createVizelCollaborationHandlers(getProvider, options, handleStateChange);
    const provider = getProvider();
    if (provider && enabled) {
      unsubscribe = handlers.subscribe();
    }
  }

  function cleanup() {
    unsubscribe?.();
    unsubscribe = null;
    handlers = null;
  }

  onMounted(() => {
    setup();
  });

  watch(
    () => getProvider(),
    () => {
      setup();
    }
  );

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    isConnected: computed(() => state.isConnected),
    isSynced: computed(() => state.isSynced),
    peerCount: computed(() => state.peerCount),
    error: computed(() => state.error),
    connect: () => handlers?.connect(),
    disconnect: () => handlers?.disconnect(),
    updateUser: (user) => handlers?.updateUser(user),
  };
}
