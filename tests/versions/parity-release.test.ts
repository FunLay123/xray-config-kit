import { describe, expect, it } from "bun:test";
import { getXrayParityRelease } from "../../src/index.js";

describe("xray parity release selection", () => {
  it("selects exact and nearest lower selected releases", () => {
    expect(getXrayParityRelease({ xrayVersion: "25.10.15" }).tag).toBe("v25.10.15");
    expect(getXrayParityRelease({ xrayVersion: "26.4.25" }).tag).toBe("v26.4.25");
    expect(getXrayParityRelease({ xrayVersion: "26.5.3" }).tag).toBe("v26.5.3");
    expect(getXrayParityRelease({ xrayVersion: "26.5.9" }).tag).toBe("v26.5.3");
  });
});
