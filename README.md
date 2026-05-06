# Xray Config Kit

`xray-config-kit` is a TypeScript-first, version-aware engine for Xray-core configuration JSON.

It is not a panel, database model, process supervisor, or frontend form manager. It provides typed profile schemas, validation, analysis, import, compilation to Xray JSON, diffing, migrations, presets, client link/subscription generation, frontend-safe helpers, and backend-only helpers for testing configs with real Xray binaries.

The root export is browser-safe. Import `xray-config-kit/node` only on the backend.

## Current Scope

- Xray adapter: `xray@26.5`, with compatibility behavior tested against a local Xray binary.
- Editable inbound models: VMess, VLESS, Trojan, Shadowsocks, HTTP, Mixed/SOCKS, WireGuard.
- Transports: TCP/RAW, gRPC, XHTTP, WebSocket, HTTPUpgrade, mKCP.
- Security: none, TLS, REALITY where compatible.
- Advanced stream settings: explicit `sockopt`, `finalmask`, and raw stream patches.
- Importers: raw Xray JSON.
- Exporters: VMess/VLESS/Trojan/Shadowsocks links, WireGuard config text, link subscriptions, and Xray JSON outbound subscriptions.
- Frontend helpers: default inbound drafts, capability flags, field visibility, and draft validation.

## Example

```ts
import {
  buildXrayConfig,
  createProfile,
  generateClientLink,
  validateProfile,
} from "xray-config-kit";

const profile = createProfile({
  presets: ["dns-simple", "routing-private-direct"],
  inbounds: [
    {
      kind: "inbound",
      protocol: "vless",
      tag: "vless-reality",
      port: 443,
      clients: [{ protocol: "vless", id: "11111111-1111-4111-8111-111111111111", email: "alice" }],
      security: {
        type: "reality",
        serverNames: ["www.example.com"],
        privateKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        publicKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        shortIds: ["a1b2c3d4"],
        target: "www.example.com:443",
      },
      transport: { type: "tcp", header: { type: "none" } },
    },
  ],
});

const validation = validateProfile(profile, { xrayVersion: "26.5.3" });
const built = buildXrayConfig(profile, { xrayVersion: "26.5.3" });
const link = generateClientLink(profile, {
  inboundTag: "vless-reality",
  clientId: "alice",
  host: "edge.example.com",
});
```

## Frontend Flow

Use the browser-safe root export:

```ts
import {
  createDefaultInbound,
  getInboundFieldVisibility,
  getInboundFormCapabilities,
  validateInboundDraft,
} from "xray-config-kit";

const capabilities = getInboundFormCapabilities({ xrayVersion: "26.5.3" });
const draft = createDefaultInbound({ protocol: "vless", transport: "xhttp", security: "reality" });
const visible = getInboundFieldVisibility(draft, capabilities);
const issues = validateInboundDraft(draft, { mode: "permissive" });
```

Frontend code should own form drafts, validation display, live JSON preview, and diffs. It should not own raw Xray JSON as the primary state.

## Backend Flow

Use the root export for final compile and `xray-config-kit/node` for binary checks:

```ts
import { buildXrayConfig, validateProfile } from "xray-config-kit";
import { testXrayConfig } from "xray-config-kit/node";

const validation = validateProfile(profile, { mode: "strict", xrayVersion: "26.5.3" });
const built = buildXrayConfig(profile, { mode: "strict", xrayVersion: "26.5.3" });
const test = await testXrayConfig(built.config, { binaryPath: "C:\\v2rayN\\bin\\xray\\xray.exe" });
```

The host application should handle atomic writes, backups, service restart/reload, health checks, and rollback. Those process-control responsibilities are intentionally outside the frontend-safe package boundary.

## Exports

- `xray-config-kit`: browser-safe core APIs.
- `xray-config-kit/frontend`: explicit browser-safe alias.
- `xray-config-kit/schemas`: Zod schemas and generated JSON Schema helper.
- `xray-config-kit/presets`: preset catalog and preset application helper.
- `xray-config-kit/adapters`: adapter registry and compatibility matrix.
- `xray-config-kit/xray-json`: low-level Xray JSON helper types.
- `xray-config-kit/exporters/client-links`: client link helpers.
- `xray-config-kit/exporters/subscriptions`: subscription helpers.
- `xray-config-kit/exporters/wireguard`: WireGuard config helper.
- `xray-config-kit/testing`: browser-safe golden fixture helpers.
- `xray-config-kit/node`: backend-only Xray binary discovery and `xray run -test` wrapper.

## Real Binary Tests

Set `XRAY_BINARY` to run the optional integration test:

```powershell
$env:XRAY_BINARY = "C:\v2rayN\bin\xray\xray.exe"
$env:XRAY_VERSION = "25.10.15"
bun run test
```
