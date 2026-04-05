# Platform-Wide Data Synchronization Plan

## Current Data Fragmentation Issues

### 1. **Equity Split Data**
- **Source**: `toolStates` table (stores equity_split tool state as JSON)
- **Problem**: Only accessible within Equity Split tool, not synced to Cap Table
- **Shows**: 2 cofounders (Samer Abualso 70%, Abdullah Almunif 20%)

### 2. **Cap Table Data**
- **Source**: Separate context/hook (`useCapTable`)
- **Problem**: Reads from different data source than dashboard
- **Shows**: Only 1 test shareholder (100% founder)
- **Missing**: Company name, cofounders

### 3. **Company Profile Data**
- **Source**: `startupProfiles` table (companyName field)
- **Problem**: Cap Table reads from wrong source, shows "(Not set)"
- **Missing**: Synchronization with Cap Table component

### 4. **Financial Data** (COGS, Revenue, Runway)
- **Source**: Multiple separate tables (cogsCalculations, salesEntries, valuationHistory)
- **Problem**: No unified view, data not aggregated for dashboard
- **Missing**: Real-time sync to overview cards

### 5. **Valuation Data**
- **Source**: `savedValuations` + `valuationHistory` tables
- **Problem**: Multiple sources, no single source of truth
- **Missing**: Sync to dashboard valuation card

---

## Unified Data Architecture Solution

### Core Concept: "Startup Workspace"

Each user has ONE unified startup workspace that contains:
- **Company metadata** (name, stage, sector, etc.)
- **Cap table** (shareholders with all equity data)
- **Financial data** (revenue, COGS, burn rate, runway)
- **Valuation data** (all 7 methods + history)
- **Team data** (cofounders, employees, advisors)
- **Fundraising data** (readiness, pitch deck score, investor pipeline)

### New Unified Schema

```sql
-- Single source of truth for startup workspace
CREATE TABLE startup_workspaces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  
  -- Company Profile
  companyName VARCHAR(256),
  tagline VARCHAR(512),
  description TEXT,
  sector VARCHAR(128),
  stage ENUM('idea', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth'),
  country VARCHAR(128),
  city VARCHAR(128),
  
  -- Cap Table
  totalSharesOutstanding BIGINT,
  shareholders JSON,  -- Array of all shareholders with equity
  
  -- Financial Metrics
  currentARR FLOAT,
  monthlyBurnRate FLOAT,
  cashOnHand FLOAT,
  totalRaised FLOAT,
  grossMargin FLOAT,
  
  -- Valuation
  latestValuation FLOAT,
  valuationDate TIMESTAMP,
  valuationMethod VARCHAR(64),
  
  -- Runway
  runwayMonths INT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### Data Flow Architecture

```
User Input (any tool)
    ↓
Unified API Procedure (tRPC)
    ↓
Validate & Transform
    ↓
Update startup_workspaces table
    ↓
Broadcast to all connected clients (via React Query invalidation)
    ↓
All tools update simultaneously
```

---

## Implementation Roadmap

### Phase 1: Database Migration
- [ ] Create `startup_workspaces` table
- [ ] Migrate existing data from fragmented tables
- [ ] Add foreign key relationships
- [ ] Run `pnpm db:push`

### Phase 2: Centralized Data Access Layer
- [ ] Create `server/db/startup.ts` with unified query helpers
- [ ] Create `server/routers/startup.ts` with tRPC procedures
- [ ] Implement `useStartupWorkspace()` hook
- [ ] Add real-time cache invalidation

### Phase 3: Tool Migration (Priority Order)
1. **Overview/Dashboard** - Read all data from workspace
2. **Cap Table** - Read/write shareholders to workspace
3. **Equity Split** - Read/write cofounders to workspace shareholders
4. **Financial Metrics** - Read/write financial data to workspace
5. **Valuation** - Read/write valuation to workspace
6. **Readiness Checker** - Read workspace data for scoring
7. **Pitch Deck Scorecard** - Read workspace data for scoring
8. **All other tools** - Migrate to workspace data

### Phase 4: Testing & Validation
- [ ] Test data persistence across tools
- [ ] Test real-time sync between components
- [ ] Test data consistency after updates
- [ ] Verify no data loss from migration

### Phase 5: Deployment
- [ ] Create checkpoint
- [ ] Deploy to production
- [ ] Monitor for sync issues

---

## Key Principles

1. **Single Source of Truth**: All startup data lives in `startup_workspaces`
2. **Atomic Updates**: All changes are atomic (all-or-nothing)
3. **Real-time Sync**: React Query invalidation triggers immediate UI updates
4. **Type Safety**: All data has strict TypeScript types
5. **Backward Compatibility**: Old data is migrated, not deleted

---

## Success Criteria

✅ Dashboard shows same cofounders as Cap Table  
✅ Company name displays in all tools  
✅ Financial metrics update across all views  
✅ Valuation syncs to dashboard  
✅ Changes in one tool appear in others instantly  
✅ No data duplication or conflicts  
