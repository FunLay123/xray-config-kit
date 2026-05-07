import {
  fieldDefinitions,
  fieldFlags,
  getGeneratedOutboundFormMetadata,
  getGeneratedRoutingRuleFields,
  type XrayGeneratedFormField
} from "../adapters/xray/form-metadata.js";
import { getCapabilities } from "../adapters/xray/registry.js";
import { validateProfile } from "./validate.js";
import type {
  Inbound,
  InboundPort,
  Issue,
  JsonObject,
  Outbound,
  ProxyOutboundProtocol,
  Profile,
  RoutingBalancer,
  RoutingRule,
  Security,
  Transport,
  ValidateOptions
} from "./types.js";

const placeholderUuid = "00000000-0000-4000-8000-000000000000";
const placeholderKey32 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

type CreateDefaultInboundPortOption<Protocol extends Exclude<Inbound["protocol"], "unmanaged">> =
  Protocol extends "tun" ? { readonly port?: InboundPort } : { readonly port: InboundPort };

type CreateDefaultInboundBaseOptions<Protocol extends Exclude<Inbound["protocol"], "unmanaged">> = {
  readonly protocol: Protocol;
  readonly tag?: string;
  readonly listen?: string;
  readonly clientDefaults?: CreateDefaultInboundClientDefaults;
} & CreateDefaultInboundPortOption<Protocol>;

export type CreateDefaultInboundClientDefaults = "placeholder" | "empty";

export type CreateDefaultInboundOptions =
  | (CreateDefaultInboundBaseOptions<"vmess"> & {
      readonly transport?: Transport["type"];
      readonly security?: "none" | "tls";
    })
  | (CreateDefaultInboundBaseOptions<"vless"> & {
      readonly transport?: Transport["type"];
      readonly security?: Security["type"];
    })
  | (CreateDefaultInboundBaseOptions<"trojan"> & {
      readonly transport?: Transport["type"];
      readonly security?: Security["type"];
    })
  | (CreateDefaultInboundBaseOptions<"shadowsocks"> & {
      readonly transport?: Transport["type"];
      readonly security?: "none" | "tls";
    })
  | (CreateDefaultInboundBaseOptions<"hysteria"> & {
      readonly security?: "none" | "tls";
    })
  | CreateDefaultInboundBaseOptions<"http">
  | CreateDefaultInboundBaseOptions<"mixed">
  | CreateDefaultInboundBaseOptions<"socks">
  | CreateDefaultInboundBaseOptions<"dokodemo-door">
  | CreateDefaultInboundBaseOptions<"tunnel">
  | CreateDefaultInboundBaseOptions<"tun">
  | CreateDefaultInboundBaseOptions<"wireguard">;

type UnsafeCreateDefaultInboundOptions = CreateDefaultInboundBaseOptions<Exclude<Inbound["protocol"], "unmanaged">> & {
  readonly transport?: Transport["type"];
  readonly security?: Security["type"];
};

type CreateDefaultInboundOptionsFor<Protocol extends Exclude<Inbound["protocol"], "unmanaged">> =
  Extract<CreateDefaultInboundOptions, { readonly protocol: Protocol }>;

type ExactCreateDefaultInboundOptions<Options extends CreateDefaultInboundOptions> =
  Options & Record<Exclude<keyof Options, keyof CreateDefaultInboundOptionsFor<Options["protocol"]>>, never>;

type InboundForProtocol<Protocol extends Exclude<Inbound["protocol"], "unmanaged">> =
  Inbound extends infer Candidate
    ? Candidate extends { readonly protocol: infer CandidateProtocol }
      ? Protocol extends CandidateProtocol
        ? Candidate
        : never
      : never
    : never;

export type InboundFormCapabilities = {
  readonly protocols: Record<string, boolean>;
  readonly transports: Record<string, boolean>;
  readonly securities: Record<string, boolean>;
  readonly clientLinks: Record<string, boolean>;
};

export type InboundFieldVisibility = {
  readonly clients: boolean;
  readonly accounts: boolean;
  readonly wireguardPeers: boolean;
  readonly tun: boolean;
  readonly dokodemo: boolean;
  readonly stream: boolean;
  readonly tls: boolean;
  readonly reality: boolean;
  readonly shadowsocks: boolean;
  readonly sniffing: boolean;
  readonly advancedStream: boolean;
};

export type RoutingRuleFieldKey = string;

export type FormVersionOptions = {
  readonly xrayVersion?: string;
};

export type ProfileTagSource = Pick<Profile, "inbounds" | "outbounds" | "routing">;

export type RoutingRuleFormCapabilities = {
  readonly fields: Record<string, boolean>;
  readonly fieldDefinitions: Record<string, XrayGeneratedFormField>;
  readonly networks: Record<string, boolean>;
  readonly protocols: Record<string, boolean>;
  readonly inboundTags: string[];
  readonly outboundTags: string[];
  readonly balancerTags: string[];
};

export type RoutingRuleFormCapabilitiesOptions = FormVersionOptions & {
  readonly profile?: ProfileTagSource;
};

export type RoutingRuleFieldVisibility = Record<string, boolean>;

export type OutboundFormCapabilities = {
  readonly protocols: Record<string, boolean>;
  readonly protocolConfigs: Record<string, string>;
  readonly envelopeFields: Record<string, boolean>;
  readonly envelopeFieldDefinitions: Record<string, XrayGeneratedFormField>;
  readonly settingsFields: Record<string, Record<string, boolean>>;
  readonly settingsFieldDefinitions: Record<string, Record<string, XrayGeneratedFormField>>;
  readonly streamFields: Record<string, boolean>;
  readonly streamFieldDefinitions: Record<string, XrayGeneratedFormField>;
  readonly muxFields: Record<string, boolean>;
  readonly muxFieldDefinitions: Record<string, XrayGeneratedFormField>;
  readonly proxySettingsFields: Record<string, boolean>;
  readonly proxySettingsFieldDefinitions: Record<string, XrayGeneratedFormField>;
};

export type OutboundFieldVisibility = {
  readonly settings: boolean;
  readonly streamSettings: boolean;
  readonly mux: boolean;
  readonly proxySettings: boolean;
  readonly raw: boolean;
};

export type CreateDefaultRoutingRuleOptions = Omit<RoutingRule, "type"> & {
  readonly type?: "field";
};

export type CreateDefaultRoutingBalancerOptions = Partial<RoutingBalancer>;

export type CreateDefaultOutboundOptions = {
  readonly protocol: Exclude<Outbound["protocol"], "unmanaged"> | "direct" | "block";
  readonly tag?: string;
  readonly settings?: JsonObject;
  readonly streamSettings?: JsonObject;
  readonly mux?: JsonObject;
  readonly proxySettings?: JsonObject;
  readonly sendThrough?: string;
  readonly targetStrategy?: string;
};

function defaultTransport(type: Transport["type"] = "tcp"): Transport {
  if (type === "grpc") return { type: "grpc", serviceName: "" };
  if (type === "xhttp") return { type: "xhttp", path: "/", mode: "auto" };
  if (type === "ws") return { type: "ws", path: "/" };
  if (type === "httpupgrade") return { type: "httpupgrade", path: "/" };
  if (type === "kcp") return { type: "kcp" };
  if (type === "hysteria") return { type: "hysteria", version: 2, udpIdleTimeout: 60 };
  return { type: "tcp", header: { type: "none" } };
}

function defaultSecurity(type: Security["type"] = "none"): Security {
  if (type === "tls") return { type: "tls", serverName: "" };
  if (type === "reality") {
    return {
      type: "reality",
      serverNames: ["example.com"],
      privateKey: placeholderKey32,
      publicKey: placeholderKey32,
      shortIds: ["a1b2c3d4"],
      target: "example.com:443",
      fingerprint: "chrome",
      spiderX: "/"
    };
  }
  return { type: "none" };
}

function defaultNonRealitySecurity(type: "none" | "tls" = "none"): Extract<Security, { type: "none" | "tls" }> {
  if (type === "tls") return { type: "tls", serverName: "" };
  return { type: "none" };
}

function assertCreateDefaultInboundOptions(options: CreateDefaultInboundOptions): void {
  const unsafe = options as UnsafeCreateDefaultInboundOptions;
  const protocol = unsafe.protocol;
  const hasStreamSecurity = unsafe.security !== undefined;
  const hasTransport = unsafe.transport !== undefined;

  if (
    protocol === "http" ||
    protocol === "mixed" ||
    protocol === "socks" ||
    protocol === "dokodemo-door" ||
    protocol === "tunnel" ||
    protocol === "tun" ||
    protocol === "wireguard"
  ) {
    if (hasStreamSecurity) throw new TypeError(`${protocol} default inbound does not support stream security options.`);
    if (hasTransport) throw new TypeError(`${protocol} default inbound does not support transport options.`);
  }

  if (protocol === "vmess" && unsafe.security === "reality") {
    throw new TypeError("VMess default inbound supports only none or TLS security.");
  }

  if ((protocol === "shadowsocks" || protocol === "hysteria") && unsafe.security === "reality") {
    throw new TypeError(`${protocol} default inbound supports only none or TLS security.`);
  }

  if (protocol === "hysteria" && hasTransport) {
    throw new TypeError("Hysteria default inbound uses the hysteria transport and does not accept a transport option.");
  }

  if (protocol !== "tun" && unsafe.port === undefined) {
    throw new TypeError(`${protocol} default inbound requires a port.`);
  }
}

export function createDefaultInbound<const Options extends CreateDefaultInboundOptions>(
  options: ExactCreateDefaultInboundOptions<Options>
): InboundForProtocol<Options["protocol"]> {
  const typedOptions = options as CreateDefaultInboundOptions;
  assertCreateDefaultInboundOptions(typedOptions);

  const tag = typedOptions.tag ?? `${typedOptions.protocol}-inbound`;
  const port = typedOptions.port ?? 443;
  const listen = typedOptions.listen ?? "0.0.0.0";

  if (typedOptions.protocol === "vmess") {
    return {
      kind: "inbound",
      protocol: "vmess",
      tag,
      listen,
      port,
      clients: typedOptions.clientDefaults === "empty"
        ? []
        : [{ protocol: "vmess", id: placeholderUuid, security: "auto", email: "user" }],
      security: typedOptions.security === "tls" ? { type: "tls", serverName: "" } : { type: "none" },
      transport: defaultTransport(typedOptions.transport)
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "vless") {
    return {
      kind: "inbound",
      protocol: "vless",
      tag,
      listen,
      port,
      clients: typedOptions.clientDefaults === "empty"
        ? []
        : [{ protocol: "vless", id: placeholderUuid, email: "user" }],
      security: defaultSecurity(typedOptions.security),
      transport: defaultTransport(typedOptions.transport),
      decryption: "none"
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "trojan") {
    return {
      kind: "inbound",
      protocol: "trojan",
      tag,
      listen,
      port,
      clients: typedOptions.clientDefaults === "empty"
        ? []
        : [{ protocol: "trojan", password: "change-me-trojan-password", email: "user" }],
      security: defaultSecurity(typedOptions.security === "reality" ? "reality" : typedOptions.security ?? "tls"),
      transport: defaultTransport(typedOptions.transport)
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "shadowsocks") {
    const usesStreamSettings = typedOptions.security !== undefined || typedOptions.transport !== undefined;
    const useEmptyClients = typedOptions.clientDefaults === "empty";
    const inbound: Extract<Inbound, { protocol: "shadowsocks" }> = {
      kind: "inbound",
      protocol: "shadowsocks",
      tag,
      listen,
      port,
      method: useEmptyClients ? undefined : "2022-blake3-aes-256-gcm",
      password: useEmptyClients ? undefined : "change-me-server-password",
      network: "tcp,udp",
      clients: useEmptyClients ? [] : [{ protocol: "shadowsocks", password: "change-me-client-password", email: "user" }]
    };
    if (!usesStreamSettings) return inbound as InboundForProtocol<Options["protocol"]>;
    return {
      ...inbound,
      security: defaultNonRealitySecurity(typedOptions.security),
      transport: defaultTransport(typedOptions.transport)
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "hysteria") {
    return {
      kind: "inbound",
      protocol: "hysteria",
      tag,
      listen,
      port,
      version: 2,
      clients: typedOptions.clientDefaults === "empty"
        ? []
        : [{ protocol: "hysteria", auth: "change-me-hysteria-auth", email: "user" }],
      security: typedOptions.security === "none" ? { type: "none" } : { type: "tls", serverName: "" },
      transport: { type: "hysteria", version: 2, udpIdleTimeout: 60 }
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "http") {
    return {
      kind: "inbound",
      protocol: "http",
      tag,
      listen,
      port: typedOptions.port ?? 8080,
      accounts: [{ user: "user", pass: "change-me-http-password" }]
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "mixed" || typedOptions.protocol === "socks") {
    return {
      kind: "inbound",
      protocol: typedOptions.protocol,
      tag,
      listen,
      port: typedOptions.port ?? 1080,
      auth: "password",
      accounts: [{ user: "user", pass: "change-me-socks-password" }],
      udp: true,
      ip: "127.0.0.1"
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "dokodemo-door" || typedOptions.protocol === "tunnel") {
    return {
      kind: "inbound",
      protocol: typedOptions.protocol,
      tag,
      listen,
      port,
      address: "127.0.0.1",
      targetPort: typedOptions.port ?? 80,
      network: "tcp"
    } as InboundForProtocol<Options["protocol"]>;
  }

  if (typedOptions.protocol === "tun") {
    return {
      kind: "inbound",
      protocol: "tun",
      tag,
      listen,
      name: "xray0",
      mtu: 1500,
      gateway: ["198.18.0.1/15"],
      dns: ["1.1.1.1"],
      autoOutboundsInterface: "auto"
    } as InboundForProtocol<Options["protocol"]>;
  }

  return {
    kind: "inbound",
    protocol: "wireguard",
    tag,
    listen,
    port: typedOptions.port ?? 51820,
    secretKey: placeholderKey32,
    publicKey: placeholderKey32,
    address: ["10.0.0.1/24"],
    peers: [
      {
        publicKey: placeholderKey32,
        allowedIPs: ["10.0.0.2/32"],
        keepAlive: 25
      }
    ],
    mtu: 1420,
    noKernelTun: false
  } as InboundForProtocol<Options["protocol"]>;
}

export function getInboundFormCapabilities(options: { readonly xrayVersion?: string } = {}): InboundFormCapabilities {
  const capabilities = getCapabilities(options);
  return {
    protocols: Object.fromEntries(capabilities.protocols.map((item) => [item, true])),
    transports: Object.fromEntries(capabilities.transports.map((item) => [item, true])),
    securities: Object.fromEntries(capabilities.securities.map((item) => [item, true])),
    clientLinks: {
      vmess: capabilities.protocols.includes("vmess"),
      vless: capabilities.protocols.includes("vless"),
      trojan: capabilities.protocols.includes("trojan"),
      shadowsocks: capabilities.protocols.includes("shadowsocks"),
      hysteria: false,
      wireguard: capabilities.protocols.includes("wireguard")
    }
  };
}

export function getInboundFieldVisibility(draft: Inbound, _capabilities: InboundFormCapabilities = getInboundFormCapabilities()): InboundFieldVisibility {
  const stream = draft.protocol === "vmess" || draft.protocol === "vless" || draft.protocol === "trojan" || draft.protocol === "shadowsocks" || draft.protocol === "hysteria";
  const security = "security" in draft ? draft.security : undefined;
  return {
    clients: "clients" in draft,
    accounts: draft.protocol === "http" || draft.protocol === "mixed" || draft.protocol === "socks",
    wireguardPeers: draft.protocol === "wireguard",
    tun: draft.protocol === "tun",
    dokodemo: draft.protocol === "dokodemo-door" || draft.protocol === "tunnel",
    stream,
    tls: security?.type === "tls",
    reality: security?.type === "reality",
    shadowsocks: draft.protocol === "shadowsocks",
    sniffing: draft.protocol !== "wireguard",
    advancedStream: stream
  };
}

function uniqueStrings(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))];
}

function resolveRoutingCapabilityInput(input?: ProfileTagSource | RoutingRuleFormCapabilitiesOptions): RoutingRuleFormCapabilitiesOptions {
  if (!input) return {};
  if ("profile" in input || "xrayVersion" in input) return input as RoutingRuleFormCapabilitiesOptions;
  return { profile: input as ProfileTagSource };
}

export function createDefaultRoutingRule(options: CreateDefaultRoutingRuleOptions = {}): RoutingRule {
  const rule: RoutingRule = {
    type: "field",
    ...options
  };
  if (rule.outboundTag === undefined && rule.balancerTag === undefined) {
    return { ...rule, outboundTag: "direct" };
  }
  return rule;
}

export function createDefaultRoutingBalancer(options: CreateDefaultRoutingBalancerOptions = {}): RoutingBalancer {
  return {
    tag: options.tag ?? "balanced",
    selector: options.selector ?? ["proxy-"],
    strategy: options.strategy,
    fallbackTag: options.fallbackTag
  };
}

export function getRoutingRuleFormCapabilities(input?: ProfileTagSource | RoutingRuleFormCapabilitiesOptions): RoutingRuleFormCapabilities {
  const options = resolveRoutingCapabilityInput(input);
  const fields = getGeneratedRoutingRuleFields(options);
  const profile = options.profile;
  return {
    fields: fieldFlags(fields),
    fieldDefinitions: fieldDefinitions(fields),
    networks: {
      tcp: true,
      udp: true,
      unix: true,
      "tcp,udp": true
    },
    protocols: {
      http: true,
      tls: true,
      bittorrent: true
    },
    inboundTags: uniqueStrings(profile?.inbounds?.map((inbound) => inbound.tag) ?? []),
    outboundTags: uniqueStrings(profile?.outbounds?.map((outbound) => outbound.tag) ?? []),
    balancerTags: uniqueStrings(profile?.routing?.balancers?.map((balancer) => balancer.tag) ?? [])
  };
}

export function getRoutingRuleFieldVisibility(_draft: RoutingRule, capabilities: RoutingRuleFormCapabilities = getRoutingRuleFormCapabilities()): RoutingRuleFieldVisibility {
  return capabilities.fields;
}

export function createDefaultOutbound(options: CreateDefaultOutboundOptions): Exclude<Outbound, { protocol: "unmanaged" }> {
  const protocol = options.protocol === "direct"
    ? "freedom"
    : options.protocol === "block"
      ? "blackhole"
      : options.protocol;
  const tag = options.tag ?? (protocol === "freedom" ? "direct" : protocol === "blackhole" ? "block" : `${protocol}-outbound`);
  const envelope = {
    sendThrough: options.sendThrough,
    streamSettings: options.streamSettings,
    proxySettings: options.proxySettings,
    mux: options.mux,
    targetStrategy: options.targetStrategy
  };

  if (protocol === "freedom") {
    return {
      protocol,
      tag,
      settings: options.settings as Extract<Outbound, { protocol: "freedom" }>["settings"],
      ...envelope
    };
  }

  if (protocol === "blackhole") {
    return {
      protocol,
      tag,
      settings: options.settings as Extract<Outbound, { protocol: "blackhole" }>["settings"],
      ...envelope
    };
  }

  if (protocol === "dns") {
    return {
      protocol,
      tag,
      settings: options.settings as Extract<Outbound, { protocol: "dns" }>["settings"],
      ...envelope
    };
  }

  return {
    protocol: protocol as ProxyOutboundProtocol,
    tag,
    settings: options.settings ?? {},
    ...envelope
  };
}

export function getOutboundFormCapabilities(options: FormVersionOptions = {}): OutboundFormCapabilities {
  const metadata = getGeneratedOutboundFormMetadata(options);
  return {
    protocols: Object.fromEntries(metadata.protocols.map((entry) => [entry.protocol, true])),
    protocolConfigs: Object.fromEntries(metadata.protocols.map((entry) => [entry.protocol, entry.config])),
    envelopeFields: fieldFlags(metadata.envelopeFields),
    envelopeFieldDefinitions: fieldDefinitions(metadata.envelopeFields),
    settingsFields: Object.fromEntries(Object.entries(metadata.settingsFieldsByProtocol).map(([protocol, fields]) => [
      protocol,
      fieldFlags(fields)
    ])),
    settingsFieldDefinitions: Object.fromEntries(Object.entries(metadata.settingsFieldsByProtocol).map(([protocol, fields]) => [
      protocol,
      fieldDefinitions(fields)
    ])),
    streamFields: fieldFlags(metadata.streamFields),
    streamFieldDefinitions: fieldDefinitions(metadata.streamFields),
    muxFields: fieldFlags(metadata.muxFields),
    muxFieldDefinitions: fieldDefinitions(metadata.muxFields),
    proxySettingsFields: fieldFlags(metadata.proxySettingsFields),
    proxySettingsFieldDefinitions: fieldDefinitions(metadata.proxySettingsFields)
  };
}

export function getOutboundFieldVisibility(draft: Outbound, capabilities: OutboundFormCapabilities = getOutboundFormCapabilities()): OutboundFieldVisibility {
  if (draft.protocol === "unmanaged") {
    return {
      settings: false,
      streamSettings: false,
      mux: false,
      proxySettings: false,
      raw: true
    };
  }

  return {
    settings: Object.keys(capabilities.settingsFields[draft.protocol] ?? {}).length > 0 || "settings" in draft,
    streamSettings: capabilities.envelopeFields.streamSettings === true,
    mux: capabilities.envelopeFields.mux === true,
    proxySettings: capabilities.envelopeFields.proxySettings === true,
    raw: true
  };
}

export function validateInboundDraft(draft: Inbound, options: ValidateOptions = {}): Issue[] {
  return validateProfile({
    schemaVersion: "xck.v1",
    inbounds: [draft]
  }, options).issues.map((issue) => ({
    ...issue,
    path: issue.path.replace(/^\/inbounds\/0/, "")
  }));
}

export function validateRoutingRuleDraft(draft: RoutingRule, options: ValidateOptions = {}): Issue[] {
  return validateProfile({
    schemaVersion: "xck.v1",
    inbounds: [],
    routing: {
      rules: [draft]
    }
  }, options).issues.map((issue) => ({
    ...issue,
    path: issue.path.replace(/^\/routing\/rules\/0/, "")
  }));
}

export function validateOutboundDraft(draft: Outbound, options: ValidateOptions = {}): Issue[] {
  return validateProfile({
    schemaVersion: "xck.v1",
    inbounds: [],
    outbounds: [draft]
  }, options).issues.map((issue) => ({
    ...issue,
    path: issue.path.replace(/^\/outbounds\/0/, "")
  }));
}
