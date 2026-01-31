/**
 * Utility for lazy-loading optional dependencies.
 *
 * Creates a loader function that dynamically imports a module on first use,
 * caches the result, and provides clear error messages when the dependency
 * is not installed.
 */

/**
 * Creates a lazy loader for an optional dependency.
 * Caches the loaded module to avoid repeated dynamic imports.
 *
 * @param moduleName - The npm package name (used in error messages)
 * @param importFn - A function that performs the dynamic import
 * @returns A function that returns a Promise of the loaded module
 *
 * @example
 * ```ts
 * const loadMermaid = createLazyLoader("mermaid", async () => {
 *   const mod = await import("mermaid");
 *   return mod.default;
 * });
 *
 * // Later, when needed:
 * const mermaid = await loadMermaid();
 * ```
 */
export function createLazyLoader<T>(
  moduleName: string,
  importFn: () => Promise<T>
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return () => {
    if (cached) return Promise.resolve(cached);
    if (loading) return loading;

    loading = importFn().then(
      (mod) => {
        cached = mod;
        loading = null;
        return mod;
      },
      (error) => {
        loading = null;
        throw new Error(
          `[Vizel] Failed to load "${moduleName}". ` +
            `Please install it: npm install ${moduleName}\n` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    );

    return loading;
  };
}
