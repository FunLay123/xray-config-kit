import { getCapabilities } from "../adapters/xray/registry.js";
import { validateProfile } from "./validate.js";
import type { Inbound, Issue, Security, Transport, ValidateOptions } from "./types.js";

const placeholderUuid = "00000000-0000-4000-8000-000000000000";
const placeholderKey32 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type CreateDefaultInboundOptions = {
  readonly protocol: Exclude<Inbound["protocol"], "unmanaged">;
  readonly tag?: string;
  readonly port?: number;
  readonly listen?: string;
  readonly transport?: Transport["type"];
  readonly security?: Security["type"];
};

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
  readonly stream: boolean;
  readonly tls: boolean;
  readonly reality: boolean;
  readonly shadowsocks: boolean;
  readonly sniffing: boolean;
  readonly advancedStream: boolean;
};

function defaultTransport(type: Transport["type"] = "tcp"): Transport {
  if (type === "grpc") return { type: "grpc", serviceName: "" };
  if (type === "xhttp") return { type: "xhttp", path: "/", mode: "auto" };
  if (type === "ws") return { type: "ws", path: "/" };
  if (type === "httpupgrade") return { type: "httpupgrade", path: "/" };
  if (type === "kcp") return { type: "kcp" };
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

export function createDefaultInbound(options: CreateDefaultInboundOptions): Inbound {
  const tag = options.tag ?? `${options.protocol}-inbound`;
  const port = options.port ?? 443;
  const listen = options.listen ?? "";

  if (options.protocol === "vmess") {
    return {
      kind: "inbound",
      protocol: "vmess",
      tag,
      listen,
      port,
      clients: [{ protocol: "vmess", id: placeholderUuid, security: "auto", email: "user" }],
      security: options.security === "tls" ? { type: "tls", serverName: "" } : { type: "none" },
      transport: defaultTransport(options.transport)
    };
  }

  if (options.protocol === "vless") {
    return {
      kind: "inbound",
      protocol: "vless",
      tag,
      listen,
      port,
      clients: [{ protocol: "vless", id: placeholderUuid, email: "user" }],
      security: defaultSecurity(options.security),
      transport: defaultTransport(options.transport),
      decryption: "none"
    };
  }

  if (options.protocol === "trojan") {
    return {
      kind: "inbound",
      protocol: "trojan",
      tag,
      listen,
      port,
      clients: [{ protocol: "trojan", password: "change-me-trojan-password", email: "user" }],
      security: defaultSecurity(options.security === "reality" ? "reality" : options.security ?? "tls"),
      transport: defaultTransport(options.transport)
    };
  }

  if (options.protocol === "shadowsocks") {
    return {
      kind: "inbound",
      protocol: "shadowsocks",
      tag,
      listen,
      port,
      method: "2022-blake3-aes-256-gcm",
      password: "change-me-server-password",
      network: "tcp,udp",
      clients: [{ protocol: "shadowsocks", password: "change-me-client-password", email: "user" }]
    };
  }

  if (options.protocol === "http") {
    return {
      kind: "inbound",
      protocol: "http",
      tag,
      listen: "127.0.0.1",
      port: options.port ?? 8080,
      accounts: [{ user: "user", pass: "change-me-http-password" }]
    };
  }

  if (options.protocol === "mixed") {
    return {
      kind: "inbound",
      protocol: "mixed",
      tag,
      listen: "127.0.0.1",
      port: options.port ?? 1080,
      auth: "password",
      accounts: [{ user: "user", pass: "change-me-socks-password" }],
      udp: true,
      ip: "127.0.0.1"
    };
  }

  return {
    kind: "inbound",
    protocol: "wireguard",
    tag,
    listen,
    port: options.port ?? 51820,
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
  };
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
      wireguard: capabilities.protocols.includes("wireguard")
    }
  };
}

export function getInboundFieldVisibility(draft: Inbound, _capabilities: InboundFormCapabilities = getInboundFormCapabilities()): InboundFieldVisibility {
  const stream = draft.protocol === "vmess" || draft.protocol === "vless" || draft.protocol === "trojan" || draft.protocol === "shadowsocks";
  const security = "security" in draft ? draft.security : undefined;
  return {
    clients: "clients" in draft,
    accounts: draft.protocol === "http" || draft.protocol === "mixed",
    wireguardPeers: draft.protocol === "wireguard",
    stream,
    tls: security?.type === "tls",
    reality: security?.type === "reality",
    shadowsocks: draft.protocol === "shadowsocks",
    sniffing: draft.protocol !== "wireguard",
    advancedStream: stream
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
