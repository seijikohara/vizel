/**
 * Shallow-equality helpers tailored for selector-result memoisation.
 *
 * Selector subscriptions in Vizel's reactivity layers (React's
 * `useSyncExternalStore`-backed `useVizelEditorState`, Vue's
 * `computed` short-circuit, Svelte's `createSubscriber` snapshot)
 * compare consecutive snapshots to decide whether to notify
 * subscribers. The default `Object.is` comparison misses structurally
 * equal but freshly allocated arrays and objects. The helpers below
 * provide the two shallow-equality shapes selectors most commonly
 * need without pulling in `react`, `vue`, or `svelte`.
 *
 * The helpers live in `@vizel/core` so the reactivity layer of every
 * framework adapter can consume them. Framework packages re-export
 * the helpers under their own import paths to keep consumer imports
 * idiomatic.
 */

/**
 * Return `true` when two arrays carry identical references in the
 * same order and the same length.
 *
 * The comparison runs in O(n) on the shared length; selectors that
 * return short arrays (typical in toolbar / bubble-menu state slices)
 * stay cheap to compare.
 *
 * @example
 * ```ts
 * shallowEqualArray([a, b], [a, b]); // true
 * shallowEqualArray([a, b], [a, c]); // false
 * ```
 */
export function shallowEqualArray<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}

/**
 * Return `true` when two plain objects share the same own
 * enumerable string keys and identical references for every value.
 *
 * The comparison treats `null` as a valid input and short-circuits on
 * reference equality, so callers may pass `null` whenever a selector
 * legitimately returns absence.
 *
 * @example
 * ```ts
 * shallowEqualObject({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
 * shallowEqualObject({ a: 1 }, { a: 1, b: 2 });       // false
 * ```
 */
export function shallowEqualObject<T extends Record<string, unknown>>(
  a: T | null,
  b: T | null
): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.hasOwn(b, key)) return false;
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}
