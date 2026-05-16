// Ported from v1.3.0 Appliance Calculator.html
export interface AppraisalInput {
  originalMsrp: number; // P0
  ageMonths: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  brand: string;
}

export const calculateMarketValue = (input: AppraisalInput) => {
  const { originalMsrp, ageMonths, condition, brand } = input;
  
  // v1.3.0 Deterministic Tables
  const BRAND_BPS: Record<string, number> = { 'WHIRLPOOL': 1000, 'GE': 1000, 'SAMSUNG': 1250 };
  const COND_BPS: Record<string, number> = { 'Excellent': 0, 'Good': 200, 'Fair': 450, 'Poor': 800 };
  
  const dEffBps = (BRAND_BPS[brand] || 1000) + COND_BPS[condition];
  const years = ageMonths / 12;
  
  // Precise depreciation: P0 * e^(years * ln(1 - d))
  const oneMinusD = 1 - (dEffBps / 10000);
  const factor = Math.exp(years * Math.log(oneMinusD));
  
  const fairMarketValue = Math.round(originalMsrp * factor);
  const salvageFloor = Math.round(originalMsrp * 0.12); // 12% floor
  
  return Math.max(fairMarketValue, salvageFloor);
};
