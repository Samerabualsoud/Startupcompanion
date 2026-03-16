/**
 * FeasibilityEvaluator — AI-powered startup idea evaluation tool
 * Users describe their idea in plain language; AI scores it across 8 dimensions
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import {
  Sparkles, Target, TrendingUp, DollarSign, Shield, Zap, Clock, Layers,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, RotateCcw,
  Lightbulb, ArrowRight, Star, AlertCircle, Info
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  target: Target,
  'trending-up': TrendingUp,
  sparkles: Sparkles,
  'dollar-sign': DollarSign,
  shield: Shield,
  zap: Zap,
  clock: Clock,
  layers: Layers,
};

const SEVERITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
};

const PRIORITY_COLORS: Record<string, string> = {
  Immediate: '#C4614A',
  'Short-term': '#F59E0B',
  'Long-term': '#2D4A6B',
};

const VERDICT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Strong Opportunity': { color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  'Promising Concept': { color: '#2D4A6B', bg: '#DBEAFE', icon: Star },
  'Needs Refinement': { color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle },
  'High Risk': { color: '#EF4444', bg: '#FEE2E2', icon: AlertTriangle },
  'Not Viable': { color: '#6B7280', bg: '#F3F4F6', icon: AlertTriangle },
};

const OUTCOME_COLORS: Record<string, string> = {
  success: '#10B981',
  failed: '#EF4444',
  acquired: '#6366F1',
};

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle" fill={color}
        fontSize={size > 60 ? 18 : 13}
        fontWeight="bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function DimensionCard({ dim, index }: { dim: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[dim.icon] ?? Target;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: dim.color + '18' }}>
          <Icon className="w-4.5 h-4.5" style={{ color: dim.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{dim.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground">weight {dim.weight}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dim.score * 10}%` }}
              transition={{ delay: index * 0.06 + 0.3, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: dim.color }}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: dim.color }}>{dim.score}<span className="text-xs text-muted-foreground">/10</span></span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{dim.assessment}</p>
              {dim.strengths?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Strengths</div>
                  <div className="space-y-1">
                    {dim.strengths.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dim.gaps?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Gaps</div>
                  <div className="space-y-1">
                    {dim.gaps.map((g: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-lg p-3" style={{ background: dim.color + '10', border: `1px solid ${dim.color}30` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: dim.color }}>Recommendation</div>
                <p className="text-xs text-foreground leading-relaxed">{dim.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FeasibilityEvaluator() {
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [form, setForm] = useState({
    ideaDescription: '',
    targetMarket: '',
    problemSolved: '',
    revenueModel: '',
    competitorAwareness: '',
    founderBackground: '',
    country: '',
    stage: '',
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const evaluate = trpc.feasibility.evaluate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
    },
    onError: (err) => {
      setError(err.message);
      setStep('input');
    },
  });

  const handleSubmit = () => {
    if (form.ideaDescription.trim().length < 20) return;
    setError(null);
    setStep('loading');
    evaluate.mutate(form);
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setError(null);
    setForm({
      ideaDescription: '',
      targetMarket: '',
      problemSolved: '',
      revenueModel: '',
      competitorAwareness: '',
      founderBackground: '',
      country: '',
      stage: '',
    });
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-border animate-spin" style={{ borderTopColor: '#C4614A' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-7 h-7" style={{ color: '#C4614A' }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold text-foreground mb-1">Evaluating your idea...</div>
          <div className="text-sm text-muted-foreground">AI is analyzing 8 dimensions of feasibility</div>
        </div>
        <div className="flex gap-2">
          {['Problem Clarity', 'Market Size', 'Competitive Moat', 'Revenue Model'].map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: i * 0.4, duration: 1.2, repeat: Infinity }}
              className="text-[10px] font-mono px-2 py-1 rounded-full border border-border text-muted-foreground"
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    const verdictCfg = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG['Needs Refinement'];
    const VerdictIcon = verdictCfg.icon;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              Feasibility Report
            </h2>
            <p className="text-sm text-muted-foreground">AI-powered evaluation across 8 dimensions</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/60 transition-colors text-muted-foreground shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Idea
          </button>
        </div>

        {/* Verdict + Score */}
        <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-5">
          <div className="shrink-0">
            <ScoreRing score={Math.round(result.overallScore / 10)} color={verdictCfg.color} size={90} />
            <div className="text-center text-[10px] text-muted-foreground mt-1 font-mono">{result.overallScore}/100</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: verdictCfg.bg, color: verdictCfg.color }}
              >
                <VerdictIcon className="w-3.5 h-3.5" />
                {result.verdict}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-3">{result.summary}</p>
            {result.oneLinerPitch && (
              <div className="rounded-lg px-3 py-2.5 border-l-4" style={{ borderColor: '#C4614A', background: '#C4614A10' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#C4614A' }}>One-liner Pitch</div>
                <p className="text-xs font-medium text-foreground italic">"{result.oneLinerPitch}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Investor Perspective */}
        {result.investorPerspective && (
          <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#2D4A6B18' }}>
              <Info className="w-4 h-4" style={{ color: '#2D4A6B' }} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Investor Perspective</div>
              <p className="text-sm text-foreground leading-relaxed">{result.investorPerspective}</p>
            </div>
          </div>
        )}

        {/* Dimension Scores */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: '#C4614A' }} />
            Dimension Breakdown
          </h3>
          <div className="space-y-2">
            {result.dimensions?.map((dim: any, i: number) => (
              <DimensionCard key={dim.name} dim={dim} index={i} />
            ))}
          </div>
        </div>

        {/* Key Risks */}
        {result.keyRisks?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Key Risks
            </h3>
            <div className="space-y-2">
              {result.keyRisks.map((risk: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                      style={{ background: SEVERITY_COLORS[risk.severity] + '20', color: SEVERITY_COLORS[risk.severity] }}
                    >
                      {risk.severity}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground mb-1">{risk.risk}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{risk.mitigation}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {result.nextSteps?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" style={{ color: '#059669' }} />
              Recommended Next Steps
            </h3>
            <div className="space-y-2">
              {result.nextSteps.map((step: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-border bg-card p-4 flex gap-3"
                >
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: PRIORITY_COLORS[step.priority] ?? '#6B7280' }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: PRIORITY_COLORS[step.priority] + '20', color: PRIORITY_COLORS[step.priority] }}
                    >
                      {step.priority}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-1">{step.step}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Analogous Startups */}
        {result.analogousStartups?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Analogous Startups
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.analogousStartups.map((s: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-foreground">{s.name}</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: (OUTCOME_COLORS[s.outcome] ?? '#6B7280') + '20', color: OUTCOME_COLORS[s.outcome] ?? '#6B7280' }}
                    >
                      {s.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.lesson}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Input form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'oklch(0.18 0.05 240)' }}>
          <Sparkles className="w-7 h-7" style={{ color: '#C4614A' }} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          AI Idea Evaluator
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Describe your startup idea in plain English. Our AI will evaluate it across 8 dimensions — just like a VC would — and give you honest, actionable feedback.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Main idea input */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
            Describe Your Idea <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.ideaDescription}
            onChange={e => setForm(f => ({ ...f, ideaDescription: e.target.value }))}
            placeholder="e.g. A B2B SaaS platform that uses AI to automate procurement workflows for mid-size manufacturing companies. Instead of manually managing supplier relationships and purchase orders, companies connect their ERP and our AI handles vendor selection, price negotiation, and order tracking automatically..."
            className="w-full h-36 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">Minimum 20 characters. More detail = better evaluation.</span>
            <span className={`text-[10px] font-mono ${form.ideaDescription.length < 20 ? 'text-red-400' : 'text-green-500'}`}>
              {form.ideaDescription.length} chars
            </span>
          </div>
        </div>
      </div>

      {/* Optional context */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Optional Context</span>
          <span className="text-[10px] text-muted-foreground">(helps the AI give more accurate feedback)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'targetMarket', label: 'Who is your target customer?', placeholder: 'e.g. Mid-size manufacturing companies (50-500 employees)' },
            { key: 'problemSolved', label: 'What specific problem does it solve?', placeholder: 'e.g. Manual procurement takes 20+ hours/week and leads to costly errors' },
            { key: 'revenueModel', label: 'How will you make money?', placeholder: 'e.g. SaaS subscription $500-2000/month per company' },
            { key: 'competitorAwareness', label: 'Who are your competitors?', placeholder: 'e.g. Coupa, Jaggaer, but they are expensive and complex for SMEs' },
            { key: 'founderBackground', label: 'Your relevant background', placeholder: 'e.g. 5 years in supply chain consulting at Deloitte' },
            { key: 'country', label: 'Country / Region', placeholder: 'e.g. UAE, Saudi Arabia, USA' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block">Current Stage</label>
            <select
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select stage...</option>
              <option value="Idea">Idea — Just an idea, no product yet</option>
              <option value="Pre-seed">Pre-seed — Building MVP</option>
              <option value="Seed">Seed — MVP ready, early users</option>
              <option value="Series A">Series A — Product-market fit found</option>
              <option value="Growth">Growth — Scaling</option>
            </select>
          </div>
        </div>
      </div>

      {/* What you'll get */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">What you'll receive</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: '8 Dimension Scores', icon: Target, color: '#C4614A' },
            { label: 'Key Risks & Mitigations', icon: AlertTriangle, color: '#F59E0B' },
            { label: '5 Next Steps', icon: ArrowRight, color: '#059669' },
            { label: 'Analogous Startups', icon: Lightbulb, color: '#6366F1' },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-foreground">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={form.ideaDescription.trim().length < 20 || evaluate.isPending}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'oklch(0.18 0.05 240)' }}
      >
        <Sparkles className="w-4 h-4" style={{ color: '#C4614A' }} />
        Evaluate My Idea with AI
      </button>
    </div>
  );
}
