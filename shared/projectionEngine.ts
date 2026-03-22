/**
 * Financial Projection Engine — Best-Practice CFO/VC Model
 *
 * Architecture:
 *  1. Driver-based revenue model (unit economics per business model)
 *  2. Full P&L: Revenue → COGS → Gross Profit → OPEX → EBITDA → Net Income
 *  3. Headcount plan (team + hiring schedule)
 *  4. Burn rate & runway
 *  5. Multi-scenario: Bear / Base / Bull
 *  6. Working capital basics (AR days, AP days)
 *  7. Key SaaS/startup metrics: ARR, MRR, CAC, LTV, LTV:CAC, Payback Period
 *
 * All calculations are pure (no side effects). Inputs are validated at call site.
 */

// ─── Business Models ────────────────────────────────────────────────────────
export type BusinessModel =
  | 'saas'
  | 'ecommerce'
  | 'marketplace'
  | 'agency'
  | 'hardware'
  | 'procurement';

// ─── Scenarios ──────────────────────────────────────────────────────────────
export type Scenario = 'bear' | 'base' | 'bull';

// ─── Revenue Driver Inputs (per business model) ──────────────────────────────
export interface SaaSDrivers {
  model: 'saas';
  // Acquisition
  startingCustomers: number;         // customers at month 0
  newCustomersM1: number;            // new customers in month 1
  monthlyNewCustomerGrowth: number;  // % MoM growth in new customers
  // Pricing
  avgMRRPerCustomer: number;         // $ MRR per customer
  annualPriceIncreasePct: number;    // % annual price increase
  // Retention
  monthlyChurnRate: number;          // % customers churning per month
  expansionRevenuePct: number;       // % of MRR from upsell/expansion
  // Unit economics
  cacPerCustomer: number;            // $ blended CAC per new customer
  grossMarginPct: number;            // % gross margin on subscription revenue
}

export interface EcommerceDrivers {
  model: 'ecommerce';
  startingMonthlyOrders: number;
  orderGrowthMoM: number;            // % MoM
  avgOrderValue: number;             // $
  returnRate: number;                // % of orders returned
  cogsAsPctOfRevenue: number;        // % COGS
  cacPerOrder: number;               // $ blended CAC
}

export interface MarketplaceDrivers {
  model: 'marketplace';
  startingMonthlyGMV: number;        // $
  gmvGrowthMoM: number;              // % MoM
  takeRate: number;                  // % of GMV
  paymentProcessingCost: number;     // % of GMV (COGS)
  cacPerBuyer: number;               // $ blended CAC
}

export interface AgencyDrivers {
  model: 'agency';
  startingClients: number;
  newClientsPerMonth: number;
  clientGrowthMoM: number;           // % MoM growth in new clients
  avgMonthlyRetainer: number;        // $ per client per month
  clientChurnMonthly: number;        // % per month
  projectRevenuePct: number;         // % additional from one-off projects
  deliveryCostPct: number;           // % of revenue (COGS: salaries of delivery team)
  cacPerClient: number;              // $ blended CAC
}

export interface HardwareDrivers {
  model: 'hardware';
  startingMonthlyUnits: number;
  unitGrowthMoM: number;             // % MoM
  avgSellingPrice: number;           // $ per unit
  cogsPerUnit: number;               // $ per unit
  recurringRevenuePerUnit: number;   // $ per month per installed unit
  recurringCostPct: number;          // % of recurring revenue (COGS)
  cacPerUnit: number;                // $ blended CAC
}

export interface ProcurementDrivers {
  model: 'procurement';
  startingMonthlyPVF: number;        // Procurement Volume Facilitated $
  pvfGrowthMoM: number;              // % MoM
  takeRate: number;                  // % of PVF
  operationalCostPct: number;        // % of revenue (COGS)
  avgOrderValue: number;             // $ per order
  cacPerBuyer: number;               // $ blended CAC
}

export type RevenueDrivers =
  | SaaSDrivers
  | EcommerceDrivers
  | MarketplaceDrivers
  | AgencyDrivers
  | HardwareDrivers
  | ProcurementDrivers;

// ─── Headcount Plan ──────────────────────────────────────────────────────────
export interface HeadcountRole {
  title: string;
  department: 'engineering' | 'sales' | 'marketing' | 'operations' | 'gna'; // G&A
  monthlySalary: number;             // $ per month (fully-loaded)
  startMonth: number;                // 1–36
  endMonth?: number;                 // optional termination month
}

// ─── OPEX Plan ───────────────────────────────────────────────────────────────
export interface OPEXInputs {
  // Sales & Marketing (non-headcount)
  marketingBudgetM1: number;         // $ in month 1
  marketingGrowthMoM: number;        // % MoM growth
  // G&A
  rentMonthly: number;               // $ per month
  softwareToolsMonthly: number;      // $ per month
  legalAccountingMonthly: number;    // $ per month
  otherGAMonthly: number;            // $ per month
  // R&D (non-headcount)
  rdBudgetMonthly: number;           // $ per month
}

// ─── Capital & Funding ───────────────────────────────────────────────────────
export interface CapitalInputs {
  startingCash: number;              // $ cash on hand at month 0
  fundingRounds?: {
    month: number;                   // month when funding arrives
    amount: number;                  // $ raised
  }[];
}

// ─── Working Capital ─────────────────────────────────────────────────────────
export interface WorkingCapitalInputs {
  arDays: number;                    // days to collect receivables (DSO)
  apDays: number;                    // days to pay suppliers (DPO)
  inventoryDays?: number;            // days of inventory (for hardware/ecommerce)
}

// ─── Scenario Multipliers ────────────────────────────────────────────────────
export interface ScenarioMultipliers {
  revenueMultiplier: number;         // e.g., 0.7 for bear, 1.0 for base, 1.3 for bull
  cogsMultiplier: number;            // e.g., 1.1 for bear (higher costs), 1.0 for base
  opexMultiplier: number;            // e.g., 0.9 for bear (cut spending), 1.0 for base
  growthMultiplier: number;          // multiplier on growth rates
}

export const SCENARIO_DEFAULTS: Record<Scenario, ScenarioMultipliers> = {
  bear: { revenueMultiplier: 0.65, cogsMultiplier: 1.10, opexMultiplier: 0.85, growthMultiplier: 0.60 },
  base: { revenueMultiplier: 1.00, cogsMultiplier: 1.00, opexMultiplier: 1.00, growthMultiplier: 1.00 },
  bull: { revenueMultiplier: 1.45, cogsMultiplier: 0.95, opexMultiplier: 1.10, growthMultiplier: 1.50 },
};

// ─── Full Model Inputs ───────────────────────────────────────────────────────
export type YearHorizon = 3 | 5 | 10;

export interface FinancialModelInputs {
  companyName: string;
  currency: string;
  startYear: number;                 // e.g., 2025
  yearHorizon: YearHorizon;          // 3 | 5 | 10
  revenueDrivers: RevenueDrivers;
  headcount: HeadcountRole[];
  opex: OPEXInputs;
  capital: CapitalInputs;
  workingCapital: WorkingCapitalInputs;
  scenario: Scenario;
  customScenarioMultipliers?: ScenarioMultipliers;
}

// ─── Output Types ────────────────────────────────────────────────────────────
export interface MonthlyPnL {
  month: number;                     // 1–36
  year: number;                      // 1, 2, or 3
  monthInYear: number;               // 1–12
  label: string;                     // e.g., "Jan 2025"

  // Revenue
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;

  // OPEX breakdown
  headcountCost: number;
  marketingSpend: number;
  rdSpend: number;
  gaSpend: number;
  totalOpex: number;

  // P&L
  ebitda: number;
  ebitdaMarginPct: number;
  netIncome: number;                 // EBITDA (no D&A/taxes at this stage)

  // Cash
  cashBurn: number;                  // negative = burning cash
  cashBalance: number;
  runway: number;                    // months of runway remaining (if burning)

  // Unit economics
  customers: number;
  newCustomers: number;
  churned?: number;
  mrr?: number;
  arr?: number;
  gmv?: number;
  cac?: number;
  ltv?: number;
  ltvCacRatio?: number;
  cacPaybackMonths?: number;

  // Working capital
  accountsReceivable: number;
  accountsPayable: number;
}

export interface YearlySummary {
  year: number;
  label: string;                     // e.g., "Year 1 (2025)"

  // P&L
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  totalOpex: number;
  ebitda: number;
  ebitdaMarginPct: number;
  netIncome: number;

  // Growth
  revenueGrowthPct?: number;
  customerGrowthPct?: number;

  // Cash
  totalCashBurned: number;
  endingCashBalance: number;
  minCashBalance: number;

  // Customers
  startCustomers: number;
  endCustomers: number;
  totalNewCustomers: number;
  avgCustomers: number;

  // Unit economics
  avgMRR?: number;
  endARR?: number;
  avgCAC?: number;
  avgLTV?: number;
  avgLtvCac?: number;
}

export interface FinancialModelOutput {
  scenario: Scenario;
  businessModel: BusinessModel;
  currency: string;
  monthly: MonthlyPnL[];
  yearly: YearlySummary[];

  // Summary KPIs
  totalRevenue3Y: number;
  totalGrossProfit3Y: number;
  totalEbitda3Y: number;
  totalCashBurned3Y: number;
  cagr?: number;
  breakEvenMonth?: number;           // first month EBITDA > 0
  defaultRunwayMonths?: number;      // runway at end of model (if still burning)

  // Top-level unit economics
  ltv?: number;
  cac?: number;
  ltvCacRatio?: number;
}

// ─── Month Label Helper ──────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(startYear: number, monthIndex: number): string {
  const totalMonth = monthIndex - 1;
  const year = startYear + Math.floor(totalMonth / 12);
  const month = totalMonth % 12;
  return `${MONTHS[month]} ${year}`;
}

// ─── Revenue Engine ──────────────────────────────────────────────────────────
interface RevenuePoint {
  revenue: number;
  cogs: number;
  customers: number;
  newCustomers: number;
  churned?: number;
  mrr?: number;
  gmv?: number;
  cac?: number;
  ltv?: number;
}

function computeRevenueStream(
  drivers: RevenueDrivers,
  multipliers: ScenarioMultipliers,
  totalMonths: number = 36
): RevenuePoint[] {
  const points: RevenuePoint[] = [];

  switch (drivers.model) {
    case 'saas': {
      let customers = drivers.startingCustomers;
      let newPerMonth = drivers.newCustomersM1;
      let mrr = customers * drivers.avgMRRPerCustomer;
      const growthRate = drivers.monthlyNewCustomerGrowth * multipliers.growthMultiplier;
      const churn = drivers.monthlyChurnRate;
      const priceGrowthPerMonth = Math.pow(1 + drivers.annualPriceIncreasePct / 100, 1 / 12) - 1;
      let priceMultiplier = 1;

      for (let m = 1; m <= totalMonths; m++) {
        const churned = Math.round(customers * (churn / 100));
        const added = Math.round(newPerMonth);
        customers = Math.max(0, customers - churned + added);
        if (m % 12 === 0) priceMultiplier *= (1 + drivers.annualPriceIncreasePct / 100);
        const effectiveMRR = customers * drivers.avgMRRPerCustomer * priceMultiplier;
        mrr = effectiveMRR * (1 + drivers.expansionRevenuePct / 100);
        const revenue = mrr * multipliers.revenueMultiplier;
        const cogs = revenue * (1 - drivers.grossMarginPct / 100) * multipliers.cogsMultiplier;
        const ltv = drivers.monthlyChurnRate > 0
          ? (drivers.avgMRRPerCustomer * (drivers.grossMarginPct / 100)) / (drivers.monthlyChurnRate / 100)
          : drivers.avgMRRPerCustomer * 36;
        points.push({
          revenue,
          cogs,
          customers,
          newCustomers: added,
          churned,
          mrr: revenue,
          cac: drivers.cacPerCustomer,
          ltv,
        });
        newPerMonth = newPerMonth * (1 + growthRate / 100);
      }
      break;
    }

    case 'ecommerce': {
      let orders = drivers.startingMonthlyOrders;
      const growthRate = drivers.orderGrowthMoM * multipliers.growthMultiplier;
      for (let m = 1; m <= totalMonths; m++) {
        const netOrders = orders * (1 - drivers.returnRate / 100);
        const revenue = netOrders * drivers.avgOrderValue * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.cogsAsPctOfRevenue / 100) * multipliers.cogsMultiplier;
        points.push({ revenue, cogs, customers: Math.round(orders), newCustomers: Math.round(orders * 0.4), cac: drivers.cacPerOrder });
        orders = orders * (1 + growthRate / 100);
      }
      break;
    }

    case 'marketplace': {
      let gmv = drivers.startingMonthlyGMV;
      const growthRate = drivers.gmvGrowthMoM * multipliers.growthMultiplier;
      for (let m = 1; m <= totalMonths; m++) {
        const revenue = gmv * (drivers.takeRate / 100) * multipliers.revenueMultiplier;
        const cogs = gmv * (drivers.paymentProcessingCost / 100) * multipliers.cogsMultiplier;
        points.push({ revenue, cogs, customers: 0, newCustomers: 0, gmv, cac: drivers.cacPerBuyer });
        gmv = gmv * (1 + growthRate / 100);
      }
      break;
    }

    case 'agency': {
      let clients = drivers.startingClients;
      let newPerMonth = drivers.newClientsPerMonth;
      const growthRate = drivers.clientGrowthMoM * multipliers.growthMultiplier;
      for (let m = 1; m <= totalMonths; m++) {
        const churned = Math.round(clients * (drivers.clientChurnMonthly / 100));
        const added = Math.round(newPerMonth);
        clients = Math.max(0, clients - churned + added);
        const retainer = clients * drivers.avgMonthlyRetainer;
        const revenue = retainer * (1 + drivers.projectRevenuePct / 100) * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.deliveryCostPct / 100) * multipliers.cogsMultiplier;
        points.push({ revenue, cogs, customers: clients, newCustomers: added, churned, cac: drivers.cacPerClient });
        newPerMonth = newPerMonth * (1 + growthRate / 100);
      }
      break;
    }

    case 'hardware': {
      let units = drivers.startingMonthlyUnits;
      let cumulativeUnits = 0;
      const growthRate = drivers.unitGrowthMoM * multipliers.growthMultiplier;
      for (let m = 1; m <= totalMonths; m++) {
        const soldUnits = Math.round(units);
        cumulativeUnits += soldUnits;
        const hwRevenue = soldUnits * drivers.avgSellingPrice * multipliers.revenueMultiplier;
        const hwCogs = soldUnits * drivers.cogsPerUnit * multipliers.cogsMultiplier;
        const recurringRev = cumulativeUnits * drivers.recurringRevenuePerUnit * multipliers.revenueMultiplier;
        const recurringCogs = recurringRev * (drivers.recurringCostPct / 100) * multipliers.cogsMultiplier;
        points.push({
          revenue: hwRevenue + recurringRev,
          cogs: hwCogs + recurringCogs,
          customers: soldUnits,
          newCustomers: soldUnits,
          cac: drivers.cacPerUnit,
        });
        units = units * (1 + growthRate / 100);
      }
      break;
    }

    case 'procurement': {
      let pvf = drivers.startingMonthlyPVF;
      const growthRate = drivers.pvfGrowthMoM * multipliers.growthMultiplier;
      for (let m = 1; m <= totalMonths; m++) {
        const revenue = pvf * (drivers.takeRate / 100) * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.operationalCostPct / 100) * multipliers.cogsMultiplier;
        const orders = Math.round(pvf / drivers.avgOrderValue);
        points.push({ revenue, cogs, customers: orders, newCustomers: Math.round(orders * 0.3), gmv: pvf, cac: drivers.cacPerBuyer });
        pvf = pvf * (1 + growthRate / 100);
      }
      break;
    }
  }

  return points;
}

// ─── Headcount Cost Engine ───────────────────────────────────────────────────
function computeHeadcountCost(headcount: HeadcountRole[], month: number): number {
  return headcount
    .filter(h => h.startMonth <= month && (!h.endMonth || h.endMonth >= month))
    .reduce((sum, h) => sum + h.monthlySalary, 0);
}

// ─── OPEX Engine ─────────────────────────────────────────────────────────────
function computeOPEX(opex: OPEXInputs, month: number, multipliers: ScenarioMultipliers) {
  const mktGrowth = Math.pow(1 + opex.marketingGrowthMoM / 100, month - 1);
  const marketing = opex.marketingBudgetM1 * mktGrowth * multipliers.opexMultiplier;
  const rd = opex.rdBudgetMonthly * multipliers.opexMultiplier;
  const ga = (opex.rentMonthly + opex.softwareToolsMonthly + opex.legalAccountingMonthly + opex.otherGAMonthly) * multipliers.opexMultiplier;
  return { marketing, rd, ga };
}

// ─── Main Compute Function ───────────────────────────────────────────────────
export function computeFinancialModel(inputs: FinancialModelInputs): FinancialModelOutput {
  const multipliers = inputs.customScenarioMultipliers ?? SCENARIO_DEFAULTS[inputs.scenario];
  const totalMonths = inputs.yearHorizon * 12;
  const revenueStream = computeRevenueStream(inputs.revenueDrivers, multipliers, totalMonths);

  const monthly: MonthlyPnL[] = [];
  let cashBalance = inputs.capital.startingCash;
  let breakEvenMonth: number | undefined;

  for (let m = 1; m <= totalMonths; m++) {
    const rev = revenueStream[m - 1];
    const { marketing, rd, ga } = computeOPEX(inputs.opex, m, multipliers);
    const headcountCost = computeHeadcountCost(inputs.headcount, m) * multipliers.opexMultiplier;

    // Funding injection
    const funding = inputs.capital.fundingRounds?.filter(f => f.month === m).reduce((s, f) => s + f.amount, 0) ?? 0;

    const grossProfit = rev.revenue - rev.cogs;
    const grossMarginPct = rev.revenue > 0 ? (grossProfit / rev.revenue) * 100 : 0;
    const totalOpex = headcountCost + marketing + rd + ga;
    const ebitda = grossProfit - totalOpex;
    const ebitdaMarginPct = rev.revenue > 0 ? (ebitda / rev.revenue) * 100 : 0;

    // Cash: EBITDA is a proxy for operating cash flow here (simplified)
    const cashBurn = ebitda;
    cashBalance = cashBalance + cashBurn + funding;

    // Working capital
    const arDays = inputs.workingCapital.arDays;
    const apDays = inputs.workingCapital.apDays;
    const accountsReceivable = (rev.revenue / 30) * arDays;
    const accountsPayable = (rev.cogs / 30) * apDays;

    // Runway: how many months of cash left at current burn rate
    const avgMonthlyBurn = cashBurn < 0 ? Math.abs(cashBurn) : 0;
    const runway = avgMonthlyBurn > 0 ? Math.floor(cashBalance / avgMonthlyBurn) : 999;

    // LTV:CAC
    const ltv = rev.ltv;
    const cac = rev.cac;
    const ltvCacRatio = ltv && cac && cac > 0 ? ltv / cac : undefined;
    const cacPaybackMonths = cac && rev.mrr && rev.mrr > 0 && rev.customers > 0
      ? cac / (rev.mrr / rev.customers)
      : undefined;

    if (!breakEvenMonth && ebitda > 0) breakEvenMonth = m;

    const year = Math.floor((m - 1) / 12) + 1;
    const monthInYear = ((m - 1) % 12) + 1;

    monthly.push({
      month: m,
      year,
      monthInYear,
      label: monthLabel(inputs.startYear, m),
      revenue: rev.revenue,
      cogs: rev.cogs,
      grossProfit,
      grossMarginPct,
      headcountCost,
      marketingSpend: marketing,
      rdSpend: rd,
      gaSpend: ga,
      totalOpex,
      ebitda,
      ebitdaMarginPct,
      netIncome: ebitda,
      cashBurn,
      cashBalance,
      runway,
      customers: rev.customers,
      newCustomers: rev.newCustomers,
      churned: rev.churned,
      mrr: rev.mrr,
      arr: rev.mrr ? rev.mrr * 12 : undefined,
      gmv: rev.gmv,
      cac,
      ltv,
      ltvCacRatio,
      cacPaybackMonths,
      accountsReceivable,
      accountsPayable,
    });
  }

  // Build yearly summaries
  const yearCount = inputs.yearHorizon;
  const yearNumbers = Array.from({ length: yearCount }, (_, i) => i + 1);
  const yearly: YearlySummary[] = yearNumbers.map(yr => {
    const slice = monthly.filter(m => m.year === yr);
    const prevSlice = yr > 1 ? monthly.filter(m => m.year === yr - 1) : null;

    const revenue = slice.reduce((s, m) => s + m.revenue, 0);
    const cogs = slice.reduce((s, m) => s + m.cogs, 0);
    const grossProfit = slice.reduce((s, m) => s + m.grossProfit, 0);
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const totalOpex = slice.reduce((s, m) => s + m.totalOpex, 0);
    const ebitda = slice.reduce((s, m) => s + m.ebitda, 0);
    const ebitdaMarginPct = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const netIncome = ebitda;
    const totalCashBurned = slice.filter(m => m.cashBurn < 0).reduce((s, m) => s + Math.abs(m.cashBurn), 0);
    const endingCashBalance = slice[slice.length - 1].cashBalance;
    const minCashBalance = Math.min(...slice.map(m => m.cashBalance));
    const startCustomers = slice[0].customers;
    const endCustomers = slice[slice.length - 1].customers;
    const totalNewCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
    const avgCustomers = slice.reduce((s, m) => s + m.customers, 0) / slice.length;

    const prevRevenue = prevSlice ? prevSlice.reduce((s, m) => s + m.revenue, 0) : null;
    const revenueGrowthPct = prevRevenue !== null && prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : undefined;
    const prevEndCustomers = prevSlice ? prevSlice[prevSlice.length - 1].customers : null;
    const customerGrowthPct = prevEndCustomers !== null && prevEndCustomers > 0 ? ((endCustomers - prevEndCustomers) / prevEndCustomers) * 100 : undefined;

    const avgMRR = slice.some(m => m.mrr) ? slice.reduce((s, m) => s + (m.mrr ?? 0), 0) / slice.length : undefined;
    const endARR = slice[slice.length - 1].arr;
    const avgCAC = slice.some(m => m.cac) ? slice.reduce((s, m) => s + (m.cac ?? 0), 0) / slice.length : undefined;
    const avgLTV = slice.some(m => m.ltv) ? slice.reduce((s, m) => s + (m.ltv ?? 0), 0) / slice.length : undefined;
    const avgLtvCac = avgLTV && avgCAC && avgCAC > 0 ? avgLTV / avgCAC : undefined;

    return {
      year: yr,
      label: `Year ${yr} (${inputs.startYear + yr - 1})`,
      revenue, cogs, grossProfit, grossMarginPct,
      totalOpex, ebitda, ebitdaMarginPct, netIncome,
      revenueGrowthPct, customerGrowthPct,
      totalCashBurned, endingCashBalance, minCashBalance,
      startCustomers, endCustomers, totalNewCustomers, avgCustomers,
      avgMRR, endARR, avgCAC, avgLTV, avgLtvCac,
    };
  });

  const totalRevenue3Y = yearly.reduce((s, y) => s + y.revenue, 0);
  const totalGrossProfit3Y = yearly.reduce((s, y) => s + y.grossProfit, 0);
  const totalEbitda3Y = yearly.reduce((s, y) => s + y.ebitda, 0);
  const totalCashBurned3Y = yearly.reduce((s, y) => s + y.totalCashBurned, 0);
  const lastYearIdx = yearly.length - 1;
  const cagr = yearly[0].revenue > 0 && lastYearIdx > 0
    ? (Math.pow(yearly[lastYearIdx].revenue / yearly[0].revenue, 1 / lastYearIdx) - 1) * 100
    : undefined;
  const lastMonth = monthly[monthly.length - 1];
  const defaultRunwayMonths = lastMonth.cashBalance < 0 ? 0 : lastMonth.runway;

  // Aggregate LTV/CAC
  const ltvSamples = monthly.filter(m => m.ltv).map(m => m.ltv!);
  const cacSamples = monthly.filter(m => m.cac).map(m => m.cac!);
  const ltv = ltvSamples.length > 0 ? ltvSamples[ltvSamples.length - 1] : undefined;
  const cac = cacSamples.length > 0 ? cacSamples[0] : undefined;
  const ltvCacRatio = ltv && cac && cac > 0 ? ltv / cac : undefined;

  return {
    scenario: inputs.scenario,
    businessModel: inputs.revenueDrivers.model,
    currency: inputs.currency,
    monthly,
    yearly,
    totalRevenue3Y,
    totalGrossProfit3Y,
    totalEbitda3Y,
    totalCashBurned3Y,
    cagr,
    breakEvenMonth,
    defaultRunwayMonths,
    ltv,
    cac,
    ltvCacRatio,
  };
}

// ─── Default Inputs ──────────────────────────────────────────────────────────
export const DEFAULT_HEADCOUNT: HeadcountRole[] = [
  { title: 'CEO / Co-Founder', department: 'gna', monthlySalary: 8000, startMonth: 1 },
  { title: 'CTO / Co-Founder', department: 'engineering', monthlySalary: 8000, startMonth: 1 },
  { title: 'Full-Stack Engineer', department: 'engineering', monthlySalary: 6000, startMonth: 3 },
  { title: 'Sales Lead', department: 'sales', monthlySalary: 5500, startMonth: 6 },
  { title: 'Marketing Manager', department: 'marketing', monthlySalary: 5000, startMonth: 9 },
  { title: 'Full-Stack Engineer #2', department: 'engineering', monthlySalary: 6000, startMonth: 13 },
  { title: 'Customer Success', department: 'operations', monthlySalary: 4500, startMonth: 13 },
  { title: 'Sales Rep', department: 'sales', monthlySalary: 4500, startMonth: 18 },
  { title: 'Product Manager', department: 'engineering', monthlySalary: 7000, startMonth: 19 },
  { title: 'Finance / Ops', department: 'gna', monthlySalary: 5000, startMonth: 24 },
];

export const DEFAULT_OPEX: OPEXInputs = {
  marketingBudgetM1: 3000,
  marketingGrowthMoM: 5,
  rentMonthly: 2000,
  softwareToolsMonthly: 1500,
  legalAccountingMonthly: 1000,
  otherGAMonthly: 500,
  rdBudgetMonthly: 1000,
};

export const DEFAULT_CAPITAL: CapitalInputs = {
  startingCash: 500000,
  fundingRounds: [
    { month: 12, amount: 1500000 },
  ],
};

export const DEFAULT_WORKING_CAPITAL: WorkingCapitalInputs = {
  arDays: 30,
  apDays: 45,
  inventoryDays: 0,
};

export const DEFAULT_REVENUE_DRIVERS: Record<BusinessModel, RevenueDrivers> = {
  saas: {
    model: 'saas',
    startingCustomers: 10,
    newCustomersM1: 5,
    monthlyNewCustomerGrowth: 10,
    avgMRRPerCustomer: 299,
    annualPriceIncreasePct: 5,
    monthlyChurnRate: 2.5,
    expansionRevenuePct: 8,
    cacPerCustomer: 1200,
    grossMarginPct: 75,
  },
  ecommerce: {
    model: 'ecommerce',
    startingMonthlyOrders: 100,
    orderGrowthMoM: 8,
    avgOrderValue: 120,
    returnRate: 8,
    cogsAsPctOfRevenue: 45,
    cacPerOrder: 25,
  },
  marketplace: {
    model: 'marketplace',
    startingMonthlyGMV: 100000,
    gmvGrowthMoM: 12,
    takeRate: 10,
    paymentProcessingCost: 2,
    cacPerBuyer: 50,
  },
  agency: {
    model: 'agency',
    startingClients: 5,
    newClientsPerMonth: 1,
    clientGrowthMoM: 8,
    avgMonthlyRetainer: 5000,
    clientChurnMonthly: 2,
    projectRevenuePct: 25,
    deliveryCostPct: 50,
    cacPerClient: 2000,
  },
  hardware: {
    model: 'hardware',
    startingMonthlyUnits: 30,
    unitGrowthMoM: 8,
    avgSellingPrice: 499,
    cogsPerUnit: 180,
    recurringRevenuePerUnit: 19.99,
    recurringCostPct: 20,
    cacPerUnit: 150,
  },
  procurement: {
    model: 'procurement',
    startingMonthlyPVF: 200000,
    pvfGrowthMoM: 15,
    takeRate: 6,
    operationalCostPct: 30,
    avgOrderValue: 8000,
    cacPerBuyer: 500,
  },
};

export const DEFAULT_MODEL_INPUTS = (model: BusinessModel, yearHorizon: YearHorizon = 3): FinancialModelInputs => ({
  companyName: 'My Startup',
  currency: 'USD',
  startYear: new Date().getFullYear(),
  yearHorizon,
  revenueDrivers: DEFAULT_REVENUE_DRIVERS[model],
  headcount: DEFAULT_HEADCOUNT,
  opex: DEFAULT_OPEX,
  capital: DEFAULT_CAPITAL,
  workingCapital: DEFAULT_WORKING_CAPITAL,
  scenario: 'base',
});

// ─── Model Display Metadata ──────────────────────────────────────────────────
export const MODEL_META: Record<BusinessModel, {
  label: string;
  labelAr: string;
  northStar: string;
  revenueLabel: string;
  customerLabel: string;
  keyMetrics: string[];
}> = {
  saas: {
    label: 'SaaS',
    labelAr: 'برمجيات كخدمة',
    northStar: 'ARR',
    revenueLabel: 'MRR',
    customerLabel: 'Customers',
    keyMetrics: ['MRR', 'ARR', 'Churn Rate', 'LTV', 'CAC', 'LTV:CAC', 'CAC Payback'],
  },
  ecommerce: {
    label: 'E-commerce',
    labelAr: 'تجارة إلكترونية',
    northStar: 'Monthly Revenue',
    revenueLabel: 'Revenue',
    customerLabel: 'Orders',
    keyMetrics: ['Orders', 'AOV', 'Return Rate', 'CAC', 'Gross Margin'],
  },
  marketplace: {
    label: 'Marketplace',
    labelAr: 'منصة تجارية',
    northStar: 'GMV',
    revenueLabel: 'Net Revenue',
    customerLabel: 'GMV',
    keyMetrics: ['GMV', 'Take Rate', 'Net Revenue', 'CAC', 'Gross Margin'],
  },
  agency: {
    label: 'Agency / Services',
    labelAr: 'وكالة / خدمات',
    northStar: 'MRR (Retainers)',
    revenueLabel: 'Revenue',
    customerLabel: 'Clients',
    keyMetrics: ['Clients', 'Avg Retainer', 'Churn', 'Utilization', 'Gross Margin'],
  },
  hardware: {
    label: 'Hardware / IoT',
    labelAr: 'أجهزة / إنترنت الأشياء',
    northStar: 'Units Shipped',
    revenueLabel: 'Revenue',
    customerLabel: 'Units',
    keyMetrics: ['Units Sold', 'ASP', 'Gross Margin', 'Recurring Revenue', 'Installed Base'],
  },
  procurement: {
    label: 'Procurement-as-a-Service',
    labelAr: 'المشتريات كخدمة',
    northStar: 'PVF',
    revenueLabel: 'Service Fee',
    customerLabel: 'Orders',
    keyMetrics: ['PVF', 'Take Rate', 'Orders', 'Gross Margin', 'CAC'],
  },
};

// ─── Legacy compatibility exports (used by old projectionRouter) ─────────────
export type BusinessModel_ = BusinessModel;
export type Approach = 'top-down' | 'bottom-up';
export type TopDownInputs = any;
export type BottomUpInputs = any;
export type MonthlyDataPoint = any;
export type YearSummary = any;
export type ProjectionOutput = any;
export const DEFAULT_TOP_DOWN: any = {};
export const DEFAULT_BOTTOM_UP: any = {};
export function computeTopDown(_inputs: any, _model: any): any { return null; }
export function computeBottomUp(_inputs: any): any { return null; }
