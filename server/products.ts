/**
 * Stripe Products & Prices
 * Central definition for all subscription plans
 */

export const PLANS = {
  pro: {
    name: 'AI Startup Toolkit Pro',
    description: 'Full access to all 9 tools: Valuation Calculator, Accelerator Finder, Co-Founder Equity Split, Dilution Simulator, Fundraising Readiness, Pitch Deck Scorecard, Investor CRM, Runway Optimizer, and Term Sheet Glossary.',
    price: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month' as const,
    features: [
      'AI-powered valuation using 7 industry methods',
      'Accelerator & incubator finder (100+ programs globally)',
      'Co-founder equity split calculator',
      'Dilution simulator (Pre-Seed → Series E)',
      'Fundraising readiness score (20 checks)',
      'Pitch deck scorecard (10 slides)',
      'Investor CRM with CSV export',
      'Runway optimizer',
      'Term Sheet glossary (80+ terms)',
      'PDF report export',
      'Shareable valuation links',
      'Unlimited scenarios',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
