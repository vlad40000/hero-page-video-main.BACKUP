import { describe, expect, it } from "vitest";

import { calculateResaleValue } from "./pricingEngine";

describe("calculateResaleValue", () => {
  it("adds a default $100 parts addback for machines over 8 years old", () => {
    const result = calculateResaleValue({
      p0: 649,
      applianceType: "Washer",
      brand: "GE",
      condition: "Good",
      ageMonths: 97,
      category: "Washer",
      parts: [],
    });

    expect(result.audit?.partsAddbackUsd).toBe(100);
    expect(Number.isInteger(result.finalPrice * 100)).toBe(true);
    expect(Number.isInteger(result.salvageValue * 100)).toBe(true);
  });

  it("does not apply the default age addback at exactly 8 years", () => {
    const result = calculateResaleValue({
      p0: 649,
      applianceType: "Washer",
      brand: "GE",
      condition: "Good",
      ageMonths: 96,
      category: "Washer",
      parts: [],
    });

    expect(result.audit?.partsAddbackUsd).toBe(0);
  });
});
