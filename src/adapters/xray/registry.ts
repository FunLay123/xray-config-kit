import type { XrayAdapter, XrayCapabilities } from "./types.js";
import { buildCapabilitySummary, type CapabilitySummary } from "./capabilities.js";
import { xray265Adapter } from "./versions/xray-26-5.js";

const adapters: readonly XrayAdapter[] = [xray265Adapter];

function parseVersion(version: string | undefined): readonly [number, number, number] {
  if (!version) return [26, 5, 3];
  const match = version.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return [26, 5, 3];
  return [
    Number(match[1] ?? 0),
    Number(match[2] ?? 0),
    Number(match[3] ?? 0)
  ];
}

export function getXrayAdapter(version?: string): XrayAdapter {
  const [major, minor] = parseVersion(version);
  if (major === 26 && minor >= 5) return xray265Adapter;
  return xray265Adapter;
}

export function getCapabilities(options: { readonly xrayVersion?: string } = {}): XrayCapabilities {
  return getXrayAdapter(options.xrayVersion).capabilities;
}

export function getCapabilitySummary(options: { readonly xrayVersion?: string } = {}): CapabilitySummary {
  return buildCapabilitySummary(getCapabilities(options));
}

export const compatibilityMatrix = xray265Adapter.capabilities.compatibilityMatrix;

export const registeredXrayAdapters = adapters;
