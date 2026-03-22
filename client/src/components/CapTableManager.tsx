/**
 * Cap Table Manager
 * Visual cap table showing shareholders, ownership %, and value at current valuation
 */
import { useState, useMemo } from 'react';
import { Users, Plus, Trash2, Edit2, Check, X, TrendingUp, PieChart, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { toast } from 'sonner';

type ShareholderType = 'founder' | 'investor' | 'employee' | 'advisor' | 'esop' | 'other';

interface Shareholder {
  id: string;
  name: string;
  type: ShareholderType;
  shares: number;
  investmentAmount: number; // USD
  roundName: string; // e.g. "Seed", "Series A", "Founder"
  vestingMonths?: number;
  notes?: string;
}

const TYPE_COLORS: Record<ShareholderType, string> = {
  founder: '#2D4A6B',
  investor: '#C4614A',
  employee: '#059669',
  advisor: '#7C3AED',
  esop: '#F59E0B',
  other: '#6B7280',
};

const TYPE_LABELS: Record<ShareholderType, string> = {
  founder: 'Founder',
  investor: 'Investor',
  employee: 'Employee',
  advisor: 'Advisor',
  esop: 'ESOP Pool',
  other: 'Other',
};

const ROUND_OPTIONS = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Founder', 'ESOP', 'Other'];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CapTableManager() {
  const { isRTL } = useLanguage();
  const { snapshot } = useStartup();

  // Pre-populate from startup context if available
  const [currentValuation, setCurrentValuation] = useState<string>(
    snapshot.latestValuation ? String(snapshot.latestValuation) : ''
  );

  const [shareholders, setShareholders] = useState<Shareholder[]>(() => {
    // Pre-populate founders from team members if available
    const initial: Shareholder[] = [];
    if (snapshot.teamMembers && snapshot.teamMembers.length > 0) {
      snapshot.teamMembers.forEach((m, i) => {
        if (m.equityPercent && m.equityPercent > 0) {
          initial.push({
            id: generateId(),
            name: m.name,
            type: 'founder',
            shares: Math.round((m.equityPercent / 100) * (snapshot.totalShares || 1000000)),
            investmentAmount: 0,
            roundName: 'Founder',
          });
        }
      });
    }
    // Add ESOP pool — prefer actual pool size from ESOP plan, fall back to % estimate
    const esopPoolSize = snapshot.currentOptionPool ?? 0;
    const esopPctSize = (snapshot.esopPoolPct ?? 0) > 0
      ? Math.round(((snapshot.esopPoolPct ?? 0) / 100) * (snapshot.totalShares || 1_000_000))
      : 0;
    const esopShares = esopPoolSize > 0 ? esopPoolSize : esopPctSize;
    if (esopShares > 0) {
      initial.push({
        id: generateId(),
        name: 'ESOP Pool',
        type: 'esop',
        shares: esopShares,
        investmentAmount: 0,
        roundName: 'ESOP',
      });
    }
    return initial;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShareholder, setNewShareholder] = useState<Partial<Shareholder>>({
    type: 'founder',
    roundName: 'Founder',
    shares: 0,
    investmentAmount: 0,
  });

  const totalShares = useMemo(() => shareholders.reduce((s, sh) => s + sh.shares, 0), [shareholders]);
  const valuation = parseFloat(currentValuation.replace(/,/g, '')) || 0;
  const pricePerShare = totalShares > 0 && valuation > 0 ? valuation / totalShares : 0;

  const enriched = useMemo(() =>
    shareholders.map(sh => ({
      ...sh,
      ownershipPct: totalShares > 0 ? (sh.shares / totalShares) * 100 : 0,
      currentValue: pricePerShare * sh.shares,
    })),
    [shareholders, totalShares, pricePerShare]
  );

  const byType = useMemo(() => {
    const groups: Record<ShareholderType, number> = {
      founder: 0, investor: 0, employee: 0, advisor: 0, esop: 0, other: 0,
    };
    enriched.forEach(sh => { groups[sh.type] += sh.ownershipPct; });
    return groups;
  }, [enriched]);

  const handleAdd = () => {
    if (!newShareholder.name?.trim() || !newShareholder.shares) {
      toast.error('Name and share count are required.');
      return;
    }
    setShareholders(prev => [...prev, {
      id: generateId(),
      name: newShareholder.name!,
      type: newShareholder.type as ShareholderType || 'other',
      shares: Number(newShareholder.shares) || 0,
      investmentAmount: Number(newShareholder.investmentAmount) || 0,
      roundName: newShareholder.roundName || 'Other',
      vestingMonths: newShareholder.vestingMonths,
      notes: newShareholder.notes,
    }]);
    setNewShareholder({ type: 'founder', roundName: 'Founder', shares: 0, investmentAmount: 0 });
    setShowAddForm(false);
    toast.success('Shareholder added.');
  };

  const handleDelete = (id: string) => {
    setShareholders(prev => prev.filter(sh => sh.id !== id));
    toast.success('Removed from cap table.');
  };

  const handleDownloadCSV = () => {
    const header = 'Name,Type,Round,Shares,Ownership %,Investment ($),Current Value ($)\n';
    const rows = enriched.map(sh =>
      `"${sh.name}","${TYPE_LABELS[sh.type]}","${sh.roundName}",${sh.shares},${sh.ownershipPct.toFixed(2)},${sh.investmentAmount},${sh.currentValue.toFixed(0)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cap-table-${snapshot.companyName || 'startup'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Cap table exported as CSV.');
  };

  const fmt = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;
  const fmtShares = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0EA5E9' }}>
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cap Table Manager</h1>
            <p className="text-sm text-muted-foreground">Track shareholders, ownership, and value in one place</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Shareholder
          </Button>
        </div>
      </div>

      {/* Valuation Input */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Current Valuation (USD)</Label>
            </div>
            <Input
              className="w-48"
              value={currentValuation}
              onChange={e => setCurrentValuation(e.target.value)}
              placeholder="e.g. 5,000,000"
            />
            {pricePerShare > 0 && (
              <span className="text-sm text-muted-foreground">
                Price per share: <strong>${pricePerShare.toFixed(4)}</strong>
              </span>
            )}
            {snapshot.latestValuation && !currentValuation && (
              <button
                onClick={() => setCurrentValuation(String(snapshot.latestValuation))}
                className="text-xs text-primary underline"
              >
                Use latest saved valuation (${(snapshot.latestValuation / 1e6).toFixed(2)}M)
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground">Total Shareholders</div>
            <div className="text-2xl font-bold mt-1">{shareholders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground">Total Shares</div>
            <div className="text-2xl font-bold mt-1">{fmtShares(totalShares)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground">Total Invested</div>
            <div className="text-2xl font-bold mt-1">{fmt(enriched.reduce((s, sh) => s + sh.investmentAmount, 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold mt-1">{valuation > 0 ? fmt(valuation) : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ownership Breakdown Bar */}
      {totalShares > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ownership Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-6 rounded-full overflow-hidden w-full mb-3">
              {(Object.entries(byType) as [ShareholderType, number][])
                .filter(([, pct]) => pct > 0)
                .map(([type, pct]) => (
                  <div
                    key={type}
                    style={{ width: `${pct}%`, background: TYPE_COLORS[type] }}
                    title={`${TYPE_LABELS[type]}: ${pct.toFixed(1)}%`}
                    className="transition-all"
                  />
                ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(byType) as [ShareholderType, number][])
                .filter(([, pct]) => pct > 0)
                .map(([type, pct]) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLORS[type] }} />
                    <span className="text-muted-foreground">{TYPE_LABELS[type]}</span>
                    <span className="font-semibold">{pct.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Shareholder Form */}
      {showAddForm && (
        <Card className="border-primary/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Add Shareholder
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input
                  value={newShareholder.name || ''}
                  onChange={e => setNewShareholder(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Smith / Sequoia Capital"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newShareholder.type} onValueChange={v => setNewShareholder(p => ({ ...p, type: v as ShareholderType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_LABELS) as [ShareholderType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Shares *</Label>
                <Input
                  type="number"
                  value={newShareholder.shares || ''}
                  onChange={e => setNewShareholder(p => ({ ...p, shares: Number(e.target.value) }))}
                  placeholder="1,000,000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Investment Amount (USD)</Label>
                <Input
                  type="number"
                  value={newShareholder.investmentAmount || ''}
                  onChange={e => setNewShareholder(p => ({ ...p, investmentAmount: Number(e.target.value) }))}
                  placeholder="500,000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Round</Label>
                <Select value={newShareholder.roundName} onValueChange={v => setNewShareholder(p => ({ ...p, roundName: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROUND_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vesting (months, optional)</Label>
                <Input
                  type="number"
                  value={newShareholder.vestingMonths || ''}
                  onChange={e => setNewShareholder(p => ({ ...p, vestingMonths: Number(e.target.value) }))}
                  placeholder="48"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleAdd} className="gap-2">
                <Check className="w-4 h-4" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cap Table */}
      {enriched.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No shareholders yet. Add founders, investors, and employees to build your cap table.</p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4" />
              Add First Shareholder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Round</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Shares</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ownership</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Invested</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Current Value</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((sh, i) => (
                    <tr key={sh.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="p-3 font-medium">{sh.name}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: TYPE_COLORS[sh.type], color: TYPE_COLORS[sh.type] }}
                        >
                          {TYPE_LABELS[sh.type]}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{sh.roundName}</td>
                      <td className="p-3 text-right font-mono">{fmtShares(sh.shares)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(sh.ownershipPct, 100)}%`, background: TYPE_COLORS[sh.type] }} />
                          </div>
                          <span className="font-semibold w-12 text-right">{sh.ownershipPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {sh.investmentAmount > 0 ? fmt(sh.investmentAmount) : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {valuation > 0 ? fmt(sh.currentValue) : '—'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(sh.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="p-3" colSpan={3}>Total</td>
                    <td className="p-3 text-right font-mono">{fmtShares(totalShares)}</td>
                    <td className="p-3 text-right">100.0%</td>
                    <td className="p-3 text-right">{fmt(enriched.reduce((s, sh) => s + sh.investmentAmount, 0))}</td>
                    <td className="p-3 text-right">{valuation > 0 ? fmt(valuation) : '—'}</td>
                    <td className="p-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs">
          This cap table is stored locally in your session. For a legally binding cap table, work with your attorney and use dedicated equity management software (e.g., Carta, Pulley, or Capshare).
        </p>
      </div>
    </div>
  );
}
