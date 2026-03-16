/**
 * Shared dropdown constants used across all screens
 * Single source of truth for sectors, stages, jurisdictions, countries, check sizes
 */

export const SECTORS = [
  "Artificial Intelligence / ML",
  "FinTech",
  "HealthTech / MedTech",
  "EdTech",
  "E-commerce / Retail Tech",
  "SaaS / B2B Software",
  "CleanTech / GreenTech",
  "AgriTech",
  "PropTech / Real Estate Tech",
  "LegalTech",
  "HRTech / Future of Work",
  "Cybersecurity",
  "Logistics / Supply Chain",
  "FoodTech",
  "TravelTech / Hospitality",
  "InsurTech",
  "RegTech",
  "BioTech / Life Sciences",
  "SpaceTech",
  "Gaming / Esports",
  "Media / Content Tech",
  "Social Impact / NGO Tech",
  "Web3 / Blockchain / Crypto",
  "IoT / Hardware",
  "Marketplace",
  "Consumer Apps",
  "Deep Tech",
  "Other",
] as const;

export const STARTUP_STAGES = [
  "Idea / Pre-product",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth / Late Stage",
  "Pre-IPO",
] as const;

export const FUNDING_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth / Late Stage",
  "Pre-IPO",
] as const;

export const CHECK_SIZES = [
  "Under $25K",
  "$25K – $100K",
  "$100K – $500K",
  "$500K – $1M",
  "$1M – $5M",
  "$5M – $10M",
  "$10M – $25M",
  "$25M – $50M",
  "$50M – $100M",
  "$100M+",
] as const;

export const REGIONS = [
  "Global",
  "MENA (Middle East & North Africa)",
  "GCC (Gulf Cooperation Council)",
  "Levant",
  "North Africa",
  "Sub-Saharan Africa",
  "North America",
  "Latin America",
  "Europe",
  "UK",
  "DACH (Germany, Austria, Switzerland)",
  "Nordics",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Australia / Oceania",
  "Central Asia",
] as const;

export const COUNTRIES = [
  // MENA
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Egypt",
  "Lebanon",
  "Iraq",
  "Palestine",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Libya",
  "Yemen",
  // Africa
  "Nigeria",
  "Kenya",
  "South Africa",
  "Ghana",
  "Ethiopia",
  "Rwanda",
  "Senegal",
  // Europe
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "Spain",
  "Italy",
  // Americas
  "United States",
  "Canada",
  "Brazil",
  "Mexico",
  "Colombia",
  "Argentina",
  // Asia
  "India",
  "Singapore",
  "Indonesia",
  "Malaysia",
  "Vietnam",
  "Philippines",
  "Pakistan",
  "Bangladesh",
  "China",
  "Japan",
  "South Korea",
  // Other
  "Australia",
  "New Zealand",
  "Other",
] as const;

export const JURISDICTIONS = [
  // MENA
  "Saudi Arabia (SAMA / CMA)",
  "UAE – DIFC",
  "UAE – ADGM",
  "UAE – Mainland",
  "Qatar (QFC)",
  "Bahrain (CBB)",
  "Kuwait",
  "Jordan",
  "Egypt",
  "Morocco",
  // Global Hubs
  "United States – Delaware",
  "United States – California",
  "United Kingdom",
  "Cayman Islands",
  "British Virgin Islands (BVI)",
  "Singapore",
  "Netherlands",
  "Germany",
  "France",
  "Luxembourg",
  "Switzerland",
  "Canada",
  "Australia",
  "India",
  "Other",
] as const;

export const LEGAL_SPECIALIZATIONS = [
  "Venture Capital & Startup Law",
  "Corporate & Commercial Law",
  "Mergers & Acquisitions (M&A)",
  "Intellectual Property (IP)",
  "Employment & Labor Law",
  "Regulatory & Compliance",
  "Data Privacy & Cybersecurity",
  "Real Estate & PropTech",
  "FinTech Regulation",
  "Cross-border Transactions",
  "Term Sheet & Investment Agreements",
  "Shareholder Agreements",
  "Licensing & Franchising",
  "Dispute Resolution & Arbitration",
] as const;

export const COFOUNDER_ROLES = [
  "CEO (Chief Executive Officer)",
  "CTO (Chief Technology Officer)",
  "COO (Chief Operating Officer)",
  "CFO (Chief Financial Officer)",
  "CMO (Chief Marketing Officer)",
  "CPO (Chief Product Officer)",
  "CRO (Chief Revenue Officer)",
  "Head of Engineering",
  "Head of Design / UX",
  "Head of Sales",
  "Head of Operations",
  "Head of Data / AI",
  "Business Development",
  "Other",
] as const;

export const VESTING_SCHEDULES = [
  "4 years, 1-year cliff (standard)",
  "3 years, 6-month cliff",
  "4 years, no cliff",
  "5 years, 1-year cliff",
  "2 years, 6-month cliff",
  "Custom",
] as const;

export const INVESTOR_TYPES = [
  "Venture Capital (VC) Fund",
  "Angel Investor",
  "Family Office",
  "Corporate VC / Strategic Investor",
  "Government / Sovereign Fund",
  "Accelerator / Incubator",
  "Crowdfunding Platform",
  "Debt / Revenue-based Financing",
  "Impact Investor",
  "Other",
] as const;

export const CONTACT_STAGES = [
  "Prospect",
  "Contacted",
  "Meeting Scheduled",
  "Pitch Done",
  "Due Diligence",
  "Term Sheet",
  "Closed / Won",
  "Passed",
] as const;

export type Sector = typeof SECTORS[number];
export type StartupStage = typeof STARTUP_STAGES[number];
export type FundingStage = typeof FUNDING_STAGES[number];
export type CheckSize = typeof CHECK_SIZES[number];
export type Region = typeof REGIONS[number];
export type Country = typeof COUNTRIES[number];
export type Jurisdiction = typeof JURISDICTIONS[number];
export type LegalSpecialization = typeof LEGAL_SPECIALIZATIONS[number];
export type CofounderRole = typeof COFOUNDER_ROLES[number];
export type VestingSchedule = typeof VESTING_SCHEDULES[number];
export type InvestorType = typeof INVESTOR_TYPES[number];
export type ContactStage = typeof CONTACT_STAGES[number];

export const NON_COMPETE_PERIODS = [
  "6 months",
  "12 months",
  "18 months",
  "24 months",
  "No non-compete",
] as const;

export const DECISION_MAKING_OPTIONS = [
  "Majority vote (>50%)",
  "Supermajority vote (>66%)",
  "Unanimous consent",
  "CEO has final say",
  "Board decision",
  "Custom",
] as const;

export type NonCompetePeriod = typeof NON_COMPETE_PERIODS[number];
export type DecisionMakingOption = typeof DECISION_MAKING_OPTIONS[number];
