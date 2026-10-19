/**
 * Return whether a value is a non-null, non-array object. Type guards built
 * on this check read fields as `unknown` instead of asserting the value to a
 * record type.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
