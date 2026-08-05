import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decodeSerialNumber } from "./decoder";

describe("parts serial decoder golden rules", () => {
  it("decodes GE month/year letters using the corrected table", async () => {
    const decoded = await decodeSerialNumber("SL621054Q", {
      brand: "GE",
      model: "GTW485ASJ4WS",
    });

    expect(decoded.brandFamily).toBe("GE_FAMILY");
    expect(decoded.selectedYear).toBe(2018);
    expect(decoded.decoded.month).toBe(9);
    expect(decoded.confidence).toBe("low");
  });

  it("keeps Whirlpool U-year serials in the 2007 cycle", async () => {
    const decoded = await decodeSerialNumber("SU1727374", {
      brand: "Whirlpool",
      model: "WED4815EW",
    });

    expect(decoded.brandFamily).toBe("WHIRLPOOL_FAMILY");
    expect(decoded.selectedYear).toBe(2007);
    expect(decoded.decoded.week).toBe(17);
    expect(decoded.confidence).toBe("high");
  });

  it("decodes Bosch FD serials into manufacture year and month", async () => {
    const decoded = await decodeSerialNumber("FD950200451", {
      brand: "Bosch",
      model: "SHE3AR72UC",
    });

    expect(decoded.brandFamily).toBe("BOSCH_BSH");
    expect(decoded.selectedYear).toBe(2015);
    expect(decoded.decoded.month).toBe(2);
    expect(decoded.confidence).toBe("high");
  });
});
