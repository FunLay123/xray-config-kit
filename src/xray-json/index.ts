import type { JsonObject, JsonValue, XrayConfig } from "../core/types.js";

export type {
  JsonObject,
  JsonValue,
  XrayConfig
} from "../core/types.js";

export type XrayTopLevelKey =
  | "log"
  | "dns"
  | "routing"
  | "inbounds"
  | "outbounds"
  | "policy"
  | "api"
  | "stats"
  | "metrics"
  | "fakeDns"
  | "observatory"
  | "burstObservatory"
  | "reverse"
  | "transport"
  | "geodata"
  | "version";

export const knownXrayTopLevelKeys: readonly XrayTopLevelKey[] = [
  "log",
  "dns",
  "routing",
  "inbounds",
  "outbounds",
  "policy",
  "api",
  "stats",
  "metrics",
  "fakeDns",
  "observatory",
  "burstObservatory",
  "reverse",
  "transport",
  "geodata",
  "version"
];

export function isXrayConfig(value: JsonValue): value is XrayConfig {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asXrayConfig(value: JsonObject): XrayConfig {
  return value as XrayConfig;
}

export {
  getXrayParityRelease,
  getXrayParityReleases,
  validateStrictXrayConfig,
  xrayParityManifest
} from "./parity.js";
export type {
  StrictXrayValidationOptions,
  StrictXrayValidationResult,
  XrayParityLoaderEntry,
  XrayParityRelease,
  XrayParityStructField
} from "./parity.js";
