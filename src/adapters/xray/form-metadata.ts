import { getXrayParityRelease, type XrayParityLoaderEntry, type XrayParityStructField } from "../../xray-json/parity.js";

export type XrayGeneratedFormField = XrayParityStructField;

export type XrayOutboundFormMetadata = {
  readonly protocols: readonly XrayParityLoaderEntry[];
  readonly envelopeFields: readonly XrayGeneratedFormField[];
  readonly streamFields: readonly XrayGeneratedFormField[];
  readonly muxFields: readonly XrayGeneratedFormField[];
  readonly proxySettingsFields: readonly XrayGeneratedFormField[];
  readonly settingsFieldsByProtocol: Readonly<Record<string, readonly XrayGeneratedFormField[]>>;
};

type VersionOptions = {
  readonly xrayVersion?: string;
};

function uniqueFields(fields: readonly XrayGeneratedFormField[]): XrayGeneratedFormField[] {
  const seen = new Set<string>();
  const output: XrayGeneratedFormField[] = [];
  for (const field of fields) {
    if (seen.has(field.json)) continue;
    seen.add(field.json);
    output.push(field);
  }
  return output;
}

function structFields(structs: Readonly<Record<string, readonly XrayGeneratedFormField[]>>, name: string): readonly XrayGeneratedFormField[] {
  return structs[name] ?? [];
}

export function fieldFlags(fields: readonly XrayGeneratedFormField[]): Record<string, boolean> {
  return Object.fromEntries(fields.map((field) => [field.json, true]));
}

export function fieldDefinitions(fields: readonly XrayGeneratedFormField[]): Record<string, XrayGeneratedFormField> {
  return Object.fromEntries(fields.map((field) => [field.json, field]));
}

export function getGeneratedRoutingRuleFields(options: VersionOptions = {}): readonly XrayGeneratedFormField[] {
  const release = getXrayParityRelease(options);
  return uniqueFields([
    ...structFields(release.structs, "RouterRule"),
    ...structFields(release.structs, "RawFieldRule"),
    { json: "type", go: "Type", type: "string" }
  ]);
}

export function getGeneratedOutboundFormMetadata(options: VersionOptions = {}): XrayOutboundFormMetadata {
  const release = getXrayParityRelease(options);
  const settingsFieldsByProtocol = Object.fromEntries(release.outboundProtocols.map((entry) => [
    entry.protocol,
    structFields(release.structs, entry.config)
  ]));

  return {
    protocols: release.outboundProtocols,
    envelopeFields: structFields(release.structs, "OutboundDetourConfig"),
    streamFields: release.streamFields,
    muxFields: structFields(release.structs, "MuxConfig"),
    proxySettingsFields: structFields(release.structs, "ProxyConfig"),
    settingsFieldsByProtocol
  };
}
