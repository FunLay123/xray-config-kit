import type { Inbound, Issue, Profile, Transport } from "../../../core/types.js";
import type { CompatibilityMatrix, FeatureSupport, XrayAdapter, XrayCapabilities } from "../types.js";

type ParsedVersion = {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
};

const latestTestedVersion = "26.5.3";

const baseProtocols = [
  "vmess",
  "vless",
  "trojan",
  "shadowsocks",
  "http",
  "mixed",
  "socks",
  "dokodemo-door",
  "tunnel",
  "wireguard",
  "hysteria",
  "tun",
  "freedom",
  "blackhole",
  "dns",
  "loopback"
] as const;

const baseTransports = [
  "tcp",
  "grpc",
  "xhttp",
  "ws",
  "httpupgrade",
  "kcp",
  "hysteria"
] as const;

function parseVersion(version: string | undefined): ParsedVersion {
  const match = version?.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return { major: 26, minor: 5, patch: 3 };
  return {
    major: Number(match[1] ?? 0),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0)
  };
}

function compareVersion(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function gte(version: ParsedVersion, minimum: string): boolean {
  return compareVersion(version, parseVersion(minimum)) >= 0;
}

function lt(version: ParsedVersion, maximum: string): boolean {
  return compareVersion(version, parseVersion(maximum)) < 0;
}

function adapterId(version: ParsedVersion): string {
  if (version.major === 26 && version.minor >= 5) return "xray@26.5";
  return `xray@${version.major}.${version.minor}`;
}

function versionRange(version: ParsedVersion): string {
  return `>=${version.major}.${version.minor}.0 <${version.major}.${version.minor + 1}.0`;
}

function support(input: FeatureSupport): FeatureSupport {
  return input;
}

function buildMatrix(version: ParsedVersion): CompatibilityMatrix {
  const modernRemoved = gte(version, "26.5.0");
  const hysteriaSupported = gte(version, "25.10.0");
  const finalmaskSupported = gte(version, "25.10.0");
  return {
    vmess: support({ supported: true, deprecated: true, replacement: "VLESS encryption" }),
    vless: support({ supported: true }),
    trojan: support({ supported: true, deprecated: true, replacement: "VLESS with flow and seed" }),
    shadowsocks: support({ supported: true, deprecated: true, replacement: "VLESS encryption" }),
    http: support({ supported: true }),
    mixed: support({ supported: true }),
    socks: support({ supported: true }),
    "dokodemo-door": support({ supported: true }),
    tunnel: support({ supported: true }),
    wireguard: support({ supported: true }),
    hysteria: support(hysteriaSupported
      ? { supported: true, introduced: "25.10.0" }
      : { supported: false, introduced: "25.10.0" }),
    tun: support({ supported: true }),
    freedom: support({ supported: true }),
    blackhole: support({ supported: true }),
    dns: support({ supported: true }),
    loopback: support({ supported: true }),
    reality: support({ supported: true }),
    tls: support({ supported: true }),
    tcp: support({ supported: true }),
    grpc: support({ supported: true, deprecated: true, replacement: "XHTTP stream-up H2" }),
    xhttp: support({ supported: true }),
    httpupgrade: support({ supported: true, deprecated: true, replacement: "XHTTP H2/H3" }),
    websocket: support({ supported: true, deprecated: true, replacement: "XHTTP H2/H3" }),
    mkcp: support({ supported: true }),
    quic: support(modernRemoved
      ? { supported: false, removed: "26.5.0", replacement: "XHTTP stream-one H3" }
      : { supported: true, deprecated: true, replacement: "XHTTP stream-one H3" }),
    "http-transport": support(modernRemoved
      ? { supported: false, removed: "26.5.0", replacement: "XHTTP stream-one H2/H3" }
      : { supported: true, deprecated: true, replacement: "XHTTP stream-one H2/H3" }),
    routing: support({ supported: true }),
    finalmask: support(finalmaskSupported
      ? { supported: true, introduced: "25.10.0" }
      : { supported: false, introduced: "25.10.0" }),
    metrics: support({ supported: true }),
    api: support({ supported: true }),
    stats: support({ supported: true })
  };
}

function buildCapabilities(versionInput?: string): XrayCapabilities {
  const version = parseVersion(versionInput);
  const matrix = buildMatrix(version);
  const protocols = baseProtocols.filter((item) => matrix[item]?.supported);
  const transports: string[] = baseTransports.filter((item) => matrix[item === "ws" ? "websocket" : item === "kcp" ? "mkcp" : item]?.supported);
  if (lt(version, "26.5.0")) {
    transports.push("quic", "http");
  }

  return {
    adapterId: adapterId(version),
    xrayVersionRange: versionRange(version),
    latestTestedVersion,
    protocols,
    transports,
    securities: ["none", "tls", "reality"],
    fingerprints: [
      "chrome",
      "firefox",
      "safari",
      "ios",
      "android",
      "edge",
      "360",
      "qq",
      "random",
      "randomized",
      "randomizednoalpn",
      "unsafe"
    ],
    alpn: ["h3", "h2", "http/1.1"],
    removedFeatures: [
      { feature: "global transport", replacement: "per-inbound/outbound streamSettings" },
      { feature: "legacy XTLS", replacement: "xtls-rprx-vision with TLS or REALITY" },
      ...(gte(version, "26.5.0") ? [
        { feature: "http transport", replacement: "XHTTP stream-one H2/H3" },
        { feature: "quic transport", replacement: "XHTTP stream-one H3" },
        { feature: "mkcp header/seed", replacement: "finalmask UDP masks" }
      ] : []),
      { feature: "trojan flow", replacement: "VLESS flow" },
      { feature: "verifyPeerCertInNames", replacement: "verifyPeerCertByName" }
    ],
    deprecatedFeatures: [
      { feature: "allowInsecure", replacement: "pinnedPeerCertSha256 and verifyPeerCertByName", removalDate: "2026-06-01" },
      { feature: "gRPC transport", replacement: "XHTTP stream-up H2" },
      { feature: "WebSocket transport", replacement: "XHTTP H2/H3" },
      { feature: "HTTPUpgrade transport", replacement: "XHTTP H2/H3" },
      { feature: "VMess", replacement: "VLESS encryption" },
      { feature: "Trojan", replacement: "VLESS with flow and seed" },
      { feature: "Shadowsocks", replacement: "VLESS encryption" }
    ],
    compatibilityMatrix: matrix
  };
}

function issue(adapter: XrayAdapter, input: Omit<Issue, "adapterId">): Issue {
  return { ...input, adapterId: adapter.id };
}

function transportFeature(transport: Transport): string {
  if (transport.type === "ws") return "websocket";
  if (transport.type === "kcp") return "mkcp";
  return transport.type;
}

function validateFeature(adapter: XrayAdapter, feature: string, path: string, label: string): Issue[] {
  const support = adapter.capabilities.compatibilityMatrix[feature];
  if (!support?.supported) {
    return [issue(adapter, {
      code: "XCK_COMPAT_FEATURE_UNSUPPORTED",
      severity: "error",
      category: "compatibility",
      path,
      message: `${label} is not supported by ${adapter.id}.`,
      suggestion: support?.replacement
    })];
  }
  if (support.deprecated) {
    return [issue(adapter, {
      code: "XCK_COMPAT_FEATURE_DEPRECATED",
      severity: "warning",
      category: "compatibility",
      path,
      message: `${label} is deprecated or discouraged in ${adapter.id}.`,
      suggestion: support.replacement
    })];
  }
  return [];
}

function validateInbound(adapter: XrayAdapter, inbound: Inbound, index: number): Issue[] {
  if (inbound.protocol === "unmanaged") return [];
  const path = `/inbounds/${index}`;
  const issues: Issue[] = [
    ...validateFeature(adapter, inbound.protocol, `${path}/protocol`, `Inbound protocol "${inbound.protocol}"`)
  ];

  if (inbound.protocol === "shadowsocks") {
    issues.push(issue(adapter, {
      code: "XCK_COMPAT_SHADOWSOCKS_DEPRECATED",
      severity: "warning",
      category: "compatibility",
      path,
      message: "Shadowsocks is supported but Xray-core warns that VLESS encryption is preferred."
    }));
    if (!inbound.transport) return issues;
  }

  if (inbound.protocol === "http" || inbound.protocol === "mixed" || inbound.protocol === "socks" || inbound.protocol === "wireguard" || inbound.protocol === "dokodemo-door" || inbound.protocol === "tunnel" || inbound.protocol === "tun") {
    return issues;
  }

  if (!("transport" in inbound) || !inbound.transport) return issues;
  const transport = inbound.transport;
  const security = "security" in inbound ? inbound.security : undefined;
  const feature = transportFeature(transport);
  issues.push(...validateFeature(adapter, feature, `${path}/transport/type`, `Transport "${transport.type}"`));

  if ((inbound.protocol === "vless" || inbound.protocol === "trojan") && security?.type === "reality") {
    if (!["tcp", "grpc", "xhttp"].includes(transport.type)) {
      issues.push(issue(adapter, {
        code: "XCK_COMPAT_REALITY_TRANSPORT",
        severity: "error",
        category: "compatibility",
        path: `${path}/security`,
        message: "REALITY is only supported on RAW/TCP, XHTTP, and gRPC in this Xray adapter.",
        suggestion: "Use transport.type \"tcp\", \"xhttp\", or \"grpc\"."
      }));
    }
  }

  if (inbound.protocol === "hysteria" && security?.type === "reality") {
    issues.push(issue(adapter, {
      code: "XCK_COMPAT_HYSTERIA_REALITY",
      severity: "error",
      category: "compatibility",
      path: `${path}/security`,
      message: "Hysteria transport uses TLS-oriented QUIC and does not support REALITY."
    }));
  }

  if (inbound.protocol === "vmess") {
    issues.push(issue(adapter, {
      code: "XCK_COMPAT_VMESS_DEPRECATED",
      severity: "warning",
      category: "compatibility",
      path,
      message: "VMess is supported but Xray-core warns that VLESS encryption is preferred."
    }));
  }

  if (inbound.protocol === "trojan") {
    issues.push(issue(adapter, {
      code: "XCK_COMPAT_TROJAN_DEPRECATED",
      severity: "warning",
      category: "compatibility",
      path,
      message: "Trojan is supported but Xray-core warns that VLESS with flow/seed is preferred."
    }));
  }

  if (security?.type === "tls" && security.allowInsecure) {
    issues.push(issue(adapter, {
      code: "XCK_COMPAT_ALLOW_INSECURE_DEPRECATED",
      severity: "warning",
      category: "compatibility",
      path: `${path}/security/allowInsecure`,
      message: "\"allowInsecure\" is scheduled for removal in Xray-core after 2026-06-01.",
      suggestion: "Use pinnedPeerCertSha256 and verifyPeerCertByName instead."
    }));
  }

  return issues;
}

export function createXrayAdapter(versionInput?: string): XrayAdapter {
  const capabilities = buildCapabilities(versionInput);
  const adapter: XrayAdapter = {
    id: capabilities.adapterId,
    versionRange: capabilities.xrayVersionRange,
    latestTestedVersion: capabilities.latestTestedVersion,
    capabilities,
    validateCompatibility(profile: Profile): Issue[] {
      return profile.inbounds.flatMap((inbound, index) => validateInbound(adapter, inbound, index));
    }
  };
  return adapter;
}

export const xray265Adapter = createXrayAdapter(latestTestedVersion);
export const xray265Capabilities = xray265Adapter.capabilities;
