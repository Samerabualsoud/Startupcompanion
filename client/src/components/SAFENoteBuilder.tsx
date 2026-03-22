/**
 * SAFE / Convertible Note Builder
 * Generates SAFE or convertible note term sheets with AI-powered document drafting
 */

import ToolGuide from '@/components/ToolGuide';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useStartup } from '@/contexts/StartupContext';
import { useCapTable } from '@/hooks/useCapTable';
import type { CapTableInstrument } from '@shared/equity';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, Copy, Check, Sparkles, Info, DollarSign, Percent, Calendar, Shield, Globe } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface SAFEInputs {
  instrumentType: 'safe' | 'convertible-note';
  investorName: string;
  companyName: string;
  investmentAmount: number;
  valuationCap: number;
  discountRate: number;
  // Convertible Note specific
  interestRate: number;
  maturityMonths: number;
  // SAFE specific
  safeType: 'pre-money' | 'post-money' | 'mfn';
  // Common
  proRataRights: boolean;
  mfnClause: boolean;
  governingLaw: string;
  closingDate: string;
}

const GOVERNING_LAW_OPTIONS = [
  { value: 'delaware', label: 'Delaware, USA' },
  { value: 'california', label: 'California, USA' },
  { value: 'adgm', label: 'ADGM, Abu Dhabi' },
  { value: 'difc', label: 'DIFC, Dubai' },
  { value: 'cayman', label: 'Cayman Islands' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'saudi', label: 'Saudi Arabia' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'jordan', label: 'Jordan' },
];

const DEFAULT_INPUTS: SAFEInputs = {
  instrumentType: 'safe',
  investorName: '',
  companyName: '',
  investmentAmount: 250000,
  valuationCap: 5000000,
  discountRate: 20,
  interestRate: 6,
  maturityMonths: 24,
  safeType: 'post-money',
  proRataRights: true,
  mfnClause: false,
  governingLaw: 'delaware',
  closingDate: new Date().toISOString().split('T')[0],
};

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export default function SAFENoteBuilder() {
  const { t, isRTL } = useLanguage();
  const { snapshot } = useStartup();
  const { state: capState, setInstruments } = useCapTable();
  const [inputs, setInputs] = useState<SAFEInputs>(DEFAULT_INPUTS);

  // Auto-fill company name from startup profile on first load
  useEffect(() => {
    if (snapshot.companyName && !inputs.companyName) {
      setInputs(prev => ({ ...prev, companyName: snapshot.companyName }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.companyName]);
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [docLanguage, setDocLanguage] = useState<'english' | 'arabic' | 'both'>('english');

  const generateMutation = trpc.ai.generateSAFENote.useMutation({
    onSuccess: (data) => {
      setGeneratedDoc(data.document);
      setActiveTab('preview');
      setIsGenerating(false);
      toast.success('Document generated successfully');
    },
    onError: (err) => {
      setIsGenerating(false);
      toast.error('Failed to generate document: ' + err.message);
    },
  });

  const handleGenerate = () => {
    if (!inputs.companyName || !inputs.investorName) {
      toast.error('Please fill in company name and investor name');
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({ inputs, language: docLanguage });
    // Automatically save instrument to ZestEquity cap table
    if (capState) {
      const existing = capState.instruments.find(
        i => i.investorName === inputs.investorName && i.investmentAmount === inputs.investmentAmount
      );
      if (!existing) {
        const instrument: CapTableInstrument = {
          id: `safe-${Date.now()}`,
          investorName: inputs.investorName,
          type: inputs.instrumentType === 'safe' ? 'safe' : 'convertible_note',
          investmentAmount: inputs.investmentAmount,
          currency: 'USD',
          valuationCap: inputs.valuationCap,
          discountRate: inputs.discountRate,
          interestRate: inputs.instrumentType === 'convertible-note' ? inputs.interestRate : 0,
          issueDate: inputs.closingDate || new Date().toISOString().split('T')[0],
          maturityMonths: inputs.instrumentType === 'convertible-note' ? inputs.maturityMonths : 0,
          qualifiedRoundThreshold: 0,
          conversionTrigger: 'qualified_round',
          status: 'active',
          color: '#10B981',
          notes: `Created via SAFE/Note Builder`,
        };
        setInstruments([...capState.instruments, instrument]);
        toast.info('Instrument added to ZestEquity Cap Table');
      }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inputs.instrumentType === 'safe' ? 'SAFE' : 'Convertible-Note'}-${inputs.companyName || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setField = <K extends keyof SAFEInputs>(key: K, value: SAFEInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // Computed metrics
  const conversionPrice = inputs.valuationCap > 0
    ? (inputs.valuationCap * (1 - inputs.discountRate / 100)) / inputs.valuationCap
    : 0;
  const ownershipAtCap = inputs.valuationCap > 0
    ? (inputs.investmentAmount / inputs.valuationCap) * 100
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              SAFE / Convertible Note Builder
            </h1>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a SAFE or convertible note term sheet with customizable terms — powered by AI.
          </p>
        </div>
      </div>

      {/* Instrument Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        {(['safe', 'convertible-note'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setField('instrumentType', type)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              inputs.instrumentType === type
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="font-semibold text-sm text-foreground mb-1">
              {type === 'safe' ? 'SAFE Agreement' : 'Convertible Note'}
            </div>
            <div className="text-xs text-muted-foreground">
              {type === 'safe'
                ? 'Simple Agreement for Future Equity — no interest, no maturity date'
                : 'Debt instrument that converts to equity — with interest and maturity'}
            </div>
          </button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'form' | 'preview')}>
        <TabsList>
          <TabsTrigger value="form">Configure Terms</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedDoc}>
            Generated Document {generatedDoc && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Parties */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Parties
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
      <ToolGuide
        toolName='SAFE Note Builder'
        tagline='Generate SAFE and convertible note agreements — automatically added to your cap table.'
        steps={[
          { step: 1, title: 'Set note type', description: 'Choose SAFE, Convertible Note, or OQAL. Company name is auto-filled from your Startup Profile.' },
          { step: 2, title: 'Enter terms', description: 'Set the investment amount, valuation cap, discount rate, and interest rate.' },
          { step: 3, title: 'Generate document', description: 'Click Generate to produce the legal agreement text.' },
          { step: 4, title: 'Save to cap table', description: 'Click "Add to Cap Table" to register the instrument in ZestEquity automatically.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'auto-fills company name and incorporation details' },
          { from: 'ZestEquity Cap Table', to: 'SAFE/note instruments are saved as cap table entries on generation' },
        ]}
        tip='SAFE notes convert to equity at the next priced round. The valuation cap protects investors from excessive dilution.'
      />

                    <Label>Company Name</Label>
                    <Input
                      placeholder="e.g. Acme Technologies Inc."
                      value={inputs.companyName}
                      onChange={e => setField('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Investor Name</Label>
                    <Input
                      placeholder="e.g. John Smith / XYZ Fund"
                      value={inputs.investorName}
                      onChange={e => setField('investorName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Closing Date</Label>
                    <Input
                      type="date"
                      value={inputs.closingDate}
                      onChange={e => setField('closingDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Governing Law</Label>
                    <Select value={inputs.governingLaw} onValueChange={v => setField('governingLaw', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOVERNING_LAW_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Terms */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Financial Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Investment Amount ($)</Label>
                    <Input
                      type="number"
                      min={1000}
                      value={inputs.investmentAmount}
                      onChange={e => setField('investmentAmount', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valuation Cap ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inputs.valuationCap}
                      onChange={e => setField('valuationCap', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount Rate (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={inputs.discountRate}
                      onChange={e => setField('discountRate', Number(e.target.value))}
                    />
                  </div>

                  {inputs.instrumentType === 'convertible-note' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Interest Rate (% per annum)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          value={inputs.interestRate}
                          onChange={e => setField('interestRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Maturity (months)</Label>
                        <Input
                          type="number"
                          min={6}
                          max={60}
                          value={inputs.maturityMonths}
                          onChange={e => setField('maturityMonths', Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  {inputs.instrumentType === 'safe' && (
                    <div className="space-y-1.5">
                      <Label>SAFE Type</Label>
                      <Select value={inputs.safeType} onValueChange={v => setField('safeType', v as SAFEInputs['safeType'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre-money">Pre-Money SAFE</SelectItem>
                          <SelectItem value="post-money">Post-Money SAFE (YC Standard)</SelectItem>
                          <SelectItem value="mfn">MFN SAFE (no cap/discount)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Investor Rights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Investor Rights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Pro-Rata Rights</div>
                      <div className="text-xs text-muted-foreground">Investor can maintain ownership % in future rounds</div>
                    </div>
                    <Switch
                      checked={inputs.proRataRights}
                      onCheckedChange={v => setField('proRataRights', v)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">MFN Clause</div>
                      <div className="text-xs text-muted-foreground">Most Favored Nation — investor gets best terms of future SAFEs</div>
                    </div>
                    <Switch
                      checked={inputs.mfnClause}
                      onCheckedChange={v => setField('mfnClause', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Term Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Instrument</span>
                      <Badge variant="outline" className="text-xs">
                        {inputs.instrumentType === 'safe' ? 'SAFE' : 'Conv. Note'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Investment</span>
                      <span className="font-semibold">{formatCurrency(inputs.investmentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valuation Cap</span>
                      <span className="font-semibold">{formatCurrency(inputs.valuationCap)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold">{inputs.discountRate}%</span>
                    </div>
                    {inputs.instrumentType === 'convertible-note' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Interest</span>
                          <span className="font-semibold">{inputs.interestRate}% p.a.</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Maturity</span>
                          <span className="font-semibold">{inputs.maturityMonths} months</span>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projected Ownership at Cap</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                      {ownershipAtCap.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      If company raises at the valuation cap
                    </div>
                  </div>

                  {inputs.instrumentType === 'convertible-note' && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interest at Maturity</div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(inputs.investmentAmount * (inputs.interestRate / 100) * (inputs.maturityMonths / 12))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatCurrency(inputs.investmentAmount + inputs.investmentAmount * (inputs.interestRate / 100) * (inputs.maturityMonths / 12))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${inputs.proRataRights ? 'bg-green-500' : 'bg-muted'}`} />
                      Pro-Rata Rights: {inputs.proRataRights ? 'Yes' : 'No'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${inputs.mfnClause ? 'bg-green-500' : 'bg-muted'}`} />
                      MFN Clause: {inputs.mfnClause ? 'Yes' : 'No'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Law: {GOVERNING_LAW_OPTIONS.find(o => o.value === inputs.governingLaw)?.label}
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Document Language</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['english', 'arabic', 'both'] as const).map((lang) => (
                        <button
                          key={lang}
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

                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || !inputs.companyName || !inputs.investorName}
                    style={{ background: 'var(--primary)' }}
                  >
                    {isGenerating ? (
                      <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Document</>
                    )}
                  </Button>

                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>This is a template only. Always have a qualified lawyer review before signing.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          {generatedDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30">
                    Document Ready
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {inputs.instrumentType === 'safe' ? 'SAFE Agreement' : 'Convertible Note'} — {inputs.companyName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1.5" /> Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('form')}>
                    Edit Terms
                  </Button>
                </div>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{generatedDoc}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
