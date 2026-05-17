/**
 * Error codes for Vizel operations.
 *
 * Codes group into four categories:
 *
 * - **Configuration** — developer mistakes; surface by `throw`.
 * - **Input** — runtime data issues; surface via `options.onError`.
 * - **Runtime** — transient failures; surface via `options.onError`.
 * - **Collaboration** — collab-specific transport / sync failures.
 *
 * `UNKNOWN_ERROR` is the fallback used by {@link wrapAsVizelError} when
 * no specific code is supplied.
 */
export type VizelErrorCode =
  // Configuration errors (developer mistakes — thrown at boundary).
  | "INVALID_CONFIG"
  | "INVALID_EXTENSION"
  | "MISSING_CONTEXT"
  | "INVALID_LOCALE"
  | "SSR_NOT_SUPPORTED"
  | "MISSING_OPTIONAL_DEP"
  // Input errors (runtime data issues — emitted via onError).
  | "INVALID_MARKDOWN"
  | "INVALID_JSON_CONTENT"
  | "INVALID_URL"
  | "MARKDOWN_LOSSY"
  // Runtime errors (transient failures — emitted via onError).
  | "UPLOAD_FAILED"
  | "EMBED_LOAD_FAILED"
  | "CLIPBOARD_FAILED"
  // Collaboration errors.
  | "COLLAB_DISCONNECTED"
  | "COLLAB_SYNC_FAILED"
  // Fallback for `wrapAsVizelError` when no code is supplied.
  | "UNKNOWN_ERROR";

/**
 * Severity of a {@link VizelError}.
 *
 * - `"error"` — the default. Renders via `console.error` when no
 *   `onError` is set.
 * - `"warning"` — for non-fatal advisories (e.g. `MARKDOWN_LOSSY`).
 *   Stays silent if no `onError` is set.
 */
export type VizelErrorSeverity = "error" | "warning";

/**
 * Options accepted by the {@link VizelError} constructor.
 */
export interface VizelErrorOptions {
  /** Severity (default: `"error"`). */
  severity?: VizelErrorSeverity;
  /** Free-form structured context attached to the error. */
  context?: Record<string, unknown>;
  /** Underlying cause, forwarded to `Error`'s `cause`. */
  cause?: unknown;
}

/**
 * Structured error class for Vizel operations.
 *
 * Extends `Error` so callers get stack traces and `instanceof` checks.
 * The `originalError` field is retained as an alias for `cause` to keep
 * pre-v2.0.0 consumer code compiling.
 */
export class VizelError extends Error {
  readonly code: VizelErrorCode;
  readonly severity: VizelErrorSeverity;
  readonly context?: Record<string, unknown>;
  /**
   * Alias for `Error.cause`. Retained for source compatibility with
   * pre-v2.0.0 consumers that read `err.originalError`.
   */
  readonly originalError?: unknown;

  constructor(code: VizelErrorCode, message: string, options?: VizelErrorOptions) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "VizelError";
    this.code = code;
    this.severity = options?.severity ?? "error";
    if (options?.context !== undefined) {
      this.context = options.context;
    }
    if (options?.cause !== undefined) {
      this.originalError = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VizelError);
    }
  }
}

/**
 * Create a {@link VizelError} instance. Convenience wrapper around `new VizelError(...)`.
 *
 * @param code - The error code.
 * @param message - Human-readable error message.
 * @param options - Optional severity / context / cause.
 */
export function createVizelError(
  code: VizelErrorCode,
  message: string,
  options?: VizelErrorOptions
): VizelError {
  return new VizelError(code, message, options);
}

/**
 * Type guard to check if a value is a VizelError.
 *
 * Uses both instanceof check and structural check for robustness
 * across multiple bundles or different realms.
 *
 * @param value - The value to check
 * @returns True if the value is a VizelError
 *
 * @example
 * ```typescript
 * try {
 *   await initEditor();
 * } catch (e) {
 *   if (isVizelError(e)) {
 *     handleVizelError(e);
 *   } else {
 *     throw e;
 *   }
 * }
 * ```
 */
export function isVizelError(value: unknown): value is VizelError {
  // Fast path: instanceof check
  if (value instanceof VizelError) {
    return true;
  }
  // Structural check for cross-realm or multiple bundle scenarios
  if (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "code" in value &&
    "message" in value &&
    (value as { name: unknown }).name === "VizelError" &&
    typeof (value as { code: unknown }).code === "string" &&
    typeof (value as { message: unknown }).message === "string"
  ) {
    return true;
  }
  return false;
}

/**
 * Options for wrapping an unknown error as a VizelError.
 */
export interface WrapAsVizelErrorOptions {
  /**
   * Optional context to include in the message prefix.
   */
  context?: string;
  /**
   * Error code to use. Defaults to "UNKNOWN_ERROR".
   */
  code?: VizelErrorCode;
}

/**
 * Wrap an unknown error as a VizelError.
 *
 * If the error is already a VizelError, returns it unchanged (the code and
 * context options are not applied). Otherwise, creates a new VizelError with
 * the specified code (or UNKNOWN_ERROR).
 *
 * @param error - The error to wrap
 * @param contextOrOptions - Optional context string or options object
 * @returns A VizelError instance (the original if already a VizelError)
 *
 * @example
 * ```typescript
 * // With context string
 * const vizelError = wrapAsVizelError(e, "During initialization");
 *
 * // With options object
 * const vizelError = wrapAsVizelError(e, {
 *   context: "During initialization",
 *   code: "INVALID_CONFIG",
 * });
 * ```
 */
export function wrapAsVizelError(
  error: unknown,
  contextOrOptions?: string | WrapAsVizelErrorOptions
): VizelError {
  if (isVizelError(error)) {
    return error;
  }

  const options: WrapAsVizelErrorOptions =
    typeof contextOrOptions === "string" ? { context: contextOrOptions } : (contextOrOptions ?? {});

  const { context, code = "UNKNOWN_ERROR" } = options;
  const prefix = context ? `${context}: ` : "";

  if (error instanceof Error) {
    return createVizelError(code, `${prefix}${error.message}`, { cause: error });
  }

  // Include string representation of non-Error values for better logging
  const errorMessage =
    error === null || error === undefined
      ? "An unknown error occurred"
      : `An unknown error occurred: ${String(error)}`;

  return createVizelError(code, `${prefix}${errorMessage}`, { cause: error });
}

/**
 * Emit a {@link VizelError} through the consumer-supplied `onError`
 * callback, falling back to `console.error` when no callback is set
 * and the severity is `"error"`. Warnings without a callback stay
 * silent.
 *
 * This is the only function inside `packages/core/src/` that calls
 * `console`; Biome's `noConsole` rule enforces this.
 *
 * @param err - The error to emit.
 * @param onError - Optional consumer callback.
 */
export function emitVizelError(
  err: VizelError,
  onError: ((err: VizelError) => void) | undefined
): void {
  if (onError) {
    onError(err);
    return;
  }
  if (err.severity === "error") {
    // biome-ignore lint/suspicious/noConsole: emitVizelError is the single sanctioned console site inside packages/core/src/.
    console.error(err);
  }
}
