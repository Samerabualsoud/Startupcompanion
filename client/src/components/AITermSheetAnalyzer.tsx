/**
 * AI Term Sheet Analyzer
 * Analyzes term sheets and explains clauses in plain English
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { STARTUP_STAGES } from '@shared/dropdowns';

type KeyTerm = {
  term: string; value: string; plainEnglish: string;
  founderImpact: string; rating: string; negotiationTip: string;
};
type AnalysisResult = {
  overallScore: number;
  verdict: string;
  keyTerms: KeyTerm[];
  redFlags: string[];
  positives: string[];
  missingClauses: string[];
  negotiationPriorities: string[];
  summary: string;
};

const SAMPLE_TERM_SHEET = `Investment Amount: $1,000,000
Pre-money Valuation: $4,000,000
Post-money Valuation: $5,000,000
Security Type: Series A Preferred Stock
Liquidation Preference: 2x non-participating
Anti-dilution: Full ratchet
Board Composition: 2 investor seats, 1 founder seat
Pro-rata Rights: Yes, for future rounds
Information Rights: Monthly financials, annual audited statements
Drag-along Rights: Majority of preferred can drag common
Vesting: 4 years, 1-year cliff for all founders
No-shop Period: 45 days
Closing Conditions: Satisfactory due diligence, legal documentation`;

export default function AITermSheetAnalyzer() {
  const { t, lang } = useLanguage();
  const [termSheetText, setTermSheetText] = useState('');
  const [companyStage, setCompanyStage] = useState('Seed');
  const [founderExperience, setFounderExperience] = useState<'first-time' | 'experienced' | 'serial'>('first-time');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const mutation = trpc.ai.termSheetAnalyzer.useMutation({
    onSuccess: (data) => { setResult(data as AnalysisResult); toast.success('Term sheet analyzed!'); },
    onError: (err) => toast.error('Failed: ' + err.message),
  });

  const ratingColor = (r: string) => {
    if (r === 'Red Flag') return 'bg-red-100 text-red-700 border-red-200';
    if (r === 'Concerning') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (r === 'Good') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-secondary text-muted-foreground border-border';
  };

  const scoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600';
    if (s >= 45) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreLabel = (s: number) => {
    if (s >= 70) return 'Founder-Friendly';
    if (s >= 45) return 'Balanced';
    return 'Investor-Heavy';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.55 0.15 30)' }}>
            <FileText className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI Term Sheet Analyzer</h1>
            <p className="text-xs text-muted-foreground">Plain-English explanations + red flags + negotiation tips</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!result && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Company Stage</Label>
              <Select value={companyStage} onValueChange={setCompanyStage}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select stage…" /></SelectTrigger>
                <SelectContent>
                  {STARTUP_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Your Experience Level</Label>
              <Select value={founderExperience} onValueChange={v => setFounderExperience(v as any)}>
                <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-time">First-time Founder</SelectItem>
                  <SelectItem value="experienced">Experienced Founder</SelectItem>
                  <SelectItem value="serial">Serial Entrepreneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold">Paste Your Term Sheet *</Label>
              <button onClick={() => setTermSheetText(SAMPLE_TERM_SHEET)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                Load sample
              </button>
            </div>
            <Textarea
              value={termSheetText}
              onChange={e => setTermSheetText(e.target.value)}
              placeholder="Paste the full text of your term sheet here…"
              className="text-sm min-h-[200px] resize-none font-mono"
            />
          </div>

          <Button
            onClick={() => {
              if (termSheetText.length < 50) { toast.error('Please paste a term sheet (at least 50 characters)'); return; }
              mutation.mutate({ termSheetText, companyStage, founderExperience, language: lang === 'ar' ? 'arabic' : 'english' });
            }}
            disabled={mutation.isPending}
            className="w-full h-11 text-sm font-semibold"
            style={{ background: 'oklch(0.55 0.15 30)', color: 'white' }}
          >
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing term sheet…</> : <><FileText className="w-4 h-4 mr-2" /> Analyze Term Sheet</>}
          </Button>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Analysis Results</h2>
              <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> New Analysis
              </Button>
            </div>

            {/* Score + Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-card">
                <div className={`text-5xl font-black ${scoreColor(result.overallScore)}`}>{result.overallScore}</div>
                <div className="text-xs text-muted-foreground mt-1">out of 100</div>
                <div className={`text-xs font-bold mt-1 ${scoreColor(result.overallScore)}`}>{scoreLabel(result.overallScore)}</div>
              </div>
              <div className="md:col-span-2 p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3">
                <p className="text-sm text-foreground leading-relaxed">{result.verdict}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Red flags + Positives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.redFlags.length > 0 && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs font-bold text-red-700">Red Flags</span></div>
                  <ul className="space-y-1.5">{result.redFlags.map((f, i) => <li key={i} className="text-xs text-red-800 flex gap-2"><span className="shrink-0">⚠</span>{f}</li>)}</ul>
                </div>
              )}
              {result.positives.length > 0 && (
                <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs font-bold text-green-700">Positives</span></div>
                  <ul className="space-y-1.5">{result.positives.map((p, i) => <li key={i} className="text-xs text-green-800 flex gap-2"><span className="shrink-0">✓</span>{p}</li>)}</ul>
                </div>
              )}
            </div>

            {/* Negotiation priorities */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-xs font-bold text-foreground mb-3">🎯 Negotiation Priorities (in order)</div>
              <ol className="space-y-2">
                {result.negotiationPriorities.map((p, i) => (
                  <li key={i} className="flex gap-3 text-xs text-foreground">
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: i === 0 ? '#C4614A' : i === 1 ? '#F59E0B' : '#6366F1' }}>{i + 1}</span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Terms */}
            <div>
              <div className="text-xs font-bold text-foreground mb-3">📋 Key Terms Explained</div>
              <div className="space-y-2">
                {result.keyTerms.map((term) => (
                  <div key={term.term} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingColor(term.rating)}`}>{term.rating}</span>
                        <span className="text-sm font-semibold text-foreground">{term.term}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">{term.value}</span>
                      </div>
                      {expandedTerm === term.term ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {expandedTerm === term.term && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 py-4 border-t border-border bg-background space-y-3">
                            <div>
                              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Plain English</div>
                              <p className="text-xs text-foreground">{term.plainEnglish}</p>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Impact on You</div>
                              <p className="text-xs text-foreground">{term.founderImpact}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <div className="text-[10px] font-bold uppercase text-amber-700 mb-1">Negotiation Tip</div>
                              <p className="text-xs text-amber-800">{term.negotiationTip}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing clauses */}
            {result.missingClauses.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="text-xs font-bold text-amber-700 mb-2">⚠ Missing Clauses to Request</div>
                <ul className="space-y-1.5">{result.missingClauses.map((c, i) => <li key={i} className="text-xs text-amber-800 flex gap-2"><span className="shrink-0">+</span>{c}</li>)}</ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
