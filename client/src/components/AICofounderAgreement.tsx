import { useLanguage } from '@/contexts/LanguageContext';
/**
 * AI Co-founder Agreement Drafter
 * Drafts comprehensive co-founder agreements based on equity and roles
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
  const [result, setResult] = useState<AgreementResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
    mutation.mutate({ companyName, founders, vestingSchedule, jurisdiction, ipAssignment, nonCompetePeriod, decisionMakingProcess: decisionMaking });
  };

  const fullDocumentText = result ? `${result.documentTitle}\n\nEffective Date: ${result.effectiveDate}\n\n${result.sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n---\n\n')}\n\n${result.disclaimer}` : '';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.45 0.15 200)' }}>
            <Users className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>AI Co-founder Agreement</h1>
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
                <Input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="e.g. Delaware, USA" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Vesting Schedule</Label>
                <Input value={vestingSchedule} onChange={e => setVestingSchedule(e.target.value)} placeholder="e.g. 4 years with 1-year cliff" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Non-compete Period</Label>
                <Input value={nonCompetePeriod} onChange={e => setNonCompetePeriod(e.target.value)} placeholder="e.g. 12 months" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Decision Making</Label>
                <Input value={decisionMaking} onChange={e => setDecisionMaking(e.target.value)} placeholder="e.g. Majority vote, Unanimous for key decisions" className="text-sm" />
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
                <span className={`text-xs font-semibold ${equityValid ? 'text-green-600' : 'text-red-600'}`}>
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

          <Button type="submit" disabled={mutation.isPending || !equityValid} className="w-full h-11 text-sm font-semibold" style={{ background: 'oklch(0.45 0.15 200)', color: 'white' }}>
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting agreement…</> : <><Users className="w-4 h-4 mr-2" /> Draft Co-founder Agreement</>}
          </Button>
        </form>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>{result.documentTitle}</h2>
              <div className="flex items-center gap-2">
                <CopyButton text={fullDocumentText} />
                <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> New Draft
                </Button>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                <div className="text-xs font-bold text-green-700 mb-2">✓ Key Highlights</div>
                <ul className="space-y-1.5">{result.keyHighlights.map((h, i) => <li key={i} className="text-xs text-green-800 flex gap-2"><span className="shrink-0">→</span>{h}</li>)}</ul>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700">Warnings</span></div>
                <ul className="space-y-1.5">{result.warnings.map((w, i) => <li key={i} className="text-xs text-amber-800 flex gap-2"><span className="shrink-0">⚠</span>{w}</li>)}</ul>
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
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="text-[10px] font-bold uppercase text-blue-700 mb-1">Plain English</div>
                            <p className="text-xs text-blue-800">{section.notes}</p>
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
