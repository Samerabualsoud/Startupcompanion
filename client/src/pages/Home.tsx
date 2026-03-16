/**
 * Home Page — AI Startup Toolkit (Full Sidebar Navigation)
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Layout: Persistent left sidebar + content area
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Sparkles, Rocket, Users, GitBranch, Target,
  BookOpen, BarChart3, Menu, X, ChevronRight,
  Gauge, Layers, FileDown, Link2, Check, Building2, LogIn, LogOut, UserCircle, Home as HomeIcon,
  MessageCircle, Mail, FileText, Users2, ClipboardCheck
} from 'lucide-react';
import { useLocation } from 'wouter';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import StartupProfile from './StartupProfile';
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
import FeasibilityEvaluator from '@/components/FeasibilityEvaluator';
import ResourceDatabase from '@/components/ResourceDatabase';
import InvestorMatcher from '@/components/InvestorMatcher';
import AdminDashboard from '@/pages/AdminDashboard';
import AIMarketResearch from '@/components/AIMarketResearch';
import AIDueDiligence from '@/components/AIDueDiligence';
import AIInvestorEmail from '@/components/AIInvestorEmail';
import AITermSheetAnalyzer from '@/components/AITermSheetAnalyzer';
import AICofounderAgreement from '@/components/AICofounderAgreement';
import AIFundraisingAdvisor from '@/components/AIFundraisingAdvisor';

type ToolId = 'valuation' | 'accelerators' | 'equity-split' | 'dilution' | 'readiness' | 'pitch-deck' | 'term-sheet' | 'investor-crm' | 'runway' | 'profile' | 'feasibility' | 'resources' | 'matching' | 'admin' | 'ai-market-research' | 'ai-due-diligence' | 'ai-investor-email' | 'ai-term-sheet' | 'ai-cofounder-agreement' | 'ai-fundraising-advisor';

interface NavItem {
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  // Valuation
  { id: 'valuation',     label: 'Valuation Calculator', shortLabel: 'Valuation',   icon: TrendingUp,  group: 'Valuation',    badge: '7 methods' },
  // Equity & Funding
  { id: 'equity-split',  label: 'Co-Founder Equity Split', shortLabel: 'Equity Split', icon: Users,    group: 'Equity & Cap Table' },
  { id: 'dilution',      label: 'Dilution Simulator',   shortLabel: 'Dilution',    icon: GitBranch,   group: 'Equity & Cap Table' },
  // Fundraising
  { id: 'readiness',     label: 'Fundraising Readiness', shortLabel: 'Readiness',  icon: Gauge,       group: 'Fundraising',  badge: '20 checks' },
  { id: 'pitch-deck',    label: 'Pitch Deck Scorecard',  shortLabel: 'Pitch Deck', icon: Layers,      group: 'Fundraising' },
  { id: 'investor-crm',  label: 'Investor CRM',          shortLabel: 'Investors',  icon: Target,      group: 'Fundraising' },
  // Resources
  { id: 'accelerators',  label: 'Accelerator Finder',    shortLabel: 'Accelerators', icon: Rocket,    group: 'Resources',    badge: 'New' },
  { id: 'runway',        label: 'Runway Optimizer',      shortLabel: 'Runway',     icon: BarChart3,   group: 'Resources' },
  { id: 'term-sheet',    label: 'Term Sheet Glossary',   shortLabel: 'Term Sheet', icon: BookOpen,    group: 'Resources',    badge: '75 terms' },
  // Idea Evaluation
  { id: 'feasibility',   label: 'Idea Evaluator',        shortLabel: 'Idea Check', icon: Sparkles,    group: 'Valuation',    badge: 'AI' },
  // My Startup
  { id: 'profile',       label: 'My Startup Profile',    shortLabel: 'My Startup', icon: Building2,   group: 'My Startup' },
  // Database
  { id: 'resources',     label: 'Investor Database',     shortLabel: 'Database',   icon: Building2,   group: 'Database',     badge: 'New' },
  { id: 'matching',      label: 'Investor Matching',     shortLabel: 'Matching',   icon: Target,      group: 'Database',     badge: 'AI' },
  // Admin
  { id: 'admin',         label: 'Admin Dashboard',       shortLabel: 'Admin',      icon: Gauge,       group: 'Admin' },
  // AI Tools
  { id: 'ai-fundraising-advisor', label: 'AI Fundraising Advisor', shortLabel: 'AI Advisor',    icon: MessageCircle, group: 'AI Tools', badge: 'AI' },
  { id: 'ai-market-research',     label: 'AI Market Research',     shortLabel: 'Market Research', icon: BarChart3,    group: 'AI Tools', badge: 'AI' },
  { id: 'ai-investor-email',      label: 'AI Investor Email',      shortLabel: 'Email Writer',  icon: Mail,          group: 'AI Tools', badge: 'AI' },
  { id: 'ai-term-sheet',          label: 'AI Term Sheet Analyzer', shortLabel: 'Term Analyzer', icon: FileText,      group: 'AI Tools', badge: 'AI' },
  { id: 'ai-cofounder-agreement', label: 'AI Co-founder Agreement',shortLabel: 'Co-founder AI', icon: Users2,        group: 'AI Tools', badge: 'AI' },
  { id: 'ai-due-diligence',       label: 'AI Due Diligence',       shortLabel: 'Due Diligence', icon: ClipboardCheck,group: 'AI Tools', badge: 'AI' },
];

const GROUPS = ['Valuation', 'Equity & Cap Table', 'Fundraising', 'Resources', 'Database', 'My Startup', 'AI Tools', 'Admin'];

const TOOL_COLORS: Record<ToolId, string> = {
  feasibility: '#6366F1',
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
  'ai-market-research': '#0EA5E9',
  'ai-due-diligence': '#8B5CF6',
  'ai-investor-email': '#EC4899',
  'ai-term-sheet': '#F97316',
  'ai-cofounder-agreement': '#14B8A6',
  'ai-fundraising-advisor': '#C4614A',
};

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  const [activeTool, setActiveTool] = useState<ToolId>('valuation');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatAnswers, setChatAnswers] = useState<Record<string, any> | null>(null);
  const [chatComplete, setChatComplete] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const { readiness, pitchScore, dilution } = useReport();

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

  const activeItem = NAV_ITEMS.find(n => n.id === activeTool)!;

  const renderTool = () => {
    switch (activeTool) {
      case 'valuation':
        return (
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Chat Panel */}
            <div className={`flex flex-col border-r border-border transition-all duration-500 ${chatComplete ? 'w-full lg:w-[400px]' : 'w-full'}`}
              style={{ background: 'oklch(0.993 0.003 80)' }}>
              <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center gap-2.5" style={{ background: 'oklch(0.18 0.05 240)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.55 0.13 30)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Valuation Assistant</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px]" style={{ color: 'oklch(0.62 0.02 240)' }}>Online · 7 valuation methods</span>
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
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="hidden lg:flex flex-col flex-1 overflow-hidden"
                  style={{ background: 'oklch(0.993 0.003 80)' }}
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
                  className="lg:hidden fixed inset-0 z-50 flex flex-col"
                  style={{ background: 'oklch(0.993 0.003 80)', top: 57 }}
                >
                  <ValuationReport inputs={inputs} summary={summary} onReset={handleReset} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder when not complete */}
            {!chatComplete && (
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8" style={{ background: 'oklch(0.18 0.05 240)' }}>
                <div className="max-w-sm text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'oklch(0.22 0.05 240)', border: '1px solid oklch(0.28 0.04 240)' }}>
                    <TrendingUp className="w-8 h-8" style={{ color: 'oklch(0.55 0.13 30)' }} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Your Report Will Appear Here
                  </h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'oklch(0.62 0.02 240)' }}>
                    Answer the questions on the left and we'll instantly generate a professional valuation report using 7 industry-standard methods.
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Discounted Cash Flow (DCF)', desc: 'Future cash flow analysis', color: '#C4614A' },
                      { label: 'Scorecard Method', desc: 'Team & market quality scoring', color: '#8B4A38' },
                      { label: 'Berkus Method', desc: 'Milestone-based valuation', color: '#2D4A6B' },
                      { label: 'VC Method', desc: 'Return-on-investment calculation', color: '#A0522D' },
                      { label: 'Comparable Transactions', desc: 'Industry benchmark multiples', color: '#1B3A5C' },
                      { label: 'Risk-Factor Summation', desc: '12-factor risk adjustment', color: '#D4845A' },
                      { label: 'First Chicago Method', desc: 'Bear / base / bull scenarios', color: '#C4614A' },
                    ].map((m, i) => (
                      <motion.div key={m.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 text-left p-2.5 rounded-lg" style={{ background: 'oklch(0.22 0.04 240)' }}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                        <div>
                          <div className="text-xs font-semibold text-white">{m.label}</div>
                          <div className="text-[10px]" style={{ color: 'oklch(0.45 0.04 240)' }}>{m.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'accelerators':    return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><AcceleratorRecommender /></div>;
      case 'equity-split':    return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><CoFounderEquitySplit /></div>;
      case 'dilution':        return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><AdvancedDilutionSimulator /></div>;
      case 'readiness':       return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><FundraisingReadiness /></div>;
      case 'pitch-deck':      return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><PitchDeckScorecard /></div>;
      case 'runway':          return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><RunwayOptimizer /></div>;
      case 'term-sheet':      return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><TermSheetGlossary /></div>;
      case 'investor-crm':    return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><InvestorCRM /></div>;
      case 'profile':         return <StartupProfile />;
      case 'feasibility':     return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><FeasibilityEvaluator /></div>;
      case 'resources':       return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><ResourceDatabase /></div>;
      case 'matching':        return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><InvestorMatcher /></div>;
      case 'admin':                    return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><AdminDashboard /></div>;
      case 'ai-market-research':        return <AIMarketResearch />;
      case 'ai-due-diligence':          return <AIDueDiligence />;
      case 'ai-investor-email':         return <AIInvestorEmail />;
      case 'ai-term-sheet':             return <AITermSheetAnalyzer />;
      case 'ai-cofounder-agreement':    return <AICofounderAgreement />;
      case 'ai-fundraising-advisor':    return <AIFundraisingAdvisor />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.978 0.008 80)' }}>

      {/* ── Top Bar ── */}
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI Startup Toolkit
              </div>
              <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                Valuation · Equity · Fundraising · Resources
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground border border-border px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            13 tools · Free
          </div>
          <LanguageSwitcher />
          {chatComplete && chatAnswers && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: linkCopied ? '#10B981' : 'oklch(0.24 0.04 240)', color: '#FAF6EF', border: '1px solid oklch(0.32 0.04 240)' }}
              title="Copy shareable link"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
            </button>
          )}
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
                companyName: inputs?.companyName || chatAnswers?.companyName || 'My Startup',
                valuation: inputs && summary ? { inputs, summary } : null,
                readiness,
                pitchScore,
                dilution,
              });
            }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'oklch(0.18 0.05 240)', color: '#FAF6EF', border: '1px solid oklch(0.28 0.04 240)' }}
            title="Download Full Report (PDF)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Report</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

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
            border-r border-border
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            w-56 h-full
          `}
          style={{ background: 'oklch(0.993 0.003 80)', top: 57, height: 'calc(100vh - 57px)' }}
        >
          <div className="flex-1 overflow-y-auto py-3 px-2">
            {GROUPS.map(group => {
              const groupItems = NAV_ITEMS.filter(n => n.group === group);
              // Hide admin group from non-admins
              if (group === 'Admin' && user?.role !== 'admin') return null;
              const groupLabel: Record<string, string> = {
                'Valuation': t('navGroupValuation'),
                'Equity & Cap Table': t('navGroupEquity'),
                'Fundraising': t('navGroupFundraising'),
                'Resources': t('navGroupResources'),
                'Database': t('navGroupDatabase'),
                'My Startup': t('navGroupMyStartup'),
                'AI Tools': t('navGroupAITools'),
                'Admin': 'Admin',
              };
              return (
                <div key={group} className="mb-3">
                  <div className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1" style={{ color: 'oklch(0.5 0.03 240)' }}>
                    {groupLabel[group] || group}
                  </div>
                  {groupItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTool === item.id;
                    const isAI = item.badge === 'AI';
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTool(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-left transition-all ${
                          isActive
                            ? 'text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                        }`}
                        style={isActive ? { background: TOOL_COLORS[item.id] } : {}}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">{item.shortLabel}</span>
                        {item.badge && !isActive && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isAI
                              ? 'bg-violet-100 text-violet-700'
                              : item.badge === 'New'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-secondary text-muted-foreground'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3 h-3 shrink-0 opacity-70" />}
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
        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Tool header bar */}
          {activeTool !== 'valuation' && (
            <div className="shrink-0 px-5 py-3 border-b border-border bg-card flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: TOOL_COLORS[activeTool] }}>
                {(() => { const Icon = activeItem.icon; return <Icon className="w-3.5 h-3.5 text-white" />; })()}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>{activeItem.label}</div>
              </div>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {renderTool()}
          </div>
        </main>
      </div>
    </div>
  );
}
