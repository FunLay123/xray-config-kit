export type JsonPrimitive = null | boolean | number | string;

export type JsonObject = {
  readonly [key: string]: JsonValue | undefined;
};

export type JsonArray = readonly JsonValue[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type XrayPortList = number | string;

export type InboundPort = XrayPortList;

export type RawPatch = {
  readonly op: "add" | "replace" | "remove";
  readonly path: `/${string}`;
  readonly value?: JsonValue;
  readonly unsafe?: boolean;
};

export type UnknownPreservation = {
  readonly source: "import" | "rawOverride";
  readonly pointers: Record<string, JsonValue>;
};

export type IssueSeverity = "error" | "warning" | "info";

export type IssueCategory =
  | "schema"
  | "semantic"
  | "compatibility"
  | "security"
  | "import"
  | "raw"
  | "suggestion";

export type Issue = {
  readonly code: string;
  readonly severity: IssueSeverity;
  readonly category: IssueCategory;
  readonly path: string;
  readonly message: string;
  readonly suggestion?: string;
  readonly adapterId?: string;
};

export type ValidationMode = "strict" | "permissive";

export type Fingerprint =
  | "chrome"
  | "firefox"
  | "safari"
  | "ios"
  | "android"
  | "edge"
  | "360"
  | "qq"
  | "random"
  | "randomized"
  | "randomizednoalpn"
  | "unsafe";

export type Alpn = "h2" | "h3" | "http/1.1";

export type ShadowsocksMethod =
  | "aes-128-gcm"
  | "aes-256-gcm"
  | "chacha20-poly1305"
  | "chacha20-ietf-poly1305"
  | "xchacha20-poly1305"
  | "xchacha20-ietf-poly1305"
  | "2022-blake3-aes-128-gcm"
  | "2022-blake3-aes-256-gcm";

export type VmessSecurity = "auto" | "aes-128-gcm" | "chacha20-poly1305" | "none" | "zero";

export type ClientMetadata = Record<string, JsonValue>;

export type VmessClient = {
  readonly protocol: "vmess";
  readonly id: string;
  readonly security?: VmessSecurity;
  readonly email?: string;
  readonly level?: number;
  readonly enabled?: boolean;
  readonly meta?: ClientMetadata;
};

export type VlessClient = {
  readonly protocol: "vless";
  readonly id: string;
  readonly email?: string;
  readonly flow?: "xtls-rprx-vision";
  readonly level?: number;
  readonly enabled?: boolean;
  readonly meta?: ClientMetadata;
};

export type TrojanClient = {
  readonly protocol: "trojan";
  readonly password: string;
  readonly email?: string;
  readonly level?: number;
  readonly enabled?: boolean;
  readonly meta?: ClientMetadata;
};

export type ShadowsocksClient = {
  readonly protocol: "shadowsocks";
  readonly password: string;
  readonly method?: ShadowsocksMethod;
  readonly email?: string;
  readonly level?: number;
  readonly enabled?: boolean;
  readonly meta?: ClientMetadata;
};

export type HysteriaClient = {
  readonly protocol: "hysteria";
  readonly auth: string;
  readonly email?: string;
  readonly level?: number;
  readonly enabled?: boolean;
  readonly meta?: ClientMetadata;
};

export type Client = VmessClient | VlessClient | TrojanClient | ShadowsocksClient | HysteriaClient;

export type NoneSecurity = {
  readonly type: "none";
};

export type TlsSecurity = {
  readonly type: "tls";
  readonly serverName?: string;
  readonly alpn?: Alpn[];
  readonly fingerprint?: Fingerprint;
  readonly allowInsecure?: boolean;
  readonly enableSessionResumption?: boolean;
  readonly disableSystemRoot?: boolean;
  readonly minVersion?: string;
  readonly maxVersion?: string;
  readonly cipherSuites?: string;
  readonly rejectUnknownSni?: boolean;
  readonly curvePreferences?: string[];
  readonly masterKeyLog?: string;
  readonly pinnedPeerCertSha256?: string;
  readonly verifyPeerCertByName?: string[];
  readonly echServerKeys?: string;
  readonly echConfigList?: string;
  readonly echForceQuery?: "none" | "half" | "full";
  readonly echSockopt?: JsonObject;
  readonly certificates?: TlsCertificate[];
};

export type TlsCertificate = {
  readonly certificateFile?: string;
  readonly keyFile?: string;
  readonly certificate?: string[];
  readonly key?: string[];
  readonly usage?: "encipherment" | "verify" | "issue";
  readonly ocspStapling?: number;
  readonly oneTimeLoading?: boolean;
  readonly buildChain?: boolean;
};

export type RealitySecurity = {
  readonly type: "reality";
  readonly serverNames: string[];
  readonly privateKey: string;
  readonly publicKey?: string;
  readonly shortIds: string[];
  readonly target: string | number;
  readonly spiderX?: string;
  readonly fingerprint?: Exclude<Fingerprint, "unsafe">;
  readonly mldsa65Seed?: string;
  readonly mldsa65Verify?: string;
  readonly maxTimeDiff?: number;
  readonly show?: boolean;
};

export type Security = NoneSecurity | TlsSecurity | RealitySecurity;

export type HttpHeader = {
  readonly version?: "1.0" | "1.1" | "2.0" | "3.0";
  readonly method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH" | "TRACE" | "CONNECT";
  readonly path?: string[];
  readonly headers?: Record<string, string[]>;
};

export type TcpTransport = {
  readonly type: "tcp";
  readonly acceptProxyProtocol?: boolean;
  readonly header?: {
    readonly type: "none" | "http";
    readonly request?: HttpHeader;
    readonly response?: Omit<HttpHeader, "method" | "path"> & {
      readonly status?: string;
      readonly reason?: string;
    };
  };
};

export type GrpcTransport = {
  readonly type: "grpc";
  readonly serviceName: string;
  readonly authority?: string;
  readonly multiMode?: boolean;
  readonly idleTimeout?: number;
  readonly healthCheckTimeout?: number;
  readonly permitWithoutStream?: boolean;
  readonly initialWindowsSize?: number;
  readonly userAgent?: string;
};

export type IntRange = number | `${number}` | `${number}-${number}`;

export type XHttpExtra = {
  readonly headers?: Record<string, string>;
  readonly scMaxBufferedPosts?: IntRange;
  readonly scMaxEachPostBytes?: IntRange;
  readonly scMinPostsIntervalMs?: IntRange;
  readonly scStreamUpServerSecs?: IntRange;
  readonly noSSEHeader?: boolean;
  readonly xPaddingBytes?: IntRange;
  readonly xPaddingObfsMode?: boolean;
  readonly xPaddingKey?: string;
  readonly xPaddingHeader?: string;
  readonly xPaddingPlacement?: "cookie" | "header" | "query" | "queryInHeader";
  readonly xPaddingMethod?: "repeat-x" | "tokenish";
  readonly uplinkHTTPMethod?: string;
  readonly sessionPlacement?: "path" | "cookie" | "header" | "query";
  readonly sessionKey?: string;
  readonly seqPlacement?: "path" | "cookie" | "header" | "query";
  readonly seqKey?: string;
  readonly uplinkDataPlacement?: "body" | "cookie" | "header";
  readonly uplinkDataKey?: string;
  readonly uplinkChunkSize?: IntRange;
  readonly noGRPCHeader?: boolean;
  readonly xmux?: Record<string, JsonValue>;
  readonly unknown?: Record<string, JsonValue>;
};

export type XHttpTransport = {
  readonly type: "xhttp";
  readonly path?: string;
  readonly host?: string;
  readonly mode?: "auto" | "packet-up" | "stream-up" | "stream-one";
  readonly extra?: XHttpExtra;
};

export type WebSocketTransport = {
  readonly type: "ws";
  readonly path?: string;
  readonly host?: string;
  readonly headers?: Record<string, string>;
  readonly acceptProxyProtocol?: boolean;
  readonly heartbeatPeriod?: number;
};

export type HttpUpgradeTransport = {
  readonly type: "httpupgrade";
  readonly path?: string;
  readonly host?: string;
  readonly headers?: Record<string, string>;
  readonly acceptProxyProtocol?: boolean;
};

export type KcpTransport = {
  readonly type: "kcp";
  readonly mtu?: number;
  readonly tti?: number;
  readonly uplinkCapacity?: number;
  readonly downlinkCapacity?: number;
  readonly cwndMultiplier?: number;
  readonly maxSendingWindow?: number;
};

export type HysteriaMasquerade = {
  readonly type?: string;
  readonly dir?: string;
  readonly url?: string;
  readonly rewriteHost?: boolean;
  readonly insecure?: boolean;
  readonly content?: string;
  readonly headers?: Record<string, string>;
  readonly statusCode?: number;
};

export type UdpHop = {
  readonly ports?: string | string[];
  readonly interval?: IntRange;
};

export type QuicParams = {
  readonly congestion?: "brutal" | "reno" | "bbr" | "force-brutal";
  readonly debug?: boolean;
  readonly bbrProfile?: "conservative" | "standard" | "aggressive";
  readonly brutalUp?: string;
  readonly brutalDown?: string;
  readonly udpHop?: UdpHop;
  readonly initStreamReceiveWindow?: number;
  readonly maxStreamReceiveWindow?: number;
  readonly initConnectionReceiveWindow?: number;
  readonly maxConnectionReceiveWindow?: number;
  readonly maxIdleTimeout?: number;
  readonly keepAlivePeriod?: number;
  readonly disablePathMTUDiscovery?: boolean;
  readonly maxIncomingStreams?: number;
};

export type HysteriaTransport = {
  readonly type: "hysteria";
  readonly version: 2;
  readonly auth?: string;
  readonly udpIdleTimeout?: number;
  readonly masquerade?: HysteriaMasquerade;
};

export type Transport =
  | TcpTransport
  | GrpcTransport
  | XHttpTransport
  | WebSocketTransport
  | HttpUpgradeTransport
  | KcpTransport
  | HysteriaTransport;

export type Sniffing = {
  readonly enabled: boolean;
  readonly destOverride?: ("http" | "tls" | "quic" | "fakedns")[];
  readonly domainsExcluded?: string[];
  readonly ipsExcluded?: string[];
  readonly metadataOnly?: boolean;
  readonly routeOnly?: boolean;
};

export type StreamAdvanced = {
  readonly sockopt?: JsonObject;
  readonly finalmask?: JsonObject;
  readonly quicParams?: QuicParams;
  readonly patches?: RawPatch[];
};

export type BaseInbound = {
  readonly kind: "inbound";
  readonly tag: string;
  readonly listen?: string;
  readonly port: InboundPort;
  readonly sniffing?: Sniffing;
  readonly streamAdvanced?: StreamAdvanced;
  readonly raw?: RawPatch[];
};

export type VmessInbound = BaseInbound & {
  readonly protocol: "vmess";
  readonly clients: VmessClient[];
  readonly security: TlsSecurity | NoneSecurity;
  readonly transport: Transport;
  readonly defaultLevel?: number;
};

export type VlessInbound = BaseInbound & {
  readonly protocol: "vless";
  readonly clients: VlessClient[];
  readonly security: Security;
  readonly transport: Transport;
  readonly decryption?: "none" | string;
  readonly encryption?: "none" | string;
  readonly fallbacks?: Fallback[];
};

export type TrojanInbound = BaseInbound & {
  readonly protocol: "trojan";
  readonly clients: TrojanClient[];
  readonly security: Security;
  readonly transport: Transport;
  readonly fallbacks?: Fallback[];
};

export type ShadowsocksInbound = BaseInbound & {
  readonly protocol: "shadowsocks";
  readonly method?: ShadowsocksMethod;
  readonly password?: string;
  readonly network?: string | string[];
  readonly clients: ShadowsocksClient[];
  readonly security?: TlsSecurity | NoneSecurity;
  readonly transport?: Transport;
};

export type HttpAccount = {
  readonly user: string;
  readonly pass: string;
};

export type HttpInbound = BaseInbound & {
  readonly protocol: "http";
  readonly accounts?: HttpAccount[];
  readonly allowTransparent?: boolean;
  readonly userLevel?: number;
};

export type MixedAccount = {
  readonly user: string;
  readonly pass: string;
};

export type MixedInbound = BaseInbound & {
  readonly protocol: "mixed";
  readonly auth?: "noauth" | "password";
  readonly accounts?: MixedAccount[];
  readonly udp?: boolean;
  readonly ip?: string;
  readonly userLevel?: number;
};

export type SocksInbound = BaseInbound & {
  readonly protocol: "socks";
  readonly auth?: "noauth" | "password";
  readonly accounts?: MixedAccount[];
  readonly udp?: boolean;
  readonly ip?: string;
  readonly userLevel?: number;
};

export type WireGuardPeer = {
  readonly publicKey: string;
  readonly preSharedKey?: string;
  readonly allowedIPs: string[];
  readonly keepAlive?: number;
  readonly endpoint?: string;
  readonly meta?: ClientMetadata;
};

export type WireGuardInbound = BaseInbound & {
  readonly protocol: "wireguard";
  readonly secretKey: string;
  readonly publicKey?: string;
  readonly peers: WireGuardPeer[];
  readonly address?: string[];
  readonly mtu?: number;
  readonly workers?: number;
  readonly reserved?: number[] | string;
  readonly domainStrategy?: "forceip" | "forceipv4" | "forceipv6" | "forceipv4v6" | "forceipv6v4";
  readonly noKernelTun?: boolean;
};

export type HysteriaInbound = BaseInbound & {
  readonly protocol: "hysteria";
  readonly version: 2;
  readonly clients: HysteriaClient[];
  readonly security: TlsSecurity | NoneSecurity;
  readonly transport: HysteriaTransport;
};

export type DokodemoInbound = BaseInbound & {
  readonly protocol: "dokodemo-door" | "tunnel";
  readonly address?: string;
  readonly targetPort?: number;
  readonly network?: string | string[];
  readonly followRedirect?: boolean;
  readonly userLevel?: number;
};

export type TunInbound = {
  readonly kind: "inbound";
  readonly protocol: "tun";
  readonly tag: string;
  readonly listen?: string;
  readonly sniffing?: Sniffing;
  readonly name?: string;
  readonly mtu?: number;
  readonly gateway?: string[];
  readonly dns?: string[];
  readonly userLevel?: number;
  readonly autoSystemRoutingTable?: string[];
  readonly autoOutboundsInterface?: string;
  readonly raw?: RawPatch[];
};

export type UnmanagedInbound = {
  readonly kind: "inbound";
  readonly protocol: "unmanaged";
  readonly tag?: string;
  readonly editable: false;
  readonly raw: JsonObject;
};

export type Inbound =
  | VmessInbound
  | VlessInbound
  | TrojanInbound
  | ShadowsocksInbound
  | HttpInbound
  | MixedInbound
  | SocksInbound
  | WireGuardInbound
  | HysteriaInbound
  | DokodemoInbound
  | TunInbound
  | UnmanagedInbound;

export type Fallback = {
  readonly name?: string;
  readonly alpn?: string;
  readonly path?: string;
  readonly dest: string | number;
  readonly type?: "tcp" | "unix" | "serve";
  readonly xver?: 0 | 1 | 2;
};

export type RoutingRule = {
  readonly type?: "field";
  readonly ruleTag?: string;
  readonly inboundTag?: string[];
  readonly outboundTag?: string;
  readonly balancerTag?: string;
  readonly domain?: string[];
  readonly domains?: string[];
  readonly ip?: string[];
  readonly port?: XrayPortList;
  readonly sourceIP?: string[];
  readonly source?: string[];
  readonly sourcePort?: XrayPortList;
  readonly user?: string[];
  readonly vlessRoute?: XrayPortList;
  readonly protocol?: string[];
  readonly network?: string | string[];
  readonly attrs?: Record<string, string>;
  readonly localIP?: string[];
  readonly localPort?: XrayPortList;
  readonly process?: string[];
  readonly webhook?: RoutingWebhook;
};

export type RoutingWebhook = {
  readonly url: string;
  readonly deduplication?: number;
  readonly headers?: Record<string, string>;
};

export type RoutingBalancerStrategy = {
  readonly type?: "random" | "leastload" | "leastping" | "roundrobin" | string;
  readonly settings?: JsonObject;
};

export type RoutingBalancer = {
  readonly tag: string;
  readonly selector: string[];
  readonly strategy?: RoutingBalancerStrategy;
  readonly fallbackTag?: string;
};

export type Routing = {
  readonly domainStrategy?: "AsIs" | "IPIfNonMatch" | "IPOnDemand";
  readonly rules: RoutingRule[];
  readonly balancers?: RoutingBalancer[];
};

export type NameServer = {
  readonly address: string;
  readonly port?: number;
  readonly domains?: string[];
  readonly expectedIPs?: string[];
  readonly skipFallback?: boolean;
  readonly queryStrategy?: "UseIP" | "UseIPv4" | "UseIPv6";
  readonly tag?: string;
};

export type Dns = {
  readonly servers: (string | NameServer)[];
  readonly hosts?: Record<string, string | string[]>;
  readonly queryStrategy?: "UseIP" | "UseIPv4" | "UseIPv6";
  readonly disableCache?: boolean;
  readonly disableFallback?: boolean;
};

export type FreedomOutboundSettings = JsonObject & {
  readonly domainStrategy?: "AsIs" | "UseIP" | "UseIPv4" | "UseIPv6" | "ForceIP" | "ForceIPv4" | "ForceIPv6";
  readonly targetStrategy?: "AsIs" | "UseIP" | "UseIPv4" | "UseIPv6" | "ForceIP" | "ForceIPv4" | "ForceIPv6" | string;
  readonly redirect?: string;
};

export type BlackholeOutboundSettings = JsonObject & {
  readonly response?: { readonly type: "none" | "http" };
};

export type DnsOutboundSettings = JsonObject & {
  readonly network?: "tcp" | "udp" | string;
};

export type FreedomOutbound = {
  readonly protocol: "freedom";
  readonly tag: string;
  readonly sendThrough?: string;
  readonly settings?: FreedomOutboundSettings;
  readonly streamSettings?: JsonObject;
  readonly proxySettings?: JsonObject;
  readonly mux?: JsonObject;
  readonly targetStrategy?: string;
};

export type BlackholeOutbound = {
  readonly protocol: "blackhole";
  readonly tag: string;
  readonly sendThrough?: string;
  readonly settings?: BlackholeOutboundSettings;
  readonly streamSettings?: JsonObject;
  readonly proxySettings?: JsonObject;
  readonly mux?: JsonObject;
  readonly targetStrategy?: string;
};

export type DnsOutbound = {
  readonly protocol: "dns";
  readonly tag: string;
  readonly sendThrough?: string;
  readonly settings?: DnsOutboundSettings;
  readonly streamSettings?: JsonObject;
  readonly proxySettings?: JsonObject;
  readonly mux?: JsonObject;
  readonly targetStrategy?: string;
};

export type ProxyOutboundProtocol =
  | "http"
  | "socks"
  | "shadowsocks"
  | "vless"
  | "vmess"
  | "trojan"
  | "hysteria"
  | "wireguard"
  | "loopback";

export type ProxyOutbound = {
  readonly protocol: ProxyOutboundProtocol;
  readonly tag: string;
  readonly sendThrough?: string;
  readonly settings?: JsonObject;
  readonly streamSettings?: JsonObject;
  readonly proxySettings?: JsonObject;
  readonly mux?: JsonObject;
  readonly targetStrategy?: string;
  readonly raw?: RawPatch[];
};

export type UnmanagedOutbound = {
  readonly protocol: "unmanaged";
  readonly tag?: string;
  readonly editable: false;
  readonly raw: JsonObject;
};

export type Outbound = FreedomOutbound | BlackholeOutbound | DnsOutbound | ProxyOutbound | UnmanagedOutbound;

export type Profile = {
  readonly schemaVersion: "xck.v1";
  readonly name?: string;
  readonly inbounds: Inbound[];
  readonly outbounds?: Outbound[];
  readonly routing?: Routing;
  readonly dns?: Dns;
  readonly log?: JsonObject;
  readonly raw?: {
    readonly topLevel?: Record<string, JsonValue>;
    readonly patches?: RawPatch[];
  };
  readonly unknown?: UnknownPreservation;
};

export type CreateProfileInput = Omit<Partial<Profile>, "schemaVersion"> & {
  readonly schemaVersion?: "xck.v1";
  readonly presets?: string[];
  readonly inbounds?: Inbound[];
  readonly includeDefaultPolicy?: boolean;
};

export type XrayConfig = JsonObject & {
  readonly inbounds?: JsonObject[];
  readonly outbounds?: JsonObject[];
  readonly routing?: JsonObject;
};

export type BuildOptions = {
  readonly xrayVersion?: string;
  readonly mode?: ValidationMode;
  readonly preserveUnknown?: boolean;
  readonly allowUnsafeRaw?: boolean;
};

export type BuildResult = {
  readonly config: XrayConfig;
  readonly normalized: Profile;
  readonly issues: Issue[];
  readonly adapterId: string;
};

export type ValidateOptions = {
  readonly xrayVersion?: string;
  readonly mode?: ValidationMode;
  readonly allowUnsafeRaw?: boolean;
};

export type ValidationResult = {
  readonly ok: boolean;
  readonly profile?: Profile;
  readonly issues: Issue[];
  readonly adapterId: string;
};

export type AnalyzeOptions = ValidateOptions & {
  readonly audits?: ("security" | "compatibility" | "suggestions")[];
};

export type ImportOptions = {
  readonly xrayVersion?: string;
  readonly mode?: ValidationMode;
};

export type ImportResult = {
  readonly profile: Profile;
  readonly issues: Issue[];
  readonly editable: number;
  readonly unmanaged: number;
};

export type DiffEntry = {
  readonly op: "added" | "removed" | "changed";
  readonly path: string;
  readonly before?: JsonValue;
  readonly after?: JsonValue;
};

export type ExplainEntry = {
  readonly path: string;
  readonly title: string;
  readonly source: "profile" | "preset" | "default" | "raw" | "import";
  readonly detail: string;
};

export type ClientLinkOptions = {
  readonly inboundTag: string;
  readonly clientId: string;
  readonly host?: string;
  readonly port?: number;
  readonly remark?: string;
};

export type WireGuardConfigOptions = {
  readonly inboundTag: string;
  readonly peerPublicKey: string;
  readonly serverPublicKey?: string;
  readonly endpointHost: string;
  readonly endpointPort?: number;
  readonly clientPrivateKey: string;
  readonly clientAddress: string | string[];
  readonly dns?: string[];
  readonly mtu?: number;
  readonly remark?: string;
};

export type SubscriptionFormat = "links" | "links-base64" | "xray-json";

export type SubscriptionOptions = {
  readonly format: SubscriptionFormat;
  readonly clients?: string[];
  readonly host?: string;
  readonly includeDisabled?: boolean;
};

export type SubscriptionResult = {
  readonly format: SubscriptionFormat;
  readonly content: string;
  readonly entries: number;
  readonly issues: Issue[];
};
