/**
 * Cap Table Manager — Unified cap table with proper persistence
 * NOW USES UNIFIED STARTUP API - syncs with dashboard and all tools
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
import { useUnifiedStartup } from '@/hooks/useUnifiedStartup';
import { toast } from 'sonner';

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
  const { startup, capTable, isLoading, updateCofounders, isUpdatingCofounders } = useUnifiedStartup();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newShareholder, setNewShareholder] = useState<any>({
    type: 'founder',
    shareClass: 'common',
    shares: 0,
    color: '#2D4A6B',
  });

  // Get shareholders from unified startup data
  const shareholders = startup?.cofounders || [];
  const companyName = startup?.companyName || '(Not set)';
  
  const totalShares = shareholders.reduce((s, sh) => s + (sh.shares || 0), 0) || 1;

  const enriched = shareholders.map(sh => ({
    ...sh,
    ownershipPct: ((sh.shares || 0) / totalShares) * 100,
  }));

  const byType = useMemo(() => {
    const groups: Record<string, number> = {
      founder: 0, investor: 0, employee: 0, advisor: 0, option_pool: 0, other: 0,
    };
    enriched.forEach(sh => { groups[sh.type] = (groups[sh.type] || 0) + sh.ownershipPct; });
    return groups;
  }, [enriched]);

  const handleAdd = async () => {
    if (!newShareholder.name?.trim() || !newShareholder.shares) {
      toast.error(lang === 'ar' ? 'الاسم وعدد الأسهم مطلوبان' : 'Name and share count are required.');
      return;
    }

    const updated = [...shareholders, {
      id: generateId(),
      name: newShareholder.name,
      email: newShareholder.email || '',
      type: newShareholder.type || 'founder',
      ownership: Number(newShareholder.shares) || 0,
      shares: Number(newShareholder.shares) || 0,
      color: newShareholder.color || '#2D4A6B',
    }];

    try {
      await updateCofounders(updated);
      setNewShareholder({ type: 'founder', shareClass: 'common', shares: 0, color: '#2D4A6B' });
      setShowAddForm(false);
      toast.success(lang === 'ar' ? 'تم إضافة المساهم' : 'Shareholder added.');
    } catch (error) {
      toast.error(lang === 'ar' ? 'خطأ في الإضافة' : 'Failed to add shareholder.');
    }
  };

  const handleDelete = async (id: string) => {
    const updated = shareholders.filter(sh => sh.id !== id);
    try {
      await updateCofounders(updated);
      toast.success(lang === 'ar' ? 'تم الحذف من جدول الملكية' : 'Removed from cap table.');
    } catch (error) {
      toast.error(lang === 'ar' ? 'خطأ في الحذف' : 'Failed to delete shareholder.');
    }
  };

  const handleEdit = async (id: string, field: string, value: any) => {
    const updated = shareholders.map(sh =>
      sh.id === id ? { ...sh, [field]: value } : sh
    );
    try {
      await updateCofounders(updated);
      setEditingId(null);
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated.');
    } catch (error) {
      toast.error(lang === 'ar' ? 'خطأ في التحديث' : 'Failed to update.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</Label>
            <div className="p-4 bg-secondary rounded-lg font-semibold">
              {companyName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shareholders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>{lang === 'ar' ? `المساهمون (${shareholders.length})` : `Shareholders (${shareholders.length})`}</CardTitle>
          </div>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> {lang === 'ar' ? 'إضافة' : 'Add'}
          </Button>
        </CardHeader>
        <CardContent>
          {shareholders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {lang === 'ar' ? 'لا توجد مساهمون' : 'No shareholders yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="text-left py-2 px-2">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="text-right py-2 px-2">{lang === 'ar' ? 'الأسهم' : 'Shares'}</th>
                    <th className="text-right py-2 px-2">{lang === 'ar' ? 'النسبة %' : 'Ownership %'}</th>
                    <th className="text-center py-2 px-2">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(sh => (
                    <tr key={sh.id} className="border-b hover:bg-secondary/50">
                      <td className="py-2 px-2">{sh.name}</td>
                      <td className="py-2 px-2">
                        <Badge style={{ backgroundColor: TYPE_COLORS[sh.type] }} className="text-white">
                          {TYPE_LABELS[sh.type]}
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-2">{(sh.shares || 0).toLocaleString()}</td>
                      <td className="text-right py-2 px-2 font-semibold">{sh.ownershipPct.toFixed(2)}%</td>
                      <td className="text-center py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sh.id)}
                          disabled={isUpdatingCofounders}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">{lang === 'ar' ? 'إضافة مساهم جديد' : 'Add New Shareholder'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{lang === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={newShareholder.name || ''}
                  onChange={(e) => setNewShareholder({ ...newShareholder, name: e.target.value })}
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
                />
              </div>
              <div>
                <Label>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  type="email"
                  value={newShareholder.email || ''}
                  onChange={(e) => setNewShareholder({ ...newShareholder, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>{lang === 'ar' ? 'النوع' : 'Type'}</Label>
                <Select value={newShareholder.type} onValueChange={(v) => setNewShareholder({ ...newShareholder, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{lang === 'ar' ? 'الأسهم' : 'Shares'}</Label>
                <Input
                  type="number"
                  value={newShareholder.shares || ''}
                  onChange={(e) => setNewShareholder({ ...newShareholder, shares: Number(e.target.value) })}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleAdd} disabled={isUpdatingCofounders}>
                {isUpdatingCofounders ? lang === 'ar' ? 'جاري الحفظ...' : 'Saving...' : lang === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ownership by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            {lang === 'ar' ? 'الملكية حسب النوع' : 'Ownership by Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(byType).map(([type, pct]) => (
              <div key={type} className="p-3 bg-secondary rounded-lg">
                <div className="text-sm font-semibold">{TYPE_LABELS[type]}</div>
                <div className="text-2xl font-bold mt-1" style={{ color: TYPE_COLORS[type] }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CapTableManager() {
  const { isLoading } = useUnifiedStartup();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading cap table...</p>
        </div>
      </div>
    );
  }

  return <CapTableManagerInner />;
}
