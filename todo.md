# AI Startup Toolkit — Project TODO

## Auth System
- [x] Replace Manus OAuth with custom email/password auth
- [x] Backend: register, login, logout, me procedures (authRouter.ts)
- [x] JWT session cookies (jose library)
- [x] bcryptjs password hashing
- [x] Update context.ts to use custom JWT verification
- [x] Sign In page (/login)
- [x] Register page (/register) with password strength indicator
- [x] Update useAuth hook to use custom auth
- [x] Update const.ts to remove Manus OAuth URLs

## Homepage
- [x] Marketing landing page (LandingPage.tsx) at /
- [x] Hero section with stats
- [x] Tools grid (13 tools)
- [x] How it works section
- [x] Database highlight section
- [x] Testimonials section
- [x] CTA section
- [x] Footer

## Investor & Resources Database
- [x] VC Firms database (35 firms, global coverage)
- [x] Angel Investors database (25 investors)
- [x] Grants & Programs database (22 grants)
- [x] Venture Lawyers database (20 firms)
- [x] Search and filter functionality
- [x] ResourceDatabase component with tabs
- [x] resourcesRouter.ts with tRPC procedures
- [x] Integrated into Home.tsx sidebar nav
- [x] Community badge on user-submitted entries

## KYC Onboarding Flow
- [x] Add userType field to users table (vc | angel | venture_lawyer | startup | other)
- [x] Add kycCompleted boolean to users table
- [x] Create kycVcProfiles table
- [x] Create kycAngelProfiles table
- [x] Create kycLawyerProfiles table
- [x] Create kycStartupProfiles table
- [x] Push DB schema changes
- [x] Build kycRouter.ts with type-specific submitKyc procedures
- [x] Auto-populate resource database from user-submitted profiles
- [x] Build KYC multi-step onboarding wizard (post-registration)
- [x] Redirect new users to /onboarding after registration

## Arabic (RTL) Language Support
- [x] Create i18n system with LanguageContext (en/ar)
- [x] Arabic translation file for all UI strings
- [x] RTL layout support (dir="rtl", font: Noto Kufi Arabic)
- [x] Language switcher in navbar and app header
- [x] Translate landing page (hero, tools, features, CTA, footer)
- [x] Translate auth pages (login, register)
- [x] Translate sidebar nav and tool headers
- [x] Translate KYC onboarding wizard
- [x] Translate resource database UI
- [x] Persist language preference in localStorage

## App Structure
- [x] /app route for the main toolkit (Home.tsx)
- [x] / route for landing page
- [x] /login and /register routes
- [x] /onboarding route for KYC wizard
- [x] Sidebar nav updated with Database section (13 tools)

## Tests
- [x] auth.custom.test.ts (14 tests passing)
- [x] auth.logout.test.ts (1 test passing)

## Future Improvements
- [ ] Email verification flow
- [ ] Forgot password / reset password
- [ ] Social login (Google, GitHub)
- [ ] User profile settings page
- [ ] Persist investor CRM data to database
- [ ] Save valuations to database
- [ ] Admin panel to verify KYC community members
- [ ] Startup-to-investor matching engine

## Bug Fixes
- [x] Fix sign in / sign up auth issues (missing cookie-parser middleware)

## New Features (Round 3)
- [x] Forgot password flow (/forgot-password, /reset-password, passwordResetRouter)
- [x] Startup-to-investor matching engine (matchingRouter + InvestorMatcher UI)
- [x] Admin dashboard for reviewing/verifying community KYC submissions (/admin, adminRouter)
- [x] Admin tool added to sidebar nav (access-gated to admin role)
- [x] 15 tests passing, zero TypeScript errors

## Round 4 Tasks
- [x] Audit and verify valuation calculator works end-to-end
- [x] Audit and verify idea evaluator works end-to-end
- [x] Promote owner account to admin role via SQL

## Investor CRM Persistence (Round 5)
- [x] Add investor_contacts table to schema
- [x] Build crmRouter (getContacts, addContact, updateContact, deleteContact)
- [x] Rewrite InvestorCRM frontend with tRPC + optimistic updates
- [x] Write vitest tests for crmRouter (28 tests total passing)

## Arabic & Navigation Fixes (Round 6)
- [x] Complete Arabic translations for all pages and tool components
- [x] Add missing Arabic keys to i18n.ts (tool names, headers, form labels, error messages)
- [x] Add Home button to app sidebar to navigate back to landing page
- [x] Add language switcher to app header (Home.tsx)
- [x] Sidebar group labels translated (Valuation, Equity, Fundraising, Resources, Database, AI Tools)

## AI Features (Round 7)
- [x] AI Market Research tool (AIMarketResearch.tsx)
- [x] AI Co-founder Agreement Drafter (AICofounderAgreement.tsx)
- [x] AI Fundraising Advisor Chat (AIFundraisingAdvisor.tsx)
- [x] AI Due Diligence Checklist (AIDueDiligence.tsx)
- [x] AI Investor Email Writer (AIInvestorEmail.tsx)
- [x] AI Term Sheet Analyzer (AITermSheetAnalyzer.tsx)
- [x] Add all 6 AI tools to sidebar nav under 'AI Tools' group
- [x] Add Arabic translations for all 6 AI tools (i18n.ts)
- [x] All AI components use useLanguage() hook
- [x] 28 tests passing, 0 TypeScript errors

## UI/UX Improvements & Dropdowns (Round 8)
- [x] Create shared dropdown constants file (sectors, stages, jurisdictions, countries, check sizes)
- [x] Update KYC onboarding wizard with proper dropdowns
- [x] Update AI Market Research with sector/region dropdowns
- [x] Update AI Due Diligence with stage/sector dropdowns
- [x] Update AI Investor Email Writer with sector/stage dropdowns
- [x] Update AI Co-founder Agreement with jurisdiction/role dropdowns
- [x] Rebuild admin panel with stats cards, better tables, verification workflow
- [x] Polish overall UI/UX: cards, spacing, typography, loading/empty states
- [x] InvestorCRM sector/stage focus dropdowns
- [x] StartupProfile sector/country dropdowns
- [x] AIFundraisingAdvisor sector/stage/country dropdowns
- [x] FeasibilityEvaluator country dropdown
- [x] LandingPage hero and CTA section polish
- [x] Run tests and save checkpoint (28 tests passing, 0 TS errors)

## Vesting Schedule Builder (Round 9)
- [x] Build VestingScheduleBuilder.tsx component (interactive chart, cliff, custom schedules)
- [x] Add vestingRecommendation procedure to aiRouter.ts (AI-powered schedule review)
- [x] Add to sidebar nav under 'Equity & Cap Table' group with AI badge
- [ ] Add Arabic translations for new tool
- [x] 28 tests passing, 0 TypeScript errors
- [x] Save checkpoint

## SEO Fixes (Round 10)
- [x] Shorten meta description to 50–160 characters (now 134 chars)
- [x] Add meta keywords tag with 12 targeted keywords
- [x] Update page title to "Polaris Arabia — Startup Toolkit for MENA Founders"
- [x] Add Open Graph and Twitter Card meta tags
- [x] Add robots and author meta tags

## Rebrand & SEO Infrastructure (Round 11)
- [x] Rebrand UI: i18n.ts appName → "Polaris Arabia" (en + ar)
- [x] Rebrand UI: LandingPage.tsx footer to "Polaris Arabia"
- [x] Rebrand UI: Home.tsx app header to "Polaris Arabia"
- [x] Rebrand UI: Login/Register/ForgotPassword/ResetPassword/Pricing pages
- [x] Rebrand UI: PDF report and full report generators
- [x] Generate sitemap.xml in client/public/ (6 URLs with priorities)
- [x] Generate robots.txt in client/public/ (blocks /api, /admin, /onboarding)
- [x] Save checkpoint

## Bug Fixes (Round 12)
- [x] Fix startup profile: added 'idea' stage to STAGE_OPTIONS to match backend enum
- [x] Fix startup profile: targetRaise NaN - setNum now guards with isNaN check
- [x] Fix AIInvestorEmail: SelectItem value="" → value="not-specified"
- [x] Fix InvestorCRM: SelectItem value="" for Any stage/sector → non-empty values
- [x] 0 TypeScript errors
