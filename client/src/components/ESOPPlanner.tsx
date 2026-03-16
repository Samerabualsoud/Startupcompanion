/**
 * ESOP / Option Pool Planner
 * Models option pool size, strike price, vesting, and dilution impact
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Users, TrendingUp, PieChart, Plus, Trash2, Info } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { STARTUP_STAGES } from '@shared/dropdowns';

interface GrantRow {
  id: string;
  role: string;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'vp' | 'csuite';
  shares: number;
  vestingMonths: number;
  cliffMonths: number;
  strikePrice: number;
}

interface ESOPInputs {
  companyName: string;
  stage: string;
  totalShares: number;
  currentOptionPool: number;
  pricePerShare: number;
  plannedHires: number;
  seniorHires: number;
  jurisdiction: string;
  nextRoundSize: number;
  grants: GrantRow[];
}

const LEVEL_GRANT_BENCHMARKS: Record<string, { label: string; typical: string; range: string }> = {
  junior: { label: 'Junior Engineer / Analyst', typical: '0.05%', range: '0.01–0.1%' },
  mid: { label: 'Mid-level Engineer / Manager', typical: '0.1%', range: '0.05–0.25%' },
  senior: { label: 'Senior Engineer / Sr. Manager', typical: '0.25%', range: '0.1–0.5%' },
  lead: { label: 'Tech Lead / Director', typical: '0.5%', range: '0.25–0.75%' },
  vp: { label: 'VP / Head of Function', typical: '1%', range: '0.5–2%' },
  csuite: { label: 'C-Suite (CTO, CFO, COO)', typical: '2%', range: '1–5%' },
};

const JURISDICTIONS = [
  { value: 'delaware', label: 'Delaware, USA' },
  { value: 'california', label: 'California, USA' },
  { value: 'adgm', label: 'ADGM, Abu Dhabi' },
  { value: 'difc', label: 'DIFC, Dubai' },
  { value: 'uae', label: 'UAE (Federal)' },
  { value: 'saudi', label: 'Saudi Arabia' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'uk', label: 'England & Wales' },
];

const CHART_COLORS = ['#C4614A', '#2D4A6B', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'];

const newGrant = (): GrantRow => ({
  id: Math.random().toString(36).slice(2),
  role: '',
  level: 'mid',
  shares: 10000,
  vestingMonths: 48,
  cliffMonths: 12,
  strikePrice: 1.0,
});

export default function ESOPPlanner() {
  const { t, isRTL } = useLanguage();
  const [inputs, setInputs] = useState<ESOPInputs>({
    companyName: '',
    stage: 'seed',
    totalShares: 10_000_000,
    currentOptionPool: 1_000_000,
    pricePerShare: 0.10,
    plannedHires: 5,
    seniorHires: 2,
    jurisdiction: 'delaware',
    nextRoundSize: 2_000_000,
    grants: [newGrant()],
  });
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'grants' | 'ai'>('planner');

  const analysisMutation = trpc.ai.esopRecommendation.useMutation({
    onSuccess: (data: { analysis: string }) => {
      setAiAnalysis(data.analysis);
      setActiveTab('ai');
      setIsAnalyzing(false);
      toast.success('Analysis complete');
    },
    onError: (err: { message: string }) => {
      setIsAnalyzing(false);
      toast.error('Analysis failed: ' + err.message);
    },
  });

  const setField = <K extends keyof ESOPInputs>(key: K, value: ESOPInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateGrant = (id: string, key: keyof GrantRow, value: GrantRow[keyof GrantRow]) => {
    setInputs(prev => ({
      ...prev,
      grants: prev.grants.map(g => g.id === id ? { ...g, [key]: value } : g),
    }));
  };

  const addGrant = () => setInputs(prev => ({ ...prev, grants: [...prev.grants, newGrant()] }));
  const removeGrant = (id: string) => setInputs(prev => ({ ...prev, grants: prev.grants.filter(g => g.id !== id) }));

  // Computed metrics
  const metrics = useMemo(() => {
    const poolPct = (inputs.currentOptionPool / inputs.totalShares) * 100;
    const allocatedShares = inputs.grants.reduce((sum, g) => sum + g.shares, 0);
    const allocatedPct = (allocatedShares / inputs.totalShares) * 100;
    const remainingPool = inputs.currentOptionPool - allocatedShares;
    const remainingPct = (remainingPool / inputs.totalShares) * 100;
    const fullyDilutedShares = inputs.totalShares + inputs.currentOptionPool;
    const totalValue = inputs.totalShares * inputs.pricePerShare;
    const poolValue = inputs.currentOptionPool * inputs.pricePerShare;

    return { poolPct, allocatedShares, allocatedPct, remainingPool, remainingPct, fullyDilutedShares, totalValue, poolValue };
  }, [inputs]);

  const capTableData = useMemo(() => {
    const grantTotal = inputs.grants.reduce((sum, g) => sum + g.shares, 0);
    const remaining = inputs.currentOptionPool - grantTotal;
    return [
      { name: 'Founders & Investors', value: inputs.totalShares - inputs.currentOptionPool, color: CHART_COLORS[0] },
      { name: 'Granted Options', value: grantTotal, color: CHART_COLORS[1] },
      { name: 'Unallocated Pool', value: Math.max(0, remaining), color: CHART_COLORS[2] },
    ].filter(d => d.value > 0);
  }, [inputs]);

  const handleAnalyze = () => {
    if (!inputs.companyName) {
      toast.error('Please enter a company name');
      return;
    }
    setIsAnalyzing(true);
    analysisMutation.mutate({
      companyName: inputs.companyName,
      stage: inputs.stage,
      totalShares: inputs.totalShares,
      currentOptionPool: inputs.currentOptionPool,
      plannedHires: inputs.plannedHires,
      seniorHires: inputs.seniorHires,
      jurisdiction: inputs.jurisdiction,
      nextRoundSize: inputs.nextRoundSize,
    });
  };

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : n.toLocaleString();
  const fmtUSD = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(2)}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <PieChart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            ESOP / Option Pool Planner
          </h1>
          <Badge variant="secondary" className="text-xs">AI</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Model your option pool size, grant allocations, dilution impact, and get AI-powered recommendations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'planner' | 'grants' | 'ai')}>
        <TabsList>
          <TabsTrigger value="planner">Pool Overview</TabsTrigger>
          <TabsTrigger value="grants">Grant Tracker</TabsTrigger>
          <TabsTrigger value="ai">
            AI Analysis {aiAnalysis && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* Pool Overview Tab */}
        <TabsContent value="planner" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Inputs */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Company & Pool Setup</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Company Name</Label>
                    <Input
                      placeholder="e.g. Acme Technologies"
                      value={inputs.companyName}
                      onChange={e => setField('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stage</Label>
                    <Select value={inputs.stage} onValueChange={v => setField('stage', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STARTUP_STAGES.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Total Shares Outstanding</Label>
                    <Input
                      type="number"
                      min={100000}
                      value={inputs.totalShares}
                      onChange={e => setField('totalShares', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Option Pool Size (shares)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inputs.currentOptionPool}
                      onChange={e => setField('currentOptionPool', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Price Per Share ($)</Label>
                    <Input
                      type="number"
                      min={0.001}
                      step={0.01}
                      value={inputs.pricePerShare}
                      onChange={e => setField('pricePerShare', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Governing Jurisdiction</Label>
                    <Select value={inputs.jurisdiction} onValueChange={v => setField('jurisdiction', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {JURISDICTIONS.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Planned Hires (12 months)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inputs.plannedHires}
                      onChange={e => setField('plannedHires', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senior / Executive Hires</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inputs.seniorHires}
                      onChange={e => setField('seniorHires', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Next Round Size ($) — for dilution modeling</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inputs.nextRoundSize}
                      onChange={e => setField('nextRoundSize', Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Benchmark Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Market Benchmark Grants</CardTitle>
                  <CardDescription className="text-xs">Typical equity grants for VC-backed startups at {inputs.stage} stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Role Level</th>
                          <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Typical %</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(LEVEL_GRANT_BENCHMARKS).map(([key, val]) => (
                          <tr key={key} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 pr-4 text-foreground">{val.label}</td>
                            <td className="py-2 pr-4 text-right font-semibold">{val.typical}</td>
                            <td className="py-2 text-right text-muted-foreground text-xs">{val.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Metrics + Chart */}
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pool Size', value: `${metrics.poolPct.toFixed(1)}%`, sub: fmt(inputs.currentOptionPool) + ' shares' },
                  { label: 'Pool Value', value: fmtUSD(metrics.poolValue), sub: 'at current price' },
                  { label: 'Allocated', value: `${metrics.allocatedPct.toFixed(1)}%`, sub: fmt(metrics.allocatedShares) + ' shares' },
                  { label: 'Remaining', value: `${metrics.remainingPct.toFixed(1)}%`, sub: fmt(Math.max(0, metrics.remainingPool)) + ' shares' },
                ].map(m => (
                  <Card key={m.label} className="p-3">
                    <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-lg font-bold text-foreground">{m.value}</div>
                    <div className="text-xs text-muted-foreground">{m.sub}</div>
                  </Card>
                ))}
              </div>

              {/* Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cap Table View</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie data={capTableData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                        {capTableData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmt(v) + ' shares', '']} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputs.companyName}
                style={{ background: 'oklch(0.18 0.05 240)' }}
              >
                {isAnalyzing ? (
                  <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Get AI Recommendations</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Grant Tracker Tab */}
        <TabsContent value="grants" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Option Grant Tracker</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Track individual option grants — {fmt(metrics.allocatedShares)} shares allocated ({metrics.allocatedPct.toFixed(2)}% of total)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addGrant}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Grant
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inputs.grants.map((grant, idx) => (
                  <div key={grant.id} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Grant #{idx + 1}</span>
                      <button
                        onClick={() => removeGrant(grant.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Employee Role</Label>
                        <Input
                          placeholder="e.g. CTO"
                          value={grant.role}
                          onChange={e => updateGrant(grant.id, 'role', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Level</Label>
                        <Select value={grant.level} onValueChange={v => updateGrant(grant.id, 'level', v as GrantRow['level'])}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(LEVEL_GRANT_BENCHMARKS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label.split(' / ')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Shares</Label>
                        <Input
                          type="number"
                          value={grant.shares}
                          onChange={e => updateGrant(grant.id, 'shares', Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vesting (months)</Label>
                        <Select value={String(grant.vestingMonths)} onValueChange={v => updateGrant(grant.id, 'vestingMonths', Number(v))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[12, 24, 36, 48, 60].map(m => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cliff (months)</Label>
                        <Select value={String(grant.cliffMonths)} onValueChange={v => updateGrant(grant.id, 'cliffMonths', Number(v))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 3, 6, 12].map(m => <SelectItem key={m} value={String(m)}>{m === 0 ? 'No cliff' : `${m} months`}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Strike Price ($)</Label>
                        <Input
                          type="number"
                          step={0.01}
                          value={grant.strikePrice}
                          onChange={e => updateGrant(grant.id, 'strikePrice', Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>{((grant.shares / inputs.totalShares) * 100).toFixed(3)}% ownership</span>
                      <span>Value at current price: {fmtUSD(grant.shares * inputs.pricePerShare)}</span>
                      <span>Benchmark: {LEVEL_GRANT_BENCHMARKS[grant.level]?.typical}</span>
                    </div>
                  </div>
                ))}
              </div>

              {inputs.grants.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No grants added yet. Click "Add Grant" to start tracking.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai" className="mt-4">
          {!aiAnalysis ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered recommendations on pool sizing, grant ranges, strike prices, and tax implications.
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !inputs.companyName}
                  style={{ background: 'oklch(0.18 0.05 240)' }}
                >
                  {isAnalyzing ? (
                    <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Get AI Recommendations</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI ESOP Recommendations
                </CardTitle>
                <CardDescription className="text-xs">{inputs.companyName} · {inputs.stage} stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{aiAnalysis}</Streamdown>
                </div>
                <div className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>AI recommendations are for guidance only. Consult a qualified equity compensation advisor and tax lawyer before implementing.</span>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleAnalyze}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
