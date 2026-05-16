import { describe, it, expect } from "vitest";
import { evaluateModelCacheEligibility } from "./cache-eligibility";

describe("evaluateModelCacheEligibility", () => {
  it("Empty parts array is rejected", () => {
    const payload = {
      parts: [],
      status: "parts_partial",
      completeness: { sectionCount: 5 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: false,
      reason: "empty_parts",
      severity: "blocked",
    });
  });

  it("no_result is rejected", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "no_result",
      completeness: { sectionCount: 5 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: false,
      reason: "blocked_status:no_result",
      severity: "blocked",
    });
  });

  it("failed is rejected", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "failed",
      completeness: { sectionCount: 5 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: false,
      reason: "blocked_status:failed",
      severity: "blocked",
    });
  });

  it("summary_only is rejected", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "summary_only",
      completeness: { sectionCount: 5 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: false,
      reason: "blocked_status:summary_only",
      severity: "blocked",
    });
  });

  it("parts_partial with parts + sections + truth source is allowed", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "parts_partial",
      completeness: { sectionCount: 2 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: true,
      reason: "eligible",
      severity: "info",
    });
  });

  it("bom_complete with parts + sections + truth source is allowed", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "bom_complete",
      completeness: { sectionCount: 5 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: true,
      reason: "eligible",
      severity: "info",
    });
  });

  it("Missing section count is rejected", () => {
    const payload = {
      parts: [{ id: 1 }],
      status: "parts_partial",
      completeness: { sectionCount: 0 },
      truthSource: "Manufacturer",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload)).toEqual({
      eligible: false,
      reason: "missing_assembly_sections",
      severity: "blocked",
    });
  });

  it("Missing truthSource/sourceStrategy is rejected", () => {
    const payload1 = {
      parts: [{ id: 1 }],
      status: "parts_partial",
      completeness: { sectionCount: 1 },
      truthSource: "",
      sourceStrategy: "direct",
    };
    expect(evaluateModelCacheEligibility(payload1)).toEqual({
      eligible: false,
      reason: "missing_source_truth",
      severity: "blocked",
    });

    const payload2 = {
      parts: [{ id: 1 }],
      status: "parts_partial",
      completeness: { sectionCount: 1 },
      truthSource: "Manufacturer",
      sourceStrategy: "",
    };
    expect(evaluateModelCacheEligibility(payload2)).toEqual({
      eligible: false,
      reason: "missing_source_truth",
      severity: "blocked",
    });
  });
});
