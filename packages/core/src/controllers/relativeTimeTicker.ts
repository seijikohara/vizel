import { formatVizelRelativeTime } from "../auto-save.ts";
import type { VizelLocale } from "../i18n/types.ts";

/**
 * Options for {@link createVizelRelativeTimeTicker}.
 */
export interface VizelRelativeTimeTickerOptions {
  /** Returns the reference date. `null`/`undefined` is rendered as an empty string. */
  getDate: () => Date | null | undefined;
  /** Returns the active locale (optional, called per tick). */
  getLocale?: () => VizelLocale | undefined;
  /** Tick interval in milliseconds (default: 10000). */
  intervalMs?: number;
  /** Called with the formatted string on every tick (and once synchronously). */
  onTick: (text: string) => void;
}

/**
 * Returned by {@link createVizelRelativeTimeTicker}.
 *
 * Follows the canonical controller contract: `mount()` starts the
 * interval and emits once synchronously; `unmount()` clears the
 * interval. Both are idempotent.
 */
export interface VizelRelativeTimeTicker {
  /** Start ticking. Emits once synchronously, then on every `intervalMs`. */
  readonly mount: () => void;
  /** Stop ticking. Safe to call repeatedly. */
  readonly unmount: () => void;
}

/**
 * Build a relative-time interval ticker.
 *
 * The factory itself has no side effects. `mount()` calls `onTick`
 * synchronously with the current relative-time string, then on every
 * `intervalMs` boundary until `unmount()` clears the interval.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() => {
 *   const ticker = createVizelRelativeTimeTicker({
 *     getDate: () => date,
 *     onTick: setText,
 *   });
 *   ticker.mount();
 *   return () => ticker.unmount();
 * }, []);
 * ```
 */
export function createVizelRelativeTimeTicker(
  options: VizelRelativeTimeTickerOptions
): VizelRelativeTimeTicker {
  const { getDate, getLocale, intervalMs = 10000, onTick } = options;

  const emit = (): void => {
    const date = getDate();
    onTick(date ? formatVizelRelativeTime(date, getLocale?.()) : "");
  };

  const state: { intervalId: ReturnType<typeof setInterval> | null } = { intervalId: null };

  return {
    mount: (): void => {
      if (state.intervalId !== null) return;
      emit();
      state.intervalId = setInterval(emit, intervalMs);
    },
    unmount: (): void => {
      if (state.intervalId === null) return;
      clearInterval(state.intervalId);
      state.intervalId = null;
    },
  };
}
