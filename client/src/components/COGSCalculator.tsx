/**
 * COGS & Cost Calculator
 * Calculates cost of goods sold, gross margin, EBITDA, and break-even.
 * Connects to the backend cogs router and AI analysis.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Loader2, Save, Sparkles, Calculator,
  ChevronDown, ChevronUp, History, RefreshCw
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

// ── Types ──────────────────────────────────────────────────────────────────

interface DirectCost {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'variable';
  perUnit: boolean;
  category: 'materials' | 'labor' | 'hosting' | 'payment_processing' | 'support' | 'packaging' | 'shipping' | 'licensing' | 'other';
}

interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  category: 'sales' | 'marketing' | 'admin' | 'rd' | 'hr' | 'facilities' | 'other';
}

type BusinessModel = 'saas' | 'ecommerce' | 'marketplace' | 'hardware' | 'services' | 'manufacturing' | 'other';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'USD'): string {
  return `${currency === 'USD' ? '$' : currency === 'SAR' ? 'SAR ' : currency + ' '}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function COGSCalculator() {
  const { t, lang } = useLanguage();
  const { refresh: refreshContext } = useStartup();
  const isRTL = lang === 'ar';

  // ── Form state ──
  const [calcName, setCalcName] = useState('');
  const [businessModel, setBusinessModel] = useState<BusinessModel>('saas');
  const [currency, setCurrency] = useState('USD');
  const [revenuePerUnit, setRevenuePerUnit] = useState<number>(0);
  const [unitsPerMonth, setUnitsPerMonth] = useState<number>(0);
  const [directCosts, setDirectCosts] = useState<DirectCost[]>([]);
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const totalRevenue = revenuePerUnit * unitsPerMonth;

    // Direct costs: fixed costs are monthly; variable per-unit costs are multiplied by units
    const totalCOGS = directCosts.reduce((sum, c) => {
      if (c.type === 'variable' && c.perUnit) {
        return sum + c.amount * unitsPerMonth;
      }
      return sum + c.amount;
    }, 0);

    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalOpEx = indirectCosts.reduce((sum, c) => sum + c.amount, 0);
    const ebitda = grossProfit - totalOpEx;

    // Break-even: fixed costs / (revenue per unit - variable cost per unit)
    const fixedCosts = directCosts
      .filter(c => c.type === 'fixed')
      .reduce((sum, c) => sum + c.amount, 0) + totalOpEx;
    const variableCostPerUnit = directCosts
      .filter(c => c.type === 'variable' && c.perUnit)
      .reduce((sum, c) => sum + c.amount, 0);
    const contributionMargin = revenuePerUnit - variableCostPerUnit;
    const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;

    return { totalRevenue, totalCOGS, grossProfit, grossMarginPct, totalOpEx, ebitda, breakEvenUnits };
  }, [revenuePerUnit, unitsPerMonth, directCosts, indirectCosts]);

  // ── tRPC ──
  const utils = trpc.useUtils();
  const { data: history, isLoading: historyLoading } = trpc.cogs.list.useQuery(undefined, { retry: false });

  const saveMutation = trpc.cogs.save.useMutation({
    onSuccess: () => {
      toast.success(t('cogsSaved'));
      utils.cogs.list.invalidate();
      refreshContext();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.cogs.delete.useMutation({
    onSuccess: () => {
      utils.cogs.list.invalidate();
      refreshContext();
    },
    onError: (err) => toast.error(err.message),
  });

  const analyzeAI = trpc.ai.analyzeCOGS.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis);
      setShowAI(true);
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Handlers ──
  const addDirectCost = useCallback(() => {
    setDirectCosts(prev => [...prev, {
      id: nanoid(),
      name: '',
      amount: 0,
      type: 'fixed',
      perUnit: false,
      category: 'other',
    }]);
  }, []);

  const addIndirectCost = useCallback(() => {
    setIndirectCosts(prev => [...prev, {
      id: nanoid(),
      name: '',
      amount: 0,
      category: 'other',
    }]);
  }, []);

  const updateDirectCost = useCallback((id: string, field: keyof DirectCost, value: any) => {
    setDirectCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const updateIndirectCost = useCallback((id: string, field: keyof IndirectCost, value: any) => {
    setIndirectCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const removeDirectCost = useCallback((id: string) => {
    setDirectCosts(prev => prev.filter(c => c.id !== id));
  }, []);

  const removeIndirectCost = useCallback((id: string) => {
    setIndirectCosts(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleSave = () => {
    if (!calcName.trim()) {
      toast.error('Please enter a calculation name');
      return;
    }
    saveMutation.mutate({
      name: calcName,
      businessModel,
      currency,
      revenuePerUnit,
      unitsPerMonth,
      directCostsJson: directCosts,
      indirectCostsJson: indirectCosts,
      totalCOGS: metrics.totalCOGS,
      grossProfit: metrics.grossProfit,
      grossMarginPct: metrics.grossMarginPct,
      totalOpEx: metrics.totalOpEx,
      ebitda: metrics.ebitda,
      breakEvenUnits: metrics.breakEvenUnits,
    });
  };

  const handleAnalyze = () => {
    analyzeAI.mutate({
      businessModel,
      revenuePerUnit,
      unitsPerMonth,
      totalRevenue: metrics.totalRevenue,
      totalCOGS: metrics.totalCOGS,
      grossMarginPct: metrics.grossMarginPct,
      totalOpEx: metrics.totalOpEx,
      ebitda: metrics.ebitda,
      breakEvenUnits: metrics.breakEvenUnits,
      directCosts: directCosts.map(c => ({ name: c.name, amount: c.amount, type: c.type })),
      indirectCosts: indirectCosts.map(c => ({ name: c.name, amount: c.amount, category: c.category })),
      currency,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const loadFromHistory = (item: any) => {
    setCalcName(item.name + ' (copy)');
    setBusinessModel(item.businessModel);
    setCurrency(item.currency);
    setRevenuePerUnit(item.revenuePerUnit);
    setUnitsPerMonth(item.unitsPerMonth);
    setDirectCosts((item.directCostsJson as DirectCost[]) ?? []);
    setIndirectCosts((item.indirectCostsJson as IndirectCost[]) ?? []);
    setShowHistory(false);
    toast.success('Loaded from history');
  };

  // ── Margin color ──
  const marginColor = metrics.grossMarginPct >= 60
    ? '#059669'
    : metrics.grossMarginPct >= 30
    ? '#F59E0B'
    : '#EF4444';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('cogsTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('cogsSubtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(v => !v)}
          className="shrink-0"
        >
          <History className="w-3.5 h-3.5 mr-1.5" />
          {t('cogsHistory')}
        </Button>
      </div>

      {/* ── History Panel ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('cogsHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </div>
                ) : !history || history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('cogsNoHistory')}</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.businessModel} · {item.currency} · GM: {item.grossMarginPct?.toFixed(1) ?? '—'}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => loadFromHistory(item)}>
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate({ id: item.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">{t('cogsBusinessModel')}</Label>
                  <Select value={businessModel} onValueChange={(v) => setBusinessModel(v as BusinessModel)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['saas', 'ecommerce', 'marketplace', 'hardware', 'services', 'manufacturing', 'other'] as BusinessModel[]).map(m => (
                        <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">{t('cogsCurrency')}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['USD', 'SAR', 'AED', 'EGP', 'EUR', 'GBP'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">{t('cogsRevenuePerUnit')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={revenuePerUnit || ''}
                    onChange={e => setRevenuePerUnit(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">{t('cogsUnitsPerMonth')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={unitsPerMonth || ''}
                    onChange={e => setUnitsPerMonth(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Costs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t('cogsDirectCosts')}</CardTitle>
                <Button size="sm" variant="outline" onClick={addDirectCost}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('cogsAddCost')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {directCosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No direct costs yet. Click "Add Cost Item" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {directCosts.map((cost) => (
                    <div key={cost.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Input
                          value={cost.name}
                          onChange={e => updateDirectCost(cost.id, 'name', e.target.value)}
                          placeholder={t('cogsCostName')}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          value={cost.amount || ''}
                          onChange={e => updateDirectCost(cost.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder={t('cogsCostAmount')}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={cost.type}
                          onValueChange={v => {
                            updateDirectCost(cost.id, 'type', v);
                            updateDirectCost(cost.id, 'perUnit', v === 'variable');
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">{t('cogsFixed')}</SelectItem>
                            <SelectItem value="variable">{t('cogsVariable')} ({t('cogsPerUnit')})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeDirectCost(cost.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indirect / OpEx Costs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t('cogsIndirectCosts')}</CardTitle>
                <Button size="sm" variant="outline" onClick={addIndirectCost}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('cogsAddCost')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {indirectCosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No operating expenses yet. Click "Add Cost Item" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {indirectCosts.map((cost) => (
                    <div key={cost.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Input
                          value={cost.name}
                          onChange={e => updateIndirectCost(cost.id, 'name', e.target.value)}
                          placeholder={t('cogsCostName')}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          value={cost.amount || ''}
                          onChange={e => updateIndirectCost(cost.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder={t('cogsCostAmount')}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={cost.category}
                          onValueChange={v => updateIndirectCost(cost.id, 'category', v as IndirectCost['category'])}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['sales', 'marketing', 'admin', 'rd', 'hr', 'facilities', 'other'].map(c => (
                              <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeIndirectCost(cost.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Input
              value={calcName}
              onChange={e => setCalcName(e.target.value)}
              placeholder={t('cogsNamePlaceholder')}
              className="h-9 text-sm"
            />
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="shrink-0"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              {saveMutation.isPending ? t('cogsSaving') : t('cogsSave')}
            </Button>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ResultRow label={t('cogsMonthlyRevenue')} value={fmt(metrics.totalRevenue, currency)} />
              <ResultRow label={t('cogsTotal')} value={fmt(metrics.totalCOGS, currency)} negative />
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('cogsGrossProfit')}</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: metrics.grossProfit >= 0 ? '#059669' : '#EF4444' }}
                >
                  {fmt(metrics.grossProfit, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('cogsGrossMargin')}</span>
                <Badge
                  className="text-xs font-bold"
                  style={{ background: `${marginColor}18`, color: marginColor, border: `1px solid ${marginColor}40` }}
                >
                  {metrics.grossMarginPct.toFixed(1)}%
                </Badge>
              </div>
              <Separator />
              <ResultRow label="OpEx" value={fmt(metrics.totalOpEx, currency)} negative />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">EBITDA</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: metrics.ebitda >= 0 ? '#059669' : '#EF4444' }}
                >
                  {fmt(metrics.ebitda, currency)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Break-even Units</span>
                <span className="text-xs font-semibold">
                  {metrics.breakEvenUnits > 0 ? Math.ceil(metrics.breakEvenUnits).toLocaleString() : '—'}
                </span>
              </div>
              {unitsPerMonth > 0 && metrics.breakEvenUnits > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">vs. Current Units</span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color: unitsPerMonth >= metrics.breakEvenUnits ? '#059669' : '#F59E0B',
                      borderColor: unitsPerMonth >= metrics.breakEvenUnits ? '#059669' : '#F59E0B',
                    }}
                  >
                    {unitsPerMonth >= metrics.breakEvenUnits ? '✓ Above break-even' : `${Math.ceil(metrics.breakEvenUnits - unitsPerMonth)} more needed`}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAnalyze}
            disabled={analyzeAI.isPending || metrics.totalRevenue === 0}
          >
            {analyzeAI.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1.5" />
            )}
            {analyzeAI.isPending ? t('cogsAnalyzing') : t('cogsAnalyze')}
          </Button>
        </div>
      </div>

      {/* ── AI Analysis Panel ── */}
      <AnimatePresence>
        {showAI && aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    AI Cost Analysis
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={handleAnalyze} disabled={analyzeAI.isPending}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAI(false)}>
                      ✕
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <Streamdown>{aiAnalysis}</Streamdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────

function ResultRow({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${negative ? 'text-destructive' : 'text-foreground'}`}>
        {negative ? `(${value})` : value}
      </span>
    </div>
  );
}
