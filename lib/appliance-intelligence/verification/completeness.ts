export function evaluateCompleteness(payload: any): boolean {
  const completeness = payload?.completeness || {};
  const sectionCount = Number(completeness.sectionCount || 0);
  return sectionCount > 0;
}
