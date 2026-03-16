/**
 * Home Page — AI Startup Valuation Calculator (Chat-First Redesign)
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Layout: Split-screen — left chat input, right live results
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { buildInputsFromAnswers } from '@/lib/chatFlow';
import { runValuation, type StartupInputs, type ValuationSummary } from '@/lib/valuation';
import ChatInterface from '@/components/ChatInterface';
import ValuationReport from '@/components/ValuationReport';

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, any> | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [key, setKey] = useState(0); // force remount on reset

  const inputs: StartupInputs | null = useMemo(() => {
    if (!answers) return null;
    return buildInputsFromAnswers(answers);
  }, [answers]);

  const summary: ValuationSummary | null = useMemo(() => {
    if (!inputs) return null;
    return runValuation(inputs);
  }, [inputs]);

  const handleComplete = (ans: Record<string, any>) => {
    setAnswers(ans);
    setIsComplete(true);
  };

  const handleReset = () => {
    setAnswers(null);
    setIsComplete(false);
    setKey(k => k + 1);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* ── Top Bar ── */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>AI Startup Valuation</div>
            <div className="text-[10px] text-muted-foreground font-mono">7 methods · Professional-grade analysis</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
            Powered by DCF · Scorecard · Berkus · VC Method · Comps · Risk-Factor · First Chicago
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── Left: Chat Panel ── */}
        <div className={`flex flex-col border-r border-border transition-all duration-500 ${isComplete ? 'w-full lg:w-[420px]' : 'w-full lg:w-1/2'}`}
          style={{ background: 'oklch(0.993 0.003 80)' }}>

          {/* Chat Header */}
          <div className="shrink-0 px-5 py-4 border-b border-border" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.55 0.13 30)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Valuation Assistant</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px]" style={{ color: 'oklch(0.62 0.02 240)' }}>Online · Ready to value your startup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface key={key} onComplete={handleComplete} />
          </div>
        </div>

        {/* ── Right: Results Panel ── */}
        <AnimatePresence>
          {isComplete && inputs && summary && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="hidden lg:flex flex-col flex-1 overflow-hidden"
              style={{ background: 'oklch(0.993 0.003 80)' }}
            >
              <ValuationReport inputs={inputs} summary={summary} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile: Results below chat ── */}
        <AnimatePresence>
          {isComplete && inputs && summary && (
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

        {/* ── Right placeholder when not complete ── */}
        {!isComplete && (
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
              <div className="space-y-2.5">
                {[
                  { label: 'Discounted Cash Flow (DCF)', desc: 'Future cash flow analysis' },
                  { label: 'Scorecard Method', desc: 'Team & market quality scoring' },
                  { label: 'Berkus Method', desc: 'Milestone-based valuation' },
                  { label: 'VC Method', desc: 'Return-on-investment calculation' },
                  { label: 'Comparable Transactions', desc: 'Industry benchmark multiples' },
                  { label: 'Risk-Factor Summation', desc: '12-factor risk adjustment' },
                  { label: 'First Chicago Method', desc: 'Bear / base / bull scenarios' },
                ].map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 text-left p-2.5 rounded-lg" style={{ background: 'oklch(0.22 0.04 240)' }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ['#C4614A','#8B4A38','#2D4A6B','#A0522D','#1B3A5C','#D4845A','#C4614A'][i] }} />
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
    </div>
  );
}
