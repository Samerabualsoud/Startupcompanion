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

## DB Schema Fix (Round 13)
- [x] Diagnosed: stage enum in DB was missing 'idea' value
- [x] Updated drizzle/schema.ts: startupProfiles stage enum now includes 'idea'
- [x] Updated profileRouter.ts: z.enum now includes 'idea'
- [x] Ran pnpm db:push: migration 0008_woozy_polaris.sql applied successfully
- [x] Verified: DB stage column now enum('idea','pre-seed','seed','series-a','series-b','growth')
- [x] 0 TypeScript errors

## Arabic RTL & Saved Valuations Fix (Round 14)
- [x] Fix RTL: added missing nav translation keys to i18n.ts (navVesting, navMatching, navFeasibility, navAdmin, all AI tools)
- [x] Fix RTL: Home.tsx sidebar now uses t(item.navKey) for translated labels
- [x] Fix RTL: mobile sidebar translate direction fixed (translate-x-full in RTL)
- [x] Fix RTL: added comprehensive RTL CSS rules (sidebar border flip, icon flip, text alignment, form fields)
- [x] Fix: ValuationReport.tsx Save Scenario now persists to DB via trpc.profile.saveValuation
- [x] Fix: Saved Valuations section in StartupProfile.tsx shows richer cards (range, confidence, stage)
- [x] Fix: Saved Valuations section auto-opens when valuations exist
- [x] 0 TypeScript errors

## Free Zones & Jurisdictions Tool (Round 15)
- [x] Research 10 jurisdictions: ADGM, DIFC, Delaware, Cayman Islands, BVI, Singapore, Saudi SEZs, Bahrain, Egypt, Jordan
- [x] Build FreeZones.tsx component with filter tabs, detail cards, comparison table, and implications guide
- [x] Wire to sidebar nav under Resources group with 'New' badge
- [x] Add navFreeZones translation key (en: 'Free Zones', ar: 'المناطق الحرة')
- [x] Add navAdmin translation key (en: 'Admin', ar: 'الإدارة')
- [x] 0 TypeScript errors, 0 console errors

## New Tools (Round 16)
- [x] SAFE / Convertible Note Builder — form + AI-generated document, PDF download
- [x] NDA Generator — mutual/one-way NDA with jurisdiction selection, AI-generated, PDF download
- [x] ESOP / Option Pool Planner — option pool modeling, strike price, dilution impact, vesting
- [x] Startup Directory — public DB-backed directory of startups, searchable/filterable
- [x] 409A / Valuation History Timeline — visual timeline of saved valuations per startup
- [x] Wire all 5 tools to sidebar nav
- [x] Add Arabic translations for all 5 tools
- [x] Run tests, 0 TypeScript errors (31 tests passing)
- [x] Save checkpoint

## Round 17 Tasks
- [x] ESOP Planner: add "Generate Grant Letter" button per employee (AI-generated, EN/AR/Both)
- [x] SAFE Note Builder: add language selector (English / Arabic / Both) before generation
- [x] NDA Generator: add language selector (English / Arabic / Both) before generation
- [x] AI Co-founder Agreement: add language selector (English / Arabic / Both)
- [x] Update aiRouter.ts: accept language param in generateSAFENote, generateNDA, and cofounderAgreement procedures
- [x] Add generateGrantLetter procedure to aiRouter.ts
- [x] Landing page: change "Get started free" / "Start for free" button text to "Get Started"
- [x] Add i18n keys for language selector and grant letter UI
- [x] 0 TypeScript errors, 31 tests passing
- [x] Save checkpoint

## Round 18 — SEO Fixes
- [x] Reduce homepage meta keywords from 13 to 6 focused keywords

## Round 19 — Arabic Language Output Fix
- [x] Audit all AI-generating components and identify which ones ignore the app language
- [x] Fix aiRouter.ts: all procedures respect language param and default to app language
- [x] Fix SAFENoteBuilder: language selector defaults to Arabic when app is in Arabic
- [x] Fix NDAGenerator: language selector defaults to Arabic when app is in Arabic
- [x] Fix AICofounderAgreement: language selector defaults to Arabic when app is in Arabic
- [x] Fix ESOPPlanner grant letters: language selector defaults to Arabic when app is in Arabic
- [x] Fix AIMarketResearch, AIDueDiligence, AIInvestorEmail: output in Arabic when Arabic is active
- [x] Fix AITermSheetAnalyzer, AIFundraisingAdvisor: output in Arabic when Arabic is active
- [x] Fix VestingScheduleBuilder: AI recommendation in Arabic when Arabic is active
- [x] Fix ESOPPlanner: AI analysis in Arabic when Arabic is active
- [x] 0 TypeScript errors, 31 tests passing
- [x] Save checkpoint

## Round 20 — Arabic RTL Full Fix
- [x] Fix FeasibilityEvaluator: all text, labels, placeholders, section headers in Arabic when lang=ar
- [x] Fix FeasibilityEvaluator: RTL layout (dir=rtl, text-right, mirrored layout)
- [x] Fix sidebar group label "LEGAL & DOCUMENTS" → translate to Arabic
- [x] Fix all tool content areas: enforce dir=rtl and Arabic font when lang=ar
- [x] Fix ChatInterface (valuation assistant): all UI strings translated
- [x] Fix ValuationReport: all labels, tabs, metrics, analyst summary, disclaimer in Arabic
- [x] Fix chat questions: Arabic questions array added, used when lang=ar
- [x] Cleared stale Vite cache causing false Babel error
- [x] 0 TypeScript errors, 31 tests passing
- [x] Save checkpoint

## Round 21 — COGS & Cost Calculator
- [x] Add cogsCalculations table to drizzle/schema.ts and push migration
- [x] Add COGS DB helpers to server/db.ts
- [x] Create server/cogsRouter.ts with save/load/delete procedures
- [x] Add AI cost analysis procedure to server/aiRouter.ts
- [x] Build COGSCalculator.tsx component (direct costs, indirect costs, gross margin, unit economics, break-even, AI analysis)
- [x] Add full Arabic/English translations to i18n.ts
- [x] Wire into sidebar nav (Overview group) in Home.tsx
- [x] 0 TypeScript errors, all tests passing
- [x] Save checkpoint

## Round 22 — Connected Founder Workspace & Dashboard
- [x] Audit current data flow between tools and identify shared data points
- [x] Create StartupContext: React context that holds all shared startup data (valuation, COGS, ESOP, profile)
- [x] Build FounderDashboard page with KPI cards, valuation snapshot, COGS summary, ESOP pool, fundraising readiness score, recent activity feed
- [x] Wire Valuation tool: on save, refresh StartupContext
- [x] Set FounderDashboard as default active tool (opens on app load)
- [x] Add Dashboard + COGS to sidebar as first items (Overview group)
- [x] Make sidebar RTL-aware: switch to right side for Arabic, flip nav button layout and chevron
- [x] Add i18n keys for dashboard and COGS strings (EN + AR)
- [x] 0 TypeScript errors, all tests passing
- [x] Save checkpoint

## Round 23 — Data Room + Sales Tracker + Dashboard Rebuild
- [x] Add data_rooms, data_room_files, data_room_views tables to schema + push migration
- [x] Build dataRoomRouter.ts: createRoom, listRooms, uploadFile, deleteFile, generateShareLink, trackView, getActivity
- [x] Build DataRoom.tsx: file upload, folder view, share modal with link copy, activity log panel
- [x] Add sales_entries and sales_targets tables to schema + push migration
- [x] Build salesRouter.ts: addEntry, listEntries, updateEntry, deleteEntry, getAnalytics, setTarget, analyzeSales (AI)
- [x] Build SalesTracker.tsx: entry log table, revenue trend chart, MoM growth chart, product/channel breakdown, AI sales analysis
- [x] Rebuild FounderDashboard: equity split pie, ESOP donut, sales KPIs, workspace checklist, all-tools grid
- [x] Wire Data Room + Sales Tracker to sidebar nav (Overview + My Startup groups)
- [x] Add i18n keys for Data Room and Sales Tracker (EN + AR)
- [x] 0 TypeScript errors, all tests passing
- [x] Save checkpoint

## Round 23 Bugs & Additions
- [x] Fix valuation history DB insert error (totalShares int overflow → bigint)
- [x] AICofounderAgreement.tsx Label error confirmed stale HMR cache — no fix needed
- [x] Add founder equity split pie chart to FounderDashboard
- [x] Add ESOP fields (option pool %, vesting schedule) to startup profile team section
- [x] Add esop_plans table to schema + push migration
- [x] Build esopRouter.ts: save/load ESOP plan (pool size, grants, vesting)
- [x] Add Save button to ESOP Planner frontend, persist to DB
- [x] Wire ESOP data into StartupContext (currentOptionPool, totalShares)
- [x] Add cap table fields to startup profile (total shares, authorized shares, par value)
- [x] Fix totalShares overflow: change int to bigint in schema + push migration
- [x] Add back/edit navigation to valuation chat (go back to any question, change answer, re-run)
- [x] Build shared FieldInfo tooltip component (info icon + popover with explanation text)
- [x] Add FieldInfo tooltips to ValuationTimeline and COGSCalculator
- [x] 0 TypeScript errors, 31 tests passing
- [x] Save checkpoint

## Round 24 — Full Platform Data Wiring Audit
- [x] Fix StartupContext: totalShares → totalSharesOutstanding, parValue → parValuePerShare, esopPoolPct → esopPoolPercent
- [x] Fix sales.summary endpoint: add annualizedRevenue (trailing-3-month avg × 12)
- [x] Wire salesARR into StartupContext snapshot
- [x] Fix ChatInterface: pre-fill currentARR from salesARR when profile ARR is 0/null
- [x] Add sales-sync banner in ChatInterface when revenue is pre-filled from Sales Tracker
- [x] Fix ValuationTimeline: auto-calculate newShares when amountRaised + preMoneyValuation + existingShares are all set
- [x] Show computed newShares, newSharePrice, dilution% in ValuationTimeline form preview
- [x] On ValuationTimeline save: update profile totalSharesOutstanding with (existing + newShares)
- [x] Fix FounderDashboard: wire totalShares from profile (not ESOP plan) for cap table display
- [x] Fix COGS: latestMonthlyRevenue should use revenuePerUnit × unitsPerMonth from latest COGS entry
- [x] Fix profile.get router: ensure all cap table fields (totalSharesOutstanding, authorizedShares, parValuePerShare, esopPoolPercent) are returned
- [x] Fix StartupProfile page: wire cap table fields correctly to profile.save mutation
- [x] Wire FounderDashboard runway: use monthlyBurnRate and cashOnHand from profile
- [x] Wire readinessScore from FundraisingReadiness into StartupContext
- [x] Wire pitchScore from PitchDeckScorecard into StartupContext
- [x] 0 TypeScript errors, all tests passing (31 tests)
- [x] Save checkpoint
- [x] Push all changes to GitHub repo Samerabualsoud/Startupcompanion

## Round 25 — Bug Fixes, UX, Database Expansion & Field Wiring
- [ ] Fix login redirect loop: landing page (/) should NOT require auth; only /app routes should redirect to login
- [ ] Add "Home" / "Back to Home" button in app sidebar and all tool screens
- [ ] Expand VC database: add 30+ more VC firms (MENA-focused + global)
- [ ] Expand Angel Investors database: add 20+ more angels
- [ ] Expand Venture Lawyers database: add 15+ more firms
- [ ] Expand Grants & Programs database: add 15+ more grants
- [ ] Expand Accelerators database: add 20+ more programs
- [ ] Audit and wire remaining disconnected fields (DilutionSimulator, FundraisingReadiness, PitchDeckScorecard, RunwayOptimizer)
- [ ] Wire DilutionSimulator: pre-fill totalShares, esopPoolPct from snapshot
- [ ] Wire FundraisingReadiness: publish readinessScore back to StartupContext
- [ ] Wire PitchDeckScorecard: publish pitchScore back to StartupContext
- [ ] Wire RunwayOptimizer: pre-fill cashOnHand, monthlyBurnRate from snapshot
- [ ] 0 TypeScript errors, 31 tests passing
- [ ] Save checkpoint and push to GitHub

## Round 25 — Resource Database Expansion + Self-Registration
- [x] Fix login redirect loop on public pages (main.tsx)
- [x] Add Home button to top header bar
- [ ] Expand VC database: add 20 more firms (MENA, Africa, SEA, India, LatAm, specialized)
- [ ] Expand Angel database: add 15 more investors
- [ ] Expand Grants database: add 15 more grants (MENA, Africa, EU, government)
- [ ] Expand Venture Lawyers database: add 10 more firms
- [ ] Add DB schema: resource_submissions table (type, data JSON, status, userId, createdAt)
- [ ] Add tRPC procedures: resources.submitProfile, resources.getMySubmissions, resources.adminApprove/Reject
- [ ] Add "List Your Firm" button in ResourceDatabase for each tab (VC, Angel, Lawyer, Grant)
- [ ] Add ResourceSubmissionForm modal component with fields per type
- [ ] Show pending submissions in ResourceDatabase with "Pending Review" badge for submitter
- [ ] Add admin panel tab for reviewing and approving/rejecting submissions
- [ ] Wire approved submissions into the live data feed alongside curated entries
- [ ] 0 TypeScript errors, all tests passing
- [ ] Save checkpoint and push to GitHub

## Round 25 (continued) — Full Admin Panel Rebuild
- [ ] Admin: Platform Overview dashboard (total users, signups/day, active tools, KYC pending)
- [ ] Admin: User Management table (search, filter by role/type, promote/demote, ban/unban, view profile)
- [ ] Admin: KYC Submissions tab (VC, Angel, Lawyer, Startup) with approve/reject + view details
- [ ] Admin: Resource Submissions tab (review self-registered VCs/lawyers/angels/grants, approve/reject)
- [ ] Admin: Startup Directory moderation (approve/reject/feature startups)
- [ ] Admin: Investor CRM data view (see all contacts across users for analytics)
- [ ] Admin: Platform Analytics (signups over time, tool usage counts, top sectors/regions)
- [ ] Admin: Content Management (edit platform announcements, featured resources)
- [ ] Admin: System Settings (maintenance mode toggle, feature flags)
- [ ] Admin: Audit Log (recent admin actions with timestamps)
- [ ] adminRouter.ts: add getStats, getUsers, updateUserRole, banUser, getAuditLog, getToolUsage procedures
- [ ] Wire admin panel to all new procedures

## Round 26 — Sidebar Reorder + 3 New Tabs
- [x] Reorder sidebar: My Startup (Dashboard + Profile + Team + COGS + ESOP) as first section
- [x] Add Term Sheet Builder tab with guided form for SAFE, convertible note, priced round — generates downloadable PDF
- [x] Add Cap Table Manager tab with visual shareholder table, ownership %, value at current valuation, auto-updated from Valuation Timeline
- [x] Add AI Startup Idea Validator tab with AI-powered assessment: market size, competition, moat, risk score, fundability rating
- [x] 0 TypeScript errors
- [ ] Save checkpoint and push to GitHub
