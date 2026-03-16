/**
 * NDA Generator
 * Generates mutual or one-way NDAs with jurisdiction selection and AI drafting
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Copy, Check, Sparkles, Info, Shield, Users, Clock, Globe } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface NDAInputs {
  ndaType: 'mutual' | 'one-way';
  disclosingParty: string;
  receivingParty: string;
  purpose: string;
  confidentialityPeriodYears: number;
  governingLaw: string;
  effectiveDate: string;
  includeNonSolicit: boolean;
  includeNonCompete: boolean;
}

const GOVERNING_LAW_OPTIONS = [
  { value: 'delaware', label: 'Delaware, USA' },
  { value: 'california', label: 'California, USA' },
  { value: 'new-york', label: 'New York, USA' },
  { value: 'adgm', label: 'ADGM, Abu Dhabi' },
  { value: 'difc', label: 'DIFC, Dubai' },
  { value: 'uae', label: 'UAE (Federal)' },
  { value: 'saudi', label: 'Saudi Arabia' },
  { value: 'cayman', label: 'Cayman Islands' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'jordan', label: 'Jordan' },
  { value: 'uk', label: 'England & Wales' },
];

const DEFAULT_INPUTS: NDAInputs = {
  ndaType: 'mutual',
  disclosingParty: '',
  receivingParty: '',
  purpose: '',
  confidentialityPeriodYears: 3,
  governingLaw: 'delaware',
  effectiveDate: new Date().toISOString().split('T')[0],
  includeNonSolicit: false,
  includeNonCompete: false,
};

export default function NDAGenerator() {
  const { t, isRTL } = useLanguage();
  const [inputs, setInputs] = useState<NDAInputs>(DEFAULT_INPUTS);
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [docLanguage, setDocLanguage] = useState<'english' | 'arabic' | 'both'>('english');

  const generateMutation = trpc.ai.generateNDA.useMutation({
    onSuccess: (data: { document: string }) => {
      setGeneratedDoc(data.document);
      setActiveTab('preview');
      setIsGenerating(false);
      toast.success('NDA generated successfully');
    },
    onError: (err: { message: string }) => {
      setIsGenerating(false);
      toast.error('Failed to generate NDA: ' + err.message);
    },
  });

  const handleGenerate = () => {
    if (!inputs.disclosingParty || !inputs.receivingParty || !inputs.purpose) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({ ...inputs, language: docLanguage });
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
    a.download = `NDA-${inputs.disclosingParty || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setField = <K extends keyof NDAInputs>(key: K, value: NDAInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              NDA Generator
            </h1>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a professional Non-Disclosure Agreement — mutual or one-way — with your choice of jurisdiction.
          </p>
        </div>
      </div>

      {/* NDA Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        {(['mutual', 'one-way'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setField('ndaType', type)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              inputs.ndaType === type
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="font-semibold text-sm text-foreground mb-1">
              {type === 'mutual' ? 'Mutual NDA' : 'One-Way NDA'}
            </div>
            <div className="text-xs text-muted-foreground">
              {type === 'mutual'
                ? 'Both parties share confidential information — common for partnerships and co-founder discussions'
                : 'Only one party shares information — common for investor pitches and vendor evaluations'}
            </div>
          </button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'form' | 'preview')}>
        <TabsList>
          <TabsTrigger value="form">Configure NDA</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedDoc}>
            Generated NDA {generatedDoc && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
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
                    <Users className="w-4 h-4" /> Parties
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>
                      {inputs.ndaType === 'mutual' ? 'Party A' : 'Disclosing Party'} *
                    </Label>
                    <Input
                      placeholder="Full legal name or company name"
                      value={inputs.disclosingParty}
                      onChange={e => setField('disclosingParty', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      {inputs.ndaType === 'mutual' ? 'Party B' : 'Receiving Party'} *
                    </Label>
                    <Input
                      placeholder="Full legal name or company name"
                      value={inputs.receivingParty}
                      onChange={e => setField('receivingParty', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Purpose & Terms */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Purpose & Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Purpose of Disclosure *</Label>
                    <Textarea
                      placeholder="e.g. Evaluating a potential business partnership / investment opportunity / vendor relationship"
                      value={inputs.purpose}
                      onChange={e => setField('purpose', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Effective Date</Label>
                      <Input
                        type="date"
                        value={inputs.effectiveDate}
                        onChange={e => setField('effectiveDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confidentiality Period (years)</Label>
                      <Select
                        value={String(inputs.confidentialityPeriodYears)}
                        onValueChange={v => setField('confidentialityPeriodYears', Number(v))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 7, 10].map(y => (
                            <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </div>
                </CardContent>
              </Card>

              {/* Additional Clauses */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Additional Clauses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Non-Solicitation Clause</div>
                      <div className="text-xs text-muted-foreground">Prevents parties from poaching each other's employees</div>
                    </div>
                    <Switch
                      checked={inputs.includeNonSolicit}
                      onCheckedChange={v => setField('includeNonSolicit', v)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Non-Compete Clause</div>
                      <div className="text-xs text-muted-foreground">Restricts parties from competing directly (limited scope)</div>
                    </div>
                    <Switch
                      checked={inputs.includeNonCompete}
                      onCheckedChange={v => setField('includeNonCompete', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">NDA Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline" className="text-xs capitalize">{inputs.ndaType}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">{inputs.confidentialityPeriodYears} years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Law</span>
                      <span className="font-semibold text-xs">
                        {GOVERNING_LAW_OPTIONS.find(o => o.value === inputs.governingLaw)?.label}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${inputs.includeNonSolicit ? 'bg-green-500' : 'bg-muted'}`} />
                      Non-Solicitation: {inputs.includeNonSolicit ? 'Included' : 'Not included'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${inputs.includeNonCompete ? 'bg-green-500' : 'bg-muted'}`} />
                      Non-Compete: {inputs.includeNonCompete ? 'Included' : 'Not included'}
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
                    disabled={isGenerating || !inputs.disclosingParty || !inputs.receivingParty || !inputs.purpose}
                    style={{ background: 'oklch(0.18 0.05 240)' }}
                  >
                    {isGenerating ? (
                      <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate NDA</>
                    )}
                  </Button>

                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>Template only. Have a qualified lawyer review before signing.</span>
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
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    NDA Ready
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">
                    {inputs.ndaType} NDA — {inputs.disclosingParty}
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
                    Edit
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
