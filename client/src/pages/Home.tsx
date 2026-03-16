/**
 * Home Page — AI Startup Toolkit (Full Sidebar Navigation)
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Layout: Persistent left sidebar + content area
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Sparkles, Rocket, Users, GitBranch, Target,
  BookOpen, BarChart3, DollarSign, Menu, X, ChevronRight,
  Gauge, Layers, FileDown
} from 'lucide-react';
import { buildInputsFromAnswers } from '@/lib/chatFlow';
import { runValuation, type StartupInputs, type ValuationSummary } from '@/lib/valuation';
import { generateFullReport } from '@/lib/fullReport';
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

type ToolId = 'valuation' | 'accelerators' | 'equity-split' | 'dilution' | 'readiness' | 'pitch-deck' | 'term-sheet' | 'investor-crm' | 'runway';

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
  { id: 'term-sheet',    label: 'Term Sheet Glossary',   shortLabel: 'Term Sheet', icon: BookOpen,    group: 'Resources',    badge: '35 terms' },
];

const GROUPS = ['Valuation', 'Equity & Cap Table', 'Fundraising', 'Resources'];

const TOOL_COLORS: Record<ToolId, string> = {
  valuation: '#C4614A',
  accelerators: '#10B981',
  'equity-split': '#2D4A6B',
  dilution: '#8B4A38',
  readiness: '#F59E0B',
  'pitch-deck': '#6366F1',
  'term-sheet': '#0F1B2D',
  'investor-crm': '#C4614A',
  runway: '#059669',
};

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolId>('valuation');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatAnswers, setChatAnswers] = useState<Record<string, any> | null>(null);
  const [chatComplete, setChatComplete] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const { readiness, pitchScore, dilution } = useReport();

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
      case 'term-sheet':      return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><TermSheetGlossary /></div>;
      case 'investor-crm':    return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><InvestorCRM /></div>;
      case 'runway':          return <div className="flex-1 overflow-y-auto p-5 lg:p-6"><RunwayOptimizer /></div>;
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
            9 tools · Free
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
              return (
                <div key={group} className="mb-4">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">{group}</div>
                  {groupItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTool === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTool(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-left transition-all group ${
                          isActive
                            ? 'text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                        }`}
                        style={isActive ? { background: TOOL_COLORS[item.id] } : {}}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">{item.shortLabel}</span>
                        {item.badge && !isActive && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
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
          <div className="shrink-0 p-3 border-t border-border">
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
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: TOOL_COLORS[activeTool] }}>
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
