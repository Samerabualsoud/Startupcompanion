/**
 * Cap Table Manager — Unified cap table with proper persistence
 * Uses useCapTable() hook to ensure all changes are saved to database
 */
import { useState, useMemo } from 'react';
import { Users, Plus, Trash2, Edit2, Check, X, TrendingUp, PieChart, Download, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCapTable } from '@/hooks/useCapTable';
import { toast } from 'sonner';
import type { CapTableShareholder } from '@shared/equity';

const TYPE_COLORS: Record<string, string> = {
  founder: '#2D4A6B',
  investor: '#C4614A',
  employee: '#059669',
  advisor: '#7C3AED',
  option_pool: '#F59E0B',
  other: '#6B7280',
};

const TYPE_LABELS: Record<string, string> = {
  founder: 'Founder',
  investor: 'Investor',
  employee: 'Employee',
  advisor: 'Advisor',
  option_pool: 'ESOP Pool',
  other: 'Other',
};

function generateId() {
  return 'sh-' + Math.random().toString(36).slice(2, 10);
}

function CapTableManagerInner() {
  const { isRTL, lang } = useLanguage();
  const { state: capState, setShareholders, isLoading, isSaving } = useCapTable();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newShareholder, setNewShareholder] = useState<Partial<CapTableShareholder>>({
    type: 'founder',
    shareClass: 'common',
    shares: 0,
    color: '#2D4A6B',
  });

  const shareholders = capState?.shareholders || [];
  const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0) || 1;

  const enriched = shareholders.map(sh => ({
    ...sh,
    ownershipPct: (sh.shares / totalShares) * 100,
  }));

  const byType = useMemo(() => {
    const groups: Record<string, number> = {
      founder: 0, investor: 0, employee: 0, advisor: 0, option_pool: 0, other: 0,
    };
    enriched.forEach(sh => { groups[sh.type] += sh.ownershipPct; });
    return groups;
  }, [enriched]);

  const handleAdd = () => {
    if (!newShareholder.name?.trim() || !newShareholder.shares) {
      toast.error(lang === 'ar' ? 'الاسم وعدد الأسهم مطلوبان' : 'Name and share count are required.');
      return;
    }

    const updated = [...shareholders, {
      id: generateId(),
      name: newShareholder.name,
      email: newShareholder.email || '',
      type: newShareholder.type as any || 'founder',
      shareClass: newShareholder.shareClass || 'common',
      shares: Number(newShareholder.shares) || 0,
      pricePerShare: newShareholder.pricePerShare || 0,
      vestingMonths: newShareholder.vestingMonths,
      cliffMonths: newShareholder.cliffMonths,
      vestingStartDate: newShareholder.vestingStartDate,
      color: newShareholder.color || '#2D4A6B',
      notes: newShareholder.notes,
    } as CapTableShareholder];

    setShareholders(updated);
    setNewShareholder({ type: 'founder', shareClass: 'common', shares: 0, color: '#2D4A6B' });
    setShowAddForm(false);
    toast.success(lang === 'ar' ? 'تم إضافة المساهم' : 'Shareholder added.');
  };

  const handleDelete = (id: string) => {
    const updated = shareholders.filter(sh => sh.id !== id);
    setShareholders(updated);
    toast.success(lang === 'ar' ? 'تم الحذف من جدول الملكية' : 'Removed from cap table.');
  };

  const handleDownloadCSV = () => {
    const header = 'Name,Type,Shares,Ownership %,Vesting Months\n';
    const rows = enriched.map(sh =>
      `"${sh.name}","${TYPE_LABELS[sh.type] || sh.type}",${sh.shares},${sh.ownershipPct.toFixed(2)},${sh.vestingMonths || 0}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cap-table-${capState?.companyName || 'startup'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(lang === 'ar' ? 'تم تصدير جدول الملكية' : 'Cap table exported as CSV.');
  };

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
            <h1 className="text-xl font-bold text-foreground">{lang === 'ar' ? 'مدير جدول الملكية' : 'Cap Table Manager'}</h1>
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'تتبع المساهمين والملكية والقيمة في مكان واحد' : 'Track shareholders, ownership, and value in one place'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2">
            <Download className="w-4 h-4" />
            {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-2" disabled={isSaving}>
            <Plus className="w-4 h-4" />
            {lang === 'ar' ? 'إضافة مساهم' : 'Add Shareholder'}
          </Button>
        </div>
      </div>

      {/* Company Name */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</div>
          <div className="text-lg font-semibold text-foreground">{capState?.companyName || '(Not set)'}</div>
        </CardContent>
      </Card>

      {/* Add Shareholder Form */}
      {showAddForm && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base">{lang === 'ar' ? 'إضافة مساهم جديد' : 'Add New Shareholder'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  placeholder={lang === 'ar' ? 'أدخل الاسم' : 'Enter name'}
                  value={newShareholder.name || ''}
                  onChange={e => setNewShareholder({ ...newShareholder, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                  value={newShareholder.email || ''}
                  onChange={e => setNewShareholder({ ...newShareholder, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'النوع' : 'Type'}</Label>
                <Select value={newShareholder.type || 'founder'} onValueChange={v => setNewShareholder({ ...newShareholder, type: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">{lang === 'ar' ? 'مؤسس' : 'Founder'}</SelectItem>
                    <SelectItem value="investor">{lang === 'ar' ? 'مستثمر' : 'Investor'}</SelectItem>
                    <SelectItem value="employee">{lang === 'ar' ? 'موظف' : 'Employee'}</SelectItem>
                    <SelectItem value="advisor">{lang === 'ar' ? 'مستشار' : 'Advisor'}</SelectItem>
                    <SelectItem value="other">{lang === 'ar' ? 'آخر' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'الأسهم' : 'Shares'}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newShareholder.shares || ''}
                  onChange={e => setNewShareholder({ ...newShareholder, shares: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'أشهر الاستحقاق' : 'Vesting Months'}</Label>
                <Input
                  type="number"
                  placeholder="48"
                  value={newShareholder.vestingMonths || ''}
                  onChange={e => setNewShareholder({ ...newShareholder, vestingMonths: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">{lang === 'ar' ? 'فترة الانتظار' : 'Cliff Months'}</Label>
                <Input
                  type="number"
                  placeholder="12"
                  value={newShareholder.cliffMonths || ''}
                  onChange={e => setNewShareholder({ ...newShareholder, cliffMonths: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={isSaving}>
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {lang === 'ar' ? 'إضافة' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shareholders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang === 'ar' ? 'المساهمون' : 'Shareholders'} ({shareholders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shareholders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {lang === 'ar' ? 'لا توجد مساهمون. أضف واحداً الآن.' : 'No shareholders yet. Add one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold text-foreground">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="text-left py-2 px-3 font-semibold text-foreground">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="text-right py-2 px-3 font-semibold text-foreground">{lang === 'ar' ? 'الأسهم' : 'Shares'}</th>
                    <th className="text-right py-2 px-3 font-semibold text-foreground">{lang === 'ar' ? 'الملكية %' : 'Ownership %'}</th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(sh => (
                    <tr key={sh.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-2 px-3 text-foreground">{sh.name}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" style={{ background: TYPE_COLORS[sh.type], color: 'white', border: 'none' }}>
                          {TYPE_LABELS[sh.type] || sh.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right text-foreground">{fmtShares(sh.shares)}</td>
                      <td className="py-2 px-3 text-right text-foreground">{sh.ownershipPct.toFixed(2)}%</td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sh.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ownership by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang === 'ar' ? 'الملكية حسب النوع' : 'Ownership by Type'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(byType).map(([type, pct]) => (
              <div key={type} className="p-3 rounded-lg" style={{ background: TYPE_COLORS[type] + '20' }}>
                <div className="text-xs text-muted-foreground font-semibold">{TYPE_LABELS[type]}</div>
                <div className="text-lg font-bold" style={{ color: TYPE_COLORS[type] }}>{pct.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CapTableManager() {
  const { lang } = useLanguage();
  const { isLoading } = useCapTable();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جاري تحميل جدول الملكية...' : 'Loading cap table...'}</p>
        </div>
      </div>
    );
  }

  return <CapTableManagerInner />;
}
