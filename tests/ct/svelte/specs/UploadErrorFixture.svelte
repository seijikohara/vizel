<script lang="ts">
import { isVizelError, type VizelError, validateVizelPlugin } from "@vizel/core";
import { createVizelEditor, VizelEditor, VizelProvider } from "@vizel/svelte";

let errorCode = $state("");

/**
 * Record the `VizelError.code` raised when `validateVizelPlugin` rejects a
 * malformed plugin, exercising the `throw new Error` -> `VizelError` conversion.
 */
function readPluginErrorCode(): string {
  try {
    validateVizelPlugin({ name: "", version: "1.0.0" });
    return "";
  } catch (error) {
    return isVizelError(error) ? error.code : "NOT_A_VIZEL_ERROR";
  }
}

const pluginErrorCode = readPluginErrorCode();

const editor = createVizelEditor({
  features: {
    content: {
      image: {
        onUpload: () => Promise.reject(new Error("network down")),
      },
    },
  },
  onError: (error: VizelError) => {
    errorCode = error.code;
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <div data-error-code>{errorCode}</div>
  <div data-plugin-error-code>{pluginErrorCode}</div>
</VizelProvider>
