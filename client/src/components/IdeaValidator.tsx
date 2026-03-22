/**
 * AI Startup Idea Validator
 * AI-powered assessment of startup ideas: market size, competition, moat, risks
 */
import ToolGuide from '@/components/ToolGuide';
import { useState, useEffect } from 'react';
import { useStartup } from '@/contexts/StartupContext';
import { Sparkles, Target, TrendingUp, Shield, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ValidationResult {
  overallScore: number;
  verdict: string;
  marketSize: { score: number; assessment: string; estimatedTAM: string };
  problemClarity: { score: number; assessment: string; isPainfulEnough: boolean };
  competitiveLandscape: { score: number; assessment: string; mainCompetitors: string[]; differentiationStrength: string };
  moat: { score: number; assessment: string; moatTypes: string[] };
  revenueModel: { score: number; assessment: string; viability: string };
  executionRisk: { score: number; assessment: string; keyRisks: string[] };
  timingAndTrends: { score: number; assessment: string; tailwinds: string[]; headwinds: string[] };
  recommendations: { topStrengths: string[]; criticalWeaknesses: string[]; nextSteps: string[]; pivotSuggestions: string[] };
  investorPerspective: string;
  summary: string;
}

const VERDICT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Strong Idea': { color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
  'Promising': { color: '#0EA5E9', bg: '#F0F9FF', icon: TrendingUp },
  'Needs Work': { color: '#F59E0B', bg: '#FFFBEB', icon: AlertTriangle },
  'Risky': { color: '#EF4444', bg: '#FEF2F2', icon: AlertTriangle },
  'Not Viable': { color: '#6B7280', bg: '#F9FAFB', icon: XCircle },
};

function ScoreBar({ score, label, color = '#2D4A6B' }: { score: number; label: string; color?: string }) {
  return (
    <div className="space-y-1">
      <ToolGuide
        toolName='Idea Validator'
        tagline='Validate your startup idea — problem, solution, and stage auto-filled from your profile.'
        steps={[
          { step: 1, title: 'Review pre-filled data', description: 'Problem, solution, revenue model, and stage are loaded from your Startup Profile.' },
          { step: 2, title: 'Add missing details', description: "Fill in any fields that weren't auto-populated." },
          { step: 3, title: 'Run validation', description: 'AI scores your idea across 8 dimensions: market size, competition, feasibility, etc.' },
          { step: 4, title: 'Act on feedback', description: 'Use the detailed feedback to refine your value proposition.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'auto-fills problem statement, solution, revenue model, geography, and stage' },
        ]}
        tip='Run the validator at different stages to track how your idea has evolved and strengthened.'
      />

      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export default function IdeaValidator() {
  const { isRTL, lang: language } = useLanguage();
  const { snapshot } = useStartup();
  const [result, setResult] = useState<ValidationResult | null>(null);

  const [ideaTitle, setIdeaTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [solution, setSolution] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [geography, setGeography] = useState('MENA');
  const [stage, setStage] = useState('idea');

  // Auto-fill from startup profile
  useEffect(() => {
    if (snapshot.companyName && !ideaTitle) setIdeaTitle(snapshot.companyName);
    if (snapshot.problem && !problemStatement) setProblemStatement(snapshot.problem);
    if (snapshot.solution && !solution) setSolution(snapshot.solution);
    if (snapshot.businessModel && !revenueModel) setRevenueModel(snapshot.businessModel);
    if (snapshot.incorporationCountry) setGeography(snapshot.incorporationCountry);
    if (snapshot.stage && snapshot.stage !== 'idea') setStage(snapshot.stage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.companyName, snapshot.problem, snapshot.solution, snapshot.businessModel, snapshot.incorporationCountry, snapshot.stage]);

  const validateMutation = (trpc as any).ideaValidator.validate.useMutation({
    onSuccess: (data: ValidationResult) => {
      setResult(data);
    },
    onError: (err: { message: string }) => {
      toast.error('Validation failed: ' + err.message);
    },
  });

  const handleValidate = () => {
    if (!ideaTitle.trim() || !problemStatement.trim() || !targetMarket.trim() || !solution.trim() || !revenueModel.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    validateMutation.mutate({ ideaTitle, problemStatement, targetMarket, solution, revenueModel, geography, stage, language: language });
  };

  const handleReset = () => {
    setResult(null);
    setIdeaTitle('');
    setProblemStatement('');
    setTargetMarket('');
    setSolution('');
    setRevenueModel('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#059669';
    if (score >= 6) return '#0EA5E9';
    if (score >= 4) return '#F59E0B';
    return '#EF4444';
  };

  const overallColor = result
    ? result.overallScore >= 75 ? '#059669'
    : result.overallScore >= 55 ? '#0EA5E9'
    : result.overallScore >= 35 ? '#F59E0B'
    : '#EF4444'
    : '#2D4A6B';

  if (result) {
    const verdictCfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['Needs Work'];
    const VerdictIcon = verdictCfg.icon;

    return (
      <div className="max-w-3xl mx-auto space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EC4899' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Idea Validation Report</h1>
              <p className="text-sm text-muted-foreground">{ideaTitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Validate Another Idea
          </Button>
        </div>

        {/* Overall Score */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Score Circle */}
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={overallColor} strokeWidth="8"
                    strokeDasharray={`${result.overallScore * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: overallColor }}>{result.overallScore}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: verdictCfg.bg, color: verdictCfg.color }}>
                    <VerdictIcon className="w-4 h-4" />
                    {result.verdict}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dimension Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreBar score={result.marketSize.score} label="Market Size" color={getScoreColor(result.marketSize.score)} />
            <ScoreBar score={result.problemClarity.score} label="Problem Clarity" color={getScoreColor(result.problemClarity.score)} />
            <ScoreBar score={result.competitiveLandscape.score} label="Competitive Differentiation" color={getScoreColor(result.competitiveLandscape.score)} />
            <ScoreBar score={result.moat.score} label="Defensible Moat" color={getScoreColor(result.moat.score)} />
            <ScoreBar score={result.revenueModel.score} label="Revenue Model" color={getScoreColor(result.revenueModel.score)} />
            <ScoreBar score={result.executionRisk.score} label="Execution Feasibility" color={getScoreColor(result.executionRisk.score)} />
            <ScoreBar score={result.timingAndTrends.score} label="Market Timing" color={getScoreColor(result.timingAndTrends.score)} />
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <CollapsibleSection title={`Market Size — TAM: ${result.marketSize.estimatedTAM}`} icon={TrendingUp} defaultOpen>
          <p className="text-sm text-muted-foreground">{result.marketSize.assessment}</p>
        </CollapsibleSection>

        <CollapsibleSection title="Competitive Landscape" icon={Target} defaultOpen>
          <p className="text-sm text-muted-foreground mb-3">{result.competitiveLandscape.assessment}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {result.competitiveLandscape.mainCompetitors.map(c => (
              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Differentiation strength: <strong className="text-foreground">{result.competitiveLandscape.differentiationStrength}</strong>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Defensible Moat" icon={Shield}>
          <p className="text-sm text-muted-foreground mb-3">{result.moat.assessment}</p>
          <div className="flex flex-wrap gap-2">
            {result.moat.moatTypes.map(m => (
              <Badge key={m} className="text-xs bg-primary/10 text-primary border-0">{m}</Badge>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Execution Risks" icon={AlertTriangle}>
          <p className="text-sm text-muted-foreground mb-3">{result.executionRisk.assessment}</p>
          <ul className="space-y-1">
            {result.executionRisk.keyRisks.map(r => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="Market Timing & Trends" icon={Sparkles}>
          <p className="text-sm text-muted-foreground mb-3">{result.timingAndTrends.assessment}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Tailwinds</div>
              <ul className="space-y-1">
                {result.timingAndTrends.tailwinds.map(t => (
                  <li key={t} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Headwinds</div>
              <ul className="space-y-1">
                {result.timingAndTrends.headwinds.map(h => (
                  <li key={h} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">Top Strengths</div>
              <ul className="space-y-1.5">
                {result.recommendations.topStrengths.map(s => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">Critical Weaknesses</div>
              <ul className="space-y-1.5">
                {result.recommendations.criticalWeaknesses.map(w => (
                  <li key={w} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-primary mb-2">Next Steps</div>
              <ol className="space-y-1.5">
                {result.recommendations.nextSteps.map((s, i) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            {result.recommendations.pivotSuggestions.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">Pivot Suggestions</div>
                <ul className="space-y-1.5">
                  {result.recommendations.pivotSuggestions.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <RotateCcw className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investor Perspective */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-semibold text-primary mb-1">Investor Perspective</div>
            <p className="text-sm text-foreground italic">"{result.investorPerspective}"</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EC4899' }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Startup Idea Validator</h1>
          <p className="text-sm text-muted-foreground">Get an AI-powered assessment of your startup idea across 7 dimensions</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div>
            <Label>Idea Title *</Label>
            <Input
              value={ideaTitle}
              onChange={e => setIdeaTitle(e.target.value)}
              placeholder="e.g. AI-powered supply chain for MENA SMEs"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Problem Statement * <span className="text-muted-foreground font-normal text-xs">(What pain are you solving?)</span></Label>
            <Textarea
              value={problemStatement}
              onChange={e => setProblemStatement(e.target.value)}
              placeholder="Describe the specific problem your startup solves and who experiences it..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label>Target Market * <span className="text-muted-foreground font-normal text-xs">(Who are your customers?)</span></Label>
            <Input
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              placeholder="e.g. SME owners in Saudi Arabia and UAE, aged 30-50"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Your Solution * <span className="text-muted-foreground font-normal text-xs">(How do you solve it?)</span></Label>
            <Textarea
              value={solution}
              onChange={e => setSolution(e.target.value)}
              placeholder="Describe your product or service and how it addresses the problem..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label>Revenue Model * <span className="text-muted-foreground font-normal text-xs">(How do you make money?)</span></Label>
            <Input
              value={revenueModel}
              onChange={e => setRevenueModel(e.target.value)}
              placeholder="e.g. SaaS subscription $99/month, transaction fee 2%"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Geography</Label>
              <Select value={geography} onValueChange={setGeography}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENA">MENA</SelectItem>
                  <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                  <SelectItem value="UAE">UAE</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Global">Global</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="LatAm">Latin America</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea Stage</SelectItem>
                  <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series-a">Series A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full gap-2 h-12 text-base"
        onClick={handleValidate}
        disabled={validateMutation.isPending}
      >
        {validateMutation.isPending ? (
          <>
            <Sparkles className="w-5 h-5 animate-spin" />
            Analyzing your idea…
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Validate My Startup Idea
          </>
        )}
      </Button>

      {/* What you'll get */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">WHAT YOU'LL GET</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Overall viability score (0-100)',
              'Market size & TAM estimate',
              'Competitive landscape analysis',
              'Defensible moat assessment',
              'Revenue model viability',
              'Execution risk breakdown',
              'Market timing & trends',
              'Actionable next steps',
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
