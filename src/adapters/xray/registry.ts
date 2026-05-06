import type { XrayAdapter, XrayCapabilities } from "./types.js";
import { buildCapabilitySummary, type CapabilitySummary } from "./capabilities.js";
import { createXrayAdapter, xray265Adapter } from "./versions/xray-26-5.js";

const adapters: readonly XrayAdapter[] = [
  createXrayAdapter("25.10.0"),
  xray265Adapter
];

export function getXrayAdapter(version?: string): XrayAdapter {
  return createXrayAdapter(version);
}

export function getCapabilities(options: { readonly xrayVersion?: string } = {}): XrayCapabilities {
  return getXrayAdapter(options.xrayVersion).capabilities;
}

export function getCapabilitySummary(options: { readonly xrayVersion?: string } = {}): CapabilitySummary {
  return buildCapabilitySummary(getCapabilities(options));
}

export const compatibilityMatrix = xray265Adapter.capabilities.compatibilityMatrix;

export const registeredXrayAdapters = adapters;
