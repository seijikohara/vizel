/**
 * Generate a short, time-ordered unique identifier.
 *
 * Combine the current millisecond timestamp with a random base-36 suffix.
 * The comment and version-history features key their entries with it;
 * uniqueness within a single client session is sufficient.
 */
export function generateVizelId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
