/**
 * Error codes for Vizel operations.
 *
 * @example
 * ```typescript
 * import { type VizelErrorCode, createVizelError } from '@vizel/core';
 *
 * const error = createVizelError(
 *   "EDITOR_INIT_FAILED",
 *   "Failed to initialize editor"
 * );
 * ```
 */
export type VizelErrorCode =
  | "EDITOR_INIT_FAILED"
  | "EXTENSION_LOAD_FAILED"
  | "IMAGE_UPLOAD_FAILED"
  | "IMAGE_VALIDATION_FAILED"
  | "MARKDOWN_PARSE_FAILED"
  | "UNKNOWN_ERROR";

/**
 * Structured error class for Vizel operations.
 *
 * Extends Error to provide stack traces and instanceof checks.
 *
 * @example
 * ```typescript
 * import { VizelError, isVizelError } from '@vizel/core';
 *
 * try {
 *   // ... editor operations
 * } catch (e) {
 *   if (isVizelError(e)) {
 *     console.error(`Vizel error [${e.code}]: ${e.message}`);
 *   }
 * }
 * ```
 */
export class VizelError extends Error {
  /**
   * The error code identifying the type of error.
   */
  readonly code: VizelErrorCode;

  /**
   * The original error that caused this error, if any.
   */
  readonly originalError?: unknown;

  constructor(code: VizelErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = "VizelError";
    this.code = code;
    this.originalError = originalError;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VizelError);
    }
  }
}

/**
 * Create a VizelError instance.
 *
 * @param code - The error code
 * @param message - Human-readable error message
 * @param originalError - The original error that caused this error
 * @returns A new VizelError instance
 *
 * @example
 * ```typescript
 * const error = createVizelError(
 *   "IMAGE_UPLOAD_FAILED",
 *   "Failed to upload image: network error",
 *   originalError
 * );
 * ```
 */
export function createVizelError(
  code: VizelErrorCode,
  message: string,
  originalError?: unknown
): VizelError {
  return new VizelError(code, message, originalError);
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
 *   code: "EDITOR_INIT_FAILED",
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
    return createVizelError(code, `${prefix}${error.message}`, error);
  }

  // Include string representation of non-Error values for better logging
  const errorMessage =
    error === null || error === undefined
      ? "An unknown error occurred"
      : `An unknown error occurred: ${String(error)}`;

  return createVizelError(code, `${prefix}${errorMessage}`, error);
}
