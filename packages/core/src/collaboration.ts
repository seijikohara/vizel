/**
 * Collaboration module for real-time multi-user editing with Yjs.
 *
 * This module provides types, state management, and lifecycle utilities
 * for integrating Yjs-based collaboration into Vizel editors.
 *
 * Users must install their own compatible versions of:
 * - `yjs` (^13.6.0)
 * - `y-websocket` (^2.0.0) or another Yjs provider
 * - `@tiptap/extension-collaboration`
 * - `@tiptap/extension-collaboration-cursor`
 */

/**
 * User information for collaboration cursor display
 */
export interface VizelCollaborationUser {
  /** Display name shown next to the cursor */
  name: string;
  /** Cursor and highlight color (CSS color value) */
  color: string;
}

/**
 * Interface matching the Yjs Awareness API.
 * Compatible with `y-protocols/awareness` Awareness class.
 */
export interface VizelYjsAwareness {
  /** Set a field on the local awareness state */
  setLocalStateField(field: string, value: unknown): void;
  /** Get all awareness states from connected peers */
  getStates(): Map<number, Record<string, unknown>>;
  /** Subscribe to awareness events */
  on(event: string, handler: (...args: unknown[]) => void): void;
  /** Unsubscribe from awareness events */
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Interface matching Yjs WebSocket provider API.
 * Compatible with `y-websocket` WebsocketProvider and similar providers
 * that emit `"status"` and `"sync"` events.
 */
export interface VizelYjsProvider {
  /** Awareness instance for cursor/presence tracking */
  awareness: VizelYjsAwareness;
  /** Connect to the collaboration server */
  connect(): void;
  /** Disconnect from the collaboration server */
  disconnect(): void;
  /** Destroy the provider and release resources */
  destroy(): void;
  /** Subscribe to provider events */
  on(event: string, handler: (...args: unknown[]) => void): void;
  /** Unsubscribe from provider events */
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Options for collaboration state management
 */
export interface VizelCollaborationOptions {
  /** Whether collaboration tracking is enabled (default: true) */
  enabled?: boolean;
  /** Current user info for cursor display */
  user: VizelCollaborationUser;
  /** Callback when connected to the collaboration server */
  onConnect?: () => void;
  /** Callback when disconnected from the collaboration server */
  onDisconnect?: () => void;
  /** Callback when initial document sync completes */
  onSynced?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when the number of connected peers changes */
  onPeersChange?: (count: number) => void;
}

/**
 * Collaboration connection state
 */
export interface VizelCollaborationState {
  /** Whether connected to the collaboration server */
  isConnected: boolean;
  /** Whether the initial document sync is complete */
  isSynced: boolean;
  /** Number of currently connected peers (including self) */
  peerCount: number;
  /** Last error that occurred */
  error: Error | null;
}

/**
 * Default collaboration options
 */
export const VIZEL_DEFAULT_COLLABORATION_OPTIONS = {
  enabled: true,
} as const;

/**
 * Create collaboration handlers for tracking provider state and managing lifecycle.
 *
 * The handlers set up event listeners on the Yjs provider to track connection state,
 * sync status, and peer count. Call `subscribe()` to start listening and use the
 * returned cleanup function to stop.
 *
 * @param getProvider - Function that returns the Yjs provider instance
 * @param options - Collaboration options including user info and callbacks
 * @param onStateChange - Callback to update reactive state
 * @returns Collaboration control methods
 *
 * @example
 * ```ts
 * const handlers = createVizelCollaborationHandlers(
 *   () => wsProvider,
 *   { user: { name: "Alice", color: "#ff0000" } },
 *   (partial) => Object.assign(state, partial)
 * );
 *
 * // Start listening to provider events
 * const unsubscribe = handlers.subscribe();
 *
 * // Later, clean up
 * unsubscribe();
 * ```
 */
export function createVizelCollaborationHandlers(
  getProvider: () => VizelYjsProvider | null | undefined,
  options: VizelCollaborationOptions,
  onStateChange: (state: Partial<VizelCollaborationState>) => void
): {
  /** Connect to the collaboration server */
  connect: () => void;
  /** Disconnect from the collaboration server */
  disconnect: () => void;
  /** Update the current user's cursor information */
  updateUser: (user: VizelCollaborationUser) => void;
  /** Subscribe to provider events. Returns an unsubscribe function. */
  subscribe: () => () => void;
} {
  const enabled = options.enabled ?? VIZEL_DEFAULT_COLLABORATION_OPTIONS.enabled;

  function connect(): void {
    if (!enabled) return;
    const provider = getProvider();
    provider?.connect();
  }

  function disconnect(): void {
    const provider = getProvider();
    provider?.disconnect();
  }

  function updateUser(user: VizelCollaborationUser): void {
    const provider = getProvider();
    provider?.awareness.setLocalStateField("user", user);
  }

  function subscribe(): () => void {
    const provider = getProvider();
    if (!(provider && enabled)) {
      // No provider or disabled — nothing to subscribe to
      return () => undefined;
    }

    const handleStatus = (...args: unknown[]) => {
      const event = args[0] as { status: string } | undefined;
      if (!event) return;
      const isConnected = event.status === "connected";
      onStateChange({ isConnected });
      if (isConnected) {
        options.onConnect?.();
      } else {
        options.onDisconnect?.();
      }
    };

    const handleSync = (...args: unknown[]) => {
      const isSynced = args[0] as boolean;
      onStateChange({ isSynced });
      if (isSynced) {
        options.onSynced?.();
      }
    };

    const handleAwarenessChange = () => {
      const peerCount = provider.awareness.getStates().size;
      onStateChange({ peerCount });
      options.onPeersChange?.(peerCount);
    };

    // Set initial user info
    provider.awareness.setLocalStateField("user", options.user);

    // Subscribe to events
    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.awareness.on("change", handleAwarenessChange);

    // Set initial peer count
    handleAwarenessChange();

    return () => {
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.awareness.off("change", handleAwarenessChange);
    };
  }

  return {
    connect,
    disconnect,
    updateUser,
    subscribe,
  };
}
