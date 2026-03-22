/**
 * AI Market Research Tool
 * Generates comprehensive market research reports using AI
 */

import ToolGuide from '@/components/ToolGuide';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Users, AlertTriangle, CheckCircle2,
  BarChart3, Globe, Zap, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { SECTORS, REGIONS } from '@shared/dropdowns';

type ResearchResult = {
  executiveSummary: string;
  marketSize: { tam: string; sam: string; som: string; growthRate: string };
  keyTrends: Array<{ trend: string; description: string; impact: string }>;
  competitors: Array<{ name: string; description: string; funding: string; weakness: string }>;
  customerSegments: Array<{ segment: string; size: string; painPoint: string; willingness: string }>;
  entryBarriers: string[];
  opportunities: string[];
  risks: string[];
  goToMarketSuggestions: string[];
  analystVerdict: string;
};

export default function AIMarketResearch() {
  const { t, lang } = useLanguage();
  const { snapshot } = useStartup();
  const [form, setForm] = useState({
    companyName: '',
    sector: '',
    targetMarket: '',
    productDescription: '',
    geography: '',
  });

  // Auto-populate from startup profile when it loads
  useEffect(() => {
    if (snapshot.companyName) {
      setForm(prev => ({
        companyName: prev.companyName || snapshot.companyName,
        sector: prev.sector || snapshot.sector || '',
        targetMarket: prev.targetMarket || snapshot.targetCustomer || '',
        productDescription: prev.productDescription || snapshot.solution || snapshot.description || '',
        geography: prev.geography || snapshot.country || '',
      }));
    }
  }, [snapshot.companyName]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('marketSize');

  const mutation = trpc.ai.marketResearch.useMutation({
    onSuccess: (data) => {
      setResult(data as ResearchResult);
      toast.success('Market research report generated!');
    },
    onError: (err) => {
      toast.error('Failed to generate report: ' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.sector || !form.targetMarket || !form.productDescription) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate({ ...form, language: lang === 'ar' ? 'arabic' : 'english' });
  };

  const impactColor = (impact: string) => {
    if (impact === 'High') return 'bg-red-100 text-red-700 border-red-200';
    if (impact === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-border bg-background">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 lg:p-6 max-w-4xl mx-auto w-full">
      <ToolGuide
        toolName='AI Market Research'
        tagline='Generate market research reports — topic pre-filled from your company name.'
        steps={[
          { step: 1, title: 'Review topic', description: 'The research topic is pre-filled based on your company name from the Startup Profile.' },
          { step: 2, title: 'Refine the query', description: 'Edit the topic to focus on a specific market segment or geography.' },
          { step: 3, title: 'Generate report', description: 'AI produces a market size, trends, and competitive landscape analysis.' },
          { step: 4, title: 'Export findings', description: 'Copy the report to include in your pitch deck or data room.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'pre-fills the research topic with your company name and market context' },
        ]}
        tip='Use the research output to validate your TAM/SAM/SOM numbers in your pitch deck.'
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Search className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              AI Market Research
            </h1>
            <p className="text-xs text-muted-foreground">Comprehensive market analysis powered by AI</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Company / Startup Name *</Label>
              <Input
                placeholder="e.g. TechVenture AI"
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Sector / Vertical *</Label>
              <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select sector…" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Target Market *</Label>
              <Input
                placeholder="e.g. SMBs in MENA, Enterprise HR teams"
                value={form.targetMarket}
                onChange={e => setForm(f => ({ ...f, targetMarket: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Geography / Region</Label>
              <Select value={form.geography} onValueChange={v => setForm(f => ({ ...f, geography: v }))}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select region…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Global">Global</SelectItem>
                  {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">Product / Service Description *</Label>
            <Textarea
              placeholder="Describe what your product does, who it's for, and the problem it solves…"
              value={form.productDescription}
              onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
              className="text-sm min-h-[100px] resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#FAF6EF' }}
          >
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Researching market… (30-60s)</>
            ) : (
              <><Search className="w-4 h-4 mr-2" /> Generate Market Research Report</>
            )}
          </Button>
        </form>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Reset button */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Market Research Report
              </h2>
              <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs">
                New Research
              </Button>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-xl border border-border" style={{ background: 'var(--primary)' }}>
              <p className="text-sm text-white/90 leading-relaxed">{result.executiveSummary}</p>
            </div>

            {/* Market Size */}
            <Section id="marketSize" title="Market Size" icon={BarChart3}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'TAM', value: result.marketSize.tam, color: '#C4614A' },
                  { label: 'SAM', value: result.marketSize.sam, color: '#2D4A6B' },
                  { label: 'SOM', value: result.marketSize.som, color: '#10B981' },
                  { label: 'Growth Rate', value: result.marketSize.growthRate, color: '#F59E0B' },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-lg border border-border text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-xs font-semibold text-foreground leading-tight">{m.value}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Key Trends */}
            <Section id="trends" title="Key Market Trends" icon={TrendingUp}>
              <div className="space-y-3">
                {result.keyTrends.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border h-fit mt-0.5 ${impactColor(t.impact)}`}>{t.impact}</span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t.trend}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Competitors */}
            <Section id="competitors" title="Competitive Landscape" icon={Globe}>
              <div className="space-y-3">
                {result.competitors.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{c.name}</span>
                      <Badge variant="outline" className="text-[10px]">{c.funding}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{c.description}</p>
                    <p className="text-xs text-amber-600"><span className="font-semibold">Weakness:</span> {c.weakness}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Customer Segments */}
            <Section id="segments" title="Customer Segments" icon={Users}>
              <div className="space-y-3">
                {result.customerSegments.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{s.segment}</span>
                      <span className="text-[10px] text-muted-foreground">{s.size}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">Pain:</span> {s.painPoint}</p>
                    <p className="text-xs text-green-600"><span className="font-medium">WTP:</span> {s.willingness}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Opportunities & Risks */}
            <Section id="oppsrisks" title="Opportunities & Risks" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Opportunities
                  </div>
                  <ul className="space-y-1.5">
                    {result.opportunities.map((o, i) => (
                      <li key={i} className="text-xs text-foreground flex gap-2">
                        <span className="text-green-500 shrink-0">→</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Risks
                  </div>
                  <ul className="space-y-1.5">
                    {result.risks.map((r, i) => (
                      <li key={i} className="text-xs text-foreground flex gap-2">
                        <span className="text-red-500 shrink-0">⚠</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* Go-to-Market */}
            <Section id="gtm" title="Go-to-Market Suggestions" icon={TrendingUp}>
              <ul className="space-y-2">
                {result.goToMarketSuggestions.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-foreground">
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Analyst Verdict */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <div className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Analyst Verdict
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">{result.analystVerdict}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
