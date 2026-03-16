/**
 * Valuation Engine — AI Startup Valuation Calculator
 * Design: "Venture Capital Clarity" — Editorial Finance
 *
 * Implements 7 industry-standard valuation methods:
 * 1. DCF (Discounted Cash Flow) — with terminal value & sensitivity
 * 2. Scorecard Method (Payne) — weighted founder/market/product scoring
 * 3. Berkus Method — milestone-based pre-revenue valuation
 * 4. VC Method — return-on-investment backward calculation
 * 5. Comparable Transactions — revenue/ARR multiple benchmarking
 * 6. Risk-Factor Summation — 12-factor risk adjustment
 * 7. First Chicago Method — scenario-weighted (bear/base/bull)
 */

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface StartupInputs {
  companyName: string;
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';
  sector: string;
  country: string;

  currentARR: number;
  revenueGrowthRate: number;
  grossMargin: number;
  burnRate: number;
  cashOnHand: number;
  totalAddressableMarket: number;
  projectedRevenue5Y: number;

  discountRate: number;
  terminalGrowthRate: number;
  projectedCashFlows: number[];

  targetReturn: number;
  exitMultiple: number;
  yearsToExit: number;

  teamScore: number;
  marketScore: number;
  productScore: number;
  competitiveScore: number;
  marketingScore: number;
  fundingScore: number;
  otherScore: number;

  berkusSoundIdea: number;
  berkusPrototype: number;
  berkusQualityTeam: number;
  berkusStrategicRelationships: number;
  berkusProductRollout: number;

  riskManagement: number;
  riskStage: number;
  riskLegislation: number;
  riskManufacturing: number;
  riskSalesMarketing: number;
  riskFunding: number;
  riskCompetition: number;
  riskTechnology: number;
  riskLitigation: number;
  riskInternational: number;
  riskReputation: number;
  riskPotentialLucrative: number;

  sectorMedianMultiple: number;
  publicCompsMultiple: number;
  privateCompsMultiple: number;

  medianPreMoneyValuation: number;

  bearCaseRevenue: number;
  bearCaseProbability: number;
  baseCaseRevenue: number;
  baseCaseProbability: number;
  bullCaseRevenue: number;
  bullCaseProbability: number;
  scenarioExitMultiple: number;
  scenarioDiscountRate: number;
  scenarioYearsToExit: number;
}

export interface ValuationResult {
  method: string;
  methodCode: string;
  value: number;
  low: number;
  high: number;
  confidence: number;
  description: string;
  breakdown: Record<string, number | string>;
  applicability: number;
}

export interface ValuationSummary {
  blended: number;
  weightedLow: number;
  weightedHigh: number;
  results: ValuationResult[];
  confidenceScore: number;
  stage: string;
  runway: number;
  burnMultiple: number;
  magicNumber: number;
  impliedARRMultiple: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
}

// ─── Dilution Types ────────────────────────────────────────────────────────────

export interface DilutionRound {
  id: string;
  name: string;
  investment: number;
  preMoneyValuation: number;
}

export interface DilutionResult {
  rounds: {
    name: string;
    investment: number;
    preMoneyValuation: number;
    postMoneyValuation: number;
    newSharesFraction: number;
    founderOwnership: number;
    investorOwnership: number;
    impliedFounderValue: number;
  }[];
  finalFounderOwnership: number;
  totalRaised: number;
  finalPostMoney: number;
}

// ─── Saved Scenario Type ───────────────────────────────────────────────────────

export interface SavedScenario {
  id: string;
  name: string;
  inputs: StartupInputs;
  summary: ValuationSummary;
  savedAt: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── Method 1: DCF ────────────────────────────────────────────────────────────

export function calcDCF(inputs: StartupInputs): ValuationResult {
  const { projectedCashFlows, discountRate, terminalGrowthRate } = inputs;
  const r = discountRate / 100;
  const g = terminalGrowthRate / 100;

  let pvCashFlows = 0;
  for (let i = 0; i < projectedCashFlows.length; i++) {
    pvCashFlows += projectedCashFlows[i] / Math.pow(1 + r, i + 1);
  }

  const lastCF = projectedCashFlows[projectedCashFlows.length - 1] || 0;
  const terminalValue = lastCF > 0 ? (lastCF * (1 + g)) / (r - g) : 0;
  const pvTerminal = terminalValue / Math.pow(1 + r, projectedCashFlows.length);
  const baseValue = pvCashFlows + pvTerminal;

  const pvLow = projectedCashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + r - 0.02, i + 1), 0);
  const tvLow = lastCF > 0 ? (lastCF * (1 + g)) / ((r - 0.02) - g) / Math.pow(1 + r - 0.02, projectedCashFlows.length) : 0;
  const pvHigh = projectedCashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + r + 0.02, i + 1), 0);
  const tvHigh = lastCF > 0 ? (lastCF * (1 + g)) / ((r + 0.02) - g) / Math.pow(1 + r + 0.02, projectedCashFlows.length) : 0;

  const low = Math.max(0, pvLow + tvLow);
  const high = Math.max(0, pvHigh + tvHigh);

  const stageMultiplier = inputs.stage === 'pre-seed' ? 0.4 : inputs.stage === 'seed' ? 0.55 : inputs.stage === 'series-a' ? 0.7 : 0.85;
  const confidence = Math.round(clamp(stageMultiplier * 100, 20, 90));
  const applicability = inputs.stage === 'pre-seed' ? 30 : inputs.stage === 'seed' ? 45 : inputs.stage === 'series-a' ? 70 : 90;

  return {
    method: 'Discounted Cash Flow',
    methodCode: 'dcf',
    value: Math.max(0, baseValue),
    low: Math.max(0, low),
    high: Math.max(0, high),
    confidence,
    description: 'Projects future free cash flows and discounts them to present value using WACC. Includes Gordon Growth terminal value.',
    breakdown: {
      'PV of Cash Flows': Math.round(pvCashFlows),
      'Terminal Value (PV)': Math.round(pvTerminal),
      'Discount Rate': `${discountRate}%`,
      'Terminal Growth Rate': `${terminalGrowthRate}%`,
    },
    applicability,
  };
}

// ─── Method 2: Scorecard ──────────────────────────────────────────────────────

export function calcScorecard(inputs: StartupInputs): ValuationResult {
  const { medianPreMoneyValuation, teamScore, marketScore, productScore, competitiveScore, marketingScore, fundingScore, otherScore } = inputs;
  const weights = { team: 0.30, market: 0.25, product: 0.15, competitive: 0.10, marketing: 0.10, funding: 0.05, other: 0.05 };
  const scores = { team: teamScore / 100, market: marketScore / 100, product: productScore / 100, competitive: competitiveScore / 100, marketing: marketingScore / 100, funding: fundingScore / 100, other: otherScore / 100 };
  const composite = scores.team * weights.team + scores.market * weights.market + scores.product * weights.product + scores.competitive * weights.competitive + scores.marketing * weights.marketing + scores.funding * weights.funding + scores.other * weights.other;
  const multiplier = composite * 2;
  const value = medianPreMoneyValuation * multiplier;
  const applicability = inputs.stage === 'pre-seed' ? 90 : inputs.stage === 'seed' ? 85 : 60;
  return {
    method: 'Scorecard Method',
    methodCode: 'scorecard',
    value,
    low: medianPreMoneyValuation * (multiplier * 0.75),
    high: medianPreMoneyValuation * (multiplier * 1.35),
    confidence: 72,
    description: 'Compares startup to median pre-money valuations using weighted qualitative factors: team (30%), market (25%), product (15%), competition (10%), marketing (10%), funding need (5%), other (5%).',
    breakdown: {
      'Median Pre-Money': medianPreMoneyValuation,
      'Composite Score': `${(composite * 100).toFixed(1)}%`,
      'Multiplier': `${multiplier.toFixed(2)}x`,
      'Team Score': `${teamScore}/100`,
      'Market Score': `${marketScore}/100`,
      'Product Score': `${productScore}/100`,
    },
    applicability,
  };
}

// ─── Method 3: Berkus ─────────────────────────────────────────────────────────

export function calcBerkus(inputs: StartupInputs): ValuationResult {
  const { berkusSoundIdea, berkusPrototype, berkusQualityTeam, berkusStrategicRelationships, berkusProductRollout } = inputs;
  const value = berkusSoundIdea + berkusPrototype + berkusQualityTeam + berkusStrategicRelationships + berkusProductRollout;
  const applicability = inputs.stage === 'pre-seed' ? 95 : inputs.stage === 'seed' ? 75 : 30;
  return {
    method: 'Berkus Method',
    methodCode: 'berkus',
    value,
    low: value * 0.7,
    high: value * 1.4,
    confidence: 65,
    description: 'Pre-revenue valuation based on five milestone achievements. Each element contributes up to $500K, capping at $2.5M for pre-revenue startups.',
    breakdown: {
      'Sound Idea': berkusSoundIdea,
      'Prototype': berkusPrototype,
      'Quality Team': berkusQualityTeam,
      'Strategic Relationships': berkusStrategicRelationships,
      'Product Rollout': berkusProductRollout,
    },
    applicability,
  };
}

// ─── Method 4: VC Method ──────────────────────────────────────────────────────

export function calcVCMethod(inputs: StartupInputs): ValuationResult {
  const { projectedRevenue5Y, exitMultiple, targetReturn, yearsToExit, discountRate } = inputs;
  const terminalValue = projectedRevenue5Y * exitMultiple;
  const postMoneyValuation = terminalValue / Math.pow(1 + discountRate / 100, yearsToExit);
  const preMoneyValuation = postMoneyValuation * 0.8;
  const applicability = inputs.stage === 'pre-seed' ? 60 : inputs.stage === 'seed' ? 80 : inputs.stage === 'series-a' ? 90 : 85;
  return {
    method: 'VC Method',
    methodCode: 'vc',
    value: preMoneyValuation,
    low: preMoneyValuation * 0.6,
    high: preMoneyValuation * 1.6,
    confidence: 70,
    description: "Backward-calculates pre-money valuation from expected exit value, discounted by the VC's required return multiple over the investment horizon.",
    breakdown: {
      'Projected Revenue (5Y)': projectedRevenue5Y,
      'Exit Multiple': `${exitMultiple}x`,
      'Terminal Value': terminalValue,
      'Target Return': `${targetReturn}x`,
      'Years to Exit': yearsToExit,
      'Post-Money Valuation': Math.round(postMoneyValuation),
    },
    applicability,
  };
}

// ─── Method 5: Comparables ────────────────────────────────────────────────────

export function calcComparables(inputs: StartupInputs): ValuationResult {
  const { currentARR, sectorMedianMultiple, publicCompsMultiple, privateCompsMultiple } = inputs;
  const blendedMultiple = (sectorMedianMultiple * 0.4 + publicCompsMultiple * 0.3 + privateCompsMultiple * 0.3);
  const stageDiscount = inputs.stage === 'pre-seed' ? 0.5 : inputs.stage === 'seed' ? 0.7 : inputs.stage === 'series-a' ? 0.85 : 1.0;
  const adjustedValue = currentARR * blendedMultiple * stageDiscount;
  const applicability = inputs.currentARR > 100000 ? 85 : inputs.currentARR > 10000 ? 65 : 35;
  return {
    method: 'Comparable Transactions',
    methodCode: 'comps',
    value: adjustedValue,
    low: currentARR * Math.min(sectorMedianMultiple, publicCompsMultiple, privateCompsMultiple) * stageDiscount,
    high: currentARR * Math.max(sectorMedianMultiple, publicCompsMultiple, privateCompsMultiple) * stageDiscount * 1.2,
    confidence: 75,
    description: 'Values the startup based on revenue multiples from sector peers, public comparables, and private transaction data, adjusted for stage.',
    breakdown: {
      'Current ARR': currentARR,
      'Sector Median Multiple': `${sectorMedianMultiple}x`,
      'Public Comps Multiple': `${publicCompsMultiple}x`,
      'Private Comps Multiple': `${privateCompsMultiple}x`,
      'Blended Multiple': `${blendedMultiple.toFixed(1)}x`,
      'Stage Discount': `${((1 - stageDiscount) * 100).toFixed(0)}%`,
    },
    applicability,
  };
}

// ─── Method 6: Risk-Factor Summation ──────────────────────────────────────────

export function calcRiskFactor(inputs: StartupInputs): ValuationResult {
  const { medianPreMoneyValuation, riskManagement, riskStage, riskLegislation, riskManufacturing, riskSalesMarketing, riskFunding, riskCompetition, riskTechnology, riskLitigation, riskInternational, riskReputation, riskPotentialLucrative } = inputs;
  const risks = [riskManagement, riskStage, riskLegislation, riskManufacturing, riskSalesMarketing, riskFunding, riskCompetition, riskTechnology, riskLitigation, riskInternational, riskReputation, riskPotentialLucrative];
  const riskAdjustment = risks.reduce((sum, r) => sum + r, 0) * 250000;
  const value = Math.max(0, medianPreMoneyValuation + riskAdjustment);
  const applicability = inputs.stage === 'pre-seed' ? 85 : inputs.stage === 'seed' ? 80 : 65;
  return {
    method: 'Risk-Factor Summation',
    methodCode: 'risk',
    value,
    low: Math.max(0, value * 0.8),
    high: value * 1.25,
    confidence: 68,
    description: 'Adjusts median pre-money valuation by evaluating 12 risk factors. Each factor ranges from −2 (very negative) to +2 (very positive), with each unit worth $250K.',
    breakdown: {
      'Median Pre-Money': medianPreMoneyValuation,
      'Total Risk Score': risks.reduce((s, r) => s + r, 0),
      'Risk Adjustment': riskAdjustment,
      'Management Risk': riskManagement,
      'Stage Risk': riskStage,
      'Competition Risk': riskCompetition,
      'Technology Risk': riskTechnology,
    },
    applicability,
  };
}

// ─── Method 7: First Chicago ──────────────────────────────────────────────────

export function calcFirstChicago(inputs: StartupInputs): ValuationResult {
  const { bearCaseRevenue, bearCaseProbability, baseCaseRevenue, baseCaseProbability, bullCaseRevenue, bullCaseProbability, scenarioExitMultiple, scenarioDiscountRate, scenarioYearsToExit } = inputs;
  const r = scenarioDiscountRate / 100;
  const n = scenarioYearsToExit;
  const totalProb = bearCaseProbability + baseCaseProbability + bullCaseProbability;
  const pBear = bearCaseProbability / totalProb;
  const pBase = baseCaseProbability / totalProb;
  const pBull = bullCaseProbability / totalProb;
  const pvBear = (bearCaseRevenue * scenarioExitMultiple) / Math.pow(1 + r, n);
  const pvBase = (baseCaseRevenue * scenarioExitMultiple) / Math.pow(1 + r, n);
  const pvBull = (bullCaseRevenue * scenarioExitMultiple) / Math.pow(1 + r, n);
  const value = pvBear * pBear + pvBase * pBase + pvBull * pBull;
  return {
    method: 'First Chicago Method',
    methodCode: 'firstchicago',
    value,
    low: pvBear,
    high: pvBull,
    confidence: 78,
    description: 'Probability-weighted average of three exit scenarios (bear, base, bull), each discounted to present value. Captures upside and downside asymmetry.',
    breakdown: {
      'Bear Case Revenue': bearCaseRevenue,
      'Bear Probability': `${(pBear * 100).toFixed(0)}%`,
      'Base Case Revenue': baseCaseRevenue,
      'Base Probability': `${(pBase * 100).toFixed(0)}%`,
      'Bull Case Revenue': bullCaseRevenue,
      'Bull Probability': `${(pBull * 100).toFixed(0)}%`,
      'Exit Multiple': `${scenarioExitMultiple}x`,
    },
    applicability: 80,
  };
}

// ─── Blended Summary ──────────────────────────────────────────────────────────

export function calcBlended(results: ValuationResult[], inputs: StartupInputs): ValuationSummary {
  const totalApplicability = results.reduce((s, r) => s + r.applicability, 0);
  const blended = results.reduce((s, r) => s + r.value * (r.applicability / totalApplicability), 0);
  const weightedLow = results.reduce((s, r) => s + r.low * (r.applicability / totalApplicability), 0);
  const weightedHigh = results.reduce((s, r) => s + r.high * (r.applicability / totalApplicability), 0);
  const confidenceScore = Math.round(results.reduce((s, r) => s + r.confidence * (r.applicability / totalApplicability), 0));
  const runway = inputs.burnRate > 0 ? Math.round(inputs.cashOnHand / inputs.burnRate) : 999;
  const burnMultiple = inputs.currentARR > 0 ? (inputs.burnRate * 12) / (inputs.currentARR * (inputs.revenueGrowthRate / 100)) : 0;
  const magicNumber = inputs.currentARR > 0 ? (inputs.currentARR * (inputs.revenueGrowthRate / 100)) / (inputs.burnRate * 12 * 0.4) : 0;
  const impliedARRMultiple = inputs.currentARR > 0 ? blended / inputs.currentARR : 0;
  const riskScore = burnMultiple;
  const riskLevel: ValuationSummary['riskLevel'] = riskScore < 1 ? 'Low' : riskScore < 2 ? 'Moderate' : riskScore < 4 ? 'High' : 'Very High';
  const stageLabels: Record<string, string> = { 'pre-seed': 'Pre-Seed', 'seed': 'Seed', 'series-a': 'Series A', 'series-b': 'Series B', 'growth': 'Growth' };
  return { blended, weightedLow, weightedHigh, results, confidenceScore, stage: stageLabels[inputs.stage] || inputs.stage, runway, burnMultiple: Math.round(burnMultiple * 10) / 10, magicNumber: Math.round(magicNumber * 100) / 100, impliedARRMultiple: Math.round(impliedARRMultiple * 10) / 10, riskLevel };
}

export function runValuation(inputs: StartupInputs): ValuationSummary {
  const results: ValuationResult[] = [
    calcDCF(inputs), calcScorecard(inputs), calcBerkus(inputs),
    calcVCMethod(inputs), calcComparables(inputs), calcRiskFactor(inputs), calcFirstChicago(inputs),
  ];
  return calcBlended(results, inputs);
}

// ─── Dilution Calculator ──────────────────────────────────────────────────────

export function calcDilution(rounds: DilutionRound[]): DilutionResult {
  let founderOwnership = 1.0;
  const resultRounds = rounds.map(round => {
    const postMoneyValuation = round.preMoneyValuation + round.investment;
    const newSharesFraction = round.investment / postMoneyValuation;
    founderOwnership = founderOwnership * (1 - newSharesFraction);
    const investorOwnership = 1 - founderOwnership;
    return {
      name: round.name,
      investment: round.investment,
      preMoneyValuation: round.preMoneyValuation,
      postMoneyValuation,
      newSharesFraction,
      founderOwnership,
      investorOwnership,
      impliedFounderValue: founderOwnership * postMoneyValuation,
    };
  });
  const totalRaised = rounds.reduce((s, r) => s + r.investment, 0);
  const finalPostMoney = rounds.length > 0 ? rounds[rounds.length - 1].preMoneyValuation + rounds[rounds.length - 1].investment : 0;
  return { rounds: resultRounds, finalFounderOwnership: founderOwnership, totalRaised, finalPostMoney };
}

// ─── Default Inputs ────────────────────────────────────────────────────────────

export const defaultInputs: StartupInputs = {
  companyName: 'My AI Startup',
  stage: 'seed',
  sector: 'saas',
  country: 'United States',
  currentARR: 500000,
  revenueGrowthRate: 120,
  grossMargin: 75,
  burnRate: 150000,
  cashOnHand: 2000000,
  totalAddressableMarket: 5000000000,
  projectedRevenue5Y: 20000000,
  discountRate: 35,
  terminalGrowthRate: 3,
  projectedCashFlows: [-500000, -200000, 500000, 2000000, 5000000],
  targetReturn: 10,
  exitMultiple: 8,
  yearsToExit: 5,
  teamScore: 75,
  marketScore: 80,
  productScore: 70,
  competitiveScore: 65,
  marketingScore: 60,
  fundingScore: 70,
  otherScore: 65,
  berkusSoundIdea: 400000,
  berkusPrototype: 350000,
  berkusQualityTeam: 450000,
  berkusStrategicRelationships: 300000,
  berkusProductRollout: 250000,
  riskManagement: 1,
  riskStage: 0,
  riskLegislation: 0,
  riskManufacturing: 1,
  riskSalesMarketing: 0,
  riskFunding: -1,
  riskCompetition: -1,
  riskTechnology: 1,
  riskLitigation: 0,
  riskInternational: 0,
  riskReputation: 1,
  riskPotentialLucrative: 1,
  sectorMedianMultiple: 12,
  publicCompsMultiple: 15,
  privateCompsMultiple: 10,
  medianPreMoneyValuation: 3000000,
  bearCaseRevenue: 5000000,
  bearCaseProbability: 25,
  baseCaseRevenue: 20000000,
  baseCaseProbability: 50,
  bullCaseRevenue: 60000000,
  bullCaseProbability: 25,
  scenarioExitMultiple: 8,
  scenarioDiscountRate: 35,
  scenarioYearsToExit: 5,
};

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ─── Sector Multiples (Expanded) ──────────────────────────────────────────────

export const SECTOR_OPTIONS = [
  // Software & Tech
  { value: 'saas', label: 'SaaS / Cloud Software', group: 'Software & Tech' },
  { value: 'enterprise', label: 'Enterprise Software', group: 'Software & Tech' },
  { value: 'devtools', label: 'Developer Tools & Infra', group: 'Software & Tech' },
  { value: 'cybersecurity', label: 'Cybersecurity', group: 'Software & Tech' },
  { value: 'aiml', label: 'AI / Machine Learning', group: 'Software & Tech' },
  { value: 'dataanalytics', label: 'Data & Analytics', group: 'Software & Tech' },
  // Commerce & Operations
  { value: 'marketplace', label: 'Marketplace', group: 'Commerce & Operations' },
  { value: 'ecommerce', label: 'E-Commerce', group: 'Commerce & Operations' },
  { value: 'supplychain', label: 'Supply Chain Tech', group: 'Commerce & Operations' },
  { value: 'logistics', label: 'Logistics & Fulfillment', group: 'Commerce & Operations' },
  { value: 'procurement', label: 'Procurement-as-a-Service', group: 'Commerce & Operations' },
  { value: 'manufacturing', label: 'Manufacturing Tech', group: 'Commerce & Operations' },
  { value: 'retailtech', label: 'Retail Tech', group: 'Commerce & Operations' },
  // Financial Services
  { value: 'fintech', label: 'FinTech', group: 'Financial Services' },
  { value: 'insurtech', label: 'InsurTech', group: 'Financial Services' },
  { value: 'wealthtech', label: 'WealthTech / Investing', group: 'Financial Services' },
  { value: 'paytech', label: 'Payments & Banking', group: 'Financial Services' },
  { value: 'regtech', label: 'RegTech / Compliance', group: 'Financial Services' },
  // Healthcare & Life Sciences
  { value: 'healthtech', label: 'HealthTech / Digital Health', group: 'Healthcare' },
  { value: 'medtech', label: 'MedTech / Devices', group: 'Healthcare' },
  { value: 'biotech', label: 'BioTech / Life Sciences', group: 'Healthcare' },
  { value: 'pharmatech', label: 'PharmaTech', group: 'Healthcare' },
  // Deep Tech & Industrial
  { value: 'deeptech', label: 'Deep Tech / R&D', group: 'Deep Tech & Industrial' },
  { value: 'cleantech', label: 'CleanTech / Climate', group: 'Deep Tech & Industrial' },
  { value: 'spacetech', label: 'Space Tech', group: 'Deep Tech & Industrial' },
  { value: 'robotics', label: 'Robotics & Automation', group: 'Deep Tech & Industrial' },
  { value: 'agtech', label: 'AgTech / FoodTech', group: 'Deep Tech & Industrial' },
  { value: 'energytech', label: 'Energy Tech', group: 'Deep Tech & Industrial' },
  // Consumer & Media
  { value: 'consumer', label: 'Consumer Apps', group: 'Consumer & Media' },
  { value: 'edtech', label: 'EdTech', group: 'Consumer & Media' },
  { value: 'proptech', label: 'PropTech / Real Estate', group: 'Consumer & Media' },
  { value: 'hrtech', label: 'HR Tech / Future of Work', group: 'Consumer & Media' },
  { value: 'legaltech', label: 'LegalTech', group: 'Consumer & Media' },
  { value: 'traveltech', label: 'Travel & Hospitality Tech', group: 'Consumer & Media' },
  { value: 'mediatech', label: 'Media & Entertainment Tech', group: 'Consumer & Media' },
  { value: 'other', label: 'Other', group: 'Other' },
];

export const SECTOR_MULTIPLES: Record<string, { median: number; public: number; private: number }> = {
  saas: { median: 12, public: 15, private: 10 },
  enterprise: { median: 11, public: 14, private: 9 },
  devtools: { median: 14, public: 18, private: 11 },
  cybersecurity: { median: 13, public: 16, private: 11 },
  aiml: { median: 18, public: 25, private: 14 },
  dataanalytics: { median: 12, public: 15, private: 10 },
  marketplace: { median: 8, public: 10, private: 7 },
  ecommerce: { median: 4, public: 5, private: 3 },
  supplychain: { median: 9, public: 11, private: 7 },
  logistics: { median: 7, public: 9, private: 6 },
  procurement: { median: 10, public: 12, private: 8 },
  manufacturing: { median: 6, public: 8, private: 5 },
  retailtech: { median: 7, public: 9, private: 6 },
  fintech: { median: 10, public: 12, private: 8 },
  insurtech: { median: 8, public: 10, private: 7 },
  wealthtech: { median: 11, public: 14, private: 9 },
  paytech: { median: 9, public: 11, private: 7 },
  regtech: { median: 10, public: 12, private: 8 },
  healthtech: { median: 9, public: 11, private: 7 },
  medtech: { median: 8, public: 10, private: 6 },
  biotech: { median: 6, public: 8, private: 5 },
  pharmatech: { median: 7, public: 9, private: 6 },
  deeptech: { median: 15, public: 20, private: 12 },
  cleantech: { median: 10, public: 13, private: 8 },
  spacetech: { median: 12, public: 16, private: 10 },
  robotics: { median: 11, public: 14, private: 9 },
  agtech: { median: 8, public: 10, private: 6 },
  energytech: { median: 9, public: 11, private: 7 },
  consumer: { median: 5, public: 7, private: 4 },
  edtech: { median: 7, public: 9, private: 6 },
  proptech: { median: 8, public: 10, private: 7 },
  hrtech: { median: 9, public: 11, private: 8 },
  legaltech: { median: 10, public: 12, private: 8 },
  traveltech: { median: 6, public: 8, private: 5 },
  mediatech: { median: 7, public: 9, private: 6 },
  other: { median: 8, public: 10, private: 6 },
};

export const STAGE_MEDIAN_VALUATIONS: Record<string, number> = {
  'pre-seed': 1500000,
  'seed': 4000000,
  'series-a': 15000000,
  'series-b': 50000000,
  'growth': 150000000,
};
