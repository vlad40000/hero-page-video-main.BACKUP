import { describe, it, expect } from 'vitest';
import { calculateVerdict } from './calculator';

describe('Appliance Economic Logic', () => {
  it('recommends REPAIR for newer appliances with low repair costs', () => {
    const result = calculateVerdict({ applianceAge: 3, repairQuote: 100, originalMsrp: 1000 });
    expect(result.action).toBe('REPAIR');
  });

  it('recommends REPLACE when repair cost exceeds 50% of depreciated value', () => {
    // A 10yr old  fridge is worth ~. A  repair is > 50% of that (.50).
    const result = calculateVerdict({ applianceAge: 10, repairQuote: 100, originalMsrp: 1000 });
    expect(result.action).toBe('REPLACE');
  });
});
