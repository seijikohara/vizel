// Visual snapshot fixture stylesheet. The package alias points
// `@vizel/react` at the workspace source tree, but the styles ship
// from the built `dist/` only — pull the SCSS source directly so
// snapshots reflect the same tokens consumers would receive.
import "@vizel/core/styles/index.scss";
