/**
 * Unified Equity Data Model — shared types used by all equity tools
 * Single source of truth for cap table, ESOP, and instruments
 */

// ─── Share Classes ─────────────────────────────────────────────────────────────
export type ShareClass = 'common' | 'preferred_seed' | 'preferred_a' | 'preferred_b' | 'option' | 'warrant';

// ─── Instrument Types ──────────────────────────────────────────────────────────
export type InstrumentType =
  | 'common_stock'
  | 'preferred_stock'
  | 'safe'                // Y Combinator SAFE
  | 'convertible_note'    // Traditional convertible note with interest
  | 'oqal_note'           // Shariah-compliant OQAL Note (Qard Hassan + promise to sell)
  | 'warrant'
  | 'option';             // ESOP option grant

// ─── Holder Types ──────────────────────────────────────────────────────────────
export type HolderType = 'founder' | 'investor' | 'employee' | 'advisor' | 'option_pool' | 'other';

// ─── Cap Table Shareholder ─────────────────────────────────────────────────────
export interface CapTableShareholder {
  id: string;
  name: string;
  email?: string;
  type: HolderType;
  shareClass: ShareClass;
  shares: number;           // number of shares (common/preferred/options)
  pricePerShare?: number;   // price paid per share (0 for founders)
  vestingMonths?: number;   // 0 = fully vested
  cliffMonths?: number;
  vestingStartDate?: string;
  color: string;
  notes?: string;
}

// ─── Convertible Instrument (SAFE / Convertible Note / OQAL Note) ─────────────
export interface CapTableInstrument {
  id: string;
  investorName: string;
  investorEmail?: string;
  type: 'safe' | 'convertible_note' | 'oqal_note';
  investmentAmount: number;
  currency: 'SAR' | 'USD';
  valuationCap: number;       // pre-money valuation cap (0 = uncapped)
  discountRate: number;       // % discount on next round price (0 = no discount)
  interestRate: number;       // % annual interest (0 for SAFE and OQAL)
  issueDate: string;          // ISO date
  maturityMonths: number;     // months until maturity
  qualifiedRoundThreshold: number; // min round size to trigger auto-conversion
  conversionTrigger: 'qualified_round' | 'maturity' | 'change_of_control' | 'manual';
  status: 'active' | 'converted' | 'repaid' | 'cancelled';
  convertedShares?: number;   // filled in after conversion
  convertedAt?: string;       // ISO date of conversion
  color: string;
  notes?: string;
}
// ─── ESOP Grant (per-employee) ────────────────────────────────────────────────
export interface EsopGrant {
  id: string;
  employeeName: string;
  employeeTitle: string;
  employeeEmail: string;
  grantDate: string;             // ISO date string
  shares: number;                // total shares granted
  strikePrice: number;           // strike price per share at grant date
  vestingMonths: number;         // total vesting period in months
  cliffMonths: number;           // cliff period in months
  vestingStartDate: string;      // ISO date string
  planType: 'iso' | 'nso' | 'rsu' | 'sar';
  status: 'active' | 'terminated' | 'exercised' | 'expired';
  notes: string;
}

// ─── ESOP Pool ────────────────────────────────────────────────────────────────────
export interface EsopPool {
  totalPoolShares: number;       // total shares reserved for ESOP
  issuedShares: number;          // shares already granted
  availableShares: number;       // totalPoolShares - issuedShares
  strikePrice: number;           // default strike price per share
  fmvPerShare: number;           // 409A Fair Market Value per share
  vestingMonths: number;         // default vesting schedule
  cliffMonths: number;           // default cliff
  planType: 'iso' | 'nso' | 'rsu' | 'sar';
  jurisdiction: string;
  grants: EsopGrant[];           // per-employee grant records
}

// ─── Funding Round ─────────────────────────────────────────────────────────────
export interface FundingRound {
  id: string;
  name: string;                  // e.g. "Pre-Seed", "Seed", "Series A"
  enabled: boolean;
  preMoneyValuation: number;
  investmentAmount: number;
  pricePerShare: number;         // calculated: preMoneyValuation / totalSharesBefore
  newSharesIssued: number;       // calculated: investmentAmount / pricePerShare
  optionPoolTopUp: number;       // additional option pool shares added this round
  color: string;
}

// ─── Master Cap Table State ────────────────────────────────────────────────────
export interface CapTableState {
  // Core configuration
  companyName: string;
  totalAuthorizedShares: number;   // total shares the company is authorized to issue
  pricePerShare: number;           // current / last round price per share
  currency: 'SAR' | 'USD';

  // Shareholders (founders + investors with actual shares)
  shareholders: CapTableShareholder[];

  // Convertible instruments (SAFE, convertible notes, OQAL notes)
  instruments: CapTableInstrument[];

  // ESOP pool configuration
  esop: EsopPool;

  // Funding rounds for dilution simulation
  rounds: FundingRound[];

  // Scenario: next priced round (for note conversion preview)
  nextRoundPreMoneyValuation: number;
  nextRoundInvestment: number;
}

// ─── Computed Cap Table Row ────────────────────────────────────────────────────
export interface CapTableRow {
  id: string;
  name: string;
  type: HolderType | 'instrument';
  instrumentType?: InstrumentType;
  shares: number;                  // actual or converted shares
  ownershipPct: number;            // % of fully-diluted cap table
  ownershipPctBasic: number;       // % excluding unissued options/unconverted notes
  investmentAmount?: number;
  pricePerShare?: number;
  status?: string;
  color: string;
}

// ─── Default Values ────────────────────────────────────────────────────────────
export const DEFAULT_CAP_TABLE: CapTableState = {
  companyName: '',
  totalAuthorizedShares: 10_000_000,
  pricePerShare: 1.00,
  currency: 'SAR',
  shareholders: [
    {
      id: 'founder-1',
      name: 'Founder 1',
      email: '',
      type: 'founder',
      shareClass: 'common',
      shares: 4_500_000,
      pricePerShare: 0,
      vestingMonths: 48,
      cliffMonths: 12,
      vestingStartDate: new Date().toISOString().split('T')[0],
      color: '#4F6EF7',
    },
    {
      id: 'founder-2',
      name: 'Founder 2',
      email: '',
      type: 'founder',
      shareClass: 'common',
      shares: 3_500_000,
      pricePerShare: 0,
      vestingMonths: 48,
      cliffMonths: 12,
      vestingStartDate: new Date().toISOString().split('T')[0],
      color: '#C4614A',
    },
  ],
  instruments: [],
  esop: {
    totalPoolShares: 1_000_000,
    issuedShares: 0,
    availableShares: 1_000_000,
    strikePrice: 0.10,
    fmvPerShare: 1.00,
    vestingMonths: 48,
    cliffMonths: 12,
    planType: 'iso',
    jurisdiction: 'saudi_arabia',
    grants: [],
  },
  rounds: [
    {
      id: 'pre-seed',
      name: 'Pre-Seed',
      enabled: false,
      preMoneyValuation: 3_000_000,
      investmentAmount: 500_000,
      pricePerShare: 0.33,
      newSharesIssued: 0,
      optionPoolTopUp: 0,
      color: '#C4614A',
    },
    {
      id: 'seed',
      name: 'Seed',
      enabled: false,
      preMoneyValuation: 8_000_000,
      investmentAmount: 2_000_000,
      pricePerShare: 0.80,
      newSharesIssued: 0,
      optionPoolTopUp: 500_000,
      color: '#8B4A38',
    },
    {
      id: 'series-a',
      name: 'Series A',
      enabled: false,
      preMoneyValuation: 25_000_000,
      investmentAmount: 5_000_000,
      pricePerShare: 2.50,
      newSharesIssued: 0,
      optionPoolTopUp: 1_000_000,
      color: '#2D4A6B',
    },
  ],
  nextRoundPreMoneyValuation: 8_000_000,
  nextRoundInvestment: 2_000_000,
};

// ─── Calculation Helpers ───────────────────────────────────────────────────────

/**
 * Calculate the conversion price for a convertible instrument
 */
export function calcConversionPrice(
  instrument: CapTableInstrument,
  nextRoundPricePerShare: number,
  nextRoundPreMoneyValuation: number,
  totalSharesBeforeRound: number,
): number {
  // Cap price: valuation cap / total shares = price per share at cap
  const capPrice = instrument.valuationCap > 0
    ? instrument.valuationCap / totalSharesBeforeRound
    : Infinity;

  // Discount price: next round price reduced by discount
  const discountPrice = nextRoundPricePerShare * (1 - instrument.discountRate / 100);

  // Conversion price is the most favourable (lowest) for the investor
  return Math.min(capPrice, discountPrice, nextRoundPricePerShare);
}

/**
 * Calculate shares received upon conversion
 */
export function calcConvertedShares(
  instrument: CapTableInstrument,
  nextRoundPricePerShare: number,
  nextRoundPreMoneyValuation: number,
  totalSharesBeforeRound: number,
): number {
  const convPrice = calcConversionPrice(
    instrument, nextRoundPricePerShare, nextRoundPreMoneyValuation, totalSharesBeforeRound,
  );
  if (convPrice <= 0) return 0;

  // For OQAL notes with interest rate = 0, no accrued interest
  const principal = instrument.investmentAmount;
  const months = instrument.maturityMonths;
  const accrued = instrument.interestRate > 0
    ? principal * (instrument.interestRate / 100) * (months / 12)
    : 0;

  return Math.round((principal + accrued) / convPrice);
}

/**
 * Build fully-diluted cap table rows from state
 */
export function buildCapTableRows(state: CapTableState): {
  rows: CapTableRow[];
  totalSharesBasic: number;
  totalSharesFullyDiluted: number;
  esopPct: number;
} {
  const nextRoundPPS = state.nextRoundPreMoneyValuation > 0 && state.totalAuthorizedShares > 0
    ? state.nextRoundPreMoneyValuation / state.totalAuthorizedShares
    : state.pricePerShare;

  // 1. Shareholder rows
  const shareholderRows: CapTableRow[] = state.shareholders.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    instrumentType: s.shareClass === 'option' ? 'option' : 'common_stock',
    shares: s.shares,
    ownershipPct: 0, // calculated below
    ownershipPctBasic: 0,
    investmentAmount: s.pricePerShare ? s.shares * s.pricePerShare : undefined,
    pricePerShare: s.pricePerShare,
    color: s.color,
  }));

  // 2. ESOP pool row
  const esopRow: CapTableRow = {
    id: 'esop-pool',
    name: 'ESOP Pool',
    type: 'option_pool',
    instrumentType: 'option',
    shares: state.esop.totalPoolShares,
    ownershipPct: 0,
    ownershipPctBasic: 0,
    color: '#10B981',
  };

  // 3. Instrument rows (converted)
  const instrumentRows: CapTableRow[] = state.instruments
    .filter(i => i.status === 'active' || i.status === 'converted')
    .map(i => {
      const converted = calcConvertedShares(
        i,
        nextRoundPPS,
        state.nextRoundPreMoneyValuation,
        state.totalAuthorizedShares,
      );
      return {
        id: i.id,
        name: i.investorName,
        type: 'investor' as HolderType,
        instrumentType: i.type as InstrumentType,
        shares: converted,
        ownershipPct: 0,
        ownershipPctBasic: 0,
        investmentAmount: i.investmentAmount,
        status: i.status,
        color: i.color,
      };
    });

  // 4. Calculate totals
  const basicShares = shareholderRows.reduce((s, r) => s + r.shares, 0);
  const totalSharesFullyDiluted =
    basicShares +
    esopRow.shares +
    instrumentRows.reduce((s, r) => s + r.shares, 0);

  // 5. Fill in ownership percentages
  const allRows = [...shareholderRows, esopRow, ...instrumentRows];
  for (const row of allRows) {
    row.ownershipPctBasic = basicShares > 0 ? (row.shares / basicShares) * 100 : 0;
    row.ownershipPct = totalSharesFullyDiluted > 0 ? (row.shares / totalSharesFullyDiluted) * 100 : 0;
  }

  return {
    rows: allRows,
    totalSharesBasic: basicShares,
    totalSharesFullyDiluted,
    esopPct: totalSharesFullyDiluted > 0 ? (esopRow.shares / totalSharesFullyDiluted) * 100 : 0,
  };
}
