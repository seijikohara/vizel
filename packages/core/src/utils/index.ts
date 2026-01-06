// Editor helpers
export {
  type ContentNode,
  type CreateUploadEventHandlerOptions,
  convertCodeBlocksToDiagrams,
  convertMermaidCodeBlocksToDiagrams,
  createUploadEventHandler,
  defaultEditorProps,
  getEditorState,
  type ResolveFeaturesOptions,
  registerUploadEventHandler,
  resolveFeatures,
  transformDiagramCodeBlocks,
  transformMermaidToDiagram,
  VIZEL_UPLOAD_IMAGE_EVENT,
} from "./editorHelpers.ts";

// Portal utilities
export {
  createPortalElement,
  getPortalContainer,
  hasPortalContainer,
  type MountPortalOptions,
  mountToPortal,
  PORTAL_Z_INDEX,
  type PortalLayer,
  removePortalContainer,
  unmountFromPortal,
  VIZEL_PORTAL_ID,
} from "./portal.ts";
