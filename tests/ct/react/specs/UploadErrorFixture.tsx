import { isVizelError, type VizelError, validateVizelPlugin } from "@vizel/core";
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/react";
import { useState } from "react";

/**
 * Record the `VizelError.code` raised when `validateVizelPlugin` rejects a
 * malformed plugin. The validation runs in the browser bundle so the raw
 * `throw new Error` -> `VizelError("INVALID_CONFIG")` conversion is exercised.
 */
function readPluginErrorCode(): string {
  try {
    validateVizelPlugin({ name: "", version: "1.0.0" });
    return "";
  } catch (error) {
    return isVizelError(error) ? error.code : "NOT_A_VIZEL_ERROR";
  }
}

/**
 * Fixture proving an image-upload rejection reaches the editor-level
 * `onError`. The upload handler always rejects; `onError` records the
 * resulting `VizelError` code into `[data-error-code]`.
 */
export function UploadErrorFixture() {
  const [errorCode, setErrorCode] = useState("");
  const pluginErrorCode = readPluginErrorCode();

  const editor = useVizelEditor({
    features: {
      content: {
        image: {
          onUpload: () => Promise.reject(new Error("network down")),
        },
      },
    },
    onError: (error: VizelError) => {
      setErrorCode(error.code);
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <div data-error-code>{errorCode}</div>
      <div data-plugin-error-code>{pluginErrorCode}</div>
    </VizelProvider>
  );
}
