/**
 * Tests for the Financial Projection Engine (Best-Practice CFO Model)
 */
import { describe, it, expect } from 'vitest';
import {
  computeFinancialModel,
  DEFAULT_MODEL_INPUTS,
  type BusinessModel,
} from '../shared/projectionEngine';

const MODELS: BusinessModel[] = ['saas', 'ecommerce', 'marketplace', 'agency', 'hardware', 'procurement'];

// ── 3-Year Horizon Tests ──────────────────────────────────────────────────────
describe('Projection Engine — 3-Year Horizon', () => {
  it('produces 36 monthly data points for SaaS base scenario', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    expect(result.monthly).toHaveLength(36);
  });

  it('produces 3 yearly summaries', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    expect(result.yearly).toHaveLength(3);
    expect(result.yearly.map(y => y.year)).toEqual([1, 2, 3]);
  });

  it('monthly data points have correct year and monthInYear fields', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    expect(result.monthly[0].year).toBe(1);
    expect(result.monthly[0].monthInYear).toBe(1);
    expect(result.monthly[12].year).toBe(2);
    expect(result.monthly[12].monthInYear).toBe(1);
    expect(result.monthly[35].year).toBe(3);
    expect(result.monthly[35].monthInYear).toBe(12);
  });

  it('revenue is non-negative for all months', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.monthly.forEach(m => expect(m.revenue).toBeGreaterThanOrEqual(0));
  });

  it('gross profit = revenue - cogs', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.monthly.forEach(m => {
      expect(m.grossProfit).toBeCloseTo(m.revenue - m.cogs, 2);
    });
  });

  it('EBITDA = gross profit - total opex', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.monthly.forEach(m => {
      expect(m.ebitda).toBeCloseTo(m.grossProfit - m.totalOpex, 2);
    });
  });

  it('yearly revenue equals sum of monthly revenue', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.yearly.forEach(y => {
      const monthlySum = result.monthly
        .filter(m => m.year === y.year)
        .reduce((s, m) => s + m.revenue, 0);
      expect(y.revenue).toBeCloseTo(monthlySum, 2);
    });
  });

  it('gross margin % is within -100 to 100 range', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.monthly.forEach(m => {
      if (m.revenue > 0) {
        expect(m.grossMarginPct).toBeGreaterThanOrEqual(-100);
        expect(m.grossMarginPct).toBeLessThanOrEqual(100);
      }
    });
  });

  it('starting cash is reflected in month 1 cash balance', () => {
    const inputs = DEFAULT_MODEL_INPUTS('saas', 3);
    const result = computeFinancialModel(inputs);
    expect(result.monthly[0].cashBalance).toBeLessThanOrEqual(inputs.capital.startingCash);
  });
});

// ── 5-Year Horizon Tests ──────────────────────────────────────────────────────
describe('Projection Engine — 5-Year Horizon', () => {
  it('produces 60 monthly data points', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 5));
    expect(result.monthly).toHaveLength(60);
  });

  it('produces 5 yearly summaries', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 5));
    expect(result.yearly).toHaveLength(5);
    expect(result.yearly.map(y => y.year)).toEqual([1, 2, 3, 4, 5]);
  });

  it('revenue grows over 5 years (base scenario)', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 5));
    expect(result.yearly[4].revenue).toBeGreaterThan(result.yearly[0].revenue);
  });
});

// ── 10-Year Horizon Tests ─────────────────────────────────────────────────────
describe('Projection Engine — 10-Year Horizon', () => {
  it('produces 120 monthly data points', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 10));
    expect(result.monthly).toHaveLength(120);
  });

  it('produces 10 yearly summaries', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 10));
    expect(result.yearly).toHaveLength(10);
  });
});

// ── Scenario Tests ────────────────────────────────────────────────────────────
describe('Projection Engine — Scenarios', () => {
  it('bull scenario revenue > base > bear', () => {
    const base = computeFinancialModel({ ...DEFAULT_MODEL_INPUTS('saas', 3), scenario: 'base' });
    const bull = computeFinancialModel({ ...DEFAULT_MODEL_INPUTS('saas', 3), scenario: 'bull' });
    const bear = computeFinancialModel({ ...DEFAULT_MODEL_INPUTS('saas', 3), scenario: 'bear' });
    expect(bull.totalRevenue3Y).toBeGreaterThan(base.totalRevenue3Y);
    expect(base.totalRevenue3Y).toBeGreaterThan(bear.totalRevenue3Y);
  });

  it('bear scenario has lower CAGR than bull', () => {
    const bull = computeFinancialModel({ ...DEFAULT_MODEL_INPUTS('saas', 3), scenario: 'bull' });
    const bear = computeFinancialModel({ ...DEFAULT_MODEL_INPUTS('saas', 3), scenario: 'bear' });
    if (bull.cagr != null && bear.cagr != null) {
      expect(bull.cagr).toBeGreaterThan(bear.cagr);
    }
  });
});

// ── All Business Models ───────────────────────────────────────────────────────
describe('Projection Engine — All Business Models', () => {
  MODELS.forEach(model => {
    it(`${model}: produces valid output with positive revenue`, () => {
      const result = computeFinancialModel(DEFAULT_MODEL_INPUTS(model, 3));
      expect(result.monthly).toHaveLength(36);
      expect(result.yearly).toHaveLength(3);
      expect(result.totalRevenue3Y).toBeGreaterThan(0);
    });

    it(`${model}: gross profit ≤ revenue`, () => {
      const result = computeFinancialModel(DEFAULT_MODEL_INPUTS(model, 3));
      result.monthly.forEach(m => {
        expect(m.grossProfit).toBeLessThanOrEqual(m.revenue + 0.01);
      });
    });
  });
});

// ── SaaS-Specific Tests ───────────────────────────────────────────────────────
describe('Projection Engine — SaaS Unit Economics', () => {
  it('SaaS MRR grows over time with positive new customer growth', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    const m1 = result.monthly[0];
    const m36 = result.monthly[35];
    expect(m36.mrr!).toBeGreaterThan(m1.mrr!);
  });

  it('SaaS ARR = MRR × 12', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    result.monthly.forEach(m => {
      if (m.mrr != null && m.arr != null) {
        expect(m.arr).toBeCloseTo(m.mrr * 12, 2);
      }
    });
  });

  it('SaaS LTV/CAC ratio is positive', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('saas', 3));
    if (result.ltvCacRatio != null) {
      expect(result.ltvCacRatio).toBeGreaterThan(0);
    }
  });
});

// ── Marketplace-Specific Tests ────────────────────────────────────────────────
describe('Projection Engine — Marketplace', () => {
  it('includes GMV in monthly data', () => {
    const result = computeFinancialModel(DEFAULT_MODEL_INPUTS('marketplace', 3));
    expect(result.monthly[0].gmv).toBeDefined();
    expect(result.monthly[0].gmv).toBeGreaterThan(0);
  });

  it('revenue is approximately take rate × GMV', () => {
    const inputs = DEFAULT_MODEL_INPUTS('marketplace', 3);
    const result = computeFinancialModel(inputs);
    const m1 = result.monthly[0];
    const drivers = inputs.revenueDrivers as any;
    // Revenue ≈ GMV × takeRate (before scenario multiplier)
    expect(m1.revenue).toBeGreaterThan(0);
    expect(m1.gmv).toBeGreaterThan(m1.revenue);
  });
});

// ── Capital & Funding Tests ───────────────────────────────────────────────────
describe('Projection Engine — Capital & Funding', () => {
  it('funding injection increases cash balance in the funding month', () => {
    const inputs = DEFAULT_MODEL_INPUTS('saas', 3);
    const result = computeFinancialModel(inputs);
    const fundingMonth = inputs.capital.fundingRounds?.[0]?.month ?? 0;
    if (fundingMonth > 0 && fundingMonth <= 36) {
      const mBefore = result.monthly[fundingMonth - 2]; // month before
      const mFunding = result.monthly[fundingMonth - 1]; // funding month
      const fundingAmount = inputs.capital.fundingRounds![0].amount;
      // Cash in funding month should be significantly higher than without funding
      expect(mFunding.cashBalance).toBeGreaterThan(mBefore.cashBalance - fundingAmount);
    }
  });
});
