/**
 * Generic type guard utilities for runtime type checking.
 *
 * These guards provide safe alternatives to type assertions (`as` casts)
 * and are designed to be composable for building domain-specific guards.
 */

/**
 * Check if a value is a non-null object (excludes arrays).
 *
 * @param value - The value to check
 * @returns True if value is a plain object
 *
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   // value is Record<string, unknown>
 *   console.log(value.someKey);
 * }
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if an object has an own property that is a function.
 *
 * Note: Uses Object.hasOwn to check for own properties only,
 * excluding inherited properties from the prototype chain.
 *
 * @param obj - The object to check
 * @param key - The property key to check
 * @returns True if the own property exists and is a function
 *
 * @example
 * ```typescript
 * if (hasFunction(storage, "characters")) {
 *   // storage.characters is callable
 *   storage.characters();
 * }
 * ```
 */
export function hasFunction<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, (...args: unknown[]) => unknown> {
  return isRecord(obj) && Object.hasOwn(obj, key) && typeof obj[key] === "function";
}

/**
 * Check if a value is a string (including empty strings).
 *
 * @param value - The value to check
 * @returns True if value is a string
 *
 * @example
 * ```typescript
 * const language = isString(attrs?.language) ? attrs.language : undefined;
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if a value is a string or undefined.
 *
 * @param value - The value to check
 * @returns True if value is a string or undefined
 */
export function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}
