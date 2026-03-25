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
- [x] Save checkpoint and push to GitHub

## Round 27 — COGS Rebuild, Sales Rebuild, Data Room Fix, Landing Page Redesign
- [x] Fix Data Room share link: /share/:token route returns 404 — created DataRoomShare.tsx and registered /data-room/:token route in App.tsx
- [x] Rebuild COGS: product-level costing, overhead allocation, margin waterfall, break-even chart, monthly trend, AI analysis
- [x] Rebuild Sales Tracker: Kanban pipeline, detailed deal form (contact, probability, close date, next action, lost reason), channel analytics, product analytics, targets, AI analysis
- [x] Add 7 new pipeline fields to salesEntries schema + db:push migration applied
- [x] Redesign landing page: "Venture Capital Night" — deep navy + amber/terracotta, asymmetric hero, stats grid, how-it-works, tools grid, testimonials, CTA banner
- [x] 0 TypeScript errors
- [x] Save checkpoint and push to GitHub

## Round 28 — App Redesign (Playful), ESOP Fix & Rebuild, Remove Idea Check
- [x] Fix ESOP bug: AI recommendation save should NOT populate allocated shares in dashboard
- [x] Remove old "Idea Check" (FeasibilityEvaluator) tab from sidebar — AI Idea Validator replaces it
- [x] Rebuild ESOP Planner: best-practice grant management (employee grants, cliff/vesting, strike price, pool tracking, grant letters)
- [x] Redesign global app shell: playful indigo/violet + electric green palette, Plus Jakarta Sans + Inter fonts
- [x] Redesign sidebar: indigo active states with glow, group labels updated
- [x] Redesign FounderDashboard: indigo/green color palette, updated charts
- [x] Apply playful design tokens to index.css (new color palette, rounded corners, shadows, glow buttons)
- [x] Generate new favicon
- [x] 0 TypeScript errors
- [x] Save checkpoint and push to GitHub

## Round 28 Bug Fixes (urgent)
- [x] Fix SalesTracker Revenue tab crash: Recharts "Invariant failed" — added missing YAxis yAxisId={1} for wonDeals Bar

## Round 29 — Data Room Visibility Controls + Time-Based New Badge
- [x] Extend data_rooms schema: add visibleSections, shareTitle, shareMessage fields + db:push migration
- [x] Update dataRoomRouter: generateShareLink accepts visibleSections/shareTitle/shareMessage; getSharedRoom returns them; add updateShareSettings procedure
- [x] Update DataRoom.tsx: share modal with section visibility toggle cards, shareTitle, shareMessage branding fields
- [x] Rebuild DataRoomShare.tsx: tabs for each enabled section (Documents, Company, Financials, Team, Metrics, Contact); email gate; file tracking
- [x] Implement time-based New badge: newUntil ISO date field on NavItem; isNewFeature() helper; sidebar renders New badge only within 14 days
- [x] 0 TypeScript errors
- [x] Save checkpoint and push to GitHub


## Round 30 — Platform Audit + Comprehensive Startup Profile
- [ ] Full platform audit: document all bugs, UX issues, missing wiring, empty states
- [ ] Rebuild Startup Profile: comprehensive fields (basic info, financials, team, product, traction, legal, social, documents)
- [ ] Fix all high-priority issues found in audit
- [ ] Fix all medium-priority issues and polish
- [ ] 0 TypeScript errors
- [ ] Save checkpoint and push to GitHub

## Round 30 Completed Items
- [x] DB migration: added 25+ new fields to startup_profiles (problem, solution, businessModel, mrr, arr, cac, ltv, churnRate, nps, teamSize, incorporationCountry, incorporationDate, legalStructure, website, github, productHunt, angelList, crunchbase, productStatus, techStack, etc.)
- [x] profileRouter input schema: all new fields included (problem, solution, businessModel, mrr, cac, ltv, churnRate, npsScore, employeeCount, incorporationCountry, etc.)
- [x] Rebuilt StartupProfile.tsx: 11 comprehensive sections (Identity, Problem & Solution, Business Model & Product, Financial Metrics, Traction Metrics, Cap Table, Team & Headcount, Legal & Incorporation, Social & Links, Milestones, Saved Valuations)
- [x] Updated StartupContext.tsx: StartupSnapshot interface now includes 30+ new fields mapped from profile
- [x] Deleted dead code file: FeasibilityEvaluator.tsx
- [x] Global color migration: replaced all 83 instances of old terracotta/navy oklch colors with new indigo/violet palette
- [x] Global font migration: replaced all Playfair Display references with Plus Jakarta Sans
- [x] Updated FounderDashboard workspace completion % to include new profile fields (Problem & Solution, Business Model, Financial Metrics, Traction Metrics)
- [x] 31 tests passing, 0 TypeScript errors
- [x] Save checkpoint and push to GitHub

## Round 30 Completed Items
- [x] DB migration: added 25+ new fields to startup_profiles (problem, solution, businessModel, mrr, arr, cac, ltv, churnRate, nps, teamSize, incorporationCountry, incorporationDate, legalStructure, website, github, productHunt, angelList, crunchbase, productStatus, techStack, etc.)
- [x] profileRouter input schema: all new fields included (problem, solution, businessModel, mrr, cac, ltv, churnRate, npsScore, employeeCount, incorporationCountry, etc.)
- [x] Rebuilt StartupProfile.tsx: 11 comprehensive sections (Identity, Problem & Solution, Business Model & Product, Financial Metrics, Traction Metrics, Cap Table, Team & Headcount, Legal & Incorporation, Social & Links, Milestones, Saved Valuations)
- [x] Updated StartupContext.tsx: StartupSnapshot interface now includes 30+ new fields mapped from profile
- [x] Deleted dead code file: FeasibilityEvaluator.tsx
- [x] Global color migration: replaced all 83 instances of old terracotta/navy oklch colors with new indigo/violet palette
- [x] Global font migration: replaced all Playfair Display references with Plus Jakarta Sans
- [x] Updated FounderDashboard workspace completion % to include new profile fields
- [x] 31 tests passing, 0 TypeScript errors
- [x] Save checkpoint and push to GitHub

## Round 31 — Comprehensive Full Report
- [ ] Add AI executive summary tRPC procedure to aiRouter.ts (takes all startup data, returns 3-paragraph summary)
- [ ] Rebuild fullReport.ts: 10+ sections (Cover, Executive Summary, Startup Profile, Problem & Solution, Business Model, Financial Metrics, Traction, Valuation, COGS, ESOP, Sales, Team, Milestones, Fundraising Readiness, Pitch Deck Score, Dilution, Appendix)
- [ ] Wire Full Report button in Home.tsx: pass StartupContext snapshot + all tool data
- [ ] Add loading state to Full Report button (AI generation takes time)
- [ ] 0 TypeScript errors, tests passing
- [ ] Save checkpoint

## Round 31 Completed Items
- [x] Fix startup directory to show profiles with isPublic=true from startup_profiles table
- [x] Add getPublicStartupProfiles() db function querying startup_profiles table
- [x] Update getPublicStartups procedure to merge both kyc_startup_profiles and startup_profiles
- [x] Deduplicate by company name (full profiles take priority over KYC profiles)
- [x] Update StartupDirectory UI to show logo, MRR, customer count, employee count
- [x] Update empty state message to guide users to toggle Public in Startup Profile
- [x] Update description to mention making profile public from Startup Profile page

## Round 32 - Delete Plans & Security Hardening
- [ ] Add saved plans list + delete button to ESOPPlanner UI (trpc.esop.list + trpc.esop.delete)
- [ ] Verify COGS delete button is visible and working
- [ ] Add security headers (helmet) to Express server
- [ ] Add rate limiting to public procedures (submitListing, getSharedRoom, trackFileView, findMatches)
- [ ] Add data room password protection option
- [ ] Sanitize inputs in submitListing (prevent XSS/injection)
- [ ] Restrict file upload MIME types in data room
- [ ] Add max file count per data room (limit to 50 files)
- [ ] Fix matchingRouter.findMatches to require auth

## Round 33 - Crash Fix & Valuation Upgrade
- [ ] Fix dashboard crash: Cannot read properties of undefined (reading 'icon') in NAV_ITEMS
- [ ] Upgrade valuation tool: richer results panel with AI narrative summary
- [ ] Upgrade valuation tool: method comparison bar chart with confidence bands
- [ ] Upgrade valuation tool: sensitivity analysis table (bull/base/bear scenarios)
- [ ] Upgrade valuation tool: peer benchmarking section
- [ ] Upgrade valuation tool: one-click PDF export of valuation report
- [ ] Upgrade valuation tool: save valuation directly from results panel

## Round 33 - Crash Fix, Valuation Upgrade & Monetization Tiers
- [ ] Fix dashboard crash: Cannot read properties of undefined (reading 'icon') in NAV_ITEMS
- [ ] Upgrade valuation tool: AI narrative summary of results
- [ ] Upgrade valuation tool: sensitivity analysis (bull/base/bear)
- [ ] Upgrade valuation tool: peer benchmarking by sector/stage
- [ ] Upgrade valuation tool: improved results UI with method comparison chart
- [ ] Design monetization tiers: Free / Pro / Enterprise tool classification
- [ ] Add tier badges to sidebar nav items (Free / Pro / Enterprise)
- [ ] Add upgrade prompt modal when free users access Pro tools
- [ ] Add /pricing page with tier breakdown

## Round 33 Completed Items

- [x] Fix dashboard crash: Cannot read properties of undefined (reading icon) when clicking Business Model or Problem nav items
- [x] Map unknown tool IDs (problem, business-model) to profile in onNavigate with null-guard on activeItem
- [x] Add AI Analyst tab to ValuationReport with AI narrative generation (trpc.ai.valuationNarrative)
- [x] Add Sensitivity Analysis tab to ValuationReport (revenue growth, burn rate, gross margin)
- [x] Add Market Benchmarks panel to AI Analyst tab (ARR multiple, burn multiple, gross margin, revenue growth vs industry)
- [x] Add valuationNarrative procedure to aiRouter.ts
- [x] Add tier field to NavItem interface (free | pro | enterprise)
- [x] Assign tiers to all 33 tools in NAV_ITEMS
- [x] Display Pro/Enterprise tier badges in sidebar next to tool names
- [x] Add tier legend (Free/Pro/Enterprise) to sidebar footer

## Round 34 - RTL Fix, Colorful Redesign, Landing Page
- [x] Fix Arabic RTL sidebar: sidebar now moves to right side when Arabic is active
- [x] Add global RTL CSS rules for text alignment, flex direction, padding, margin, border, icon flipping
- [x] Add Noto Sans Arabic font for proper Arabic text rendering
- [x] Rewrite LandingPage with colorful playful startup-energy design (light background)
- [x] Landing page: vibrant coral/violet gradient hero with animated background blobs
- [x] Landing page: colorful tool cards with per-tool accent colors
- [x] Landing page: updated stats to 33+ tools
- [x] Landing page: full Arabic translations for all sections
- [x] Landing page: colorful CTA section with gradient background
- [x] Restart dev server to clear stale Vite cache errors
- [x] 31 tests passing, 0 TypeScript errors

## Round 35 — Valuation Benchmark Context & AI Personalization
- [x] Add MENA benchmark context panel to ValuationReport (pre-money vs post-money explanation, stage benchmarks)
- [x] Add MENA market benchmarks by stage: Pre-Seed ($300K–$2M), Seed ($2M–$8M), Series A ($10M–$30M)
- [x] Add ARR multiples and revenue growth benchmarks for each stage
- [x] Add important caveat: high valuation ≠ investor interest
- [x] Full Arabic translation of benchmark context panel
- [x] Expanded disclaimer with financial advisor recommendation
- [x] 31 tests passing, 0 TypeScript errors

## Round 36 — Runway Planner & Free Zones Rebuild
- [x] Rebuild RunwayOptimizer: modern design with gradient header, monthly cash flow timeline chart, runway gauge/progress bar, pre-fill from StartupContext (cashOnHand, monthlyBurnRate, mrr), add expense categories management (add/remove), scenario comparison (current vs optimized), investor tips panel
- [x] Rebuild FreeZones: new layout with AI-powered "Find My Jurisdiction" quiz/recommender, improved card design with visual score bars, better detail modal/drawer with tabbed content, comparison table improvements, added RAKEZ, Qatar QFC, BVI, Cayman, Singapore, Saudi SEZs, Bahrain, Delaware, ADGM, DIFC (10 jurisdictions total)
- [x] 31 tests passing, 0 TypeScript errors
- [x] Save checkpoint

## Round 37 — Glossary Enrichment
- [ ] Expand termSheet.ts: add 40+ new terms (MENA-specific, valuation, metrics, equity, legal) bringing total to 75+ terms
- [ ] Add new categories: 'metrics' (KPIs, ARR, MRR, CAC, LTV, etc.) and 'mena' (MENA-specific terms)
- [ ] Add Arabic translations for term names and plain explanations
- [ ] Improve TermSheetGlossary UI: alphabet index, "MENA" filter badge, term count per category, better empty state
- [ ] 31 tests passing, 0 TypeScript errors
- [ ] Save checkpoint

## Round 38 — Admin Full Control + Tooltips + Runway UX
- [x] Admin panel: Users tab — list all users, search/filter, change role, ban/unban, delete, view profile
- [x] Admin panel: Platform Stats tab — total users, signups per day chart, tool usage counts, top sectors/stages
- [x] Admin panel: Content tab — manage resource database entries (VCs, angels, grants, lawyers), approve/reject community submissions
- [x] Admin panel: Site Settings tab — toggle maintenance mode, set announcement banner text, manage featured startups
- [x] Admin panel: Valuations tab — view all saved valuations across users, export CSV
- [x] Runway Planner: fix slider/range input color (visible thumb + track with custom RunwaySlider component)
- [x] Runway Planner: add Info tooltip (?) to every input field, slider, and result metric
- [x] Runway Planner: explain "Cut %" slider, "Monthly Revenue Growth", "Optimised Burn" concept inline
- [x] 31 tests passing, 0 TypeScript errors
- [x] Save checkpoint

## Round 39 — Admin Full CRUD for Resource Database
- [ ] Rename "Investor Database" tab to "Resource Database" in admin panel
- [ ] Add per-type subtabs: VCs | Angels | Grants | Venture Lawyers (each with own table)
- [ ] Add delete button per row for every resource type (with confirmation dialog)
- [ ] Add edit capability per row (inline edit or modal) for all resource types
- [ ] Add adminRouter procedures: deleteVC, deleteAngel, deleteGrant, deleteLawyer, updateVC, updateAngel, updateGrant, updateLawyer
- [ ] Add "Add New" button per resource type so admin can create entries directly
- [ ] 31 tests passing, 0 TypeScript errors
- [ ] Save checkpoint

## Round 39 — Full Report Fix [DONE]
- [x] Read fullReport.ts and understand what data it receives and renders
- [x] Fix incorrect/missing data in the full report: now pulls company name, sector, stage, financials, team from StartupContext (always available)
- [x] Added "Company Overview" section to report (always renders from profile: problem/solution, financials grid, traction metrics, team members)
- [x] All sections now show "empty notice" with instructions when data is missing, instead of silently omitting the section
- [x] Valuation section now includes analyst note and MENA benchmark context inline
- [x] 31 tests passing, 0 TypeScript errors
- [x] Save checkpoint

## Round 40 — Ecosystem Database Fix + Glossary Cleanup
- [ ] Fix admin panel Resource Database tab showing 0 entries (VCs, angels, grants, lawyers) — diagnose query mismatch
- [ ] Rename "Investor Database" → "Ecosystem Database" everywhere (nav label, page title, tab label, i18n keys)
- [ ] Remove all 14 MENA-Specific terms from termSheet.ts
- [ ] Remove MENA-Specific category from TERM_CATEGORIES and TermSheetGlossary.tsx
- [ ] 31 tests passing, 0 TypeScript errors
- [ ] Save checkpoint

## Round 41 — My Company UI Redesign
- [ ] Read StartupProfile.tsx and understand current layout, tabs, and data structure
- [ ] Redesign My Company: new hero header with company logo placeholder, gradient banner, key metrics row, tabbed sections (Overview, Financials, Team, Documents), modern card layout
- [ ] 0 TypeScript errors
- [ ] Save checkpoint

## Round 41 — Glossary Language Fix + My Company Redesign
- [ ] Fix termSheet.ts syntax error (duplicate bracket from MENA removal)
- [ ] Fix TermSheetGlossary: show term name in active language only (EN or AR, not both)
- [ ] Redesign My Company (StartupProfile.tsx): hero header, key metrics row, tabbed layout
- [ ] 0 TypeScript errors
- [ ] Save checkpoint

## Round 26 — New Features & Bug Fixes
- [x] Fix: All tools (FundraisingReadiness, PitchDeckScorecard, DilutionSimulator, RunwayOptimizer, CoFounderEquitySplit) now persist state to DB via tool_states table
- [x] Add tool_states DB table (userId + toolId + stateJson, unique per user/tool)
- [x] Create useToolState hook for DB-backed tool state persistence with debounced auto-save
- [x] Add OQAL Notes tool (Shariah-compliant convertible notes, OQAL network structure)
- [x] Add Zest Equity tool (cap table with SAFE/convertible note conversion modeling)
- [x] Wire both new tools to sidebar nav (Legal & Compliance + Equity & Ownership groups)
- [x] Add search to Term Sheet Glossary (already existed — confirmed working)
- [x] 31 tests passing, 0 TypeScript errors

## Round 27 — Unified Equity Engine
- [ ] Audit all equity-related components: ZestEquity, CoFounderEquitySplit, AdvancedDilutionSimulator, OQALNotes, CapTableManager
- [ ] Design unified equity DB schema: cap_table_shareholders, cap_table_instruments (SAFE/OQAL/convertible), esop_pools
- [ ] Build shared equity calculation engine (shared/equityEngine.ts): share counts, ESOP %, dilution, note conversion
- [ ] Build equityRouter tRPC procedures: get/upsert shareholders, instruments, ESOP pool
- [ ] Rebuild ZestEquity to use unified model as source of truth
- [ ] Wire CoFounderEquitySplit to read/write to cap_table_shareholders
- [ ] Wire AdvancedDilutionSimulator to read from cap_table_shareholders + instruments
- [ ] Wire OQALNotes to read/write to cap_table_instruments
- [ ] Update dashboard to show live cap table summary (total shares, ESOP %, top shareholders)
- [ ] 0 TypeScript errors
- [ ] Save checkpoint

## Round 27 — Nav Labels, ESOP Saving, Vesting Planner Wiring
- [ ] Fix nav items showing raw IDs (navZestEquity, navOQALNotes) instead of proper display labels
- [ ] Fix ESOP saving so grants reflect in CoFounderEquitySplit share calculations
- [ ] Connect vesting planner to founders shares and ESOP grants automatically
- [ ] Push all code to GitHub

## Round 28 — Full Platform Wiring + Help Content Updates
- [x] Wire SAFENoteBuilder → startup profile (company name) + cap table (auto-add instrument on generate)
- [x] Wire NDAGenerator → startup profile (company name, jurisdiction)
- [x] Wire AICofounderAgreement → startup profile (company name, jurisdiction) + cap table (founders pre-populated)
- [ ] Wire AcceleratorRecommender → startup profile (stage, country, sector)
- [ ] Wire IdeaValidator → startup profile (stage, geography, company description)
- [ ] Wire FundraisingReadiness → startup profile (show company name in header)
- [ ] Wire PitchDeckScorecard → startup profile (show company name in header)
- [ ] Wire InvestorCRM → startup profile (company name, stage, sector)
- [ ] Wire AITermSheetAnalyzer → startup profile (company name, stage)
- [ ] Wire DataRoom → startup profile (company name)
- [ ] Update ToolGuide help content in all tools to reflect connections
- [ ] Push all changes to GitHub

## Round 29 — Footer, Legal Pages, Unit Economics, Glossary
- [ ] Build professional site footer component (SiteFooter.tsx)
- [ ] Build Terms & Conditions page (/terms) — Saudi PDPL compliant
- [ ] Build Privacy Policy page (/privacy) — Saudi PDPL compliant
- [ ] Wire footer into LandingPage, Login, Register, T&C, Privacy pages
- [ ] Register /terms and /privacy routes in App.tsx
- [ ] Rebuild Unit Economics with business-model cost structures (SaaS, Marketplace, E-commerce, Service, Hardware, Subscription)
- [ ] Add per-item unit economics analysis (COGS per unit, contribution margin, break-even units)
- [ ] Add ZestEquity/equity/ESOP/OQAL/cap table terms to glossary (termSheet.ts)
- [ ] COGSCalculator: percentage-fee (feeType) support for payment gateway, BNPL, etc.
- [ ] Fix RTL sidebar: anchor to right side when Arabic is active
- [ ] Full Arabic translation coverage for all tool screens
- [ ] Unit Economics tab in Sales Pipeline Tracker
- [ ] Visible.vc dark theme applied to all screens

## Round 30 — English Only, Dark/Light Toggle, Admin Panel, Footer, Legal Pages
- [ ] Remove Arabic language entirely (strip LanguageContext, i18n.ts, language switcher, all isRTL/lang==='ar' code)
- [ ] Add light/dark theme toggle button to app header and landing page nav
- [ ] Build full admin panel (/admin): user management, KYC review, resource submissions, platform analytics, content management, audit log
- [ ] Build adminRouter.ts: getStats, getUsers, updateUserRole, banUser, getAuditLog, getToolUsage, getKYCSubmissions, approveRejectResource
- [ ] Build site footer component (SiteFooter.tsx) with links to legal pages, social, copyright
- [ ] Build Terms & Conditions page (/terms) — Saudi PDPL compliant
- [ ] Build Privacy Policy page (/privacy) — Saudi PDPL compliant
- [ ] Wire footer into LandingPage, Login, Register, T&C, Privacy pages
- [ ] Register /terms, /privacy, /admin routes in App.tsx
- [ ] Fix nav labels showing raw IDs (navZestEquity, navOQALNotes)
- [ ] Wire AcceleratorRecommender, FundraisingReadiness, PitchDeckScorecard, InvestorCRM, DataRoom → startup profile
- [ ] 0 TypeScript errors, 31 tests passing
- [ ] Save checkpoint

## Round N — System Theme & Badge Cleanup
- [x] Add 'system' theme option to ThemeContext (follows OS prefers-color-scheme)
- [x] Update theme toggle to cycle Light → Dark → System with appropriate icon
- [x] Remove all sidebar nav badges (New, AI, 7 methods, 20 checks, etc.)

## Round N+1 — Sales Analytics Enhancement
- [ ] Enhance salesRouter analytics: auto-calculate MRR, ARR, MoM growth, YoY growth, YTD, LTD
- [ ] Add early-startup detection: show YTD + LTD when <12 months of data instead of ARR
- [ ] Rebuild SalesTracker KPI cards with all new metrics
- [ ] Add cosmetic polish to SalesTracker UI

## Round N+2 — Color Contrast Fixes
- [ ] Audit index.css CSS variables for WCAG AA compliance in light and dark modes
- [ ] Fix muted-foreground contrast on light backgrounds
- [ ] Fix card/secondary text contrast across tool screens
- [ ] Fix any hardcoded low-contrast colors remaining in components

## Round N+3 — AI Advisory UI Fixes & Sales Tracker Analytics

- [ ] Rename "Investor Network" tab to "Ecosystem Network" in sidebar nav
- [ ] Fix UI issues in AIFundraisingAdvisor component
- [ ] Fix UI issues in AIInvestorEmail component
- [ ] Fix UI issues in AIDueDiligence component
- [ ] Fix UI issues in AITermSheetAnalyzer component
- [ ] Fix UI issues in AICofounderAgreement component
- [ ] Implement MRR/ARR auto-calculation in Sales Tracker from revenue entries
- [ ] Implement YTD/LTD metrics for early-stage startups with no recurring revenue
- [ ] Build enhanced KPI dashboard in Sales Tracker frontend

## Financial Projection Tool
- [ ] Design projection logic for all 6 business models (SaaS, E-commerce, Marketplace, Agency, Hardware, Procurement)
- [ ] Top-down approach: TAM → SAM → SOM → market share capture rate → revenue
- [ ] Bottom-up approach: unit economics driven (price × volume × growth rate per model)
- [ ] Backend: schema, db helpers, tRPC procedures for saving/loading projections
- [ ] Frontend: model selector, approach toggle, input forms, 3-year output with charts
- [ ] Wire into sidebar navigation
- [ ] Write vitest tests

## Financial Projection Tool Rebuild — Best Practices + AI Review + PDF + Excel Export
- [x] Rewrite projectionRouter.ts for new computeFinancialModel engine
- [x] Build FinancialProjection.tsx UI: tabbed layout (Setup / P&L / Charts / AI Review)
- [x] Setup tab: business model selector, scenario toggle (bear/base/bull), revenue drivers, headcount plan, OPEX, capital
- [x] P&L tab: full income statement (Revenue → COGS → Gross Profit → OPEX → EBITDA → Net Income), monthly + yearly view
- [x] Charts tab: Revenue/EBITDA area chart, cash waterfall, headcount cost breakdown, unit economics KPI cards
- [x] AI Review tab: LLM analysis with strengths, risks, investor-ready recommendations
- [x] PDF report generation: downloadable VC-ready financial report
- [x] Excel export: full P&L table with all monthly data
- [x] 3/5/10-year horizon selector
- [x] COGS/Unit Economics data integration (pre-fill from COGS tool)
- [x] Save/load projections to database
- [x] Write vitest tests for new engine (34 tests)

## Business Model Expansion (6 → 15 Models)
- [x] Add Subscription (non-SaaS) model: physical/content recurring billing, churn, LTV
- [x] Add Freemium model: free-to-paid conversion funnel, MAU, ARPU tiers
- [x] Add Usage-Based / Pay-as-you-go model: volume × unit price, API calls / transactions
- [x] Add Advertising / Media model: MAU × CPM, fill rate, ad revenue per user
- [x] Add D2C / Retail model: units × ASP, repeat purchase rate, LTV, inventory COGS
- [x] Add Fintech / Lending model: AUM, interest spread, transaction volume, NIM
- [x] Add EdTech / Content model: enrolled students × course price, completion rate
- [x] Add On-Demand / Gig model: bookings × take rate, supply/demand sides
- [x] Add Real Estate / PropTech model: units under management × fee, rental yield
- [x] Update FinancialProjection UI with input forms for all 9 new models
- [x] Update MODEL_META for all 9 new models
- [x] Update DEFAULT_REVENUE_DRIVERS for all 9 new models
- [x] Update tests for new models


## Round 25 — Public Startup Profiles (Q2 2026)
- [x] Add public profile fields to startupProfiles schema (publicProfileSlug, publicProfileLogoUrl, publicProfileBio, etc.)
- [x] Push database migration for public profile fields
- [x] Create publicProfileRouter.ts with all endpoints:
  - [x] getMyProfile: Get current user's profile settings
  - [x] uploadLogo: Upload startup logo to S3 with validation
  - [x] updatePublicProfile: Update and publish profile
  - [x] getPublicProfile: Get public profile by slug (public endpoint)
  - [x] listPublicProfiles: List all published profiles with filtering
  - [x] getDirectoryStats: Get directory statistics
- [x] Register publicProfileRouter in appRouter
- [x] Build PublicStartupProfile.tsx component (investor-facing profile view)
- [x] Build PublicStartupDirectory.tsx component (searchable directory with filters)
- [x] Build ProfileSettings.tsx component (founder profile management UI)
- [x] Add routes to App.tsx (/startups, /startup/:slug, /profile-settings)
- [x] Implement logo upload with S3 storage and validation (JPEG, PNG, WebP, SVG, max 5MB)
- [x] Implement URL-safe slug generation with uniqueness check
- [x] Implement profile publishing/unpublishing workflow
- [x] Implement view count tracking
- [x] Implement filtering by sector, stage, country
- [x] Write comprehensive unit tests (17 tests, all passing)
- [x] 0 TypeScript errors, 92 tests passing
- [ ] Next: Add investor discovery features and CRM integration


## Round 26 — Bug Fixes (Public Profiles)
- [x] Fix StartupProfile.tsx: Replace "LOGO URL" text input with file upload button
- [x] Fix StartupProfile.tsx: Add file upload handler for logo (same as ProfileSettings)
- [x] Fix LandingPage.tsx: Add "Startup Directory" link to navigation menu
- [ ] Fix LandingPage.tsx: Add "Startup Directory" to tools grid or features section

## Round 27 — Featured Startups on Landing Page
- [ ] Add public API endpoint to fetch top 6 featured/published profiles
- [ ] Build FeaturedStartups section component with cards
- [ ] Integrate section into LandingPage.tsx between hero and features sections
- [ ] Add "View All Startups" CTA linking to /startups directory

## Phase 1 — Quick Data Sync Fixes (CURRENT)
- [ ] Debug Cap Table data flow: Add logging to useCapTable hook to see if founders array is populated
- [ ] Fix Dilution Simulator: Ensure DEFAULT_CAP_TABLE founders are properly initialized in toolStates
- [ ] Create unified data API: Build getToolState tRPC procedure that reads from toolStates table
- [ ] Add sync indicators: Show visual badge on tools that are synced vs out-of-sync
- [ ] Fix Cap Table → Dilution sync: Dilution should read shareholders from Cap Table
- [ ] Fix Valuation → Dilution sync: Dilution should read pre-money valuation from Valuation tool
- [ ] Test data flow: Verify founders appear in Dilution after saving in Cap Table
- [ ] 0 TypeScript errors, all tests passing
- [ ] Save checkpoint
