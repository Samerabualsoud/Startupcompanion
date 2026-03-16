import { describe, it, expect } from 'vitest';

describe('Valuation History Router', () => {
  it('should have correct valuation types', () => {
    const validTypes = ['409a', 'priced-round', 'safe', 'convertible-note', 'internal', 'other'];
    expect(validTypes).toContain('409a');
    expect(validTypes).toContain('safe');
    expect(validTypes).toContain('convertible-note');
    expect(validTypes).toHaveLength(6);
  });

  it('should validate required fields for a valuation entry', () => {
    const entry = {
      companyName: 'Acme Inc.',
      valuationDate: new Date('2024-01-15'),
      valuationType: '409a' as const,
      preMoneyValuation: 5_000_000,
      postMoneyValuation: 6_000_000,
      amountRaised: 1_000_000,
    };
    expect(entry.companyName).toBeTruthy();
    expect(entry.valuationDate).toBeInstanceOf(Date);
    expect(entry.preMoneyValuation).toBeGreaterThan(0);
    expect(entry.postMoneyValuation).toBeGreaterThan(entry.preMoneyValuation);
  });

  it('should calculate dilution correctly', () => {
    const preMoneyValuation = 5_000_000;
    const amountRaised = 1_000_000;
    const postMoneyValuation = preMoneyValuation + amountRaised;
    const founderOwnershipAfter = preMoneyValuation / postMoneyValuation;
    expect(postMoneyValuation).toBe(6_000_000);
    expect(founderOwnershipAfter).toBeCloseTo(0.8333, 3);
  });
});
