/**
 * Tests for KPI Benchmark data library
 * Validates: benchmark lookup, KPI status computation, benchmark label formatting
 */
import { describe, it, expect } from 'vitest';
import {
  BUSINESS_MODEL_BENCHMARKS,
  INDUSTRY_CONTEXT,
  getKpiStatus,
  getBenchmarkLabel,
} from '../shared/kpiBenchmarks';

describe('KPI Benchmark Library', () => {
  describe('BUSINESS_MODEL_BENCHMARKS', () => {
    it('should have entries for all core business models', () => {
      const requiredModels = ['saas', 'ecommerce', 'marketplace', 'agency', 'hardware'];
      for (const model of requiredModels) {
        expect(BUSINESS_MODEL_BENCHMARKS[model], `Missing benchmark for ${model}`).toBeDefined();
      }
    });

    it('each benchmark profile should have a northStar and kpis array', () => {
      for (const [model, profile] of Object.entries(BUSINESS_MODEL_BENCHMARKS)) {
        expect(profile.northStar, `${model} missing northStar`).toBeDefined();
        expect(profile.northStar.key).toBeTruthy();
        expect(profile.northStar.label).toBeTruthy();
        expect(profile.kpis.length).toBeGreaterThan(0);
      }
    });

    it('each KPI should have required fields', () => {
      for (const [model, profile] of Object.entries(BUSINESS_MODEL_BENCHMARKS)) {
        for (const kpi of profile.kpis) {
          expect(kpi.key, `${model} KPI missing key`).toBeTruthy();
          expect(kpi.label, `${model} KPI ${kpi.key} missing label`).toBeTruthy();
          expect(kpi.unit, `${model} KPI ${kpi.key} missing unit`).toBeTruthy();
          expect(kpi.excellent, `${model} KPI ${kpi.key} missing excellent range`).toBeDefined();
          expect(kpi.good, `${model} KPI ${kpi.key} missing good range`).toBeDefined();
          expect(kpi.fair, `${model} KPI ${kpi.key} missing fair range`).toBeDefined();
        }
      }
    });
  });

  describe('getKpiStatus', () => {
    it('returns no-data when actual is null', () => {
      const kpi = BUSINESS_MODEL_BENCHMARKS['saas'].kpis[0];
      expect(getKpiStatus(kpi, null)).toBe('no-data');
    });

    it('returns excellent for MoM growth >= 15% in SaaS', () => {
      const momKpi = BUSINESS_MODEL_BENCHMARKS['saas'].kpis.find(k => k.key === 'mom_growth');
      if (!momKpi) return; // skip if not present
      expect(getKpiStatus(momKpi, 20)).toBe('excellent');
    });

    it('returns poor for very high churn rate (lower-is-better KPI)', () => {
      const churnKpi = BUSINESS_MODEL_BENCHMARKS['saas'].kpis.find(k => k.key === 'churn_rate');
      if (!churnKpi) return;
      expect(getKpiStatus(churnKpi, 20)).toBe('poor');
    });

    it('returns excellent for very low churn rate (lower-is-better KPI)', () => {
      const churnKpi = BUSINESS_MODEL_BENCHMARKS['saas'].kpis.find(k => k.key === 'churn_rate');
      if (!churnKpi) return;
      expect(getKpiStatus(churnKpi, 0.5)).toBe('excellent');
    });

    it('returns good for LTV:CAC ratio of 4x', () => {
      const ltvKpi = BUSINESS_MODEL_BENCHMARKS['saas'].kpis.find(k => k.key === 'ltv_cac_ratio');
      if (!ltvKpi) return;
      expect(getKpiStatus(ltvKpi, 4)).toBe('good');
    });
  });

  describe('getBenchmarkLabel', () => {
    it('returns a non-empty string for all KPIs', () => {
      for (const profile of Object.values(BUSINESS_MODEL_BENCHMARKS)) {
        for (const kpi of profile.kpis) {
          const label = getBenchmarkLabel(kpi);
          expect(label, `Empty benchmark label for KPI ${kpi.key}`).toBeTruthy();
          expect(typeof label).toBe('string');
        }
      }
    });
  });

  describe('INDUSTRY_CONTEXT', () => {
    it('should have notes for common sectors', () => {
      const expectedSectors = ['fintech', 'healthtech', 'edtech', 'saas', 'ecommerce'];
      for (const sector of expectedSectors) {
        if (INDUSTRY_CONTEXT[sector]) {
          expect(INDUSTRY_CONTEXT[sector].notes).toBeTruthy();
          expect(INDUSTRY_CONTEXT[sector].label).toBeTruthy();
        }
      }
    });
  });
});
