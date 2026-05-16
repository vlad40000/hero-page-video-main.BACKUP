// Ported from appliance_decoder_patched.py
export type BrandFamily = 'GE' | 'WHIRLPOOL' | 'MAYTAG' | 'SAMSUNG' | 'LG';

export interface DecodeResult {
  year: number;
  month: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function decodeSerial(brand: BrandFamily, serial: string): DecodeResult {
  const s = serial.toUpperCase().replace(/[-\s]/g, '');
  
  // Example: Whirlpool Logic (Ported Rule 2.2)
  if (brand === 'WHIRLPOOL') {
    const yearChar = s.charAt(1);
    const WP_YEARS: Record<string, number[]> = { 'K': [2000], 'A': [1991, 2021], 'D': [1994, 2024] };
    const candidates = WP_YEARS[yearChar] || [];
    return {
      year: candidates[candidates.length - 1] || 2024,
      month: parseInt(s.substring(2, 4)),
      confidence: 'medium',
      reason: 'Matched Whirlpool family pattern'
    };
  }
  
  return { year: 2024, month: 1, confidence: 'low', reason: 'Fallback default' };
}
