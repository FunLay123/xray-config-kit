import type { XrayParityGeneratorConfig } from "./scripts/generate-xray-parity-manifest.js";

export default {
  source: {
    repo: "XTLS/Xray-core",
    pathEnv: "XRAY_CORE_DIR"
  },
  releases: [
    "v25.10.15",
    "v26.4.25",
    "v26.5.3",
    "latest"
  ],
  outputs: {
    manifest: "src/xray-json/parity-manifest.ts",
    types: "src/xray-json/parity-types.ts"
  }
} satisfies XrayParityGeneratorConfig;
