export { compatibilityMatrix, getCapabilities, getCapabilitySummary, getXrayAdapter, registeredXrayAdapters } from "./registry.js";
export { latestXrayAdapter, latestXrayCapabilities } from "./dynamic.js";
export { buildCapabilitySummary, capabilitySummary } from "./capabilities.js";
export { fieldDefinitions, fieldFlags, getGeneratedOutboundFormMetadata, getGeneratedRoutingRuleFields } from "./form-metadata.js";
export type { CompatibilityMatrix, FeatureSupport, XrayAdapter, XrayCapabilities, XrayFeature } from "./types.js";
export type { CapabilityFlagMap, CapabilitySummary } from "./capabilities.js";
export type { XrayGeneratedFormField, XrayOutboundFormMetadata } from "./form-metadata.js";
