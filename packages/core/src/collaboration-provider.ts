/**
 * Minimal collaboration-provider interface.
 *
 * The Yjs `Y.Doc` + connection-provider pair is the reference
 * implementation. Adapters for Liveblocks, Convex, or custom WebSocket
 * protocols wrap their native handles into this shape. Vizel's editor
 * factory consumes this object to wire the History extension off and
 * connect Tiptap's collaboration extensions.
 */
export interface VizelCollaborationProvider {
  /**
   * Discriminant for downstream consumers. The reference Yjs adapter
   * sets `kind: "yjs"`; other providers use their own literal.
   */
  readonly kind: string;
  /**
   * Connect the provider to the editor. Returns a disposer that
   * disconnects the provider and releases any open WebSocket / network
   * resources. The editor invokes this exactly once during creation
   * and the disposer exactly once during destruction.
   */
  readonly connect: () => () => void;
}
