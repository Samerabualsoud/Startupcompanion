/**
 * Tests for the Financial Projection Engine
 */
import { describe, it, expect } from 'vitest';
import {
  computeTopDown,
  computeBottomUp,
  DEFAULT_TOP_DOWN,
  DEFAULT_BOTTOM_UP,
  type TopDownInputs,
} from '../shared/projectionEngine';

describe('Projection Engine — Top-Down', () => {
  it('produces 36 monthly data points', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    expect(result.monthly).toHaveLength(36);
  });

  it('produces 3 yearly summaries', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    expect(result.yearly).toHaveLength(3);
    expect(result.yearly.map(y => y.year)).toEqual([1, 2, 3]);
  });

  it('monthly data points have year and monthInYear fields', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    const m1 = result.monthly[0];
    expect(m1.year).toBe(1);
    expect(m1.monthInYear).toBe(1);
    const m13 = result.monthly[12];
    expect(m13.year).toBe(2);
    expect(m13.monthInYear).toBe(1);
    const m36 = result.monthly[35];
    expect(m36.year).toBe(3);
    expect(m36.monthInYear).toBe(12);
  });

  it('cumulative revenue is monotonically increasing', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    for (let i = 1; i < result.monthly.length; i++) {
      expect(result.monthly[i].cumulativeRevenue).toBeGreaterThanOrEqual(result.monthly[i - 1].cumulativeRevenue);
    }
  });

  it('includes TAM, SAM, SOM in output', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    expect(result.tam).toBe(DEFAULT_TOP_DOWN.tam);
    expect(result.sam).toBeCloseTo(DEFAULT_TOP_DOWN.tam * (DEFAULT_TOP_DOWN.samPct / 100));
    expect(result.som).toBeDefined();
  });

  it('includes CAGR in output', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    expect(result.cagr).toBeDefined();
    expect(typeof result.cagr).toBe('number');
  });

  it('includes totalThreeYearRevenue', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    const sum = result.monthly.reduce((s, m) => s + m.revenue, 0);
    expect(result.totalThreeYearRevenue).toBeCloseTo(sum, 0);
  });

  it('year 2 has higher revenue than year 1 when capture rates increase', () => {
    const inputs: TopDownInputs = { ...DEFAULT_TOP_DOWN, captureY1: 1, captureY2: 3, captureY3: 7 };
    const result = computeTopDown(inputs, 'saas');
    expect(result.yearly[1].revenue).toBeGreaterThan(result.yearly[0].revenue);
    expect(result.yearly[2].revenue).toBeGreaterThan(result.yearly[1].revenue);
  });

  it('YoY growth is defined for years 2 and 3', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    expect(result.yearly[0].revenueGrowth).toBeUndefined();
    expect(result.yearly[1].revenueGrowth).toBeDefined();
    expect(result.yearly[2].revenueGrowth).toBeDefined();
  });

  it('yearly totalRevenue equals revenue (alias)', () => {
    const result = computeTopDown(DEFAULT_TOP_DOWN, 'saas');
    result.yearly.forEach(y => {
      expect(y.totalRevenue).toBe(y.revenue);
    });
  });
});

describe('Projection Engine — Bottom-Up SaaS', () => {
  it('produces 36 monthly data points', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.saas);
    expect(result.monthly).toHaveLength(36);
  });

  it('customer count grows over time with positive growth rate', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.saas);
    expect(result.monthly[35].customers).toBeGreaterThan(result.monthly[0].customers);
  });

  it('revenue grows over time', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.saas);
    expect(result.yearly[2].revenue).toBeGreaterThan(result.yearly[0].revenue);
  });

  it('has cagr field', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.saas);
    expect(result.cagr).toBeDefined();
    expect(result.cagr).toBeGreaterThan(0);
  });
});

describe('Projection Engine — Bottom-Up Marketplace', () => {
  it('includes GMV in monthly data', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.marketplace);
    expect(result.monthly[0].gmv).toBeDefined();
    expect(result.monthly[0].gmv).toBeGreaterThan(0);
  });

  it('revenue is take rate × GMV', () => {
    const inputs = DEFAULT_BOTTOM_UP.marketplace;
    const result = computeBottomUp(inputs);
    const m1 = result.monthly[0];
    expect(m1.revenue).toBeCloseTo(m1.gmv! * (inputs.takeRate / 100), 0);
  });
});

describe('Projection Engine — Bottom-Up Hardware', () => {
  it('includes recurring revenue from installed base', () => {
    const result = computeBottomUp(DEFAULT_BOTTOM_UP.hardware);
    // By month 36, recurring revenue should be significant
    const m36 = result.monthly[35];
    expect(m36.revenue).toBeGreaterThan(0);
  });
});

describe('Projection Engine — Bottom-Up Procurement', () => {
  it('revenue is take rate × PVF', () => {
    const inputs = DEFAULT_BOTTOM_UP.procurement;
    const result = computeBottomUp(inputs);
    const m1 = result.monthly[0];
    expect(m1.revenue).toBeCloseTo(m1.gmv! * (inputs.takeRate / 100), 0);
  });
});
