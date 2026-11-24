import { describe, it, expect } from 'vitest';
import {
  calculateDurationUnits,
  calculateRequiredCredits,
  LICENSE_CREDIT_COSTS,
} from '../utils/creditCalculator.js';

describe('Credit Calculator Utility Tests', () => {
  it('calculates duration units correctly according to formula durationUnits = Math.ceil(durationSec / 60)', () => {
    // 30 seconds = 1 unit
    expect(calculateDurationUnits(30)).toBe(1);
    // 60 seconds = 1 unit
    expect(calculateDurationUnits(60)).toBe(1);
    // 61 seconds = 2 units
    expect(calculateDurationUnits(61)).toBe(2);
    // 120 seconds = 2 units
    expect(calculateDurationUnits(120)).toBe(2);
    // 121 seconds = 3 units
    expect(calculateDurationUnits(121)).toBe(3);
    // 180 seconds = 3 units
    expect(calculateDurationUnits(180)).toBe(3);
    // 181 seconds = 4 units
    expect(calculateDurationUnits(181)).toBe(4);
  });

  it('rejects invalid non-positive duration', () => {
    expect(() => calculateDurationUnits(0)).toThrow();
    expect(() => calculateDurationUnits(-10)).toThrow();
  });

  it('applies exact license credit cost multipliers', () => {
    expect(LICENSE_CREDIT_COSTS.royalty_free).toBe(1);
    expect(LICENSE_CREDIT_COSTS.sync).toBe(6);
    expect(LICENSE_CREDIT_COSTS.full_ownership).toBe(14);
  });

  it('calculates total credits correctly: totalCredits = durationUnits * licenseCreditCost', () => {
    // 60 seconds, royalty_free: 1 unit * 1 = 1 credit
    const res1 = calculateRequiredCredits(60, 'royalty_free');
    expect(res1.durationUnits).toBe(1);
    expect(res1.licenseCreditCost).toBe(1);
    expect(res1.totalCredits).toBe(1);

    // 61 seconds, royalty_free: 2 units * 1 = 2 credits
    const res2 = calculateRequiredCredits(61, 'royalty_free');
    expect(res2.durationUnits).toBe(2);
    expect(res2.totalCredits).toBe(2);

    // 60 seconds, sync: 1 unit * 6 = 6 credits
    const res3 = calculateRequiredCredits(60, 'sync');
    expect(res3.totalCredits).toBe(6);

    // 120 seconds, sync: 2 units * 6 = 12 credits
    const res4 = calculateRequiredCredits(120, 'sync');
    expect(res4.totalCredits).toBe(12);

    // 60 seconds, full_ownership: 1 unit * 14 = 14 credits
    const res5 = calculateRequiredCredits(60, 'full_ownership');
    expect(res5.totalCredits).toBe(14);

    // 125 seconds, full_ownership: 3 units * 14 = 42 credits
    const res6 = calculateRequiredCredits(125, 'full_ownership');
    expect(res6.durationUnits).toBe(3);
    expect(res6.totalCredits).toBe(42);
  });
});
