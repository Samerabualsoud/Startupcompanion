/**
 * AI Co-founder Agreement Drafter
 * Drafts comprehensive co-founder agreements based on equity and roles
 */

import ToolGuide from '@/components/ToolGuide';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useStartup } from '@/contexts/StartupContext';
import { useCapTable } from '@/hooks/useCapTable';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { JURISDICTIONS, VESTING_SCHEDULES, NON_COMPETE_PERIODS, DECISION_MAKING_OPTIONS } from '@shared/dropdowns';

type Founder = { name: string; role: string; equityPercent: number; contribution: string };
type Section = { title: string; content: string; notes: string };
type AgreementResult = {
  documentTitle: string;
  effectiveDate: string;
  sections: Section[];
  keyHighlights: string[];
  warnings: string[];
  nextSteps: string[];
  disclaimer: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

export default function AICofounderAgreement() {
  const { t } = useLanguage();
  const { snapshot } = useStartup();
  const { state: capState } = useCapTable();
  const [companyName, setCompanyName] = useState('');
  const [vestingSchedule, setVestingSchedule] = useState('4 years with 1-year cliff');
  const [jurisdiction, setJurisdiction] = useState('Delaware, USA');
  const [nonCompetePeriod, setNonCompetePeriod] = useState('12 months');
  const [decisionMaking, setDecisionMaking] = useState('Majority vote');
  const [ipAssignment, setIpAssignment] = useState(true);
  const [founders, setFounders] = useState<Founder[]>([
    { name: '', role: 'CEO', equityPercent: 50, contribution: '' },
    { name: '', role: 'CTO', equityPercent: 50, contribution: '' },
  ]);

  // Auto-fill from startup profile and cap table founders
  useEffect(() => {
    if (snapshot.companyName && !companyName) setCompanyName(snapshot.companyName);
    if (snapshot.incorporationCountry && jurisdiction === 'Delaware, USA') {
      const countryMap: Record<string, string> = {
        'Saudi Arabia': 'Saudi Arabia', 'UAE': 'DIFC, Dubai', 'Bahrain': 'Bahrain',
        'Egypt': 'Egypt', 'Jordan': 'Jordan', 'Singapore': 'Singapore',
      };
      const mapped = countryMap[snapshot.incorporationCountry];
      if (mapped) setJurisdiction(mapped);
    }
    // Pre-populate founders from cap table shareholders (type=founder)
    if (capState?.shareholders) {
      const capFounders = capState.shareholders.filter((s: any) => s.type === 'founder');
      if (capFounders.length >= 2) {
        const total = capFounders.reduce((s: number, f: any) => s + f.shares, 0);
        const mapped = capFounders.map((f: any) => ({
          name: f.name,
          role: f.title || 'Co-Founder',
          equityPercent: total > 0 ? Math.round((f.shares / total) * 100 * 10) / 10 : 0,
          contribution: f.title || '',
        }));
        setFounders(mapped);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.companyName, snapshot.incorporationCountry, capState?.shareholders]);
  const [result, setResult] = useState<AgreementResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [docLanguage, setDocLanguage] = useState<'english' | 'arabic' | 'both'>('english');

  const mutation = trpc.ai.cofounderAgreement.useMutation({
    onSuccess: (data) => { setResult(data as AgreementResult); toast.success('Agreement drafted!'); },
    onError: (err) => toast.error('Failed: ' + err.message),
  });

  const totalEquity = founders.reduce((sum, f) => sum + (f.equityPercent || 0), 0);
  const equityValid = Math.abs(totalEquity - 100) < 0.01;

  const addFounder = () => setFounders(f => [...f, { name: '', role: 'COO', equityPercent: 0, contribution: '' }]);
  const removeFounder = (i: number) => setFounders(f => f.filter((_, idx) => idx !== i));
  const updateFounder = (i: number, field: keyof Founder, value: any) => setFounders(f => f.map((founder, idx) => idx === i ? { ...founder, [field]: value } : founder));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) { toast.error('Enter company name'); return; }
    if (founders.some(f => !f.name || !f.contribution)) { toast.error('Fill in all founder details'); return; }
    if (!equityValid) { toast.error('Equity must total exactly 100%'); return; }
    mutation.mutate({ companyName, founders, vestingSchedule, jurisdiction, ipAssignment, nonCompetePeriod, decisionMakingProcess: decisionMaking, language: docLanguage });
  };

  const fullDocumentText = result ? `${result.documentTitle}\n\nEffective Date: ${result.effectiveDate}\n\n${result.sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n---\n\n')}\n\n${result.disclaimer}` : '';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-4xl mx-auto w-full">
      <ToolGuide
        toolName='Co-Founder Agreement'
        tagline='Generate co-founder agreements — founders and equity splits pulled from ZestEquity.'
        steps={[
          { step: 1, title: 'Review founders', description: 'Founders and their equity percentages are pre-filled from ZestEquity cap table.' },
          { step: 2, title: 'Set vesting terms', description: 'Configure the vesting schedule, cliff period, and good/bad leaver clauses.' },
          { step: 3, title: 'Add IP assignment', description: 'Specify IP assignment terms and non-compete clauses.' },
          { step: 4, title: 'Generate agreement', description: 'Click Generate to produce the co-founder agreement text.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'auto-fills company name and incorporation details' },
          { from: 'ZestEquity Cap Table', to: 'pre-populates founders and their equity percentages' },
        ]}
        tip='Co-founder agreements should be signed before any significant work begins. Vesting protects all founders if someone leaves early.'
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary">
            <Users className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI Co-founder Agreement</h1>
            <p className="text-xs text-muted-foreground">Draft a comprehensive co-founder agreement in minutes</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-6 mb-6">
          {/* Company info */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Company Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Company Name *</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Technologies Inc." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Jurisdiction</Label>
                <Select value={jurisdiction} onValueChange={setJurisdiction}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select jurisdiction…" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Vesting Schedule</Label>
                <Select value={vestingSchedule} onValueChange={setVestingSchedule}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select schedule…" /></SelectTrigger>
                  <SelectContent>
                    {VESTING_SCHEDULES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Non-compete Period</Label>
                <Select value={nonCompetePeriod} onValueChange={setNonCompetePeriod}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select period…" /></SelectTrigger>
                  <SelectContent>
                    {NON_COMPETE_PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Decision Making</Label>
                <Select value={decisionMaking} onValueChange={setDecisionMaking}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select model…" /></SelectTrigger>
                  <SelectContent>
                    {DECISION_MAKING_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" id="ip" checked={ipAssignment} onChange={e => setIpAssignment(e.target.checked)} className="w-4 h-4 rounded" />
                <Label htmlFor="ip" className="text-xs font-semibold cursor-pointer">IP Assignment to Company</Label>
              </div>
            </div>
          </div>

          {/* Founders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Founders</div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${equityValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Total: {totalEquity}% {equityValid ? '✓' : '(must be 100%)'}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addFounder} className="text-xs gap-1.5 h-7">
                  <Plus className="w-3.5 h-3.5" /> Add Founder
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {founders.map((founder, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-foreground">Founder {i + 1}</span>
                    {founders.length > 2 && (
                      <button type="button" onClick={() => removeFounder(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-[10px] font-semibold mb-1 block">Name *</Label>
                      <Input value={founder.name} onChange={e => updateFounder(i, 'name', e.target.value)} placeholder="Full name" className="text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold mb-1 block">Role</Label>
                      <Input value={founder.role} onChange={e => updateFounder(i, 'role', e.target.value)} placeholder="CEO, CTO…" className="text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold mb-1 block">Equity %</Label>
                      <Input type="number" min={0} max={100} value={founder.equityPercent} onChange={e => updateFounder(i, 'equityPercent', parseFloat(e.target.value) || 0)} className="text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold mb-1 block">Contribution *</Label>
                      <Input value={founder.contribution} onChange={e => updateFounder(i, 'contribution', e.target.value)} placeholder="e.g. Tech, $50K cash" className="text-xs h-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold"><Globe className="w-3.5 h-3.5" /> Document Language</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['english', 'arabic', 'both'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setDocLanguage(lang)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                    docLanguage === lang
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {lang === 'english' ? '🇺🇸 English' : lang === 'arabic' ? '🇸🇦 Arabic' : '🌐 Both'}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending || !equityValid} className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting agreement…</> : <><Users className="w-4 h-4 mr-2" /> Draft Co-founder Agreement</>}
          </Button>
        </form>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{result.documentTitle}</h2>
              <div className="flex items-center gap-2">
                <CopyButton text={fullDocumentText} />
                <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> New Draft
                </Button>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">✓ Key Highlights</div>
                <ul className="space-y-1.5">{result.keyHighlights.map((h, i) => <li key={i} className="text-xs text-green-800 dark:text-green-300 flex gap-2"><span className="shrink-0">→</span>{h}</li>)}</ul>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /><span className="text-xs font-bold text-amber-700 dark:text-amber-400">Warnings</span></div>
                <ul className="space-y-1.5">{result.warnings.map((w, i) => <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-2"><span className="shrink-0">⚠</span>{w}</li>)}</ul>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              {result.sections.map((section) => (
                <div key={section.title} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)} className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/30 transition-colors">
                    <span className="text-sm font-semibold text-foreground">{section.title}</span>
                    {expandedSection === section.title ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {expandedSection === section.title && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 py-4 border-t border-border bg-background space-y-3">
                          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{section.content}</pre>
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 mb-1">Plain English</div>
                            <p className="text-xs text-blue-800 dark:text-blue-300">{section.notes}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Next steps */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-xs font-bold text-foreground mb-3">📋 Next Steps</div>
              <ol className="space-y-2">{result.nextSteps.map((s, i) => <li key={i} className="flex gap-3 text-xs text-foreground"><span className="shrink-0 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">{i + 1}</span>{s}</li>)}</ol>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-xl border border-border bg-secondary/30">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{result.disclaimer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
