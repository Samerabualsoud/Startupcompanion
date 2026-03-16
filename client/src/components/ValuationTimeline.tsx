import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  TrendingUp, Plus, Trash2, Calendar, DollarSign, Building2,
  BarChart3, Clock, ChevronRight, Info, Layers
} from 'lucide-react';

const VALUATION_TYPES = [
  { value: '409a', label: '409A Appraisal' },
  { value: 'priced-round', label: 'Priced Round' },
  { value: 'safe', label: 'SAFE' },
  { value: 'convertible-note', label: 'Convertible Note' },
  { value: 'internal', label: 'Internal Estimate' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<string, string> = {
  '409a': 'bg-blue-500',
  'priced-round': 'bg-emerald-500',
  'safe': 'bg-violet-500',
  'convertible-note': 'bg-amber-500',
  'internal': 'bg-slate-400',
  'other': 'bg-rose-400',
};

const TYPE_BADGE_VARIANTS: Record<string, string> = {
  '409a': 'bg-blue-100 text-blue-800 border-blue-200',
  'priced-round': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'safe': 'bg-violet-100 text-violet-800 border-violet-200',
  'convertible-note': 'bg-amber-100 text-amber-800 border-amber-200',
  'internal': 'bg-slate-100 text-slate-700 border-slate-200',
  'other': 'bg-rose-100 text-rose-800 border-rose-200',
};

function formatCurrency(val: number | null | undefined): string {
  if (!val) return '—';
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

interface AddEntryForm {
  companyName: string;
  valuationDate: string;
  valuationType: string;
  preMoneyValuation: string;
  postMoneyValuation: string;
  sharePrice: string;
  totalShares: string;
  stage: string;
  roundName: string;
  amountRaised: string;
  leadInvestor: string;
  notes: string;
  methodology: string;
  provider: string;
}

const EMPTY_FORM: AddEntryForm = {
  companyName: '',
  valuationDate: new Date().toISOString().split('T')[0],
  valuationType: '409a',
  preMoneyValuation: '',
  postMoneyValuation: '',
  sharePrice: '',
  totalShares: '',
  stage: '',
  roundName: '',
  amountRaised: '',
  leadInvestor: '',
  notes: '',
  methodology: '',
  provider: '',
};

export default function ValuationTimeline() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AddEntryForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: entries = [], isLoading, refetch } = trpc.valuationHistory.getAll.useQuery();

  const addMutation = trpc.valuationHistory.add.useMutation({
    onSuccess: () => {
      toast.success(t('valuationTimelineEntryAdded'));
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.valuationHistory.delete.useMutation({
    onSuccess: () => {
      toast.success(t('valuationTimelineEntryDeleted'));
      setDeleteId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = () => {
    if (!form.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    addMutation.mutate({
      companyName: form.companyName.trim(),
      valuationDate: new Date(form.valuationDate),
      valuationType: form.valuationType as any,
      preMoneyValuation: form.preMoneyValuation ? parseFloat(form.preMoneyValuation) : null,
      postMoneyValuation: form.postMoneyValuation ? parseFloat(form.postMoneyValuation) : null,
      sharePrice: form.sharePrice ? parseFloat(form.sharePrice) : null,
      totalShares: form.totalShares ? parseInt(form.totalShares) : null,
      stage: form.stage || null,
      roundName: form.roundName || null,
      amountRaised: form.amountRaised ? parseFloat(form.amountRaised) : null,
      leadInvestor: form.leadInvestor || null,
      notes: form.notes || null,
      methodology: form.methodology || null,
      provider: form.provider || null,
      isPublic: false,
    });
  };

  // Compute growth metrics
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.valuationDate).getTime() - new Date(b.valuationDate).getTime()
  );

  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const firstEntry = sortedEntries[0];
  const totalGrowth = firstEntry?.preMoneyValuation && latestEntry?.preMoneyValuation
    ? ((latestEntry.preMoneyValuation - firstEntry.preMoneyValuation) / firstEntry.preMoneyValuation * 100)
    : null;

  // Chart data (simple bar chart using CSS)
  const maxVal = Math.max(...sortedEntries.map(e => e.preMoneyValuation || e.postMoneyValuation || 0), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {t('valuationTimelineTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('valuationTimelineSubtitle')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('valuationTimelineAddEntry')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('valuationTimelineAddEntry')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t('valuationTimelineCompanyName')} *</Label>
                  <Input
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineDate')} *</Label>
                  <Input
                    type="date"
                    value={form.valuationDate}
                    onChange={e => setForm(f => ({ ...f, valuationDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineType')}</Label>
                  <Select value={form.valuationType} onValueChange={v => setForm(f => ({ ...f, valuationType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALUATION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('valuationTimelinePreMoney')}</Label>
                  <Input
                    type="number"
                    value={form.preMoneyValuation}
                    onChange={e => setForm(f => ({ ...f, preMoneyValuation: e.target.value }))}
                    placeholder="5000000"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelinePostMoney')}</Label>
                  <Input
                    type="number"
                    value={form.postMoneyValuation}
                    onChange={e => setForm(f => ({ ...f, postMoneyValuation: e.target.value }))}
                    placeholder="6000000"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineAmountRaised')}</Label>
                  <Input
                    type="number"
                    value={form.amountRaised}
                    onChange={e => setForm(f => ({ ...f, amountRaised: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineStage')}</Label>
                  <Input
                    value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                    placeholder="Seed, Series A..."
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineRoundName')}</Label>
                  <Input
                    value={form.roundName}
                    onChange={e => setForm(f => ({ ...f, roundName: e.target.value }))}
                    placeholder="Seed Round"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineLeadInvestor')}</Label>
                  <Input
                    value={form.leadInvestor}
                    onChange={e => setForm(f => ({ ...f, leadInvestor: e.target.value }))}
                    placeholder="Sequoia Capital"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineSharePrice')}</Label>
                  <Input
                    type="number"
                    value={form.sharePrice}
                    onChange={e => setForm(f => ({ ...f, sharePrice: e.target.value }))}
                    placeholder="1.00"
                    step="0.0001"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineTotalShares')}</Label>
                  <Input
                    type="number"
                    value={form.totalShares}
                    onChange={e => setForm(f => ({ ...f, totalShares: e.target.value }))}
                    placeholder="10000000"
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineMethodology')}</Label>
                  <Input
                    value={form.methodology}
                    onChange={e => setForm(f => ({ ...f, methodology: e.target.value }))}
                    placeholder="DCF, Scorecard, Berkus..."
                  />
                </div>
                <div>
                  <Label>{t('valuationTimelineProvider')}</Label>
                  <Input
                    value={form.provider}
                    onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                    placeholder="Carta, Andersen, Internal..."
                  />
                </div>
                <div className="col-span-2">
                  <Label>{t('valuationTimelineNotes')}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Context, key assumptions, board approval date..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('back')}
                </Button>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Saving...' : 'Save Entry'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Layers className="w-3.5 h-3.5" />
                Total Entries
              </div>
              <div className="text-2xl font-bold text-foreground">{entries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Latest Valuation
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(latestEntry?.preMoneyValuation || latestEntry?.postMoneyValuation)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Total Growth
              </div>
              <div className={`text-2xl font-bold ${totalGrowth !== null && totalGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalGrowth !== null ? `${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(0)}%` : '—'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                First Entry
              </div>
              <div className="text-2xl font-bold text-foreground">
                {firstEntry ? new Date(firstEntry.valuationDate).getFullYear() : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bar Chart */}
      {sortedEntries.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Valuation Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32 mt-2">
              {sortedEntries.map((entry, i) => {
                const val = entry.preMoneyValuation || entry.postMoneyValuation || 0;
                const height = maxVal > 0 ? Math.max((val / maxVal) * 100, 4) : 4;
                const color = TYPE_COLORS[entry.valuationType] || 'bg-primary';
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">
                      {formatCurrency(val)}
                    </div>
                    <div
                      className={`w-full rounded-t-sm ${color} opacity-80 group-hover:opacity-100 transition-all cursor-default`}
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-[9px] text-muted-foreground text-center leading-tight">
                      {new Date(entry.valuationDate).getFullYear()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Clock className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('valuationTimelineEmpty')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {t('valuationTimelineEmptyDesc')}
            </p>
            <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('valuationTimelineAddFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {[...sortedEntries].reverse().map((entry, i) => {
              const color = TYPE_COLORS[entry.valuationType] || 'bg-primary';
              const badgeClass = TYPE_BADGE_VARIANTS[entry.valuationType] || '';
              const typeLabel = VALUATION_TYPES.find(t => t.value === entry.valuationType)?.label || entry.valuationType;
              const isDeleting = deleteId === entry.id;

              return (
                <div key={entry.id} className="relative pl-14">
                  {/* Dot */}
                  <div className={`absolute left-3 top-4 w-4 h-4 rounded-full ${color} border-2 border-background shadow-sm`} />

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-foreground text-sm">{entry.companyName}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
                              {typeLabel}
                            </span>
                            {entry.roundName && (
                              <span className="text-[10px] text-muted-foreground">{entry.roundName}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.valuationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {entry.preMoneyValuation && (
                              <div>
                                <div className="text-[10px] text-muted-foreground">Pre-Money</div>
                                <div className="text-sm font-bold text-foreground">{formatCurrency(entry.preMoneyValuation)}</div>
                              </div>
                            )}
                            {entry.postMoneyValuation && (
                              <div>
                                <div className="text-[10px] text-muted-foreground">Post-Money</div>
                                <div className="text-sm font-bold text-foreground">{formatCurrency(entry.postMoneyValuation)}</div>
                              </div>
                            )}
                            {entry.amountRaised && (
                              <div>
                                <div className="text-[10px] text-muted-foreground">Raised</div>
                                <div className="text-sm font-bold text-emerald-600">{formatCurrency(entry.amountRaised)}</div>
                              </div>
                            )}
                            {entry.sharePrice && (
                              <div>
                                <div className="text-[10px] text-muted-foreground">Share Price</div>
                                <div className="text-sm font-bold text-foreground">${entry.sharePrice.toFixed(4)}</div>
                              </div>
                            )}
                          </div>

                          {(entry.leadInvestor || entry.provider || entry.methodology) && (
                            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                              {entry.leadInvestor && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {entry.leadInvestor}
                                </span>
                              )}
                              {entry.provider && (
                                <span className="flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {entry.provider}
                                </span>
                              )}
                              {entry.methodology && (
                                <span className="flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3" />
                                  {entry.methodology}
                                </span>
                              )}
                            </div>
                          )}

                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2">
                              {entry.notes}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(entry.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {isDeleting && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Delete this entry?</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate({ id: entry.id })}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
