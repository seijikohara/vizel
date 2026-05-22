<script lang="ts">
import { getVizelThemeSafe } from "@vizel/svelte";

const THEME_STORAGE_KEY = "vizel-theme";

type ThemeMode = "light" | "dark" | "system";

function readStoredThemeMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

interface Props {
  /** Triggered when the user picks "system" so the provider remounts. */
  onResetToSystem?: () => void;
}

let { onResetToSystem }: Props = $props();

const themeApi = getVizelThemeSafe();
let storedMode = $state<ThemeMode>(readStoredThemeMode());

function pickLight(): void {
  themeApi?.setTheme("light");
  storedMode = "light";
}

function pickDark(): void {
  themeApi?.setTheme("dark");
  storedMode = "dark";
}

function pickSystem(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
  storedMode = "system";
  onResetToSystem?.();
}
</script>

<fieldset class="theme-toggle-group" aria-label="Theme">
  <button
    type="button"
    class="theme-toggle-option"
    data-active={storedMode === "light"}
    aria-label="Light mode"
    title="Light"
    onclick={pickLight}
  >
    ☀
  </button>
  <button
    type="button"
    class="theme-toggle-option"
    data-active={storedMode === "dark"}
    aria-label="Dark mode"
    title="Dark"
    onclick={pickDark}
  >
    ☾
  </button>
  <button
    type="button"
    class="theme-toggle-option"
    data-active={storedMode === "system"}
    aria-label={`System (currently ${themeApi?.current ?? "light"})`}
    title="System"
    onclick={pickSystem}
  >
    ⎙
  </button>
</fieldset>
