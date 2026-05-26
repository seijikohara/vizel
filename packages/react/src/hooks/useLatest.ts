import { type RefObject, useRef } from "react";

/**
 * @internal
 *
 * Track the latest value in a stable `RefObject`.
 *
 * Each render synchronously updates `ref.current` to the passed value,
 * so any closure that reads `ref.current` later observes the most recent
 * value without having to depend on it in a dependency array.
 *
 * This is the React idiom for "callback that should not stale" — used
 * throughout `Vizel.tsx` for lifecycle callbacks (`onUpdate`, `onError`,
 * etc.) that flow into `useVizelEditor` (which captures options once at
 * mount). Without it, passing a fresh handler on every render would be
 * silently ignored.
 *
 * @example
 * ```tsx
 * const onUpdate = useLatest(props.onUpdate);
 * useEffect(() => {
 *   editor.on("update", (e) => onUpdate.current?.(e));
 * }, [editor]);
 * ```
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
