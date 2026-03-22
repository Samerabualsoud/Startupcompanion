/**
 * Home Page — Polaris Arabia (Full Sidebar Navigation)
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Layout: Persistent left sidebar + content area
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Sparkles, Rocket, Users, GitBranch, Target,
  BookOpen, BarChart3, DollarSign, Menu, X, ChevronRight,
  Gauge, Layers, FileDown, Link2, Check, Sun, Moon, Monitor, Building2, MessageCircle,
  Mail, FileText, Users2, ClipboardCheck, Calendar, Globe,
  UserCircle, LogOut, LogIn, Home as HomeIcon, ShoppingCart, FolderOpen, Shield
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import StartupProfile from './StartupProfile';
import { StartupProvider, useStartup } from '@/contexts/StartupContext';
import { buildInputsFromAnswers } from '@/lib/chatFlow';
import { runValuation, type StartupInputs, type ValuationSummary } from '@/lib/valuation';
import { generateFullReport } from '@/lib/fullReport';
import { encodeAnswersToURL, decodeAnswersFromURL, copyToClipboard } from '@/lib/shareLink';
import { useReport } from '@/contexts/ReportContext';
import ChatInterface from '@/components/ChatInterface';
import ValuationReport from '@/components/ValuationReport';
import AcceleratorRecommender from '@/components/AcceleratorRecommender';
import CoFounderEquitySplit from '@/components/CoFounderEquitySplit';
import AdvancedDilutionSimulator from '@/components/AdvancedDilutionSimulator';
import FundraisingReadiness from '@/components/FundraisingReadiness';
import PitchDeckScorecard from '@/components/PitchDeckScorecard';
import TermSheetGlossary from '@/components/TermSheetGlossary';
import InvestorCRM from '@/components/InvestorCRM';
import RunwayOptimizer from '@/components/RunwayOptimizer';
import ResourceDatabase from '@/components/ResourceDatabase';
import InvestorMatcher from '@/components/InvestorMatcher';
import AdminDashboard from '@/pages/AdminDashboard';
import AIMarketResearch from '@/components/AIMarketResearch';
import AIDueDiligence from '@/components/AIDueDiligence';
import AIInvestorEmail from '@/components/AIInvestorEmail';
import AITermSheetAnalyzer from '@/components/AITermSheetAnalyzer';
import AICofounderAgreement from '@/components/AICofounderAgreement';
import AIFundraisingAdvisor from '@/components/AIFundraisingAdvisor';
import VestingScheduleBuilder from '@/components/VestingScheduleBuilder';
import FreeZones from '@/components/FreeZones';
import SAFENoteBuilder from '@/components/SAFENoteBuilder';
import NDAGenerator from '@/components/NDAGenerator';
import ESOPPlanner from '@/components/ESOPPlanner';
import StartupDirectory from '@/components/StartupDirectory';
import ValuationTimeline from '@/components/ValuationTimeline';
import FounderDashboard from '@/components/FounderDashboard';
import COGSCalculator from '@/components/COGSCalculator';
import SalesTracker from '@/components/SalesTracker';
import DataRoom from '@/components/DataRoom';
import TermSheetBuilder from '@/components/TermSheetBuilder';
import CapTableManager from '@/components/CapTableManager';
import OQALNotes from '@/components/OQALNotes';
import ZestEquity from '@/components/ZestEquity';
import IdeaValidator from '@/components/IdeaValidator';
type ToolId = 'dashboard' | 'cogs' | 'sales' | 'data-room' | 'valuation' | 'accelerators' | 'equity-split' | 'dilution' | 'readiness' | 'pitch-deck' | 'term-sheet' | 'investor-crm' | 'runway' | 'profile' | 'resources' | 'matching' | 'admin' | 'vesting' | 'free-zones' | 'ai-fundraising-advisor' | 'ai-market-research' | 'ai-investor-email' | 'ai-term-sheet' | 'ai-cofounder-agreement' | 'ai-due-diligence' | 'safe-note' | 'nda' | 'esop' | 'startup-directory' | 'valuation-timeline' | 'term-sheet-builder' | 'cap-table' | 'idea-validator' | 'oqal-notes' | 'zest-equity';

interface NavItem {
  id: ToolId;
  label: string;
  shortLabel: string;
  navKey?: string;
  icon: React.ElementType;
  badge?: string;
  /** ISO date string — show 'New' badge until 14 days after this date */
  newUntil?: string;
  group: string;
  /** Monetization tier: 'free' | 'pro' | 'enterprise' */
  tier?: 'free' | 'pro' | 'enterprise';
}

/** Returns true if today is within 14 days of the launch date */
function isNewFeature(newUntil?: string): boolean {
  if (!newUntil) return false;
  return new Date() <= new Date(newUntil);
}

const NAV_ITEMS: NavItem[] = [
  // Overview
  { id: 'dashboard', tier: 'free',     label: 'Command Center',     shortLabel: 'Overview',   navKey: 'navDashboard',   icon: Gauge,       group: 'My Company',   badge: undefined },
  { id: 'profile', tier: 'free',       label: 'Company Profile',    shortLabel: 'Profile',     navKey: 'navMyStartup',   icon: Building2,   group: 'My Company' },
  { id: 'cogs', tier: 'free',          label: 'Unit Economics',        shortLabel: 'Unit Econ.',        navKey: 'navCOGS',        icon: DollarSign,  group: 'My Company',   newUntil: '2026-04-01' },
  { id: 'sales', tier: 'free',         label: 'Revenue Intelligence',          shortLabel: 'Revenue',       navKey: 'navSales',       icon: ShoppingCart, group: 'My Company',  newUntil: '2026-04-01' },
  { id: 'data-room', tier: 'pro',     label: 'Virtual Data Room',              shortLabel: 'Data Room',   navKey: 'navDataRoom',    icon: FolderOpen,  group: 'My Company',   newUntil: '2026-04-01' },
  { id: 'cap-table', tier: 'pro',     label: 'Capitalization Table',      shortLabel: 'Cap Table',   navKey: 'navCapTable',    icon: Users,       group: 'My Company',   newUntil: '2026-04-01' },
  // Valuation
  { id: 'valuation', tier: 'free',     label: 'Startup Valuation Engine', shortLabel: 'Valuation',   navKey: 'navValuation',   icon: TrendingUp,  group: 'Valuation',    badge: '7 methods' },
  // Equity & Funding
  { id: 'equity-split', tier: 'free',  label: 'Founder Equity Allocation', shortLabel: 'Equity Split',   navKey: 'navEquitySplit', icon: Users,    group: 'Equity & Ownership' },
  { id: 'dilution', tier: 'free',      label: 'Dilution & Ownership Model',   shortLabel: 'Dilution',   navKey: 'navDilution',    icon: GitBranch,   group: 'Equity & Ownership' },
  { id: 'vesting', tier: 'pro',       label: 'Equity Vesting Planner', shortLabel: 'Vesting',   navKey: 'navVesting',  icon: Calendar,    group: 'Equity & Ownership', badge: 'AI' },
  // Fundraising
  { id: 'readiness', tier: 'free',     label: 'Investor Readiness Assessment', shortLabel: 'Readiness',   navKey: 'navReadiness',  icon: Gauge,       group: 'Capital Raising',  badge: '20 checks' },
  { id: 'pitch-deck', tier: 'free',    label: 'Pitch Deck Evaluator',  shortLabel: 'Pitch Deck',   navKey: 'navPitchDeck', icon: Layers,      group: 'Capital Raising' },
  { id: 'investor-crm', tier: 'pro',  label: 'Investor Pipeline CRM',          shortLabel: 'Pipeline',   navKey: 'navInvestorCRM',  icon: Target,      group: 'Capital Raising' },
  // Resources
  { id: 'accelerators', tier: 'free',  label: 'Accelerator & Incubator Finder',    shortLabel: 'Accelerators',   navKey: 'navAccelerators', icon: Rocket,    group: 'Market Intelligence',    newUntil: '2026-04-01' },
  { id: 'runway', tier: 'free',        label: 'Cash Runway Planner',      shortLabel: 'Runway',   navKey: 'navRunway',     icon: BarChart3,   group: 'Market Intelligence' },
  { id: 'term-sheet', tier: 'free',    label: 'Investment Terms Glossary',   shortLabel: 'Glossary',   navKey: 'navTermSheet', icon: BookOpen,    group: 'Market Intelligence',    badge: '75 terms' },
  // My Startup
  // Legal & Jurisdictions
  { id: 'free-zones', tier: 'free',    label: 'Jurisdiction & Free Zone Guide', shortLabel: 'Jurisdictions', navKey: 'navFreeZones', icon: Globe,        group: 'Market Intelligence',    newUntil: '2026-04-01' },
  // Database
  { id: 'resources', tier: 'free',     label: 'Investor Intelligence Database',     shortLabel: 'Ecosystem',   navKey: 'navDatabase',   icon: Building2,   group: 'Ecosystem Network',     newUntil: '2026-04-01' },
  { id: 'matching', tier: 'pro',      label: 'AI Investor Matching',     shortLabel: 'Matching',   navKey: 'navMatching',   icon: Target,      group: 'Ecosystem Network',     badge: 'AI' },
  // Admin
  { id: 'admin', tier: 'enterprise',         label: 'Platform Administration',       shortLabel: 'Admin',      icon: Gauge,       group: 'Admin' },
  // Legal & Documents
  { id: 'safe-note', tier: 'pro',         label: 'SAFE & Convertible Note Builder', shortLabel: 'SAFE / Note',    navKey: 'navSAFENote',       icon: FileText,    group: 'Legal & Compliance', newUntil: '2026-04-01' },
  { id: 'nda', tier: 'pro',               label: 'Non-Disclosure Agreement',           shortLabel: 'NDA',            navKey: 'navNDA',            icon: ClipboardCheck, group: 'Legal & Compliance', newUntil: '2026-04-01' },
  { id: 'term-sheet-builder', tier: 'enterprise', label: 'Term Sheet Architect',     shortLabel: 'Glossary',     navKey: 'navTermSheetBuilder', icon: FileText,   group: 'Legal & Compliance', newUntil: '2026-04-01' },
  // ESOP moved to My Startup group above
  // Community
  { id: 'startup-directory', tier: 'free', label: 'Startup Directory',       shortLabel: 'Directory',      navKey: 'navStartupDir',     icon: Globe,       group: 'Ecosystem Network',           newUntil: '2026-04-01' },
  { id: 'valuation-timeline', tier: 'pro',label: 'Valuation History & 409A',shortLabel: '409A History',   navKey: 'navValuationTimeline', icon: BarChart3, group: 'My Company',         newUntil: '2026-04-01' },
  // Equity & Cap Table
  { id: 'esop', tier: 'pro',              label: 'ESOP & Option Pool Manager',      shortLabel: 'ESOP',           navKey: 'navESOP',           icon: Users2,      group: 'My Company',         newUntil: '2026-04-01' },
  // AI Tools
  { id: 'idea-validator', tier: 'free',        label: 'Concept Validation Engine',      shortLabel: 'Concept Val.', navKey: 'navIdeaValidator', icon: Sparkles,     group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-fundraising-advisor', tier: 'pro', label: 'Fundraising Strategy Advisor', shortLabel: 'Advisor',   navKey: 'navAIAdvisor',    icon: MessageCircle, group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-market-research', tier: 'pro',     label: 'Market Intelligence Report',     shortLabel: 'Market Intel',   navKey: 'navAIMarketResearch', icon: BarChart3,    group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-investor-email', tier: 'pro',      label: 'Investor Outreach Writer',      shortLabel: 'Outreach',   navKey: 'navAIEmailWriter',  icon: Mail,          group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-term-sheet', tier: 'enterprise',          label: 'Term Sheet Intelligence', shortLabel: 'Term Intel',   navKey: 'navAITermAnalyzer', icon: FileText,      group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-cofounder-agreement', tier: 'pro', label: 'Co-founder Agreement Drafter',shortLabel: 'Co-founder',   navKey: 'navAICofounder', icon: Users2,        group: 'AI Advisory', badge: 'AI' },
  { id: 'ai-due-diligence', tier: 'enterprise',       label: 'Due Diligence Analyzer',       shortLabel: 'Due Diligence',   navKey: 'navAIDueDiligence', icon: ClipboardCheck,group: 'AI Advisory', badge: 'AI' },
  // Financing Instruments
  { id: 'oqal-notes', tier: 'pro',   label: 'OQAL Notes (Shariah)',         shortLabel: 'OQAL Notes',    navKey: 'navOQALNotes',   icon: Shield,      group: 'Legal & Compliance', newUntil: '2026-07-01', badge: 'New' },
  { id: 'zest-equity', tier: 'pro',  label: 'Zest Equity & Cap Table',      shortLabel: 'Zest Equity',   navKey: 'navZestEquity',  icon: TrendingUp,  group: 'Equity & Ownership', newUntil: '2026-07-01', badge: 'New' },
];

const GROUPS = ['My Company', 'Valuation', 'Equity & Ownership', 'Capital Raising', 'Legal & Compliance', 'Market Intelligence', 'Ecosystem Network', 'AI Advisory', 'Admin'];
const TOOL_COLORS: Record<ToolId, string> = {
  dashboard: '#0F1B2D',
  cogs: '#059669',
  valuation: '#C4614A',
  accelerators: '#10B981',
  'equity-split': '#2D4A6B',
  dilution: '#8B4A38',
  readiness: '#F59E0B',
  'pitch-deck': '#6366F1',
  'term-sheet': '#0F1B2D',
  'investor-crm': '#C4614A',
  runway: '#059669',
  profile: '#2D4A6B',
  resources: '#10B981',
  matching: '#C4614A',
  admin: '#8B4A38',
  vesting: '#7C3AED',
  'ai-market-research': '#0EA5E9',
  'ai-due-diligence': '#8B5CF6',
  'ai-investor-email': '#EC4899',
  'ai-term-sheet': '#F97316',
  'ai-cofounder-agreement': '#14B8A6',
  'ai-fundraising-advisor': '#C4614A',
  'free-zones': '#0284C7',
  'safe-note': '#7C3AED',
  'nda': '#0284C7',
  'esop': '#059669',
  'startup-directory': '#C4614A',
  'valuation-timeline': '#2D4A6B',
  'sales': '#F59E0B',
  'data-room': '#2D4A6B',
  'term-sheet-builder': '#7C3AED',
  'cap-table': '#0EA5E9',
  'oqal-notes': '#10B981',
  'zest-equity': '#4F6EF7',
  'idea-validator': '#EC4899',
};

function HomeInner() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { t, isRTL } = useLanguage();
   const { mode, theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  // Theme-aware color tokens for inline styles (using CSS variables)
  const C = {
    sidebarBg:    'var(--card)',
    sidebarBorder:'1px solid var(--border)',
    headerBg:     'var(--background)',
    headerBorder: 'var(--border)',
    contentBg:    'var(--background)',
    navText:      'var(--muted-foreground)',
    navHover:     'var(--secondary)',
    groupHeader:  'var(--muted-foreground)',
    activeBg:     'color-mix(in srgb, var(--primary) 12%, transparent)',
    activeText:   'var(--primary)',
    activeIcon:   'var(--primary)',
    chatPanelBg:  'var(--background)',
    chatHeaderBg: 'var(--card)',
    chatHeaderText:'var(--foreground)',
    placeholderBg:'var(--secondary)',
    methodCardBg: 'var(--card)',
    methodText:   'var(--muted-foreground)',
  };
  // Persist active tool across refreshes using localStorage + URL hash
  const VALID_TOOL_IDS: ToolId[] = ['dashboard', 'cogs', 'sales', 'data-room', 'valuation', 'accelerators', 'equity-split', 'dilution', 'readiness', 'pitch-deck', 'term-sheet', 'investor-crm', 'runway', 'profile', 'resources', 'matching', 'admin', 'vesting', 'free-zones', 'ai-fundraising-advisor', 'ai-market-research', 'ai-investor-email', 'ai-term-sheet', 'ai-cofounder-agreement', 'ai-due-diligence', 'safe-note', 'nda', 'esop', 'startup-directory', 'valuation-timeline', 'term-sheet-builder', 'cap-table', 'idea-validator', 'oqal-notes', 'zest-equity'];
  const getInitialTool = (): ToolId => {
    // 1. Check URL hash first (e.g. /app#equity-split)
    const hash = window.location.hash.replace('#', '') as ToolId;
    if (VALID_TOOL_IDS.includes(hash)) return hash;
    // 2. Fall back to localStorage
    const saved = localStorage.getItem('polaris_active_tool') as ToolId;
    if (saved && VALID_TOOL_IDS.includes(saved)) return saved;
    return 'dashboard';
  };
  const [activeTool, setActiveToolState] = useState<ToolId>(getInitialTool);
  const setActiveTool = (id: ToolId) => {
    setActiveToolState(id);
    localStorage.setItem('polaris_active_tool', id);
    window.history.replaceState(null, '', `/app#${id}`);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatAnswers, setChatAnswers] = useState<Record<string, any> | null>(null);
  const [chatComplete, setChatComplete] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const { readiness, pitchScore, dilution } = useReport();
  const { snapshot: startupSnapshot } = useStartup();

  // Restore from shared URL on first load
  useEffect(() => {
    const restored = decodeAnswersFromURL();
    if (restored) {
      setChatAnswers(restored);
      setChatComplete(true);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('v');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!chatAnswers) return;
    const shareURL = encodeAnswersToURL(chatAnswers);
    const ok = await copyToClipboard(shareURL);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  }, [chatAnswers]);

  const inputs: StartupInputs | null = useMemo(() => {
    if (!chatAnswers) return null;
    return buildInputsFromAnswers(chatAnswers);
  }, [chatAnswers]);

  const summary: ValuationSummary | null = useMemo(() => {
    if (!inputs) return null;
    return runValuation(inputs);
  }, [inputs]);

  const handleChatComplete = (ans: Record<string, any>) => {
    setChatAnswers(ans);
    setChatComplete(true);
  };

  const handleReset = () => {
    setChatAnswers(null);
    setChatComplete(false);
    setChatKey(k => k + 1);
  };

  const activeItem = NAV_ITEMS.find(n => n.id === activeTool) ?? { id: activeTool, label: activeTool, shortLabel: activeTool, icon: Layers, group: '', navKey: undefined };

  const renderTool = () => {
    switch (activeTool) {
      case 'valuation':
        return (
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Chat Panel */}
            <div className={`flex flex-col border-r border-border transition-all duration-500 bg-background ${chatComplete ? 'w-full lg:w-[400px]' : 'w-full'}`}>
              <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center gap-2.5 bg-card">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t('valuationAssistantTitle')}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">{t('valuationAssistantStatus')}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface key={chatKey} onComplete={handleChatComplete} />
              </div>
            </div>

            {/* Results Panel (desktop) */}
            <AnimatePresence>
              {chatComplete && inputs && summary && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="hidden lg:flex flex-col flex-1 overflow-hidden bg-background"
                >
                  <ValuationReport inputs={inputs} summary={summary} onReset={handleReset} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Panel (mobile overlay) */}
            <AnimatePresence>
              {chatComplete && inputs && summary && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background"
                  style={{ top: 57 }}
                >
                  <ValuationReport inputs={inputs} summary={summary} onReset={handleReset} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder when not complete */}
            {!chatComplete && (
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-secondary/30">
                <div className="max-w-sm text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary/10 border border-primary/20">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('valuationReportWillAppear')}
                  </h2>
                  <p className="text-sm leading-relaxed mb-6 text-muted-foreground">
                    {t('valuationReportWillAppearDesc')}
                  </p>
                  <div className="space-y-2">
                    {(isRTL ? [
                      { label: 'التدفق النقدي المخصوم (DCF)', desc: 'تحليل التدفقات النقدية المستقبلية', color: '#C4614A' },
                      { label: 'طريقة بطاقة الأداء', desc: 'تقييم جودة الفريق والسوق', color: '#8B4A38' },
                      { label: 'طريقة بيركوس', desc: 'التقييم القائم على المعالم', color: '#2D4A6B' },
                      { label: 'طريقة رأس المال المخاطر', desc: 'حساب العائد على الاستثمار', color: '#A0522D' },
                      { label: 'المعاملات المماثلة', desc: 'مضاعفات معيار الصناعة', color: '#1B3A5C' },
                      { label: 'جمع عوامل المخاطرة', desc: 'تعديل بـ 12 عامل مخاطرة', color: '#D4845A' },
                      { label: 'طريقة شيكاغو الأولى', desc: 'سيناريوهات متفائلة / متوسطة / متشائمة', color: '#C4614A' },
                    ] : [
                      { label: 'Discounted Cash Flow (DCF)', desc: 'Future cash flow analysis', color: '#C4614A' },
                      { label: 'Scorecard Method', desc: 'Team & market quality scoring', color: '#8B4A38' },
                      { label: 'Berkus Method', desc: 'Milestone-based valuation', color: '#2D4A6B' },
                      { label: 'VC Method', desc: 'Return-on-investment calculation', color: '#A0522D' },
                      { label: 'Comparable Transactions', desc: 'Industry benchmark multiples', color: '#1B3A5C' },
                      { label: 'Risk-Factor Summation', desc: '12-factor risk adjustment', color: '#D4845A' },
                      { label: 'First Chicago Method', desc: 'Bear / base / bull scenarios', color: '#C4614A' },
                    ]).map((m, i) => (
                      <motion.div key={m.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 text-left p-2.5 rounded-lg bg-card">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{m.label}</div>
                          <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'accelerators':    return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><AcceleratorRecommender /></div>;
      case 'equity-split':    return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><CoFounderEquitySplit /></div>;
      case 'dilution':        return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><AdvancedDilutionSimulator /></div>;
      case 'vesting':         return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><VestingScheduleBuilder /></div>;
      case 'free-zones':      return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><FreeZones /></div>;
      case 'readiness':       return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><FundraisingReadiness /></div>;
      case 'pitch-deck':      return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><PitchDeckScorecard /></div>;
      case 'runway':          return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><RunwayOptimizer /></div>;
      case 'term-sheet':      return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><TermSheetGlossary /></div>;
      case 'investor-crm':    return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><InvestorCRM /></div>;
      case 'profile':         return <StartupProfile />;
      case 'resources':       return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><ResourceDatabase /></div>;
      case 'matching':        return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><InvestorMatcher /></div>;
      case 'admin':                    return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><AdminDashboard /></div>;
      case 'ai-market-research':        return <AIMarketResearch />;
      case 'ai-due-diligence':          return <AIDueDiligence />;
      case 'ai-investor-email':         return <AIInvestorEmail />;
      case 'ai-term-sheet':             return <AITermSheetAnalyzer />;
      case 'ai-cofounder-agreement':    return <AICofounderAgreement />;
      case 'ai-fundraising-advisor':    return <AIFundraisingAdvisor />;
      case 'safe-note':                  return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><SAFENoteBuilder /></div>;
      case 'nda':                        return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><NDAGenerator /></div>;
      case 'esop':                       return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><ESOPPlanner /></div>;
      case 'startup-directory':          return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><StartupDirectory /></div>;
      case 'valuation-timeline':         return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><ValuationTimeline /></div>;
      case 'dashboard':                  return <FounderDashboard onNavigate={(id) => {
        // Map profile sub-section IDs back to the profile page
        const profileSections = ['problem', 'business-model', 'financials', 'traction'];
        if (profileSections.includes(id)) {
          setActiveTool('profile');
        } else {
          setActiveTool(id as ToolId);
        }
      }} />;
      case 'cogs':                       return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><COGSCalculator /></div>;
      case 'sales':                      return <SalesTracker />;
      case 'data-room':                  return <DataRoom />;
      case 'term-sheet-builder':           return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><TermSheetBuilder /></div>;
      case 'cap-table':                    return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><CapTableManager /></div>;
      case 'oqal-notes':                   return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><OQALNotes /></div>;
      case 'zest-equity':                  return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><ZestEquity /></div>;
      case 'idea-validator':               return <div className="flex-1 min-w-0 overflow-y-auto p-5 lg:p-6"><IdeaValidator /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Top Bar ── */}
      <header className={`shrink-0 border-b border-border px-4 py-3 flex items-center justify-between z-40 relative ${isRTL ? 'flex-row-reverse' : ''}`} style={{ background: C.headerBg, boxShadow: `0 1px 0 ${C.headerBorder}` }}>
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              if (isAuthenticated) {
                setActiveTool('dashboard');
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                Polaris Arabia
              </div>
              <div className="text-[10px] text-muted-foreground hidden sm:block">
                Startup Intelligence Platform
              </div>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
            <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            title="Back to Home"
          >
            <HomeIcon className="w-3 h-3" />
            <span>Home</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground border border-border px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            35 tools · Free
          </div>
          {chatComplete && chatAnswers && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95 text-white border-none ${linkCopied ? 'bg-emerald-500' : 'bg-primary'}`}
              title="Copy shareable link"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
            </button>
          )}
          {/* Theme toggle — cycles: light → dark → system */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg transition-all hover:bg-secondary/60 text-muted-foreground"
            title={mode === 'light' ? 'Switch to dark mode' : mode === 'dark' ? 'Switch to system theme' : 'Switch to light mode'}
          >
            {mode === 'light' ? <Moon className="w-4 h-4" /> : mode === 'dark' ? <Monitor className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:bg-secondary/60 text-muted-foreground"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Account'}</span>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2.5 border-b border-border">
                        <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                      </div>
                      <button onClick={() => { setActiveTool('profile'); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/50 transition-colors">
                        <Building2 className="w-3.5 h-3.5" /> My Startup Profile
                      </button>

                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors border-t border-border">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { window.location.href = getLoginUrl(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/50 transition-colors">
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              generateFullReport({
                companyName: startupSnapshot?.companyName || inputs?.companyName || chatAnswers?.companyName || 'My Company',
                profile: startupSnapshot,
                valuation: inputs && summary ? { inputs, summary } : null,
                readiness,
                pitchScore,
                dilution,
              });
            }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95 text-white"
            style={{ background: 'var(--primary)' }}
            title="Download Full Report (PDF)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Report</span>
          </button>
        </div>
      </header>

      <div className={`flex flex-1 overflow-hidden main-layout ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── Sidebar ── */}
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar panel */}
        <aside
          className={`
            fixed lg:relative z-40 lg:z-auto
            flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            w-56 h-full
            ${!sidebarOpen ? (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0') : 'translate-x-0'}
          `}
          style={{
            background: C.sidebarBg,
            borderRight: isRTL ? 'none' : C.sidebarBorder,
            borderLeft: isRTL ? C.sidebarBorder : 'none',
            top: 57,
            height: 'calc(100vh - 57px)',
            // RTL: anchor to right side; LTR: anchor to left side
            // On desktop (lg+), no transform needed — sidebar is always visible via lg:relative
            // On mobile, slide in/out based on sidebarOpen
            ...(isRTL
              ? { right: 0, left: 'auto' }
              : { left: 0, right: 'auto' }
            ),
          }}
        >
          <div className="flex-1 overflow-y-auto py-3 px-2">
            {GROUPS.map(group => {
              const groupItems = NAV_ITEMS.filter(n => n.group === group);
              // Hide admin group from non-admins
              if (group === 'Admin' && user?.role !== 'admin') return null;
              const groupLabel: Record<string, string> = {
                'Overview': isRTL ? 'نظرة عامة' : 'Overview',
                'Valuation': t('navGroupValuation'),
                'Equity & Ownership': t('navGroupEquity'),
                'Capital Raising': t('navGroupFundraising'),
                'Market Intelligence': t('navGroupResources'),
                'Ecosystem Network': t('navGroupDatabase'),
                'My Company': t('navGroupMyStartup'),
                'AI Advisory': t('navGroupAITools'),
                'Legal & Compliance': t('navGroupLegal'),
                'Admin': 'Admin',
              };
              // Per-group color config
              const groupColors: Record<string, { header: string; activeBg: string; activeText: string; activeIcon: string }> = {
                'Overview':           { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'My Company':         { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Valuation':          { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Equity & Ownership': { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Capital Raising':    { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Legal & Compliance': { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Market Intelligence':{ header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Ecosystem Network':   { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'AI Advisory':        { header: C.groupHeader, activeBg: C.activeBg, activeText: C.activeText, activeIcon: C.activeIcon },
                'Admin':              { header: 'var(--muted-foreground)', activeBg: 'var(--secondary)', activeText: 'var(--foreground)', activeIcon: 'var(--foreground)' },
              };
              const gc = groupColors[group] ?? groupColors['Overview'];
              return (
                <div key={group} className="mb-3">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5" style={{ color: gc.header }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: gc.header }} />
                    {groupLabel[group] || group}
                  </div>
                  {groupItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTool === item.id;
                    // Badges removed — no badge rendering
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTool(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                        style={isActive ? {
                          background: gc.activeBg,
                          color: gc.activeText,
                          fontWeight: 600,
                        } : {
                          color: C.navText,
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = C.navHover; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = ''; }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? gc.activeIcon : undefined }} />
                        <span className="text-xs flex-1 truncate text-left">{item.shortLabel}</span>

                        {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: gc.activeIcon }} />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 p-3 border-t border-border space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            >
              <HomeIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-medium">{t('backToHome')}</span>
            </button>
            <div className="text-[9px] text-muted-foreground text-center leading-relaxed">
              Built for early-stage founders.<br />
              All calculations are estimates only.
            </div>
          </div>
        </aside>

         {/* ── Main Content ── */}
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-1 min-w-0 overflow-hidden">
            {renderTool()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <StartupProvider>
      <HomeInner />
    </StartupProvider>
  );
}
