/**
 * AI Investor Email Writer
 * Generates personalized cold outreach emails to investors
 */

import ToolGuide from '@/components/ToolGuide';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Copy, Check, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SECTORS, STARTUP_STAGES, CHECK_SIZES } from '@shared/dropdowns';

type EmailResult = {
  subjectLine: string;
  emailBody: string;
  followUpEmail: string;
  tips: string[];
  doNotDo: string[];
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

export default function AIInvestorEmail() {
  const { t, lang } = useLanguage();
  const { snapshot } = useStartup();
  const [form, setForm] = useState({
    startupName: '', founderName: '', sector: '', stage: 'Seed',
    oneLiner: '', traction: '', askAmount: '',
    investorName: '', investorFirm: '', investorFocus: '',
    emailTone: 'conversational' as 'formal' | 'conversational' | 'bold',
  });

  // Auto-populate from startup profile when it loads
  useEffect(() => {
    if (snapshot.companyName) {
      const tractionParts = [
        snapshot.mrr ? `MRR: $${snapshot.mrr.toLocaleString()}` : '',
        snapshot.currentARR ? `ARR: $${snapshot.currentARR.toLocaleString()}` : '',
        snapshot.numberOfCustomers ? `${snapshot.numberOfCustomers} customers` : '',
        snapshot.monthlyActiveUsers ? `${snapshot.monthlyActiveUsers} MAU` : '',
      ].filter(Boolean);
      setForm(prev => ({
        ...prev,
        startupName: prev.startupName || snapshot.companyName,
        sector: prev.sector || snapshot.sector || '',
        stage: prev.stage !== 'Seed' ? prev.stage : (snapshot.stage || 'Seed'),
        oneLiner: prev.oneLiner || snapshot.tagline || '',
        traction: prev.traction || tractionParts.join(', '),
        askAmount: prev.askAmount || (snapshot.targetRaise ? `$${(snapshot.targetRaise / 1e6).toFixed(1)}M` : ''),
      }));
    }
  }, [snapshot.companyName]);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const mutation = trpc.ai.investorEmail.useMutation({
    onSuccess: (data) => { setResult(data as EmailResult); toast.success('Email drafted!'); },
    onError: (err) => toast.error('Failed: ' + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startupName || !form.founderName || !form.sector || !form.oneLiner || !form.investorName) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate({ ...form, language: lang === 'ar' ? 'arabic' : 'english' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-4xl mx-auto w-full">
      <ToolGuide
        toolName='AI Investor Email'
        tagline='Draft investor outreach emails — startup name and details auto-filled from your profile.'
        steps={[
          { step: 1, title: 'Review pre-filled data', description: 'Your startup name is auto-filled from the Startup Profile.' },
          { step: 2, title: 'Choose email type', description: 'Select cold outreach, follow-up, or thank-you email.' },
          { step: 3, title: 'Add investor context', description: "Optionally add the investor's name and fund for personalization." },
          { step: 4, title: 'Generate & send', description: 'Review the generated email and customize before sending.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'auto-fills startup name, stage, and key metrics in the email' },
        ]}
        tip="Personalize each email with the investor's specific thesis and portfolio companies for higher response rates."
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI Investor Email Writer</h1>
            <p className="text-xs text-muted-foreground">Personalized cold outreach emails that get responses</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-5 mb-6">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Your Startup</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Startup Name *</Label>
                <Input value={form.startupName} onChange={e => setForm(f => ({ ...f, startupName: e.target.value }))} placeholder="e.g. TechVenture AI" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Your Name *</Label>
                <Input value={form.founderName} onChange={e => setForm(f => ({ ...f, founderName: e.target.value }))} placeholder="e.g. Ahmed Al-Rashid" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Sector / Vertical *</Label>
                <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select sector…" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Stage</Label>
                <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select stage…" /></SelectTrigger>
                  <SelectContent>
                    {STARTUP_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-semibold mb-1.5 block">One-liner pitch *</Label>
                <Input value={form.oneLiner} onChange={e => setForm(f => ({ ...f, oneLiner: e.target.value }))} placeholder="e.g. We help SMBs in MENA automate their accounting with AI" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Traction (optional)</Label>
                <Input value={form.traction} onChange={e => setForm(f => ({ ...f, traction: e.target.value }))} placeholder="e.g. $50K MRR, 200 customers, 3x YoY growth" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Raise Amount (optional)</Label>
                <Select value={form.askAmount} onValueChange={v => setForm(f => ({ ...f, askAmount: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select amount…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">Not specified</SelectItem>
                    {CHECK_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Investor Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Investor Name *</Label>
                <Input value={form.investorName} onChange={e => setForm(f => ({ ...f, investorName: e.target.value }))} placeholder="e.g. Sarah Johnson" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Firm (optional)</Label>
                <Input value={form.investorFirm} onChange={e => setForm(f => ({ ...f, investorFirm: e.target.value }))} placeholder="e.g. Sequoia Capital" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Investor Focus (optional)</Label>
                <Input value={form.investorFocus} onChange={e => setForm(f => ({ ...f, investorFocus: e.target.value }))} placeholder="e.g. B2B SaaS, MENA" className="text-sm" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-2 block">Email Tone</Label>
            <div className="flex gap-2">
              {(['formal', 'conversational', 'bold'] as const).map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, emailTone: tone }))}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${form.emailTone === tone ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/50'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full h-11 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'white' }}>
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing email…</> : <><Mail className="w-4 h-4 mr-2" /> Generate Investor Email</>}
          </Button>
        </form>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your Investor Email</h2>
              <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> New Email
              </Button>
            </div>

            {/* Subject line */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subject Line</span>
                <CopyButton text={result.subjectLine} />
              </div>
              <p className="text-sm font-semibold text-foreground">{result.subjectLine}</p>
            </div>

            {/* Email body */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Body</span>
                <CopyButton text={result.emailBody} />
              </div>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{result.emailBody}</pre>
            </div>

            {/* Follow-up */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button onClick={() => setShowFollowUp(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/30 transition-colors">
                <span className="text-sm font-semibold text-foreground">2-Week Follow-up Email</span>
                {showFollowUp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showFollowUp && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 py-4 border-t border-border bg-background">
                      <div className="flex justify-end mb-2"><CopyButton text={result.followUpEmail} /></div>
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{result.followUpEmail}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                <div className="text-xs font-bold text-green-700 mb-2">✓ Tips for Success</div>
                <ul className="space-y-1.5">
                  {result.tips.map((t, i) => <li key={i} className="text-xs text-green-800 flex gap-2"><span className="shrink-0">→</span>{t}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                <div className="text-xs font-bold text-red-700 mb-2">✗ Avoid These Mistakes</div>
                <ul className="space-y-1.5">
                  {result.doNotDo.map((d, i) => <li key={i} className="text-xs text-red-800 flex gap-2"><span className="shrink-0">✗</span>{d}</li>)}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
