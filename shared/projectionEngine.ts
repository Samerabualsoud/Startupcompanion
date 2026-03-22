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
 * Business Models (15 total):
 *  1. SaaS — subscription software
 *  2. E-commerce — online retail
 *  3. Marketplace — two-sided platform
 *  4. Agency / Services — retainer + project
 *  5. Hardware / IoT — device + recurring
 *  6. Procurement-as-a-Service — B2B procurement facilitation
 *  7. Subscription (non-SaaS) — physical/content recurring
 *  8. Freemium — free-to-paid conversion funnel
 *  9. Usage-Based / Pay-as-you-go — volume × unit price
 * 10. Advertising / Media — MAU × CPM
 * 11. D2C / Retail — direct-to-consumer product
 * 12. Fintech / Lending — AUM, interest spread, transaction fees
 * 13. EdTech / Content — course enrollments × price
 * 14. On-Demand / Gig — bookings × take rate
 * 15. Real Estate / PropTech — units under management × fee
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
  | 'procurement'
  | 'subscription'
  | 'freemium'
  | 'usage_based'
  | 'advertising'
  | 'd2c'
  | 'fintech'
  | 'edtech'
  | 'on_demand'
  | 'proptech';

// ─── Scenarios ──────────────────────────────────────────────────────────────
export type Scenario = 'bear' | 'base' | 'bull';

// ─── Revenue Driver Inputs (per business model) ──────────────────────────────

export interface SaaSDrivers {
  model: 'saas';
  startingCustomers: number;
  newCustomersM1: number;
  monthlyNewCustomerGrowth: number;   // % MoM
  avgMRRPerCustomer: number;          // $
  annualPriceIncreasePct: number;     // %
  monthlyChurnRate: number;           // %
  expansionRevenuePct: number;        // % of MRR from upsell
  cacPerCustomer: number;             // $
  grossMarginPct: number;             // %
}

export interface EcommerceDrivers {
  model: 'ecommerce';
  startingMonthlyOrders: number;
  orderGrowthMoM: number;             // %
  avgOrderValue: number;              // $
  returnRate: number;                 // %
  cogsAsPctOfRevenue: number;         // %
  cacPerOrder: number;                // $
}

export interface MarketplaceDrivers {
  model: 'marketplace';
  startingMonthlyGMV: number;         // $
  gmvGrowthMoM: number;               // %
  takeRate: number;                   // % of GMV
  paymentProcessingCost: number;      // % of GMV (COGS)
  cacPerBuyer: number;                // $
}

export interface AgencyDrivers {
  model: 'agency';
  startingClients: number;
  newClientsPerMonth: number;
  clientGrowthMoM: number;            // %
  avgMonthlyRetainer: number;         // $
  clientChurnMonthly: number;         // %
  projectRevenuePct: number;          // % additional from one-off projects
  deliveryCostPct: number;            // % of revenue (COGS)
  cacPerClient: number;               // $
}

export interface HardwareDrivers {
  model: 'hardware';
  startingMonthlyUnits: number;
  unitGrowthMoM: number;              // %
  avgSellingPrice: number;            // $
  cogsPerUnit: number;                // $
  recurringRevenuePerUnit: number;    // $ per month per installed unit
  recurringCostPct: number;           // % of recurring revenue (COGS)
  cacPerUnit: number;                 // $
}

export interface ProcurementDrivers {
  model: 'procurement';
  startingMonthlyPVF: number;         // Procurement Volume Facilitated $
  pvfGrowthMoM: number;               // %
  takeRate: number;                   // % of PVF
  operationalCostPct: number;         // % of revenue (COGS)
  avgOrderValue: number;              // $
  cacPerBuyer: number;                // $
}

/** Model 7: Subscription (non-SaaS) — physical boxes, media, newsletters */
export interface SubscriptionDrivers {
  model: 'subscription';
  startingSubscribers: number;
  newSubscribersM1: number;
  subscriberGrowthMoM: number;        // %
  avgMonthlyFee: number;              // $ per subscriber
  monthlyChurnRate: number;           // %
  cogsPerSubscriber: number;          // $ per month (fulfillment, content cost)
  cacPerSubscriber: number;           // $
  annualPriceIncreasePct: number;     // %
}

/** Model 8: Freemium — free users + paid conversion */
export interface FreemiumDrivers {
  model: 'freemium';
  startingMAU: number;                // Monthly Active Users (free)
  mauGrowthMoM: number;               // %
  freeToPayConversionRate: number;    // % of MAU who convert to paid
  avgARPU: number;                    // $ per paying user per month
  monthlyChurnRate: number;           // % of paying users churning
  cogsAsPctOfRevenue: number;         // % (hosting, support, infra)
  cacPerPaidUser: number;             // $ blended CAC
  expansionRevenuePct: number;        // % upsell from existing paid users
}

/** Model 9: Usage-Based / Pay-as-you-go — API calls, compute, transactions */
export interface UsageBasedDrivers {
  model: 'usage_based';
  startingMonthlyUnits: number;       // API calls, transactions, GB, etc.
  unitGrowthMoM: number;              // %
  pricePerUnit: number;               // $ per unit
  cogsPctOfRevenue: number;           // % (infra, bandwidth, processing)
  startingActiveAccounts: number;     // number of paying accounts
  accountGrowthMoM: number;          // %
  avgUnitsPerAccount: number;         // units per account per month
  cacPerAccount: number;              // $
}

/** Model 10: Advertising / Media — content platform monetized via ads */
export interface AdvertisingDrivers {
  model: 'advertising';
  startingMAU: number;                // Monthly Active Users
  mauGrowthMoM: number;               // %
  avgSessionsPerUserPerMonth: number; // sessions
  pageViewsPerSession: number;        // pages/screens per session
  adFillRate: number;                 // % of ad slots filled
  cpmRate: number;                    // $ per 1000 impressions
  contentCostMonthly: number;         // $ per month (content production COGS)
  infrastructureCostPctRevenue: number; // % (hosting, CDN)
  cacPerUser: number;                 // $ blended (paid acquisition)
}

/** Model 11: D2C / Retail — direct-to-consumer physical or digital products */
export interface D2CDrivers {
  model: 'd2c';
  startingMonthlyNewCustomers: number;
  newCustomerGrowthMoM: number;       // %
  avgFirstOrderValue: number;         // $
  repeatPurchaseRate: number;         // % of customers who repurchase monthly
  avgRepeatOrderValue: number;        // $
  cogsAsPctOfRevenue: number;         // % (product cost + fulfillment)
  returnRate: number;                 // %
  cacPerCustomer: number;             // $
  existingCustomerBase: number;       // customers already in base at month 0
}

/** Model 12: Fintech / Lending — neobank, BNPL, lending, payments */
export interface FintechDrivers {
  model: 'fintech';
  startingAUM: number;                // $ Assets Under Management / Loan Book
  aumGrowthMoM: number;               // %
  netInterestMarginPct: number;       // % NIM (interest income - funding cost)
  transactionVolumeM1: number;        // $ monthly transaction volume
  transactionGrowthMoM: number;       // %
  transactionFeePct: number;          // % fee on transactions
  loanDefaultRatePct: number;         // % annual default rate (COGS equivalent)
  operationalCostPctRevenue: number;  // % (compliance, ops, tech)
  cacPerCustomer: number;             // $
  startingCustomers: number;
  customerGrowthMoM: number;          // %
}

/** Model 13: EdTech / Content — online courses, bootcamps, learning platforms */
export interface EdTechDrivers {
  model: 'edtech';
  startingMonthlyEnrollments: number;
  enrollmentGrowthMoM: number;        // %
  avgCoursePrice: number;             // $ per enrollment
  subscriptionRevenuePct: number;     // % of revenue from subscriptions (vs one-time)
  avgSubscriptionFee: number;         // $ per month for subscription users
  startingSubscribers: number;
  subscriberGrowthMoM: number;        // %
  subscriberChurnMonthly: number;     // %
  contentCostPctRevenue: number;      // % (instructor fees, content production)
  platformCostPctRevenue: number;     // % (hosting, video streaming)
  cacPerStudent: number;              // $
}

/** Model 14: On-Demand / Gig — ride-hailing, delivery, freelance platforms */
export interface OnDemandDrivers {
  model: 'on_demand';
  startingMonthlyBookings: number;
  bookingGrowthMoM: number;           // %
  avgBookingValue: number;            // $ per booking (gross)
  takeRate: number;                   // % platform fee
  paymentProcessingCost: number;      // % of GMV
  insuranceSafetyPct: number;         // % of revenue (insurance, safety, compliance)
  cacPerSupplySide: number;           // $ to acquire driver/freelancer/courier
  supplyGrowthMoM: number;            // % growth in supply-side workers
  startingSupplyCount: number;        // drivers/workers at month 0
}

/** Model 15: Real Estate / PropTech — property management, rental platforms */
export interface PropTechDrivers {
  model: 'proptech';
  startingUnitsUnderManagement: number;
  unitGrowthMoM: number;              // %
  avgMonthlyFeePerUnit: number;       // $ management fee per unit per month
  avgRentalYield: number;             // % annual rental yield (for revenue-share models)
  revenueSharePct: number;            // % of rental income taken as fee
  transactionFeePerLease: number;     // $ one-time fee per new lease
  newLeasesPerMonth: number;          // new leases signed per month
  leaseGrowthMoM: number;             // %
  operationalCostPctRevenue: number;  // % (property ops, maintenance coordination)
  cacPerUnit: number;                 // $ to onboard a new property/unit
}

export type RevenueDrivers =
  | SaaSDrivers
  | EcommerceDrivers
  | MarketplaceDrivers
  | AgencyDrivers
  | HardwareDrivers
  | ProcurementDrivers
  | SubscriptionDrivers
  | FreemiumDrivers
  | UsageBasedDrivers
  | AdvertisingDrivers
  | D2CDrivers
  | FintechDrivers
  | EdTechDrivers
  | OnDemandDrivers
  | PropTechDrivers;

// ─── Headcount Plan ──────────────────────────────────────────────────────────
export interface HeadcountRole {
  title: string;
  department: 'engineering' | 'sales' | 'marketing' | 'operations' | 'gna';
  monthlySalary: number;
  startMonth: number;
  endMonth?: number;
}

// ─── OPEX Plan ───────────────────────────────────────────────────────────────
export interface OPEXInputs {
  marketingBudgetM1: number;
  marketingGrowthMoM: number;         // %
  rentMonthly: number;
  softwareToolsMonthly: number;
  legalAccountingMonthly: number;
  otherGAMonthly: number;
  rdBudgetMonthly: number;
}

// ─── Capital & Funding ───────────────────────────────────────────────────────
export interface CapitalInputs {
  startingCash: number;
  fundingRounds?: {
    month: number;
    amount: number;
  }[];
}

// ─── Working Capital ─────────────────────────────────────────────────────────
export interface WorkingCapitalInputs {
  arDays: number;
  apDays: number;
  inventoryDays?: number;
}

// ─── Scenario Multipliers ────────────────────────────────────────────────────
export interface ScenarioMultipliers {
  revenueMultiplier: number;
  cogsMultiplier: number;
  opexMultiplier: number;
  growthMultiplier: number;
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
  startYear: number;
  yearHorizon: YearHorizon;
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
  month: number;
  year: number;
  monthInYear: number;
  label: string;

  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;

  headcountCost: number;
  marketingSpend: number;
  rdSpend: number;
  gaSpend: number;
  totalOpex: number;

  ebitda: number;
  ebitdaMarginPct: number;
  netIncome: number;

  cashBurn: number;
  cashBalance: number;
  runway: number;

  customers: number;
  newCustomers: number;
  churned?: number;
  mrr?: number;
  arr?: number;
  gmv?: number;
  mau?: number;
  cac?: number;
  ltv?: number;
  ltvCacRatio?: number;
  cacPaybackMonths?: number;

  accountsReceivable: number;
  accountsPayable: number;
}

export interface YearlySummary {
  year: number;
  label: string;

  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  totalOpex: number;
  ebitda: number;
  ebitdaMarginPct: number;
  netIncome: number;

  revenueGrowthPct?: number;
  customerGrowthPct?: number;

  totalCashBurned: number;
  endingCashBalance: number;
  minCashBalance: number;

  startCustomers: number;
  endCustomers: number;
  totalNewCustomers: number;
  avgCustomers: number;

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

  totalRevenue3Y: number;
  totalGrossProfit3Y: number;
  totalEbitda3Y: number;
  totalCashBurned3Y: number;
  cagr?: number;
  breakEvenMonth?: number;
  defaultRunwayMonths?: number;

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
  mau?: number;
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
    // ── 1. SaaS ──────────────────────────────────────────────────────────────
    case 'saas': {
      let customers = drivers.startingCustomers;
      let newPerMonth = drivers.newCustomersM1;
      const growthRate = drivers.monthlyNewCustomerGrowth * multipliers.growthMultiplier;
      const churn = drivers.monthlyChurnRate;
      let priceMultiplier = 1;

      for (let m = 1; m <= totalMonths; m++) {
        const churned = Math.round(customers * (churn / 100));
        const added = Math.round(newPerMonth);
        customers = Math.max(0, customers - churned + added);
        if (m % 12 === 0) priceMultiplier *= (1 + drivers.annualPriceIncreasePct / 100);
        const effectiveMRR = customers * drivers.avgMRRPerCustomer * priceMultiplier;
        const mrr = effectiveMRR * (1 + drivers.expansionRevenuePct / 100);
        const revenue = mrr * multipliers.revenueMultiplier;
        const cogs = revenue * (1 - drivers.grossMarginPct / 100) * multipliers.cogsMultiplier;
        const ltv = drivers.monthlyChurnRate > 0
          ? (drivers.avgMRRPerCustomer * (drivers.grossMarginPct / 100)) / (drivers.monthlyChurnRate / 100)
          : drivers.avgMRRPerCustomer * 36;
        points.push({ revenue, cogs, customers, newCustomers: added, churned, mrr: revenue, cac: drivers.cacPerCustomer, ltv });
        newPerMonth = newPerMonth * (1 + growthRate / 100);
      }
      break;
    }

    // ── 2. E-commerce ─────────────────────────────────────────────────────────
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

    // ── 3. Marketplace ────────────────────────────────────────────────────────
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

    // ── 4. Agency / Services ──────────────────────────────────────────────────
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

    // ── 5. Hardware / IoT ─────────────────────────────────────────────────────
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
        points.push({ revenue: hwRevenue + recurringRev, cogs: hwCogs + recurringCogs, customers: soldUnits, newCustomers: soldUnits, cac: drivers.cacPerUnit });
        units = units * (1 + growthRate / 100);
      }
      break;
    }

    // ── 6. Procurement-as-a-Service ───────────────────────────────────────────
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

    // ── 7. Subscription (non-SaaS) ────────────────────────────────────────────
    case 'subscription': {
      let subscribers = drivers.startingSubscribers;
      let newPerMonth = drivers.newSubscribersM1;
      const growthRate = drivers.subscriberGrowthMoM * multipliers.growthMultiplier;
      let priceMultiplier = 1;

      for (let m = 1; m <= totalMonths; m++) {
        const churned = Math.round(subscribers * (drivers.monthlyChurnRate / 100));
        const added = Math.round(newPerMonth);
        subscribers = Math.max(0, subscribers - churned + added);
        if (m % 12 === 0) priceMultiplier *= (1 + drivers.annualPriceIncreasePct / 100);
        const mrr = subscribers * drivers.avgMonthlyFee * priceMultiplier;
        const revenue = mrr * multipliers.revenueMultiplier;
        const cogs = subscribers * drivers.cogsPerSubscriber * multipliers.cogsMultiplier;
        const ltv = drivers.monthlyChurnRate > 0
          ? (drivers.avgMonthlyFee - drivers.cogsPerSubscriber) / (drivers.monthlyChurnRate / 100)
          : (drivers.avgMonthlyFee - drivers.cogsPerSubscriber) * 36;
        points.push({ revenue, cogs, customers: subscribers, newCustomers: added, churned, mrr: revenue, cac: drivers.cacPerSubscriber, ltv });
        newPerMonth = newPerMonth * (1 + growthRate / 100);
      }
      break;
    }

    // ── 8. Freemium ───────────────────────────────────────────────────────────
    case 'freemium': {
      let mau = drivers.startingMAU;
      let paidUsers = Math.round(mau * (drivers.freeToPayConversionRate / 100));
      const mauGrowth = drivers.mauGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        // MAU grows, paid users = conversion rate × MAU + expansion - churn
        const newPaid = Math.round(mau * (drivers.freeToPayConversionRate / 100) * 0.1); // 10% of convertible pool converts each month
        const churned = Math.round(paidUsers * (drivers.monthlyChurnRate / 100));
        paidUsers = Math.max(0, paidUsers - churned + newPaid);
        const mrr = paidUsers * drivers.avgARPU * (1 + drivers.expansionRevenuePct / 100);
        const revenue = mrr * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.cogsAsPctOfRevenue / 100) * multipliers.cogsMultiplier;
        const ltv = drivers.monthlyChurnRate > 0
          ? (drivers.avgARPU * (1 - drivers.cogsAsPctOfRevenue / 100)) / (drivers.monthlyChurnRate / 100)
          : drivers.avgARPU * 36;
        points.push({ revenue, cogs, customers: paidUsers, newCustomers: newPaid, churned, mrr: revenue, mau, cac: drivers.cacPerPaidUser, ltv });
        mau = mau * (1 + mauGrowth / 100);
      }
      break;
    }

    // ── 9. Usage-Based / Pay-as-you-go ────────────────────────────────────────
    case 'usage_based': {
      let accounts = drivers.startingActiveAccounts;
      const accountGrowth = drivers.accountGrowthMoM * multipliers.growthMultiplier;
      const unitGrowth = drivers.unitGrowthMoM * multipliers.growthMultiplier;
      let unitsPerAccount = drivers.avgUnitsPerAccount;

      for (let m = 1; m <= totalMonths; m++) {
        const newAccounts = Math.round(accounts * (accountGrowth / 100));
        accounts = accounts + newAccounts;
        unitsPerAccount = unitsPerAccount * (1 + unitGrowth / 100 / 12); // gradual growth
        const totalUnits = accounts * unitsPerAccount;
        const revenue = totalUnits * drivers.pricePerUnit * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.cogsPctOfRevenue / 100) * multipliers.cogsMultiplier;
        const ltv = drivers.cacPerAccount > 0 ? drivers.cacPerAccount * 3 : undefined; // simplified
        points.push({ revenue, cogs, customers: accounts, newCustomers: newAccounts, cac: drivers.cacPerAccount, ltv });
      }
      break;
    }

    // ── 10. Advertising / Media ───────────────────────────────────────────────
    case 'advertising': {
      let mau = drivers.startingMAU;
      const mauGrowth = drivers.mauGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const totalImpressions = mau * drivers.avgSessionsPerUserPerMonth * drivers.pageViewsPerSession * (drivers.adFillRate / 100);
        const revenue = (totalImpressions / 1000) * drivers.cpmRate * multipliers.revenueMultiplier;
        const cogs = (drivers.contentCostMonthly + revenue * (drivers.infrastructureCostPctRevenue / 100)) * multipliers.cogsMultiplier;
        points.push({ revenue, cogs, customers: 0, newCustomers: 0, mau, cac: drivers.cacPerUser });
        mau = mau * (1 + mauGrowth / 100);
      }
      break;
    }

    // ── 11. D2C / Retail ──────────────────────────────────────────────────────
    case 'd2c': {
      let newCustomersPerMonth = drivers.startingMonthlyNewCustomers;
      let existingCustomers = drivers.existingCustomerBase;
      const newCustGrowth = drivers.newCustomerGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const newCust = Math.round(newCustomersPerMonth);
        existingCustomers += newCust;
        // Revenue from new customers (first order) + repeat purchases from existing base
        const newRevenue = newCust * drivers.avgFirstOrderValue * (1 - drivers.returnRate / 100);
        const repeatRevenue = existingCustomers * (drivers.repeatPurchaseRate / 100) * drivers.avgRepeatOrderValue * (1 - drivers.returnRate / 100);
        const revenue = (newRevenue + repeatRevenue) * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.cogsAsPctOfRevenue / 100) * multipliers.cogsMultiplier;
        const ltv = drivers.avgRepeatOrderValue * (drivers.repeatPurchaseRate / 100) * 24 * (1 - drivers.cogsAsPctOfRevenue / 100); // 24-month LTV
        points.push({ revenue, cogs, customers: existingCustomers, newCustomers: newCust, cac: drivers.cacPerCustomer, ltv });
        newCustomersPerMonth = newCustomersPerMonth * (1 + newCustGrowth / 100);
      }
      break;
    }

    // ── 12. Fintech / Lending ─────────────────────────────────────────────────
    case 'fintech': {
      let aum = drivers.startingAUM;
      let txVolume = drivers.transactionVolumeM1;
      let customers = drivers.startingCustomers;
      const aumGrowth = drivers.aumGrowthMoM * multipliers.growthMultiplier;
      const txGrowth = drivers.transactionGrowthMoM * multipliers.growthMultiplier;
      const custGrowth = drivers.customerGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const interestIncome = aum * (drivers.netInterestMarginPct / 100 / 12); // monthly NIM
        const txFeeIncome = txVolume * (drivers.transactionFeePct / 100);
        const revenue = (interestIncome + txFeeIncome) * multipliers.revenueMultiplier;
        // COGS = loan defaults + operational cost
        const defaultCost = aum * (drivers.loanDefaultRatePct / 100 / 12);
        const opCost = revenue * (drivers.operationalCostPctRevenue / 100);
        const cogs = (defaultCost + opCost) * multipliers.cogsMultiplier;
        const newCust = Math.round(customers * (custGrowth / 100));
        points.push({ revenue, cogs, customers, newCustomers: newCust, cac: drivers.cacPerCustomer });
        aum = aum * (1 + aumGrowth / 100);
        txVolume = txVolume * (1 + txGrowth / 100);
        customers = customers + newCust;
      }
      break;
    }

    // ── 13. EdTech / Content ──────────────────────────────────────────────────
    case 'edtech': {
      let enrollments = drivers.startingMonthlyEnrollments;
      let subscribers = drivers.startingSubscribers;
      const enrollGrowth = drivers.enrollmentGrowthMoM * multipliers.growthMultiplier;
      const subGrowth = drivers.subscriberGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const courseRevenue = enrollments * drivers.avgCoursePrice * (1 - drivers.subscriptionRevenuePct / 100);
        const subRevenue = subscribers * drivers.avgSubscriptionFee;
        const revenue = (courseRevenue + subRevenue) * multipliers.revenueMultiplier;
        const cogs = revenue * ((drivers.contentCostPctRevenue + drivers.platformCostPctRevenue) / 100) * multipliers.cogsMultiplier;
        const newEnrollments = Math.round(enrollments * (enrollGrowth / 100));
        const churned = Math.round(subscribers * (drivers.subscriberChurnMonthly / 100));
        const newSubs = Math.round(subscribers * (subGrowth / 100));
        subscribers = Math.max(0, subscribers - churned + newSubs);
        const mrr = subRevenue * multipliers.revenueMultiplier;
        points.push({ revenue, cogs, customers: Math.round(enrollments + subscribers), newCustomers: newEnrollments + newSubs, churned, mrr, cac: drivers.cacPerStudent });
        enrollments = enrollments * (1 + enrollGrowth / 100);
      }
      break;
    }

    // ── 14. On-Demand / Gig ───────────────────────────────────────────────────
    case 'on_demand': {
      let bookings = drivers.startingMonthlyBookings;
      const bookingGrowth = drivers.bookingGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const gmv = bookings * drivers.avgBookingValue;
        const revenue = gmv * (drivers.takeRate / 100) * multipliers.revenueMultiplier;
        const cogs = (gmv * (drivers.paymentProcessingCost / 100) + revenue * (drivers.insuranceSafetyPct / 100)) * multipliers.cogsMultiplier;
        points.push({ revenue, cogs, customers: Math.round(bookings), newCustomers: Math.round(bookings * 0.2), gmv, cac: drivers.cacPerSupplySide });
        bookings = bookings * (1 + bookingGrowth / 100);
      }
      break;
    }

    // ── 15. Real Estate / PropTech ────────────────────────────────────────────
    case 'proptech': {
      let units = drivers.startingUnitsUnderManagement;
      let newLeases = drivers.newLeasesPerMonth;
      const unitGrowth = drivers.unitGrowthMoM * multipliers.growthMultiplier;
      const leaseGrowth = drivers.leaseGrowthMoM * multipliers.growthMultiplier;

      for (let m = 1; m <= totalMonths; m++) {
        const mgmtFeeRevenue = units * drivers.avgMonthlyFeePerUnit;
        const rentalIncome = units * drivers.avgMonthlyFeePerUnit * (drivers.avgRentalYield / 100 / 12) * (drivers.revenueSharePct / 100);
        const leasingRevenue = newLeases * drivers.transactionFeePerLease;
        const revenue = (mgmtFeeRevenue + rentalIncome + leasingRevenue) * multipliers.revenueMultiplier;
        const cogs = revenue * (drivers.operationalCostPctRevenue / 100) * multipliers.cogsMultiplier;
        const newUnits = Math.round(units * (unitGrowth / 100));
        points.push({ revenue, cogs, customers: units, newCustomers: newUnits, cac: drivers.cacPerUnit });
        units = units + newUnits;
        newLeases = newLeases * (1 + leaseGrowth / 100);
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

    const funding = inputs.capital.fundingRounds?.filter(f => f.month === m).reduce((s, f) => s + f.amount, 0) ?? 0;

    const grossProfit = rev.revenue - rev.cogs;
    const grossMarginPct = rev.revenue > 0 ? (grossProfit / rev.revenue) * 100 : 0;
    const totalOpex = headcountCost + marketing + rd + ga;
    const ebitda = grossProfit - totalOpex;
    const ebitdaMarginPct = rev.revenue > 0 ? (ebitda / rev.revenue) * 100 : 0;

    const cashBurn = ebitda;
    cashBalance = cashBalance + cashBurn + funding;

    const arDays = inputs.workingCapital.arDays;
    const apDays = inputs.workingCapital.apDays;
    const accountsReceivable = (rev.revenue / 30) * arDays;
    const accountsPayable = (rev.cogs / 30) * apDays;

    const avgMonthlyBurn = cashBurn < 0 ? Math.abs(cashBurn) : 0;
    const runway = avgMonthlyBurn > 0 ? Math.floor(cashBalance / avgMonthlyBurn) : 999;

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
      mau: rev.mau,
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
  subscription: {
    model: 'subscription',
    startingSubscribers: 500,
    newSubscribersM1: 100,
    subscriberGrowthMoM: 8,
    avgMonthlyFee: 29,
    monthlyChurnRate: 3,
    cogsPerSubscriber: 8,
    cacPerSubscriber: 40,
    annualPriceIncreasePct: 5,
  },
  freemium: {
    model: 'freemium',
    startingMAU: 5000,
    mauGrowthMoM: 15,
    freeToPayConversionRate: 5,
    avgARPU: 19,
    monthlyChurnRate: 4,
    cogsAsPctOfRevenue: 20,
    cacPerPaidUser: 30,
    expansionRevenuePct: 5,
  },
  usage_based: {
    model: 'usage_based',
    startingMonthlyUnits: 1000000,
    unitGrowthMoM: 10,
    pricePerUnit: 0.001,
    cogsPctOfRevenue: 30,
    startingActiveAccounts: 50,
    accountGrowthMoM: 12,
    avgUnitsPerAccount: 20000,
    cacPerAccount: 500,
  },
  advertising: {
    model: 'advertising',
    startingMAU: 50000,
    mauGrowthMoM: 20,
    avgSessionsPerUserPerMonth: 8,
    pageViewsPerSession: 5,
    adFillRate: 70,
    cpmRate: 3.5,
    contentCostMonthly: 15000,
    infrastructureCostPctRevenue: 20,
    cacPerUser: 2,
  },
  d2c: {
    model: 'd2c',
    startingMonthlyNewCustomers: 200,
    newCustomerGrowthMoM: 10,
    avgFirstOrderValue: 85,
    repeatPurchaseRate: 15,
    avgRepeatOrderValue: 65,
    cogsAsPctOfRevenue: 40,
    returnRate: 5,
    cacPerCustomer: 35,
    existingCustomerBase: 500,
  },
  fintech: {
    model: 'fintech',
    startingAUM: 2000000,
    aumGrowthMoM: 12,
    netInterestMarginPct: 6,
    transactionVolumeM1: 500000,
    transactionGrowthMoM: 15,
    transactionFeePct: 1.5,
    loanDefaultRatePct: 2,
    operationalCostPctRevenue: 35,
    cacPerCustomer: 80,
    startingCustomers: 500,
    customerGrowthMoM: 10,
  },
  edtech: {
    model: 'edtech',
    startingMonthlyEnrollments: 150,
    enrollmentGrowthMoM: 10,
    avgCoursePrice: 199,
    subscriptionRevenuePct: 30,
    avgSubscriptionFee: 39,
    startingSubscribers: 200,
    subscriberGrowthMoM: 8,
    subscriberChurnMonthly: 5,
    contentCostPctRevenue: 25,
    platformCostPctRevenue: 10,
    cacPerStudent: 45,
  },
  on_demand: {
    model: 'on_demand',
    startingMonthlyBookings: 2000,
    bookingGrowthMoM: 15,
    avgBookingValue: 35,
    takeRate: 20,
    paymentProcessingCost: 2.5,
    insuranceSafetyPct: 5,
    cacPerSupplySide: 120,
    supplyGrowthMoM: 8,
    startingSupplyCount: 100,
  },
  proptech: {
    model: 'proptech',
    startingUnitsUnderManagement: 50,
    unitGrowthMoM: 5,
    avgMonthlyFeePerUnit: 150,
    avgRentalYield: 7,
    revenueSharePct: 10,
    transactionFeePerLease: 1500,
    newLeasesPerMonth: 5,
    leaseGrowthMoM: 8,
    operationalCostPctRevenue: 40,
    cacPerUnit: 300,
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
  description: string;
}> = {
  saas: {
    label: 'SaaS',
    labelAr: 'برمجيات كخدمة',
    description: 'Subscription software sold to businesses or consumers',
    northStar: 'ARR',
    revenueLabel: 'MRR',
    customerLabel: 'Customers',
    keyMetrics: ['MRR', 'ARR', 'Churn Rate', 'LTV', 'CAC', 'LTV:CAC', 'CAC Payback'],
  },
  ecommerce: {
    label: 'E-commerce',
    labelAr: 'تجارة إلكترونية',
    description: 'Online retail selling physical or digital products',
    northStar: 'Monthly Revenue',
    revenueLabel: 'Revenue',
    customerLabel: 'Orders',
    keyMetrics: ['Orders', 'AOV', 'Return Rate', 'CAC', 'Gross Margin'],
  },
  marketplace: {
    label: 'Marketplace',
    labelAr: 'منصة تجارية',
    description: 'Two-sided platform connecting buyers and sellers',
    northStar: 'GMV',
    revenueLabel: 'Net Revenue',
    customerLabel: 'GMV',
    keyMetrics: ['GMV', 'Take Rate', 'Net Revenue', 'CAC', 'Gross Margin'],
  },
  agency: {
    label: 'Agency / Services',
    labelAr: 'وكالة / خدمات',
    description: 'Professional services on retainer or project basis',
    northStar: 'MRR (Retainers)',
    revenueLabel: 'Revenue',
    customerLabel: 'Clients',
    keyMetrics: ['Clients', 'Avg Retainer', 'Churn', 'Utilization', 'Gross Margin'],
  },
  hardware: {
    label: 'Hardware / IoT',
    labelAr: 'أجهزة / إنترنت الأشياء',
    description: 'Physical device sales plus recurring software/service revenue',
    northStar: 'Units Shipped',
    revenueLabel: 'Revenue',
    customerLabel: 'Units',
    keyMetrics: ['Units Sold', 'ASP', 'Gross Margin', 'Recurring Revenue', 'Installed Base'],
  },
  procurement: {
    label: 'Procurement-as-a-Service',
    labelAr: 'المشتريات كخدمة',
    description: 'B2B procurement facilitation with take rate on volume',
    northStar: 'PVF',
    revenueLabel: 'Service Fee',
    customerLabel: 'Orders',
    keyMetrics: ['PVF', 'Take Rate', 'Orders', 'Gross Margin', 'CAC'],
  },
  subscription: {
    label: 'Subscription (Physical/Content)',
    labelAr: 'اشتراك (منتجات / محتوى)',
    description: 'Recurring billing for physical boxes, media, or newsletters',
    northStar: 'MRR',
    revenueLabel: 'MRR',
    customerLabel: 'Subscribers',
    keyMetrics: ['Subscribers', 'MRR', 'Churn Rate', 'LTV', 'CAC', 'LTV:CAC'],
  },
  freemium: {
    label: 'Freemium',
    labelAr: 'مجاني مع مميزات مدفوعة',
    description: 'Free tier driving paid conversion; monetize top % of users',
    northStar: 'Paid Users',
    revenueLabel: 'MRR',
    customerLabel: 'Paid Users',
    keyMetrics: ['MAU', 'Paid Users', 'Conversion Rate', 'ARPU', 'Churn', 'LTV:CAC'],
  },
  usage_based: {
    label: 'Usage-Based / Pay-as-you-go',
    labelAr: 'الدفع حسب الاستخدام',
    description: 'Revenue scales with consumption: API calls, compute, transactions',
    northStar: 'Monthly Usage Revenue',
    revenueLabel: 'Revenue',
    customerLabel: 'Active Accounts',
    keyMetrics: ['Active Accounts', 'Units Consumed', 'Revenue per Unit', 'Gross Margin', 'CAC'],
  },
  advertising: {
    label: 'Advertising / Media',
    labelAr: 'إعلانات / وسائل إعلام',
    description: 'Content platform monetized via display, video, or native ads',
    northStar: 'MAU',
    revenueLabel: 'Ad Revenue',
    customerLabel: 'MAU',
    keyMetrics: ['MAU', 'Sessions/User', 'Fill Rate', 'CPM', 'Revenue per MAU'],
  },
  d2c: {
    label: 'D2C / Retail',
    labelAr: 'بيع مباشر للمستهلك',
    description: 'Direct-to-consumer brand selling physical or digital products',
    northStar: 'Monthly Revenue',
    revenueLabel: 'Revenue',
    customerLabel: 'Customers',
    keyMetrics: ['New Customers', 'Repeat Rate', 'AOV', 'LTV', 'CAC', 'Gross Margin'],
  },
  fintech: {
    label: 'Fintech / Lending',
    labelAr: 'تكنولوجيا مالية / إقراض',
    description: 'Neobank, BNPL, lending, or payments platform',
    northStar: 'AUM / Loan Book',
    revenueLabel: 'Net Revenue',
    customerLabel: 'Customers',
    keyMetrics: ['AUM', 'NIM', 'Transaction Volume', 'Default Rate', 'CAC', 'Revenue per Customer'],
  },
  edtech: {
    label: 'EdTech / Content',
    labelAr: 'تعليم إلكتروني / محتوى',
    description: 'Online courses, bootcamps, or learning subscription platforms',
    northStar: 'Enrollments',
    revenueLabel: 'Revenue',
    customerLabel: 'Students',
    keyMetrics: ['Enrollments', 'Subscribers', 'Avg Course Price', 'Churn', 'CAC', 'Gross Margin'],
  },
  on_demand: {
    label: 'On-Demand / Gig',
    labelAr: 'خدمات عند الطلب / اقتصاد الغيغ',
    description: 'Ride-hailing, delivery, or freelance platform with take rate',
    northStar: 'GMV / Bookings',
    revenueLabel: 'Net Revenue',
    customerLabel: 'Bookings',
    keyMetrics: ['Bookings', 'GMV', 'Take Rate', 'Supply Count', 'CAC', 'Gross Margin'],
  },
  proptech: {
    label: 'Real Estate / PropTech',
    labelAr: 'عقارات / تقنية عقارية',
    description: 'Property management, rental platforms, or real estate marketplaces',
    northStar: 'Units Under Management',
    revenueLabel: 'Revenue',
    customerLabel: 'Units',
    keyMetrics: ['Units Managed', 'Mgmt Fee/Unit', 'Leases/Month', 'Rental Yield', 'Gross Margin'],
  },
};

// ─── Legacy compatibility exports ────────────────────────────────────────────
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
