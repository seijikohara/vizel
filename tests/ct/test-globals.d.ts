// Globals that component-test fixtures publish so scenarios can reach the
// editor instance and command registries in the browser without
// `page.evaluate`. This declaration file has no imports or exports, so the
// interface merges into the global `Window` and fixtures and scenarios need
// no `window` type assertions.
interface Window {
  vizelTestEditor?: unknown;
  vizelBlockOperationCommands?: unknown;
}
