/**
 * Financial Projection Engine
 * Supports 6 business models × 2 approaches (top-down / bottom-up)
 * All calculations are deterministic and pure (no side effects).
 */

export type BusinessModel = 'saas' | 'ecommerce' | 'marketplace' | 'agency' | 'hardware' | 'procurement';
export type Approach = 'top-down' | 'bottom-up';

// ── Top-Down Inputs (same for all models) ──────────────────────────────────
export interface TopDownInputs {
  tam: number;           // Total Addressable Market ($)
  samPct: number;        // SAM as % of TAM (0–100)
  somPct: number;        // SOM as % of SAM (0–100)
  captureY1: number;     // % of SOM captured in Year 1 (0–100)
  captureY2: number;     // % of SOM captured in Year 2 (0–100)
  captureY3: number;     // % of SOM captured in Year 3 (0–100)
  avgDealSize: number;   // Average revenue per customer/deal ($)
  currency: string;
}

// ── Bottom-Up Inputs per Business Model ────────────────────────────────────
export interface SaaSBottomUp {
  startingCustomers: number;
  newCustomersPerMonth: number;       // Month 1 new customer adds
  monthlyGrowthRate: number;          // % MoM growth in new customers
  avgMRRPerCustomer: number;          // $
  monthlyChurnRate: number;           // % of customers churning per month
  expansionRevenuePct: number;        // % of MRR from expansion/upsell
  currency: string;
}

export interface EcommerceBottomUp {
  startingMonthlyOrders: number;
  orderGrowthRateMoM: number;         // % MoM growth in orders
  avgOrderValue: number;              // $
  returnRate: number;                 // % of orders returned
  repeatPurchaseRate: number;         // % of customers buying again in same month
  currency: string;
}

export interface MarketplaceBottomUp {
  startingMonthlyGMV: number;         // $
  gmvGrowthRateMoM: number;           // % MoM
  takeRate: number;                   // % of GMV kept as revenue
  currency: string;
}

export interface AgencyBottomUp {
  startingClients: number;
  newClientsPerMonth: number;
  clientGrowthRateMoM: number;        // % MoM growth in new clients
  avgMonthlyRetainer: number;         // $ per client per month
  clientChurnRateMonthly: number;     // % per month
  projectRevenuePct: number;          // % of revenue from one-off projects
  currency: string;
}

export interface HardwareBottomUp {
  startingMonthlyUnits: number;
  unitGrowthRateMoM: number;          // % MoM
  avgSellingPrice: number;            // $ per unit
  cogs: number;                       // $ per unit
  recurringRevenuePerUnit: number;    // $ per month (subscriptions/services)
  currency: string;
}

export interface ProcurementBottomUp {
  startingMonthlyPVF: number;         // Procurement Volume Facilitated ($)
  pvfGrowthRateMoM: number;           // % MoM
  takeRate: number;                   // % of PVF kept as service fee
  avgOrderValue: number;              // $ per procurement order
  buyerRetentionRate: number;         // % of buyers returning monthly
  currency: string;
}

export type BottomUpInputs =
  | ({ model: 'saas' } & SaaSBottomUp)
  | ({ model: 'ecommerce' } & EcommerceBottomUp)
  | ({ model: 'marketplace' } & MarketplaceBottomUp)
  | ({ model: 'agency' } & AgencyBottomUp)
  | ({ model: 'hardware' } & HardwareBottomUp)
  | ({ model: 'procurement' } & ProcurementBottomUp);

// ── Output Types ────────────────────────────────────────────────────────────
export interface MonthlyDataPoint {
  month: number;           // 1–36 (global month index)
  year: number;            // 1, 2, or 3
  monthInYear: number;     // 1–12 within the year
  revenue: number;
  cumulativeRevenue: number;
  customers: number;       // customers / orders / GMV units depending on model
  gmv?: number;            // for marketplace / procurement
}

export interface YearSummary {
  year: number;            // 1, 2, or 3
  revenue: number;         // total annual revenue (alias: totalRevenue)
  totalRevenue: number;    // same as revenue, for convenience
  customers: number;
  gmv?: number;
  revenueGrowth?: number;   // % YoY
  customersGrowth?: number; // % YoY
  marketShare?: number;     // % of SOM (top-down only)
}

export interface ProjectionOutput {
  approach: Approach;
  businessModel: BusinessModel;
  monthly: MonthlyDataPoint[];
  yearly: YearSummary[];
  // Top-down specific
  tam?: number;
  sam?: number;
  som?: number;
  // Summary
  cagr?: number;           // Compound Annual Growth Rate (Y1→Y3)
  totalThreeYearRevenue: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function calcCagr(y1Rev: number, y3Rev: number): number {
  if (y1Rev <= 0) return 0;
  return (Math.pow(y3Rev / y1Rev, 1 / 2) - 1) * 100;
}

// ── Top-Down Engine ─────────────────────────────────────────────────────────
export function computeTopDown(inputs: TopDownInputs, model: BusinessModel): ProjectionOutput {
  const sam = inputs.tam * (inputs.samPct / 100);
  const som = sam * (inputs.somPct / 100);

  const captureRates = [inputs.captureY1, inputs.captureY2, inputs.captureY3];
  const yearlyRevenues = captureRates.map(capture => {
    const customers = inputs.avgDealSize > 0 ? Math.round((som / inputs.avgDealSize) * (capture / 100)) : 0;
    const revenue = customers * inputs.avgDealSize;
    return { customers, revenue };
  });

  // Distribute yearly revenue across months with a ramp
  const monthly: MonthlyDataPoint[] = [];
  let cumulative = 0;
  for (let y = 0; y < 3; y++) {
    const annualRev = yearlyRevenues[y].revenue;
    const annualCust = yearlyRevenues[y].customers;
    const baseMonthly = annualRev / 12;
    for (let m = 0; m < 12; m++) {
      // Slight ramp: starts at 0.7 in month 1, reaches 1.3 by month 12
      const ramp = 0.7 + (0.6 * m) / 11;
      const revenue = baseMonthly * ramp;
      cumulative += revenue;
      monthly.push({
        month: y * 12 + m + 1,
        year: y + 1,
        monthInYear: m + 1,
        revenue,
        cumulativeRevenue: cumulative,
        customers: Math.round(annualCust / 12),
      });
    }
  }

  const yearly: YearSummary[] = [1, 2, 3].map((yr, i) => {
    const slice = monthly.filter(m => m.year === yr);
    const revenue = slice.reduce((s, m) => s + m.revenue, 0);
    const prevRevenue = i > 0 ? monthly.filter(m => m.year === yr - 1).reduce((s, m) => s + m.revenue, 0) : null;
    const revenueGrowth = prevRevenue !== null && prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : undefined;
    return {
      year: yr,
      revenue,
      totalRevenue: revenue,
      customers: yearlyRevenues[i].customers,
      revenueGrowth,
      marketShare: captureRates[i],
    };
  });

  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);

  return { approach: 'top-down', businessModel: model, monthly, yearly, tam: inputs.tam, sam, som, cagr, totalThreeYearRevenue };
}

// ── Bottom-Up Engines ───────────────────────────────────────────────────────
function buildYearlySummary(monthly: MonthlyDataPoint[]): YearSummary[] {
  const yearly: YearSummary[] = [1, 2, 3].map(yr => {
    const slice = monthly.filter(m => m.year === yr);
    const revenue = slice.reduce((s, m) => s + m.revenue, 0);
    const customers = slice.length > 0 ? slice[slice.length - 1].customers : 0;
    const gmv = slice.some(m => m.gmv !== undefined)
      ? slice.reduce((s, m) => s + (m.gmv ?? 0), 0)
      : undefined;
    return { year: yr, revenue, totalRevenue: revenue, customers, gmv };
  });
  for (let i = 1; i < yearly.length; i++) {
    const prev = yearly[i - 1].revenue;
    yearly[i].revenueGrowth = prev > 0 ? ((yearly[i].revenue - prev) / prev) * 100 : 0;
    const prevC = yearly[i - 1].customers;
    yearly[i].customersGrowth = prevC > 0 ? ((yearly[i].customers - prevC) / prevC) * 100 : 0;
  }
  return yearly;
}

function enrichMonthly(raw: { month: number; revenue: number; customers: number; gmv?: number }[]): MonthlyDataPoint[] {
  let cumulative = 0;
  return raw.map(m => {
    cumulative += m.revenue;
    return {
      ...m,
      year: Math.floor((m.month - 1) / 12) + 1,
      monthInYear: ((m.month - 1) % 12) + 1,
      cumulativeRevenue: cumulative,
    };
  });
}

function computeSaaS(inputs: SaaSBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number }[] = [];
  let customers = inputs.startingCustomers;
  let newPerMonth = inputs.newCustomersPerMonth;

  for (let m = 1; m <= 36; m++) {
    const churned = Math.round(customers * (inputs.monthlyChurnRate / 100));
    customers = Math.max(0, customers - churned + Math.round(newPerMonth));
    const mrr = customers * inputs.avgMRRPerCustomer * (1 + inputs.expansionRevenuePct / 100);
    raw.push({ month: m, revenue: mrr, customers });
    newPerMonth = newPerMonth * (1 + inputs.monthlyGrowthRate / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'saas', monthly, yearly, cagr, totalThreeYearRevenue };
}

function computeEcommerce(inputs: EcommerceBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number }[] = [];
  let orders = inputs.startingMonthlyOrders;

  for (let m = 1; m <= 36; m++) {
    const netOrders = orders * (1 - inputs.returnRate / 100);
    const revenue = netOrders * inputs.avgOrderValue;
    raw.push({ month: m, revenue, customers: Math.round(orders) });
    orders = orders * (1 + inputs.orderGrowthRateMoM / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'ecommerce', monthly, yearly, cagr, totalThreeYearRevenue };
}

function computeMarketplace(inputs: MarketplaceBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number; gmv: number }[] = [];
  let gmv = inputs.startingMonthlyGMV;

  for (let m = 1; m <= 36; m++) {
    const revenue = gmv * (inputs.takeRate / 100);
    raw.push({ month: m, revenue, customers: 0, gmv });
    gmv = gmv * (1 + inputs.gmvGrowthRateMoM / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'marketplace', monthly, yearly, cagr, totalThreeYearRevenue };
}

function computeAgency(inputs: AgencyBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number }[] = [];
  let clients = inputs.startingClients;
  let newPerMonth = inputs.newClientsPerMonth;

  for (let m = 1; m <= 36; m++) {
    const churned = Math.round(clients * (inputs.clientChurnRateMonthly / 100));
    clients = Math.max(0, clients - churned + Math.round(newPerMonth));
    const retainerRevenue = clients * inputs.avgMonthlyRetainer;
    const revenue = retainerRevenue * (1 + inputs.projectRevenuePct / 100);
    raw.push({ month: m, revenue, customers: clients });
    newPerMonth = newPerMonth * (1 + inputs.clientGrowthRateMoM / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'agency', monthly, yearly, cagr, totalThreeYearRevenue };
}

function computeHardware(inputs: HardwareBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number }[] = [];
  let units = inputs.startingMonthlyUnits;
  let cumulativeUnits = 0;

  for (let m = 1; m <= 36; m++) {
    cumulativeUnits += Math.round(units);
    const hardwareRevenue = Math.round(units) * (inputs.avgSellingPrice - inputs.cogs);
    const recurringRevenue = cumulativeUnits * inputs.recurringRevenuePerUnit;
    const revenue = hardwareRevenue + recurringRevenue;
    raw.push({ month: m, revenue, customers: Math.round(units) });
    units = units * (1 + inputs.unitGrowthRateMoM / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'hardware', monthly, yearly, cagr, totalThreeYearRevenue };
}

function computeProcurement(inputs: ProcurementBottomUp): ProjectionOutput {
  const raw: { month: number; revenue: number; customers: number; gmv: number }[] = [];
  let pvf = inputs.startingMonthlyPVF;

  for (let m = 1; m <= 36; m++) {
    const revenue = pvf * (inputs.takeRate / 100);
    raw.push({ month: m, revenue, customers: Math.round(pvf / inputs.avgOrderValue), gmv: pvf });
    pvf = pvf * (1 + inputs.pvfGrowthRateMoM / 100);
  }

  const monthly = enrichMonthly(raw);
  const yearly = buildYearlySummary(monthly);
  const cagr = calcCagr(yearly[0].revenue, yearly[2].revenue);
  const totalThreeYearRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  return { approach: 'bottom-up', businessModel: 'procurement', monthly, yearly, cagr, totalThreeYearRevenue };
}

export function computeBottomUp(inputs: BottomUpInputs): ProjectionOutput {
  switch (inputs.model) {
    case 'saas':        return computeSaaS(inputs);
    case 'ecommerce':   return computeEcommerce(inputs);
    case 'marketplace': return computeMarketplace(inputs);
    case 'agency':      return computeAgency(inputs);
    case 'hardware':    return computeHardware(inputs);
    case 'procurement': return computeProcurement(inputs);
  }
}

// ── Default Inputs per Model ─────────────────────────────────────────────────
export const DEFAULT_TOP_DOWN: TopDownInputs = {
  tam: 1_000_000_000,
  samPct: 5,
  somPct: 10,
  captureY1: 1,
  captureY2: 3,
  captureY3: 7,
  avgDealSize: 1200,
  currency: 'USD',
};

export const DEFAULT_BOTTOM_UP: Record<BusinessModel, BottomUpInputs> = {
  saas: { model: 'saas', startingCustomers: 10, newCustomersPerMonth: 5, monthlyGrowthRate: 10, avgMRRPerCustomer: 99, monthlyChurnRate: 3, expansionRevenuePct: 5, currency: 'USD' },
  ecommerce: { model: 'ecommerce', startingMonthlyOrders: 50, orderGrowthRateMoM: 8, avgOrderValue: 80, returnRate: 5, repeatPurchaseRate: 20, currency: 'USD' },
  marketplace: { model: 'marketplace', startingMonthlyGMV: 50000, gmvGrowthRateMoM: 12, takeRate: 10, currency: 'USD' },
  agency: { model: 'agency', startingClients: 3, newClientsPerMonth: 1, clientGrowthRateMoM: 10, avgMonthlyRetainer: 3000, clientChurnRateMonthly: 3, projectRevenuePct: 20, currency: 'USD' },
  hardware: { model: 'hardware', startingMonthlyUnits: 20, unitGrowthRateMoM: 8, avgSellingPrice: 299, cogs: 120, recurringRevenuePerUnit: 9.99, currency: 'USD' },
  procurement: { model: 'procurement', startingMonthlyPVF: 100000, pvfGrowthRateMoM: 15, takeRate: 8, avgOrderValue: 5000, buyerRetentionRate: 80, currency: 'USD' },
};

// ── Model Display Metadata ───────────────────────────────────────────────────
export const MODEL_META: Record<BusinessModel, { label: string; labelAr: string; northStar: string; revenueLabel: string; customerLabel: string }> = {
  saas:        { label: 'SaaS',                          labelAr: 'برمجيات كخدمة',           northStar: 'ARR',                    revenueLabel: 'MRR',              customerLabel: 'Customers' },
  ecommerce:   { label: 'E-commerce',                    labelAr: 'تجارة إلكترونية',          northStar: 'Monthly Revenue',        revenueLabel: 'Revenue',          customerLabel: 'Orders' },
  marketplace: { label: 'Marketplace',                   labelAr: 'منصة تجارية',              northStar: 'GMV',                    revenueLabel: 'Net Revenue',      customerLabel: 'GMV ($)' },
  agency:      { label: 'Agency / Services',             labelAr: 'وكالة / خدمات',            northStar: 'Monthly Retainer MRR',   revenueLabel: 'Revenue',          customerLabel: 'Clients' },
  hardware:    { label: 'Hardware / IoT',                labelAr: 'أجهزة / إنترنت الأشياء',   northStar: 'Units Shipped',          revenueLabel: 'Revenue',          customerLabel: 'Units' },
  procurement: { label: 'Procurement-as-a-Service',      labelAr: 'المشتريات كخدمة',          northStar: 'Procurement Volume (PVF)', revenueLabel: 'Service Fee Revenue', customerLabel: 'Orders' },
};
