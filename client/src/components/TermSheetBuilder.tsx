/**
 * Term Sheet Builder
 * Generates downloadable term sheets for SAFE, Convertible Note, and Priced Round
 */
import { useState } from 'react';
import { FileText, Download, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type InstrumentType = 'safe' | 'convertible-note' | 'priced-round';

interface SAFEFields {
  investmentAmount: string;
  valuationCap: string;
  discountRate: string;
  mfnClause: boolean;
  proRataRights: boolean;
}

interface ConvertibleNoteFields {
  principalAmount: string;
  interestRate: string;
  maturityMonths: string;
  valuationCap: string;
  discountRate: string;
  conversionTrigger: string;
}

interface PricedRoundFields {
  preMoneyValuation: string;
  investmentAmount: string;
  sharePrice: string;
  boardSeats: string;
  liquidationPreference: string;
  antiDilution: string;
  participatingPreferred: boolean;
  dividendRate: string;
  redemptionRights: boolean;
}

const STEPS = ['Instrument', 'Company Info', 'Deal Terms', 'Investor Rights', 'Review & Download'];

export default function TermSheetBuilder() {
  const { isRTL } = useLanguage();
  const { snapshot } = useStartup();


  const [step, setStep] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentType>('safe');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  // Company Info
  const [companyName, setCompanyName] = useState(snapshot.companyName || '');
  const [companyState, setCompanyState] = useState(snapshot.country || 'Delaware, USA');
  const [investorName, setInvestorName] = useState('');
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  // SAFE fields
  const [safeFields, setSafeFields] = useState<SAFEFields>({
    investmentAmount: '',
    valuationCap: '',
    discountRate: '20',
    mfnClause: true,
    proRataRights: false,
  });

  // Convertible Note fields
  const [noteFields, setNoteFields] = useState<ConvertibleNoteFields>({
    principalAmount: '',
    interestRate: '6',
    maturityMonths: '24',
    valuationCap: '',
    discountRate: '20',
    conversionTrigger: '1000000',
  });

  // Priced Round fields
  const [pricedFields, setPricedFields] = useState<PricedRoundFields>({
    preMoneyValuation: '',
    investmentAmount: '',
    sharePrice: '',
    boardSeats: '1',
    liquidationPreference: '1x',
    antiDilution: 'broad-based-weighted-average',
    participatingPreferred: false,
    dividendRate: '8',
    redemptionRights: false,
  });

  const generateTermSheetMutation = (trpc as any).termSheet.generate.useMutation({
    onSuccess: (data: { content: string }) => {
      setGeneratedContent(data.content);
      setGenerating(false);
      setStep(4);
    },
    onError: (err: { message: string }) => {
      setGenerating(false);
      toast.error('Generation failed: ' + err.message);
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    const payload = {
      instrument,
      companyName,
      companyState,
      investorName,
      closingDate,
      ...(instrument === 'safe' ? { safeFields } : {}),
      ...(instrument === 'convertible-note' ? { noteFields } : {}),
      ...(instrument === 'priced-round' ? { pricedFields } : {}),
    };
    generateTermSheetMutation.mutate(payload as any);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `term-sheet-${instrument}-${companyName.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Term sheet downloaded!');
  };

  const instrumentLabels: Record<InstrumentType, string> = {
    'safe': 'SAFE (Simple Agreement for Future Equity)',
    'convertible-note': 'Convertible Note',
    'priced-round': 'Priced Equity Round (Series A/B)',
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select the type of investment instrument for your term sheet.</p>
            <div className="grid gap-3">
              {(['safe', 'convertible-note', 'priced-round'] as InstrumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setInstrument(type)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${instrument === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{instrumentLabels[type]}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {type === 'safe' && 'No interest, no maturity date. Converts on next priced round.'}
                        {type === 'convertible-note' && 'Debt instrument with interest that converts to equity.'}
                        {type === 'priced-round' && 'Equity round with defined share price and investor rights.'}
                      </div>
                    </div>
                    {instrument === type && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Basic company and deal information.</p>
            <div className="grid gap-4">
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." className="mt-1" />
              </div>
              <div>
                <Label>State / Jurisdiction of Incorporation</Label>
                <Input value={companyState} onChange={e => setCompanyState(e.target.value)} placeholder="Delaware, USA" className="mt-1" />
              </div>
              <div>
                <Label>Investor / Lead Investor Name</Label>
                <Input value={investorName} onChange={e => setInvestorName(e.target.value)} placeholder="Sequoia Capital" className="mt-1" />
              </div>
              <div>
                <Label>Expected Closing Date</Label>
                <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Core financial terms for your {instrumentLabels[instrument]}.</p>
            {instrument === 'safe' && (
              <div className="grid gap-4">
                <div>
                  <Label>Investment Amount (USD)</Label>
                  <Input value={safeFields.investmentAmount} onChange={e => setSafeFields(f => ({ ...f, investmentAmount: e.target.value }))} placeholder="500,000" className="mt-1" />
                </div>
                <div>
                  <Label>Valuation Cap (USD) <span className="text-muted-foreground font-normal">— optional</span></Label>
                  <Input value={safeFields.valuationCap} onChange={e => setSafeFields(f => ({ ...f, valuationCap: e.target.value }))} placeholder="5,000,000" className="mt-1" />
                </div>
                <div>
                  <Label>Discount Rate (%)</Label>
                  <Input value={safeFields.discountRate} onChange={e => setSafeFields(f => ({ ...f, discountRate: e.target.value }))} placeholder="20" className="mt-1" />
                </div>
              </div>
            )}
            {instrument === 'convertible-note' && (
              <div className="grid gap-4">
                <div>
                  <Label>Principal Amount (USD)</Label>
                  <Input value={noteFields.principalAmount} onChange={e => setNoteFields(f => ({ ...f, principalAmount: e.target.value }))} placeholder="500,000" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Interest Rate (%/yr)</Label>
                    <Input value={noteFields.interestRate} onChange={e => setNoteFields(f => ({ ...f, interestRate: e.target.value }))} placeholder="6" className="mt-1" />
                  </div>
                  <div>
                    <Label>Maturity (months)</Label>
                    <Input value={noteFields.maturityMonths} onChange={e => setNoteFields(f => ({ ...f, maturityMonths: e.target.value }))} placeholder="24" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Valuation Cap (USD)</Label>
                  <Input value={noteFields.valuationCap} onChange={e => setNoteFields(f => ({ ...f, valuationCap: e.target.value }))} placeholder="5,000,000" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Discount Rate (%)</Label>
                    <Input value={noteFields.discountRate} onChange={e => setNoteFields(f => ({ ...f, discountRate: e.target.value }))} placeholder="20" className="mt-1" />
                  </div>
                  <div>
                    <Label>Conversion Trigger ($)</Label>
                    <Input value={noteFields.conversionTrigger} onChange={e => setNoteFields(f => ({ ...f, conversionTrigger: e.target.value }))} placeholder="1,000,000" className="mt-1" />
                  </div>
                </div>
              </div>
            )}
            {instrument === 'priced-round' && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pre-Money Valuation ($)</Label>
                    <Input value={pricedFields.preMoneyValuation} onChange={e => setPricedFields(f => ({ ...f, preMoneyValuation: e.target.value }))} placeholder="10,000,000" className="mt-1" />
                  </div>
                  <div>
                    <Label>Investment Amount ($)</Label>
                    <Input value={pricedFields.investmentAmount} onChange={e => setPricedFields(f => ({ ...f, investmentAmount: e.target.value }))} placeholder="2,000,000" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Share Price (USD)</Label>
                  <Input value={pricedFields.sharePrice} onChange={e => setPricedFields(f => ({ ...f, sharePrice: e.target.value }))} placeholder="1.00" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Liquidation Preference</Label>
                    <Select value={pricedFields.liquidationPreference} onValueChange={v => setPricedFields(f => ({ ...f, liquidationPreference: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1x">1x Non-Participating</SelectItem>
                        <SelectItem value="1x-participating">1x Participating</SelectItem>
                        <SelectItem value="2x">2x Non-Participating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Anti-Dilution</Label>
                    <Select value={pricedFields.antiDilution} onValueChange={v => setPricedFields(f => ({ ...f, antiDilution: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broad-based-weighted-average">Broad-Based WA</SelectItem>
                        <SelectItem value="narrow-based-weighted-average">Narrow-Based WA</SelectItem>
                        <SelectItem value="full-ratchet">Full Ratchet</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Investor rights and governance provisions.</p>
            {instrument === 'safe' && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={safeFields.mfnClause} onChange={e => setSafeFields(f => ({ ...f, mfnClause: e.target.checked }))} className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">Most Favored Nation (MFN) Clause</div>
                    <div className="text-xs text-muted-foreground">Investor gets same terms as future SAFE investors.</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={safeFields.proRataRights} onChange={e => setSafeFields(f => ({ ...f, proRataRights: e.target.checked }))} className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">Pro-Rata Rights</div>
                    <div className="text-xs text-muted-foreground">Investor can maintain ownership % in future rounds.</div>
                  </div>
                </label>
              </div>
            )}
            {instrument === 'convertible-note' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <div className="font-medium mb-1">Standard Convertible Note Rights</div>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Automatic conversion on qualified financing</li>
                    <li>• Optional conversion at maturity</li>
                    <li>• Change of control provision (1× return)</li>
                    <li>• Information rights (annual financials)</li>
                  </ul>
                </div>
              </div>
            )}
            {instrument === 'priced-round' && (
              <div className="space-y-3">
                <div>
                  <Label>Board Seats</Label>
                  <Select value={pricedFields.boardSeats} onValueChange={v => setPricedFields(f => ({ ...f, boardSeats: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Board Seat</SelectItem>
                      <SelectItem value="1">1 Board Seat</SelectItem>
                      <SelectItem value="2">2 Board Seats</SelectItem>
                      <SelectItem value="observer">Observer Rights Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dividend Rate (%)</Label>
                  <Input value={pricedFields.dividendRate} onChange={e => setPricedFields(f => ({ ...f, dividendRate: e.target.value }))} placeholder="8" className="mt-1" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={pricedFields.redemptionRights} onChange={e => setPricedFields(f => ({ ...f, redemptionRights: e.target.checked }))} className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">Redemption Rights</div>
                    <div className="text-xs text-muted-foreground">Investor can request redemption after 5 years.</div>
                  </div>
                </label>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {generatedContent ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium text-sm">Term sheet generated successfully</span>
                </div>
                <div className="bg-muted rounded-xl p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{generatedContent}</pre>
                </div>
                <Button onClick={handleDownload} className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download Term Sheet (.txt)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This term sheet is for informational purposes only and does not constitute legal advice. Please consult a qualified attorney before use.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-muted-foreground">Generating your term sheet with AI…</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (step === 1) return companyName.trim().length > 0 && investorName.trim().length > 0;
    if (step === 2) {
      if (instrument === 'safe') return safeFields.investmentAmount.trim().length > 0;
      if (instrument === 'convertible-note') return noteFields.principalAmount.trim().length > 0;
      if (instrument === 'priced-round') return pricedFields.preMoneyValuation.trim().length > 0 && pricedFields.investmentAmount.trim().length > 0;
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Term Sheet Builder</h1>
          <p className="text-sm text-muted-foreground">Generate professional term sheets for SAFE, convertible notes, and priced rounds</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              i === step ? 'bg-primary text-primary-foreground' :
              i < step ? 'bg-green-100 text-green-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{STEPS[step]}</CardTitle>
          {step === 0 && <CardDescription>Choose the investment structure</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Term Sheet
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs">
          <strong>Legal Disclaimer:</strong> This tool generates template term sheets for educational and drafting purposes only. Always review with a qualified attorney before signing or distributing any legal documents.
        </p>
      </div>
    </div>
  );
}
