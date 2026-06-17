import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * A collaborator's identity for presence rendering.
 */
export interface VizelPresenceUser {
  /** Stable user identifier. */
  readonly id: string;
  /** Human-readable display name. */
  readonly name: string;
  /** CSS color used for the user's cursor and selection. */
  readonly color: string;
}

/**
 * Per-user awareness state shared with other collaborators.
 *
 * The `selection` is encoded as a pair of ProseMirror document positions
 * (`anchor`, `head`). The `user` carries the identity payload above.
 */
export interface VizelPresenceUserState {
  readonly user: VizelPresenceUser;
  readonly selection: {
    readonly anchor: number;
    readonly head: number;
  } | null;
}

/**
 * Minimal awareness interface that Vizel's presence extension consumes.
 *
 * The Yjs Awareness instance satisfies this shape natively. Adapters
 * for other providers (Liveblocks, Convex, custom WebSocket protocols)
 * wrap their native API into this same surface.
 */
export interface VizelPresenceAwareness {
  /** Snapshot of every connected user's state, keyed by client id. */
  readonly getStates: () => ReadonlyMap<number, VizelPresenceUserState>;
  /** Publish the local user's state. */
  readonly setLocalState: (state: VizelPresenceUserState) => void;
  /**
   * Subscribe to state-change events. Returns an unsubscribe handle.
   */
  readonly on: (event: "update", handler: () => void) => () => void;
}

/**
 * Configuration for the presence extension.
 */
export interface VizelPresenceOptions {
  /** Awareness adapter to read remote states from and publish local state to. */
  readonly awareness: VizelPresenceAwareness;
  /** Identity of the local user. */
  readonly currentUser: VizelPresenceUser;
}

export const vizelPresencePluginKey = new PluginKey<DecorationSet>("vizelPresence");

/**
 * Create the presence extension.
 *
 * Renders other collaborators' cursors as `Decoration.widget` labels
 * and their selections as `Decoration.inline` highlights. Each user's
 * color drives a CSS variable that the companion stylesheet consumes.
 */
export function createVizelPresenceExtension(options: VizelPresenceOptions): Extension {
  return Extension.create({
    name: "vizelPresence",

    addProseMirrorPlugins() {
      return [
        new Plugin<DecorationSet>({
          key: vizelPresencePluginKey,
          state: {
            init: () => DecorationSet.empty,
            apply(tr, prev) {
              const remote = tr.getMeta(vizelPresencePluginKey);
              if (remote instanceof DecorationSet) return remote;
              return prev.map(tr.mapping, tr.doc);
            },
          },
          props: {
            decorations(state) {
              return this.getState(state);
            },
          },
          view(view) {
            const rebuild = (): void => {
              const decorations = buildVizelPresenceDecorations(
                view.state.doc,
                options.awareness.getStates(),
                options.currentUser.id
              );
              view.dispatch(view.state.tr.setMeta(vizelPresencePluginKey, decorations));
            };

            const unsubscribe = options.awareness.on("update", rebuild);
            rebuild();

            return {
              destroy() {
                unsubscribe();
              },
            };
          },
        }),
      ];
    },
  });
}

function buildVizelPresenceDecorations(
  doc: Parameters<typeof DecorationSet.create>[0],
  states: ReadonlyMap<number, VizelPresenceUserState>,
  localUserId: string
): DecorationSet {
  const decorations: Decoration[] = [];
  const docSize = doc.content.size;

  for (const [, state] of states) {
    if (state.user.id === localUserId) continue;
    if (!state.selection) continue;

    const anchor = Math.max(0, Math.min(docSize, state.selection.anchor));
    const head = Math.max(0, Math.min(docSize, state.selection.head));
    const from = Math.min(anchor, head);
    const to = Math.max(anchor, head);

    decorations.push(
      Decoration.widget(head, () => {
        const cursor = document.createElement("span");
        cursor.className = "vizel-presence-cursor";
        cursor.style.setProperty("--vizel-presence-color", state.user.color);
        cursor.dataset.vizelUserId = state.user.id;

        const label = document.createElement("span");
        label.className = "vizel-presence-cursor-label";
        label.textContent = state.user.name;
        cursor.appendChild(label);

        return cursor;
      })
    );

    if (from !== to) {
      decorations.push(
        Decoration.inline(from, to, {
          class: "vizel-presence-selection",
          style: `--vizel-presence-color: ${state.user.color};`,
        })
      );
    }
  }

  return DecorationSet.create(doc, decorations);
}
