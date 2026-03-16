/**
 * Chat Flow Definition — Polaris Arabia
 * Plain-English conversational questions that map to StartupInputs
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import {
  SECTOR_OPTIONS, SECTOR_MULTIPLES, STAGE_MEDIAN_VALUATIONS, defaultInputs,
  type StartupInputs,
} from './valuation';

export type QuestionType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'select'
  | 'multiselect'
  | 'slider'
  | 'confirm'
  | 'cashflows';

export interface ChatQuestion {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: { value: string; label: string; group?: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  mapTo: string | string[];
  transform?: (raw: any) => Partial<StartupInputs>;
  skipIf?: (answers: Record<string, any>) => boolean;
  emoji?: string;
}

// ─── Question Flow ─────────────────────────────────────────────────────────────

export const CHAT_QUESTIONS: ChatQuestion[] = [
  {
    id: 'companyName',
    emoji: '👋',
    text: "What's your startup called?",
    subtext: "Just the name — we'll use it on your report.",
    type: 'text',
    placeholder: 'e.g. Acme AI',
    mapTo: 'companyName',
    defaultValue: 'My Startup',
  },
  {
    id: 'sector',
    emoji: '🏭',
    text: "What does your startup do? Pick the closest category.",
    subtext: "This helps us use the right industry benchmarks.",
    type: 'select',
    options: SECTOR_OPTIONS,
    mapTo: 'sector',
    defaultValue: 'saas',
    transform: (val: string) => {
      const m = SECTOR_MULTIPLES[val] || SECTOR_MULTIPLES['saas'];
      return {
        sector: val,
        sectorMedianMultiple: m.median,
        publicCompsMultiple: m.public,
        privateCompsMultiple: m.private,
      };
    },
  },
  {
    id: 'stage',
    emoji: '🚀',
    text: "What stage is your startup at?",
    subtext: "This affects which valuation methods carry the most weight.",
    type: 'select',
    options: [
      { value: 'pre-seed', label: 'Pre-Seed — just an idea or early prototype, no revenue yet' },
      { value: 'seed', label: 'Seed — early product, maybe some first customers' },
      { value: 'series-a', label: 'Series A — product-market fit, growing revenue' },
      { value: 'series-b', label: 'Series B — scaling fast, proven business model' },
      { value: 'growth', label: 'Growth — large revenue, expanding into new markets' },
    ],
    mapTo: 'stage',
    defaultValue: 'seed',
    transform: (val: string) => ({
      stage: val as StartupInputs['stage'],
      medianPreMoneyValuation: STAGE_MEDIAN_VALUATIONS[val] || 4000000,
    }),
  },
  {
    id: 'currentARR',
    emoji: '💰',
    text: "How much revenue does your startup make per year?",
    subtext: "If you're pre-revenue, just enter 0. This is your Annual Recurring Revenue (ARR) — the total yearly income from customers.",
    type: 'currency',
    placeholder: '500000',
    min: 0,
    step: 10000,
    mapTo: 'currentARR',
    defaultValue: 0,
  },
  {
    id: 'revenueGrowthRate',
    emoji: '📈',
    text: "How fast is your revenue growing year over year?",
    subtext: "For example, if you went from $500K to $1.1M last year, that's 120% growth. If you're pre-revenue, estimate your expected first-year growth.",
    type: 'percent',
    placeholder: '120',
    min: 0,
    max: 1000,
    step: 5,
    mapTo: 'revenueGrowthRate',
    defaultValue: 100,
  },
  {
    id: 'grossMargin',
    emoji: '📊',
    text: "What percentage of your revenue is profit before operating costs?",
    subtext: "This is your gross margin — what's left after paying for the product/service itself (not salaries or marketing). Software companies are usually 60–85%. Hardware or services can be lower.",
    type: 'percent',
    placeholder: '70',
    min: 0,
    max: 100,
    step: 5,
    mapTo: 'grossMargin',
    defaultValue: 70,
  },
  {
    id: 'burnRate',
    emoji: '🔥',
    text: "How much cash does your startup spend per month?",
    subtext: "This is your monthly burn rate — total money going out (salaries, rent, software, marketing, etc.). If you're profitable, enter 0.",
    type: 'currency',
    placeholder: '150000',
    min: 0,
    step: 5000,
    mapTo: 'burnRate',
    defaultValue: 100000,
  },
  {
    id: 'cashOnHand',
    emoji: '🏦',
    text: "How much cash does your startup currently have in the bank?",
    subtext: "Include all liquid funds — bank accounts, short-term investments. This helps us calculate your runway.",
    type: 'currency',
    placeholder: '2000000',
    min: 0,
    step: 100000,
    mapTo: 'cashOnHand',
    defaultValue: 1000000,
  },
  {
    id: 'totalAddressableMarket',
    emoji: '🌍',
    text: "How big is the total market you're going after?",
    subtext: "This is your Total Addressable Market (TAM) — the total revenue opportunity if you captured 100% of your target market. Think big. For a global SaaS tool, this could be billions.",
    type: 'currency',
    placeholder: '5000000000',
    min: 0,
    step: 100000000,
    mapTo: 'totalAddressableMarket',
    defaultValue: 1000000000,
  },
  {
    id: 'projectedRevenue5Y',
    emoji: '🔭',
    text: "What do you realistically expect your annual revenue to be in 5 years?",
    subtext: "Be ambitious but honest. This is your 5-year revenue target — a key input for investor return calculations.",
    type: 'currency',
    placeholder: '20000000',
    min: 0,
    step: 500000,
    mapTo: 'projectedRevenue5Y',
    defaultValue: 10000000,
  },
  {
    id: 'teamScore',
    emoji: '👥',
    text: "How strong is your founding team? (0–100)",
    subtext: "Think about: domain expertise, previous startup experience, technical skills, and ability to execute. 50 = average first-time founder. 80+ = serial entrepreneur with relevant exits.",
    type: 'slider',
    min: 0,
    max: 100,
    step: 5,
    mapTo: 'teamScore',
    defaultValue: 60,
  },
  {
    id: 'marketScore',
    emoji: '📡',
    text: "How attractive is your market opportunity? (0–100)",
    subtext: "Consider: market size, growth rate, timing, and urgency of the problem. 50 = decent niche market. 80+ = large, fast-growing market with a clear pain point.",
    type: 'slider',
    min: 0,
    max: 100,
    step: 5,
    mapTo: 'marketScore',
    defaultValue: 65,
  },
  {
    id: 'productScore',
    emoji: '🛠️',
    text: "How differentiated is your product or technology? (0–100)",
    subtext: "Think about: unique features, patents, technical moat, or proprietary data. 50 = solid product, some competition. 80+ = hard to replicate, strong IP.",
    type: 'slider',
    min: 0,
    max: 100,
    step: 5,
    mapTo: 'productScore',
    defaultValue: 60,
  },
  {
    id: 'competitiveScore',
    emoji: '⚔️',
    text: "How favorable is your competitive environment? (0–100)",
    subtext: "Higher score = fewer strong competitors. 50 = competitive but you have differentiation. 80+ = blue ocean or clear market leader position.",
    type: 'slider',
    min: 0,
    max: 100,
    step: 5,
    mapTo: 'competitiveScore',
    defaultValue: 55,
  },
  {
    id: 'riskOverall',
    emoji: '🛡️',
    text: "Overall, how risky is your startup compared to a typical one at your stage?",
    subtext: "This covers things like regulatory risk, technology risk, and market risk.",
    type: 'select',
    options: [
      { value: 'very_low', label: '🟢 Very Low — proven model, low regulation, clear path to revenue' },
      { value: 'low', label: '🟡 Low — some uncertainty but well-understood market' },
      { value: 'medium', label: '🟠 Medium — typical startup risk, some unknowns' },
      { value: 'high', label: '🔴 High — new market, regulatory hurdles, or unproven tech' },
      { value: 'very_high', label: '🚨 Very High — deep tech, biotech, or highly regulated space' },
    ],
    mapTo: 'riskOverall',
    defaultValue: 'medium',
    transform: (val: string) => {
      const riskMap: Record<string, Partial<StartupInputs>> = {
        very_low:  { riskManagement: 2, riskStage: 1, riskLegislation: 2, riskManufacturing: 1, riskSalesMarketing: 1, riskFunding: 1, riskCompetition: 1, riskTechnology: 2, riskLitigation: 1, riskInternational: 1, riskReputation: 1, riskPotentialLucrative: 2 },
        low:       { riskManagement: 1, riskStage: 1, riskLegislation: 1, riskManufacturing: 1, riskSalesMarketing: 0, riskFunding: 0, riskCompetition: 0, riskTechnology: 1, riskLitigation: 0, riskInternational: 0, riskReputation: 1, riskPotentialLucrative: 1 },
        medium:    { riskManagement: 1, riskStage: 0, riskLegislation: 0, riskManufacturing: 0, riskSalesMarketing: 0, riskFunding: -1, riskCompetition: -1, riskTechnology: 0, riskLitigation: 0, riskInternational: 0, riskReputation: 0, riskPotentialLucrative: 1 },
        high:      { riskManagement: 0, riskStage: -1, riskLegislation: -1, riskManufacturing: -1, riskSalesMarketing: -1, riskFunding: -1, riskCompetition: -1, riskTechnology: -1, riskLitigation: -1, riskInternational: 0, riskReputation: 0, riskPotentialLucrative: 0 },
        very_high: { riskManagement: -1, riskStage: -2, riskLegislation: -2, riskManufacturing: -1, riskSalesMarketing: -1, riskFunding: -2, riskCompetition: -1, riskTechnology: -2, riskLitigation: -1, riskInternational: -1, riskReputation: -1, riskPotentialLucrative: -1 },
      };
      return riskMap[val] || riskMap['medium'];
    },
  },
  {
    id: 'exitMultiple',
    emoji: '🎯',
    text: "If your startup gets acquired or goes public, what kind of exit multiple do you expect?",
    subtext: "This is how many times your annual revenue an acquirer might pay. SaaS companies often sell for 5–15x revenue. High-growth AI companies can be 20x+.",
    type: 'select',
    options: [
      { value: '4', label: '4x — conservative, slower growth or services business' },
      { value: '6', label: '6x — moderate, solid SaaS or marketplace' },
      { value: '8', label: '8x — good, strong growth SaaS' },
      { value: '12', label: '12x — strong, high-growth tech company' },
      { value: '15', label: '15x — premium, market leader or AI-native' },
      { value: '20', label: '20x+ — exceptional, category-defining company' },
    ],
    mapTo: 'exitMultiple',
    defaultValue: '8',
    transform: (val: string) => ({
      exitMultiple: parseFloat(val),
      scenarioExitMultiple: parseFloat(val),
    }),
  },
  {
    id: 'yearsToExit',
    emoji: '⏳',
    text: "In how many years do you expect a major exit (acquisition or IPO)?",
    subtext: "Most VC-backed startups aim for an exit in 5–7 years. Be realistic.",
    type: 'select',
    options: [
      { value: '3', label: '3 years — aggressive timeline' },
      { value: '5', label: '5 years — typical VC horizon' },
      { value: '7', label: '7 years — longer runway' },
      { value: '10', label: '10 years — patient capital' },
    ],
    mapTo: 'yearsToExit',
    defaultValue: '5',
    transform: (val: string) => ({
      yearsToExit: parseInt(val),
      scenarioYearsToExit: parseInt(val),
    }),
  },
  {
    id: 'berkusMilestones',
    emoji: '✅',
    text: "Which of these milestones has your startup achieved?",
    subtext: "Select all that apply. This is used for the Berkus valuation method — great for early-stage startups.",
    type: 'multiselect',
    options: [
      { value: 'idea', label: '💡 We have a validated idea / clear problem-solution fit' },
      { value: 'prototype', label: '🛠️ We have a working prototype or MVP' },
      { value: 'team', label: '👥 We have a strong, experienced team in place' },
      { value: 'relationships', label: '🤝 We have key partnerships, LOIs, or distribution deals' },
      { value: 'revenue', label: '💳 We have paying customers or signed contracts' },
    ],
    mapTo: 'berkusMilestones',
    defaultValue: [],
    transform: (val: string[]) => ({
      berkusSoundIdea: val.includes('idea') ? 400000 : 0,
      berkusPrototype: val.includes('prototype') ? 400000 : 0,
      berkusQualityTeam: val.includes('team') ? 450000 : 0,
      berkusStrategicRelationships: val.includes('relationships') ? 350000 : 0,
      berkusProductRollout: val.includes('revenue') ? 450000 : 0,
    }),
  },
];

// ─── Derive full StartupInputs from chat answers ───────────────────────────────

export function buildInputsFromAnswers(answers: Record<string, any>): StartupInputs {
  const base: StartupInputs = { ...defaultInputs };

  for (const q of CHAT_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined || raw === null) continue;

    if (q.transform) {
      const mapped = q.transform(raw);
      Object.assign(base, mapped);
    } else {
      const key = Array.isArray(q.mapTo) ? q.mapTo[0] : q.mapTo;
      (base as any)[key] = typeof raw === 'string' && (q.type === 'currency' || q.type === 'percent' || q.type === 'number')
        ? parseFloat(raw) || 0
        : raw;
    }
  }

  // Derive projected cash flows from ARR + growth
  const arr = base.currentARR || 0;
  const g = (base.revenueGrowthRate || 100) / 100;
  const margin = (base.grossMargin || 70) / 100;
  const burn = base.burnRate || 0;
  base.projectedCashFlows = [1, 2, 3, 4, 5].map(yr => {
    const rev = arr * Math.pow(1 + g, yr);
    const fcf = rev * margin * 0.3 - burn * 12 * Math.pow(0.85, yr);
    return Math.round(fcf);
  });

  // Derive bear/base/bull from projectedRevenue5Y
  const r5 = base.projectedRevenue5Y || 10000000;
  base.bearCaseRevenue = Math.round(r5 * 0.35);
  base.baseCaseRevenue = Math.round(r5);
  base.bullCaseRevenue = Math.round(r5 * 2.5);
  base.bearCaseProbability = 25;
  base.baseCaseProbability = 50;
  base.bullCaseProbability = 25;

  // Scorecard defaults for unused fields
  base.marketingScore = Math.round((base.marketScore + base.productScore) / 2);
  base.fundingScore = 65;
  base.otherScore = 65;

  return base;
}

// ─── Format answer for display ────────────────────────────────────────────────

export function formatAnswer(q: ChatQuestion, value: any): string {
  if (value === null || value === undefined) return '—';

  if (q.type === 'currency') {
    const n = parseFloat(value);
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }
  if (q.type === 'percent') return `${value}%`;
  if (q.type === 'slider') return `${value}/100`;
  if (q.type === 'select') {
    const opt = q.options?.find(o => o.value === value);
    return opt?.label?.replace(/^[^\w]*/, '').split('—')[0].trim() || String(value);
  }
  if (q.type === 'multiselect' && Array.isArray(value)) {
    if (value.length === 0) return 'None yet';
    return `${value.length} milestone${value.length !== 1 ? 's' : ''} achieved`;
  }
  return String(value);
}
