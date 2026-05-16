export function evaluateSourceTruth(payload: any): boolean {
  const truthSource = String(payload?.truthSource || "").trim();
  const sourceStrategy = String(payload?.sourceStrategy || "").trim();
  return Boolean(truthSource && sourceStrategy);
}
