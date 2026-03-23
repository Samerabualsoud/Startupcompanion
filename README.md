# Polaris Arabia — AI Startup Intelligence Platform

> **The complete operating system for early-stage founders in emerging markets.**  
> Value your startup, split equity fairly, find investors, track fundraising, and evaluate your idea — all in one place. Built for founders, not financial advisors.

🌐 **Live:** [polarisarabia.com](https://polarisarabia.com)  
📦 **Repo:** [github.com/Samerabualsoud/Startupcompanion](https://github.com/Samerabualsoud/Startupcompanion)

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Modules](#feature-modules)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Environment Variables](#environment-variables)
8. [Local Development](#local-development)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Roadmap](#roadmap)

---

## Overview

Polaris Arabia is a full-stack SaaS platform built for early-stage founders — particularly in Saudi Arabia and the broader MENA region. It combines **35+ financial and strategic tools** with an **AI advisory layer** and a **public startup ecosystem** where founders can publish investor-facing profiles and investors can discover deal flow.

The platform is built on a modern React + tRPC + MySQL stack, deployed at [polarisarabia.com](https://polarisarabia.com), and supports both English and Arabic.

---

## Feature Modules

### Valuation & Financial Analysis

| Tool | Description |
|---|---|
| **Valuation Calculator** | 7 industry-standard methods: DCF, Scorecard, Berkus, VC Method, Comparable Transactions, Risk-Factor Summation, First Chicago |
| **Financial Projections** | 5-year revenue, expense, and cash flow modeling with scenario analysis |
| **Valuation History** | Track how your valuation changes over time as the company grows |
| **Scenario Comparison** | Side-by-side bear / base / bull scenario modeling |
| **COGS Calculator** | Unit economics and cost-of-goods-sold breakdown |

### Equity & Cap Table

| Tool | Description |
|---|---|
| **Cap Table Manager** | Full cap table with founder, investor, and ESOP pool tracking |
| **Co-Founder Equity Split** | Weighted scoring model for fair equity allocation |
| **Dilution Simulator** | Model dilution across multiple funding rounds |
| **ESOP Planner** | Employee stock option pool design and vesting schedules |
| **Vesting Schedule Builder** | Cliff, linear, and milestone-based vesting configurations |
| **SAFE Note Builder** | Generate SAFE note terms with valuation cap and discount rate |
| **Zest Equity** | Equity compensation benchmarking by role and stage |

### Fundraising

| Tool | Description |
|---|---|
| **Fundraising Readiness** | 20-point checklist scoring investor-readiness across 6 dimensions |
| **Pitch Deck Scorecard** | AI-powered pitch deck evaluation with improvement suggestions |
| **Investor CRM** | Pipeline tracker for managing investor relationships and outreach |
| **Investor Matcher** | AI-powered matching between startup profile and investor criteria |
| **AI Fundraising Advisor** | Conversational AI that answers fundraising strategy questions |
| **AI Investor Email** | Generate personalized cold outreach emails to investors |
| **Term Sheet Builder** | Create and customize term sheet documents |
| **Term Sheet Glossary** | 35+ term definitions with plain-language explanations |

### AI Advisory

| Tool | Description |
|---|---|
| **AI Startup Advisor** | Conversational AI advisor trained on startup best practices |
| **Concept Validator** | AI evaluation of business idea viability and market fit |
| **Idea Validator** | Structured 10-point idea validation framework |
| **AI Due Diligence** | Simulate investor due diligence questions and answers |
| **AI Market Research** | Generate market size, competitive landscape, and TAM/SAM/SOM analysis |
| **AI Term Sheet Analyzer** | Upload and analyze term sheet clauses with AI commentary |
| **AI Co-Founder Agreement** | Generate co-founder agreement templates with AI customization |

### Operations & Legal

| Tool | Description |
|---|---|
| **Data Room** | Secure document storage and sharing for investor due diligence |
| **NDA Generator** | Generate non-disclosure agreements in English and Arabic |
| **Sales Tracker** | Pipeline management for B2B sales |
| **Runway Optimizer** | Burn rate modeling and cash runway optimization |
| **Free Zones Guide** | Saudi Arabia and UAE free zone comparison and setup guide |
| **Jurisdictions** | Legal jurisdiction comparison for company incorporation |
| **OQAL Notes** | Saudi Angel Investors Network (OQAL) compliance notes |
| **Resource Database** | Curated database of startup resources, grants, and programs |
| **Accelerator Finder** | Searchable database of MENA accelerators and incubators |

### Ecosystem Network

| Tool | Description |
|---|---|
| **Public Startup Directory** | Searchable directory of published startup profiles |
| **Startup Profile** | Investor-facing public profile with logo, bio, traction, and contact info |
| **Investor Watchlist** | Bookmark and track interesting startup profiles |
| **Saved Startups** | Personal watchlist page for investors |
| **Investor Matching** | AI-powered investor-startup compatibility scoring |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI |
| **Routing** | Wouter |
| **State / Data** | TanStack Query v5, tRPC v11, Superjson |
| **Backend** | Node.js, Express 4, tRPC |
| **Database** | MySQL (TiDB Cloud), Drizzle ORM |
| **Auth** | Manus OAuth (JWT, HTTP-only cookies) |
| **File Storage** | AWS S3 (via Manus built-in storage) |
| **AI / LLM** | Manus built-in LLM API (OpenAI-compatible) |
| **Payments** | Stripe (Checkout Sessions + Webhooks) |
| **Build** | Vite 6, esbuild, tsx |
| **Testing** | Vitest |
| **Deployment** | Manus hosting (polarisarabia.com) |

---

## Project Structure

```
ai-startup-valuation/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                    # Routes and layout
│       ├── main.tsx                   # tRPC + QueryClient providers
│       ├── index.css                  # Global theme (CSS variables)
│       ├── const.ts                   # OAuth helpers
│       ├── _core/hooks/useAuth.ts     # Authentication hook
│       ├── components/
│       │   ├── ui/                    # shadcn/ui primitives
│       │   ├── DashboardLayout.tsx    # Sidebar layout with auth
│       │   ├── FeaturedStartups.tsx   # Landing page startup showcase
│       │   ├── ChatInterface.tsx      # AI chat UI
│       │   ├── ValuationReport.tsx    # Valuation output report
│       │   ├── CapTableManager.tsx    # Cap table UI
│       │   ├── InvestorCRM.tsx        # CRM pipeline UI
│       │   ├── FinancialProjection.tsx
│       │   └── ... (40+ components)
│       └── pages/
│           ├── LandingPage.tsx        # Public marketing page
│           ├── Home.tsx               # Authenticated app shell (sidebar nav)
│           ├── StartupProfile.tsx     # Founder profile editor
│           ├── ProfileSettings.tsx    # Public profile publish settings
│           ├── PublicStartupDirectory.tsx  # Investor-facing directory
│           ├── PublicStartupDetail.tsx     # Full startup detail page
│           ├── SavedStartups.tsx      # Investor watchlist
│           ├── Pricing.tsx
│           ├── AdminDashboard.tsx
│           └── ...
├── server/
│   ├── _core/                         # Framework plumbing (do not edit)
│   │   ├── index.ts                   # Express server entry
│   │   ├── context.ts                 # tRPC context (user injection)
│   │   ├── oauth.ts                   # Manus OAuth flow
│   │   ├── llm.ts                     # LLM helper
│   │   ├── imageGeneration.ts         # Image generation helper
│   │   └── ...
│   ├── routers.ts                     # Root tRPC router (merges all sub-routers)
│   ├── db.ts                          # Drizzle query helpers
│   ├── storage.ts                     # S3 helpers
│   ├── profileRouter.ts               # Startup profile CRUD
│   ├── publicProfileRouter.ts         # Public directory + featured profiles
│   ├── watchlistRouter.ts             # Investor watchlist
│   ├── valuationHistoryRouter.ts      # Valuation history tracking
│   ├── projectionRouter.ts            # Financial projections
│   ├── crmRouter.ts                   # Investor CRM
│   ├── aiRouter.ts                    # AI advisory endpoints
│   ├── subscriptionRouter.ts          # Stripe subscription management
│   ├── subscriptionWebhook.ts         # Stripe webhook handler
│   ├── adminRouter.ts                 # Admin dashboard procedures
│   └── ...
├── drizzle/
│   ├── schema.ts                      # All database table definitions
│   ├── relations.ts                   # Drizzle relation definitions
│   └── migrations/                    # Auto-generated migration files
├── shared/
│   ├── const.ts                       # Shared constants
│   ├── types.ts                       # Shared TypeScript types
│   ├── dropdowns.ts                   # Dropdown option lists
│   ├── equity.ts                      # Equity calculation logic
│   ├── projectionEngine.ts            # Financial projection engine
│   └── kpiBenchmarks.ts               # Industry KPI benchmarks
├── package.json
├── vite.config.ts
├── drizzle.config.ts
└── vitest.config.ts
```

---

## Database Schema

The platform uses MySQL via Drizzle ORM. Key tables:

| Table | Purpose |
|---|---|
| `users` | Authenticated users (id, email, name, role, stripeCustomerId) |
| `startup_profiles` | Founder startup data (35+ fields covering identity, traction, financials) |
| `valuation_history` | Timestamped valuation snapshots per startup |
| `financial_projections` | 5-year projection models per startup |
| `investor_crm` | Investor pipeline entries with stage and notes |
| `saved_profiles` | Investor watchlist (userId + profileId, unique constraint) |
| `subscriptions` | Stripe subscription records (planId, status, stripeSubscriptionId) |
| `data_room_files` | Document metadata for investor data rooms |

To push schema changes:

```bash
pnpm db:push
```

---

## API Architecture

All API calls use **tRPC v11** over HTTP batch links at `/api/trpc`. There are no REST endpoints for feature logic — everything is a typed procedure.

### Router Map

| Router | Prefix | Key Procedures |
|---|---|---|
| `authRouter` | `auth.*` | `me`, `logout` |
| `profileRouter` | `profile.*` | `get`, `upsert`, `uploadLogo` |
| `publicProfileRouter` | `publicProfile.*` | `listPublicProfiles`, `getPublicProfile`, `getFeaturedProfiles`, `publishProfile` |
| `watchlistRouter` | `watchlist.*` | `toggle`, `getWatchlist`, `isSaved` |
| `valuationHistoryRouter` | `valuationHistory.*` | `list`, `save` |
| `projectionRouter` | `projection.*` | `get`, `save` |
| `crmRouter` | `crm.*` | `list`, `add`, `update`, `delete` |
| `aiRouter` | `ai.*` | `chat`, `validateIdea`, `generateEmail`, `analyzeTermSheet` |
| `subscriptionRouter` | `subscription.*` | `getStatus`, `createCheckout`, `getPortalUrl` |
| `adminRouter` | `admin.*` | `getStats`, `listUsers`, `updateUserRole` |

### Authentication

- Login via Manus OAuth at `/api/oauth/callback`
- Session stored in HTTP-only signed JWT cookie
- `protectedProcedure` injects `ctx.user` — use for all authenticated routes
- `publicProcedure` for unauthenticated access (landing page, public directory)
- Frontend reads auth state via `useAuth()` hook → `trpc.auth.me.useQuery()`

---

## Environment Variables

All secrets are injected by the Manus platform. Do not commit `.env` files.

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (frontend) |
| `BUILT_IN_FORGE_API_URL` | Manus built-in APIs (LLM, storage, etc.) |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for server-side Manus APIs |
| `VITE_FRONTEND_FORGE_API_KEY` | Bearer token for frontend Manus APIs |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (frontend) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret |
| `OWNER_OPEN_ID`, `OWNER_NAME` | Platform owner identity |

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- MySQL database (or TiDB Cloud free tier)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Samerabualsoud/Startupcompanion.git
cd Startupcompanion

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env
# Fill in DATABASE_URL and other required vars

# 4. Push database schema
pnpm db:push

# 5. Start the development server
pnpm dev
```

The app runs on `http://localhost:3000` with Vite HMR for the frontend and `tsx watch` for the backend.

### Key Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server (Express + Vite) |
| `pnpm build` | Production build (Vite + esbuild) |
| `pnpm test` | Run Vitest test suite |
| `pnpm db:push` | Generate and run Drizzle migrations |
| `pnpm format` | Prettier format all files |

---

## Testing

Tests are written with **Vitest** and live in `server/*.test.ts`.

```bash
pnpm test
```

Current test coverage includes:

- Authentication flow (logout, session validation)
- Public profile router (slug generation, publish/unpublish, directory listing)
- Watchlist router (save, unsave, duplicate prevention)
- Valuation calculation logic
- Financial projection engine

---

## Deployment

The platform is deployed on **Manus hosting** at [polarisarabia.com](https://polarisarabia.com).

To deploy a new version:

1. Ensure all changes are committed and tests pass (`pnpm test`)
2. Save a checkpoint via the Manus Management UI
3. Click **Publish** in the Management UI header

Custom domains are configured in **Settings → Domains** in the Manus Management UI.

---

## Roadmap

### Q2 2026 — Ecosystem Layer
- [x] Public Startup Profiles with investor-facing detail pages
- [x] Startup Directory with search and filters
- [x] Featured Startups section on landing page
- [x] Investor Watchlist with bookmark functionality
- [ ] Profile view analytics (notify founders when viewed)
- [ ] Investor outreach templates from watchlist

### Q3 2026 — Marketplace
- [ ] Mentor Marketplace (paid mentor booking, 15% platform cut)
- [ ] Enterprise Projects Board (corporate build/co-build opportunities)
- [ ] Co-Founder Finder directory
- [ ] Accelerator application tracking (apply + pipeline status)

### Q4 2026 — Intelligence Layer
- [ ] AI-powered startup profile scoring (auto-generated investor score)
- [ ] Weekly investor digest email (new startups matching criteria)
- [ ] Benchmarking dashboard (compare KPIs against industry peers)
- [ ] Fundraising pipeline analytics

---

## Contributing

This is a private repository. For access or contribution inquiries, contact the project owner via [polarisarabia.com](https://polarisarabia.com).

---

## License

Proprietary — All rights reserved. © 2026 Polaris Arabia.
