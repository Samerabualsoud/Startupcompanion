/**
 * AI Term Sheet Negotiation Advisor
 * Identifies founder-unfriendly terms and provides counter-proposals
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useStartup } from '@/contexts/StartupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { FUNDING_STAGES } from '@shared/dropdowns';

export default function TermNegotiationAdvisor() {
  const { snapshot } = useStartup();
  const { isRTL, lang } = useLanguage();
  const [termSheetText, setTermSheetText] = useState('');
  const [stage, setStage] = useState('');
  const [raiseAmount, setRaiseAmount] = useState('');
  const [preMoneyVal, setPreMoneyVal] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const mutation = trpc.ai.termNegotiationAdvisor.useMutation({
    onSuccess: (data) => { setResult(data); toast.success(isRTL ? 'تم تحليل صحيفة الشروط!' : 'Term sheet analyzed!'); },
    onError: (err) => { toast.error('Failed: ' + err.message); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termSheetText.trim() || termSheetText.length < 50) { toast.error(isRTL ? 'يرجى الصق محتوى صحيفة الشروط' : 'Please paste the term sheet content'); return; }
    mutation.mutate({
      companyName: snapshot.companyName || 'My Startup',
      stage: stage || 'seed',
      termSheetText,
      raiseAmount: parseFloat(raiseAmount) * 1e6 || 1e6,
      preMoneyValuation: parseFloat(preMoneyVal) * 1e6 || 5e6,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const fairnessColors: Record<string, { color: string; bg: string }> = {
    'founder-friendly': { color: '#059669', bg: '#ECFDF5' },
    'balanced':         { color: '#2563EB', bg: '#EFF6FF' },
    'investor-friendly':{ color: '#D97706', bg: '#FFFBEB' },
    'very-investor-friendly':{ color: '#DC2626', bg: '#FEF2F2' },
  };
  const severityColor: Record<string, string> = { High: '#DC2626', Medium: '#D97706', Low: '#6B7280' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
            {isRTL ? 'مستشار التفاوض على صحيفة الشروط' : 'Term Sheet Negotiation Advisor'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            {isRTL ? 'الصق صحيفة الشروط وسيحدد الذكاء الاصطناعي البنود غير الملائمة للمؤسس ويقدم مقترحات مضادة.' : 'Paste your term sheet and AI identifies founder-unfriendly terms with specific counter-proposals and negotiation tactics.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '380px 1fr' : '500px', gap: 20, justifyContent: result ? '' : 'center' }}>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader><CardTitle style={{ fontSize: 14 }}>{isRTL ? 'صحيفة الشروط' : 'Term sheet details'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label style={{ fontSize: 11 }}>{isRTL ? 'المرحلة' : 'Stage'}</Label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{FUNDING_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ fontSize: 11 }}>{isRTL ? 'مبلغ الجولة ($M)' : 'Raise amount ($M)'}</Label>
                    <Input type="number" value={raiseAmount} onChange={e => setRaiseAmount(e.target.value)} placeholder="e.g. 2" style={{ fontSize: 12 }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label style={{ fontSize: 11 }}>{isRTL ? 'التقييم قبل الاستثمار ($M)' : 'Pre-money valuation ($M)'}</Label>
                  <Input type="number" value={preMoneyVal} onChange={e => setPreMoneyVal(e.target.value)} placeholder="e.g. 10" style={{ fontSize: 12 }} />
                </div>
                <div className="space-y-1.5">
                  <Label style={{ fontSize: 11 }}>{isRTL ? 'محتوى صحيفة الشروط' : 'Term sheet content'}</Label>
                  <Textarea value={termSheetText} onChange={e => setTermSheetText(e.target.value)}
                    placeholder={isRTL ? 'الصق نص صحيفة الشروط هنا — شروط التصفية، حقوق التصويت، بنود الحماية...' : 'Paste term sheet text — liquidation preferences, voting rights, protective provisions, anti-dilution, board seats...'}
                    style={{ minHeight: 200, fontSize: 11, lineHeight: 1.6 }} />
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', textAlign: 'right' }}>{termSheetText.length}/6000</div>
                </div>
                <Button type="submit" disabled={mutation.isPending || !termSheetText.trim()} className="w-full gap-2">
                  {mutation.isPending ? <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />{isRTL ? 'جارٍ التحليل...' : 'Analyzing...'}</> : <><Sparkles className="w-3.5 h-3.5" />{isRTL ? 'تحليل صحيفة الشروط' : 'Analyze term sheet'}</>}
                </Button>
                {result && <Button type="button" variant="ghost" size="sm" className="w-full gap-1" onClick={() => setResult(null)}><RotateCcw size={12} />{isRTL ? 'تحليل جديد' : 'New analysis'}</Button>}
              </CardContent>
            </Card>
          </form>

          {result && (
            <div className="space-y-4">
              {/* Fairness overview */}
              <Card>
                <CardContent style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{isRTL ? 'عدالة الشروط' : 'Overall fairness'}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: fairnessColors[result.overallFairness]?.bg || '#F3F4F6', color: fairnessColors[result.overallFairness]?.color || '#6B7280', display: 'inline-block' }}>{result.overallFairness}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{isRTL ? 'تخفيف ملكية المؤسس' : 'Founder dilution'}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{result.dilutionAnalysis.totalDilution.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{isRTL ? 'ملكية المؤسس بعد' : 'Post-investment ownership'}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{result.dilutionAnalysis.founderOwnership.toFixed(1)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Red flags */}
              {result.redFlags.length > 0 && (
                <Card>
                  <CardHeader><CardTitle style={{ fontSize: 13, color: '#DC2626' }}>🚩 {isRTL ? 'العلامات الحمراء' : 'Red flags'} ({result.redFlags.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.redFlags.map((flag: any, i: number) => (
                        <div key={i} style={{ border: `1px solid ${severityColor[flag.severity]}30`, borderRadius: 8, padding: '10px 12px', background: severityColor[flag.severity] === '#DC2626' ? '#FEF2F2' : severityColor[flag.severity] === '#D97706' ? '#FFFBEB' : '#F9FAFB' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: severityColor[flag.severity] }}>{flag.term}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: severityColor[flag.severity] + '20', color: severityColor[flag.severity] }}>{flag.severity}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>{flag.issue}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>{isRTL ? 'المعيار السوقي: ' : 'Market standard: '}{flag.marketStandard}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Negotiable terms */}
              <Card>
                <CardHeader><CardTitle style={{ fontSize: 13 }}>💬 {isRTL ? 'البنود القابلة للتفاوض' : 'Negotiable terms'}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.negotiableTerms.map((term: any, i: number) => (
                      <div key={i} style={{ border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', background: '#FFFBEB', fontSize: 12, fontWeight: 700, color: '#92400E' }}>{term.term}</div>
                        <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div><div style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', marginBottom: 2 }}>{isRTL ? 'الوضع الحالي' : 'Current'}</div><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{term.currentPosition}</div></div>
                          <div><div style={{ fontSize: 9, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 2 }}>{isRTL ? 'المقترح المضاد' : 'Counter-proposal'}</div><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{term.counterProposal}</div></div>
                        </div>
                        <div style={{ padding: '6px 12px', background: '#EFF6FF', fontSize: 11, color: '#1D4ED8' }}>🎯 {isRTL ? 'التكتيك: ' : 'Tactic: '}{term.tactic}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strategy */}
              <Card>
                <CardHeader><CardTitle style={{ fontSize: 13 }}>🧭 {isRTL ? 'استراتيجية التفاوض' : 'Negotiation strategy'}</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.7, padding: '10px 12px', background: 'var(--secondary)', borderRadius: 8, marginBottom: 10 }}>{result.negotiationStrategy}</div>
                  {result.walkAwayConditions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>🚫 {isRTL ? 'الشروط التي توجب الانسحاب' : 'Walk-away conditions'}</div>
                      {result.walkAwayConditions.map((c: string, i: number) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>• {c}</div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
