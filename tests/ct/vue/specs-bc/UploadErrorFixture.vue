<script setup lang="ts">
import { isVizelError, type VizelError, validateVizelPlugin } from "@vizel/core";
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/vue";
import { ref } from "vue";

const errorCode = ref("");

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

const editor = useVizelEditor({
  features: {
    content: {
      image: {
        onUpload: () => Promise.reject(new Error("network down")),
      },
    },
  },
  onError: (error: VizelError) => {
    errorCode.value = error.code;
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <div data-error-code>{{ errorCode }}</div>
    <div data-plugin-error-code>{{ pluginErrorCode }}</div>
  </VizelProvider>
</template>
