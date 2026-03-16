/**
 * Accelerators & Incubators Database
 * Organized by region and stage for smart recommendations
 */

export type Stage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';

export interface Accelerator {
  id: string;
  name: string;
  type: 'accelerator' | 'incubator' | 'vc-studio' | 'corporate';
  regions: string[];          // country codes or region names
  stages: Stage[];
  sectors: string[];          // 'all' or specific sector keys
  equity: string;             // e.g. "7%" or "0%"
  funding: string;            // e.g. "$125K" or "Up to $500K"
  duration: string;           // e.g. "3 months"
  location: string;
  description: string;
  highlights: string[];
  applyUrl: string;
  deadline: string;           // "Rolling" or specific cycle
  tier: 1 | 2 | 3;           // 1 = top-tier global, 2 = strong regional, 3 = local/niche
  remote: boolean;
}

export const ACCELERATORS: Accelerator[] = [
  // ─── Tier 1 Global ────────────────────────────────────────────────────────
  {
    id: 'yc',
    name: 'Y Combinator',
    type: 'accelerator',
    regions: ['global'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '7%',
    funding: '$500K',
    duration: '3 months',
    location: 'San Francisco, CA (remote-friendly)',
    description: 'The world\'s most prestigious startup accelerator. Backed over 4,000 companies including Airbnb, Stripe, Dropbox, and Coinbase.',
    highlights: ['$500K standard deal', 'Access to YC alumni network (4,000+ companies)', 'Demo Day with top-tier VCs', 'Lifetime YC network access'],
    applyUrl: 'https://www.ycombinator.com/apply',
    deadline: 'Rolling (2 batches/year: Jan & July)',
    tier: 1,
    remote: true,
  },
  {
    id: 'techstars',
    name: 'Techstars',
    type: 'accelerator',
    regions: ['global'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '6%',
    funding: '$120K',
    duration: '3 months',
    location: 'Multiple cities globally',
    description: 'Global accelerator network with 50+ programs worldwide. Strong mentor network and corporate partnerships.',
    highlights: ['Mentor-driven program', '50+ global programs', 'Strong alumni network', 'Corporate partnership opportunities'],
    applyUrl: 'https://www.techstars.com/accelerators',
    deadline: 'Rolling (varies by program)',
    tier: 1,
    remote: false,
  },
  {
    id: '500startups',
    name: '500 Global',
    type: 'accelerator',
    regions: ['global'],
    stages: ['seed'],
    sectors: ['all'],
    equity: '6%',
    funding: '$150K',
    duration: '4 months',
    location: 'San Francisco, CA + global programs',
    description: 'Global venture fund and accelerator with a strong focus on emerging markets and diverse founders.',
    highlights: ['Strong MENA & Asia programs', 'Growth hacking focus', 'Global investor network', 'Post-program support'],
    applyUrl: 'https://500.co/accelerators',
    deadline: 'Rolling',
    tier: 1,
    remote: true,
  },
  {
    id: 'sequoia-arc',
    name: 'Sequoia Arc',
    type: 'accelerator',
    regions: ['global'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Investment on merit',
    duration: '8 weeks',
    location: 'Global (remote)',
    description: 'Sequoia Capital\'s founder program. No equity taken — pure value-add with access to Sequoia\'s global network.',
    highlights: ['No equity taken', 'Sequoia network access', 'Curated cohort of 15-20 companies', 'Direct path to Sequoia investment'],
    applyUrl: 'https://www.sequoiacap.com/arc',
    deadline: 'Rolling',
    tier: 1,
    remote: true,
  },
  {
    id: 'a16z-speedrun',
    name: 'a16z Speedrun',
    type: 'accelerator',
    regions: ['global'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Investment on merit',
    duration: '4 weeks',
    location: 'San Francisco, CA',
    description: 'Andreessen Horowitz\'s founder program focused on consumer and enterprise software.',
    highlights: ['a16z network access', 'No equity taken', 'Intensive 4-week format', 'Direct VC introductions'],
    applyUrl: 'https://a16z.com/speedrun',
    deadline: 'Rolling',
    tier: 1,
    remote: false,
  },

  // ─── MENA Region ──────────────────────────────────────────────────────────
  {
    id: 'flat6labs',
    name: 'Flat6Labs',
    type: 'accelerator',
    regions: ['SA', 'AE', 'EG', 'BH', 'TN', 'MA', 'JO', 'mena'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '5-10%',
    funding: '$20K–$100K',
    duration: '4 months',
    location: 'Cairo, Riyadh, Abu Dhabi, Bahrain, Tunis, Casablanca, Amman',
    description: 'MENA\'s leading startup accelerator with programs across 7 cities. Strong local ecosystem connections.',
    highlights: ['MENA-focused network', 'Local market expertise', 'Government partnerships', 'Arabic-speaking support'],
    applyUrl: 'https://www.flat6labs.com/apply',
    deadline: 'Rolling (multiple cohorts/year)',
    tier: 2,
    remote: false,
  },
  {
    id: 'misk',
    name: 'Misk Accelerator',
    type: 'accelerator',
    regions: ['SA', 'mena'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '0%',
    funding: 'SAR 300K (~$80K)',
    duration: '3 months',
    location: 'Riyadh, Saudi Arabia',
    description: 'Saudi Arabia\'s premier accelerator backed by Misk Foundation. Focuses on Vision 2030 aligned sectors.',
    highlights: ['No equity taken', 'Saudi Vision 2030 alignment', 'Government connections', 'Strong local VC network'],
    applyUrl: 'https://misk.org.sa/accelerator',
    deadline: 'Annual (Q1)',
    tier: 2,
    remote: false,
  },
  {
    id: 'sdaia-accelerator',
    name: 'SDAIA Accelerator',
    type: 'accelerator',
    regions: ['SA', 'mena'],
    stages: ['seed', 'series-a'],
    sectors: ['aiml', 'dataanalytics', 'cybersecurity'],
    equity: '0%',
    funding: 'Up to SAR 500K',
    duration: '3 months',
    location: 'Riyadh, Saudi Arabia',
    description: 'Saudi Data & AI Authority accelerator focused exclusively on AI, data, and smart city startups.',
    highlights: ['AI/Data focus', 'Government procurement opportunities', 'NEOM & smart city access', 'Regulatory fast-track'],
    applyUrl: 'https://sdaia.gov.sa',
    deadline: 'Annual',
    tier: 2,
    remote: false,
  },
  {
    id: 'dtec',
    name: 'DTEC (Dubai Technology Entrepreneur Campus)',
    type: 'incubator',
    regions: ['AE', 'mena'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Office space + support',
    duration: 'Ongoing',
    location: 'Dubai Silicon Oasis, UAE',
    description: 'Dubai\'s largest tech startup hub offering co-working, incubation, and acceleration services.',
    highlights: ['Dubai Silicon Oasis license support', 'Visa assistance', 'Investor network', 'Free zone benefits'],
    applyUrl: 'https://dtec.ae',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },
  {
    id: 'hub71',
    name: 'Hub71',
    type: 'incubator',
    regions: ['AE', 'mena'],
    stages: ['pre-seed', 'seed', 'series-a'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Up to $415K in incentives',
    duration: 'Ongoing',
    location: 'Abu Dhabi, UAE',
    description: 'Abu Dhabi\'s global tech ecosystem backed by Mubadala, Microsoft, and SoftBank. Offers housing, health insurance, and office subsidies.',
    highlights: ['$415K incentive package', 'Housing subsidy', 'Health insurance', 'Mubadala & SoftBank network'],
    applyUrl: 'https://hub71.com/apply',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },
  {
    id: 'wamda',
    name: 'Wamda Capital',
    type: 'vc-studio',
    regions: ['AE', 'SA', 'JO', 'LB', 'mena'],
    stages: ['seed', 'series-a'],
    sectors: ['all'],
    equity: 'Varies',
    funding: '$500K–$5M',
    duration: 'Ongoing',
    location: 'Dubai, UAE',
    description: 'MENA-focused VC and ecosystem builder supporting tech entrepreneurs across the Arab world.',
    highlights: ['MENA market expertise', 'Cross-border expansion support', 'Strong LP network', 'Policy advocacy'],
    applyUrl: 'https://www.wamda.com',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },
  {
    id: 'oqal',
    name: 'Oqal Angel Network',
    type: 'accelerator',
    regions: ['SA', 'mena'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: 'Varies',
    funding: 'SAR 100K–1M',
    duration: 'Varies',
    location: 'Riyadh, Saudi Arabia',
    description: 'Saudi Arabia\'s largest angel investor network connecting startups with local HNW investors.',
    highlights: ['Largest Saudi angel network', 'Local investor connections', 'Sharia-compliant options', 'Government backing'],
    applyUrl: 'https://oqal.com',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },

  // ─── Europe ───────────────────────────────────────────────────────────────
  {
    id: 'seedcamp',
    name: 'Seedcamp',
    type: 'accelerator',
    regions: ['GB', 'DE', 'FR', 'NL', 'SE', 'europe'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '7%',
    funding: '€200K',
    duration: 'Ongoing',
    location: 'London, UK (pan-European)',
    description: 'Europe\'s leading pre-seed fund and accelerator. Backed Revolut, UiPath, and Wise.',
    highlights: ['Pan-European network', 'Strong fintech/deeptech focus', 'Long-term founder support', 'London HQ'],
    applyUrl: 'https://seedcamp.com/apply',
    deadline: 'Rolling',
    tier: 1,
    remote: true,
  },
  {
    id: 'station-f',
    name: 'Station F (Paris)',
    type: 'incubator',
    regions: ['FR', 'europe'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Office space + programs',
    duration: 'Ongoing',
    location: 'Paris, France',
    description: 'World\'s largest startup campus with 30+ programs including Facebook, Microsoft, and Ubisoft tracks.',
    highlights: ['World\'s largest startup campus', '30+ programs', 'Paris ecosystem access', 'Visa support for non-EU'],
    applyUrl: 'https://stationf.co/programs',
    deadline: 'Rolling',
    tier: 1,
    remote: false,
  },
  {
    id: 'startupwise-guys',
    name: 'Startup Wise Guys',
    type: 'accelerator',
    regions: ['EE', 'LV', 'LT', 'europe'],
    stages: ['pre-seed', 'seed'],
    sectors: ['saas', 'b2b', 'fintech'],
    equity: '8%',
    funding: '€65K',
    duration: '3 months',
    location: 'Tallinn, Estonia (pan-European)',
    description: 'Europe\'s top B2B SaaS accelerator with strong focus on Baltic and CEE startups.',
    highlights: ['B2B SaaS specialist', 'EU market entry support', 'Strong mentor network', 'e-Residency support'],
    applyUrl: 'https://startupwiseguys.com/apply',
    deadline: 'Rolling',
    tier: 2,
    remote: true,
  },

  // ─── Asia-Pacific ─────────────────────────────────────────────────────────
  {
    id: 'antler',
    name: 'Antler',
    type: 'vc-studio',
    regions: ['global', 'SG', 'IN', 'AU', 'NG', 'SE', 'NL', 'GB'],
    stages: ['pre-seed'],
    sectors: ['all'],
    equity: '10%',
    funding: '$200K–$400K',
    duration: '3 months',
    location: 'Singapore + 25 global cities',
    description: 'Global early-stage VC that builds companies from scratch. Matches co-founders and provides pre-seed funding.',
    highlights: ['Co-founder matching', '25+ global locations', 'Day-0 company building', 'Strong Asia-Pacific network'],
    applyUrl: 'https://www.antler.co/apply',
    deadline: 'Rolling',
    tier: 1,
    remote: false,
  },
  {
    id: 'plug-and-play',
    name: 'Plug and Play Tech Center',
    type: 'accelerator',
    regions: ['global', 'US', 'DE', 'JP', 'AE', 'SG'],
    stages: ['seed', 'series-a'],
    sectors: ['all'],
    equity: '0%',
    funding: 'Corporate partnerships',
    duration: '3 months',
    location: 'Silicon Valley + 50 global locations',
    description: 'Corporate innovation platform connecting startups with Fortune 500 companies for pilots and investments.',
    highlights: ['No equity taken', '50+ global locations', 'Corporate pilot opportunities', 'Fortune 500 connections'],
    applyUrl: 'https://www.plugandplaytechcenter.com/apply',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },

  // ─── US Regional ──────────────────────────────────────────────────────────
  {
    id: 'mit-delta-v',
    name: 'MIT delta v',
    type: 'accelerator',
    regions: ['US'],
    stages: ['pre-seed', 'seed'],
    sectors: ['deeptech', 'biotech', 'aiml'],
    equity: '0%',
    funding: '$20K stipend',
    duration: '3 months',
    location: 'Cambridge, MA',
    description: 'MIT\'s flagship student/alumni accelerator. Strong focus on deep tech and science-based startups.',
    highlights: ['MIT network access', 'No equity taken', 'Deep tech focus', 'Strong research commercialization'],
    applyUrl: 'https://entrepreneurship.mit.edu/accelerator',
    deadline: 'Annual (Spring)',
    tier: 2,
    remote: false,
  },
  {
    id: 'nsvf',
    name: 'National Science Foundation I-Corps',
    type: 'accelerator',
    regions: ['US'],
    stages: ['pre-seed'],
    sectors: ['deeptech', 'biotech', 'cleantech'],
    equity: '0%',
    funding: '$50K grant',
    duration: '7 weeks',
    location: 'US (remote + in-person)',
    description: 'NSF program helping scientists and engineers commercialize research. $50K non-dilutive grant.',
    highlights: ['Non-dilutive $50K', 'Customer discovery focus', 'Research commercialization', 'NSF network'],
    applyUrl: 'https://www.nsf.gov/news/special_reports/i-corps',
    deadline: 'Rolling (cohorts)',
    tier: 2,
    remote: true,
  },

  // ─── Africa ───────────────────────────────────────────────────────────────
  {
    id: 'ycombinator-africa',
    name: 'Y Combinator (Africa Track)',
    type: 'accelerator',
    regions: ['NG', 'KE', 'ZA', 'GH', 'africa'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: '7%',
    funding: '$500K',
    duration: '3 months',
    location: 'San Francisco (remote-friendly)',
    description: 'YC actively recruits African founders. Strong alumni base in Nigeria, Kenya, and South Africa.',
    highlights: ['Growing African cohort', 'Remote-friendly', 'Flutterwave, Paystack alumni', 'Global network'],
    applyUrl: 'https://www.ycombinator.com/apply',
    deadline: 'Rolling',
    tier: 1,
    remote: true,
  },
  {
    id: 'cchub',
    name: 'Co-Creation Hub (CcHUB)',
    type: 'incubator',
    regions: ['NG', 'KE', 'RW', 'africa'],
    stages: ['pre-seed', 'seed'],
    sectors: ['all'],
    equity: 'Varies',
    funding: 'Up to $250K',
    duration: 'Ongoing',
    location: 'Lagos, Nigeria + Nairobi, Kigali',
    description: 'Africa\'s leading tech innovation center. Backed Ubenwa, Lifebank, and 200+ African startups.',
    highlights: ['Africa market expertise', 'Pan-African network', 'Social impact focus', 'Strong media & fintech track'],
    applyUrl: 'https://cchubnigeria.com',
    deadline: 'Rolling',
    tier: 2,
    remote: false,
  },
];

// ─── Country to Region Mapping ─────────────────────────────────────────────────

export const COUNTRY_TO_REGION: Record<string, string[]> = {
  // MENA
  'Saudi Arabia': ['SA', 'mena'],
  'UAE': ['AE', 'mena'],
  'Egypt': ['EG', 'mena'],
  'Jordan': ['JO', 'mena'],
  'Bahrain': ['BH', 'mena'],
  'Kuwait': ['KW', 'mena'],
  'Qatar': ['QA', 'mena'],
  'Oman': ['OM', 'mena'],
  'Lebanon': ['LB', 'mena'],
  'Morocco': ['MA', 'mena'],
  'Tunisia': ['TN', 'mena'],
  'Iraq': ['IQ', 'mena'],
  // Americas
  'United States': ['US'],
  'Canada': ['CA'],
  'Brazil': ['BR'],
  'Mexico': ['MX'],
  // Europe
  'United Kingdom': ['GB', 'europe'],
  'Germany': ['DE', 'europe'],
  'France': ['FR', 'europe'],
  'Netherlands': ['NL', 'europe'],
  'Sweden': ['SE', 'europe'],
  'Estonia': ['EE', 'europe'],
  'Spain': ['ES', 'europe'],
  'Italy': ['IT', 'europe'],
  // Asia-Pacific
  'Singapore': ['SG'],
  'India': ['IN'],
  'Australia': ['AU'],
  'Japan': ['JP'],
  'South Korea': ['KR'],
  'Indonesia': ['ID'],
  // Africa
  'Nigeria': ['NG', 'africa'],
  'Kenya': ['KE', 'africa'],
  'South Africa': ['ZA', 'africa'],
  'Ghana': ['GH', 'africa'],
  'Rwanda': ['RW', 'africa'],
  'Other': ['global'],
};

export const COUNTRIES = Object.keys(COUNTRY_TO_REGION).sort();

// ─── Recommendation Engine ─────────────────────────────────────────────────────

export function recommendAccelerators(
  stage: Stage,
  country: string,
  sector: string,
  limit = 8
): Accelerator[] {
  const regions = COUNTRY_TO_REGION[country] || ['global'];

  const scored = ACCELERATORS.map(acc => {
    let score = 0;

    // Stage match
    if (acc.stages.includes(stage)) score += 40;
    else if (
      (stage === 'seed' && acc.stages.includes('pre-seed')) ||
      (stage === 'series-a' && acc.stages.includes('seed'))
    ) score += 20;

    // Region match
    if (acc.regions.includes('global')) score += 15;
    regions.forEach(r => {
      if (acc.regions.includes(r)) score += r === 'global' ? 10 : 30;
    });

    // Sector match
    if (acc.sectors.includes('all')) score += 10;
    else if (acc.sectors.includes(sector)) score += 20;

    // Tier bonus
    score += (4 - acc.tier) * 5;

    return { acc, score };
  });

  return scored
    .filter(s => s.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.acc);
}
