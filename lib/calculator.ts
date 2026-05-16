export interface CalcInput {
  applianceAge: number;
  repairQuote: number;
  originalMsrp: number;
  categoryLifespan?: number;
}

export const calculateVerdict = (input: CalcInput) => {
  const { applianceAge, repairQuote, originalMsrp, categoryLifespan = 12 } = input;
  const depreciationRate = 1 / categoryLifespan;
  const currentValue = Math.max(0, originalMsrp * (1 - (applianceAge * depreciationRate)));
  const threshold = currentValue * 0.5;
  const action = repairQuote > threshold ? 'REPLACE' : 'REPAIR';

  return {
    action,
    currentValue: Math.round(currentValue),
    threshold: Math.round(threshold),
    savings: Math.round(originalMsrp - repairQuote)
  };
};
