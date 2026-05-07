import { describe, expect, it } from "bun:test";
import { validateStrictXrayConfig } from "../../src/index.js";

describe("xray strict security behavior", () => {
  it("reports legacy XTLS as a removed security mode", () => {
    const result = validateStrictXrayConfig({
      inbounds: [
        {
          protocol: "vless",
          tag: "vless-xtls",
          port: 443,
          settings: { clients: [], decryption: "none" },
          streamSettings: {
            network: "tcp",
            security: "xtls"
          }
        }
      ]
    }, { releaseTag: "v26.5.3" });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "XCK_XRAY_STRICT_REMOVED_SECURITY")).toBe(true);
  });
});
