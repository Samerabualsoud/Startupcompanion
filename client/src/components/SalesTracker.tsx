/**
 * Sales Tracker — Business Model Adaptive Pipeline
 * Stages, fields, KPIs, and unit economics adapt to:
 *   Business Model: SaaS | E-commerce | Marketplace | Agency | Hardware
 *   Motion: B2B | B2C
 */
import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Edit2, X, Check, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, TrendingDown, DollarSign, Target, Users, Sparkles,
  RefreshCw, Search, ArrowUpDown, CheckCircle2, Clock, XCircle,
  GitMerge, Zap, Activity, ShoppingCart, Briefcase, Cpu, Store,
  Package, UserCheck, Repeat, Calendar, CalendarRange, Rocket,
  Star, Info, AlertCircle, Award, ArrowRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
type BusinessModel = 'saas' | 'ecommerce' | 'marketplace' | 'agency' | 'hardware' | 'procurement';
type Motion = 'b2b' | 'b2c';
type DealStage = string;

interface StageConfig {
  label: string;
  labelAr: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  defaultProb: number;
}

interface ModelConfig {
  label: string;
  labelAr: string;
  icon: React.ElementType;
  stages: Record<string, StageConfig>;
  wonStage: string;
  lostStage: string;
  dealLabel: string;
  dealLabelAr: string;
  amountLabel: string;
  amountLabelAr: string;
  extraFields: ExtraField[];
  kpiLabels: KpiLabels;
  unitEconLabels: UnitEconLabels;
  benchmarks: Benchmark[];
}

interface ExtraField {
  key: string;
  label: string;
  labelAr: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}

interface KpiLabels {
  revenue: string; revenueAr: string;
  pipeline: string; pipelineAr: string;
  weighted: string; weightedAr: string;
  winRate: string; winRateAr: string;
}

interface UnitEconLabels {
  arpc: string; arpcAr: string;
  ltv: string; ltvAr: string;
  cac: string; cacAr: string;
  payback: string; paybackAr: string;
  extraMetric?: string; extraMetricAr?: string;
}

interface Benchmark {
  metric: string; metricAr: string;
  b2b: string; b2c: string;
}

interface Deal {
  id: number;
  date: string | Date;
  amount: number;
  currency: string;
  channel: string;
  product: string;
  customer: string;
  dealStage: DealStage;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  dealValue?: number | null;
  probability?: number | null;
  expectedCloseDate?: string | Date | null;
  lostReason?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  // extra model-specific fields stored in notes as JSON prefix
}

// ── Model Configurations ───────────────────────────────────────────────────
const MODEL_CONFIGS: Record<BusinessModel, ModelConfig> = {
  saas: {
    label: 'SaaS',
    labelAr: 'SaaS',
    icon: Zap,
    stages: {
      lead:        { label: 'Lead',        labelAr: 'عميل محتمل',   color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Users,         defaultProb: 10 },
      trial:       { label: 'Trial',       labelAr: 'تجربة',        color: 'text-sky-600',    bg: 'bg-sky-50',      icon: Clock,         defaultProb: 20 },
      demo:        { label: 'Demo',        labelAr: 'عرض توضيحي',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: Activity,      defaultProb: 35 },
      proposal:    { label: 'Proposal',    labelAr: 'عرض سعر',      color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: Clock,         defaultProb: 55 },
      negotiation: { label: 'Negotiation', labelAr: 'تفاوض',        color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30',   icon: ArrowUpDown,   defaultProb: 75 },
      closed_won:  { label: 'Closed Won',  labelAr: 'مُغلقة (ربح)', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      closed_lost: { label: 'Closed Lost', labelAr: 'مُغلقة (خسارة)', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'closed_won', lostStage: 'closed_lost',
    dealLabel: 'Account', dealLabelAr: 'حساب',
    amountLabel: 'ARR / MRR', amountLabelAr: 'الإيراد السنوي/الشهري المتكرر',
    extraFields: [
      { key: 'seats', label: 'Seats / Licenses', labelAr: 'عدد المقاعد', type: 'number', placeholder: '10' },
      { key: 'contractMonths', label: 'Contract Length (mo)', labelAr: 'مدة العقد (شهر)', type: 'number', placeholder: '12' },
      { key: 'plan', label: 'Plan / Tier', labelAr: 'الخطة', type: 'select', options: ['Starter', 'Growth', 'Enterprise', 'Custom'] },
    ],
    kpiLabels: {
      revenue: 'Total ARR', revenueAr: 'إجمالي الإيراد السنوي',
      pipeline: 'Pipeline ARR', pipelineAr: 'خط أنابيب الإيراد السنوي',
      weighted: 'Weighted ARR', weightedAr: 'الإيراد السنوي المرجّح',
      winRate: 'Win Rate', winRateAr: 'معدل الفوز',
    },
    unitEconLabels: {
      arpc: 'Avg ARR / Account', arpcAr: 'متوسط الإيراد السنوي لكل حساب',
      ltv: 'Customer LTV', ltvAr: 'القيمة الدائمة للعميل',
      cac: 'CAC', cacAr: 'تكلفة اكتساب العميل',
      payback: 'CAC Payback', paybackAr: 'فترة استرداد تكلفة الاكتساب',
      extraMetric: 'NRR (est.)', extraMetricAr: 'معدل الاحتفاظ الصافي (تقديري)',
    },
    benchmarks: [
      { metric: 'LTV/CAC', metricAr: 'نسبة LTV/CAC', b2b: '3–5x', b2c: '2–4x' },
      { metric: 'CAC Payback', metricAr: 'فترة الاسترداد', b2b: '12–18 mo', b2c: '6–12 mo' },
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '70–80%', b2c: '65–75%' },
      { metric: 'Win Rate', metricAr: 'معدل الفوز', b2b: '20–30%', b2c: '2–5%' },
      { metric: 'Avg Contract', metricAr: 'متوسط العقد', b2b: '12–24 mo', b2c: '1–3 mo' },
    ],
  },

  ecommerce: {
    label: 'E-commerce',
    labelAr: 'تجارة إلكترونية',
    icon: ShoppingCart,
    stages: {
      browsing:   { label: 'Browsing',   labelAr: 'تصفح',         color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Search,        defaultProb: 5 },
      cart:       { label: 'Cart',       labelAr: 'سلة التسوق',   color: 'text-sky-600',    bg: 'bg-sky-50',      icon: ShoppingCart,  defaultProb: 20 },
      checkout:   { label: 'Checkout',   labelAr: 'الدفع',        color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: DollarSign,    defaultProb: 60 },
      processing: { label: 'Processing', labelAr: 'قيد المعالجة', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: Clock,         defaultProb: 85 },
      fulfilled:  { label: 'Fulfilled',  labelAr: 'تم الشحن',     color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      returned:   { label: 'Returned',   labelAr: 'مُرتجع',       color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'fulfilled', lostStage: 'returned',
    dealLabel: 'Order', dealLabelAr: 'طلب',
    amountLabel: 'Order Value (GMV)', amountLabelAr: 'قيمة الطلب (GMV)',
    extraFields: [
      { key: 'sku', label: 'SKU / Product', labelAr: 'رمز المنتج', type: 'text', placeholder: 'SKU-001' },
      { key: 'units', label: 'Units Ordered', labelAr: 'الكمية', type: 'number', placeholder: '1' },
      { key: 'discountPct', label: 'Discount (%)', labelAr: 'الخصم (%)', type: 'number', placeholder: '0' },
      { key: 'shippingCost', label: 'Shipping Cost', labelAr: 'تكلفة الشحن', type: 'number', placeholder: '0' },
    ],
    kpiLabels: {
      revenue: 'Total GMV', revenueAr: 'إجمالي قيمة البضائع',
      pipeline: 'Pending Orders', pipelineAr: 'الطلبات المعلقة',
      weighted: 'Checkout Value', weightedAr: 'قيمة الطلبات في الدفع',
      winRate: 'Fulfillment Rate', winRateAr: 'معدل إتمام الطلبات',
    },
    unitEconLabels: {
      arpc: 'Avg Order Value (AOV)', arpcAr: 'متوسط قيمة الطلب',
      ltv: 'Customer LTV', ltvAr: 'القيمة الدائمة للعميل',
      cac: 'CAC / CPA', cacAr: 'تكلفة اكتساب العميل',
      payback: 'Payback Period', paybackAr: 'فترة الاسترداد',
      extraMetric: 'Repeat Rate', extraMetricAr: 'معدل التكرار',
    },
    benchmarks: [
      { metric: 'AOV', metricAr: 'متوسط قيمة الطلب', b2b: '$200–$2,000', b2c: '$50–$150' },
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '35–55%', b2c: '30–50%' },
      { metric: 'Cart Abandon Rate', metricAr: 'معدل التخلي عن السلة', b2b: '60–70%', b2c: '70–80%' },
      { metric: 'Repeat Purchase Rate', metricAr: 'معدل الشراء المتكرر', b2b: '50–70%', b2c: '20–40%' },
      { metric: 'Return Rate', metricAr: 'معدل الإرجاع', b2b: '5–10%', b2c: '15–30%' },
    ],
  },

  marketplace: {
    label: 'Marketplace',
    labelAr: 'منصة سوق',
    icon: Store,
    stages: {
      inquiry:    { label: 'Inquiry',    labelAr: 'استفسار',      color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Users,         defaultProb: 10 },
      matched:    { label: 'Matched',    labelAr: 'تم التطابق',   color: 'text-sky-600',    bg: 'bg-sky-50',      icon: UserCheck,     defaultProb: 30 },
      negotiating:{ label: 'Negotiating',labelAr: 'تفاوض',        color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: ArrowUpDown,   defaultProb: 50 },
      in_progress:{ label: 'In Progress',labelAr: 'قيد التنفيذ',  color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: Clock,         defaultProb: 75 },
      completed:  { label: 'Completed',  labelAr: 'مكتمل',        color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      cancelled:  { label: 'Cancelled',  labelAr: 'ملغى',         color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'completed', lostStage: 'cancelled',
    dealLabel: 'Transaction', dealLabelAr: 'معاملة',
    amountLabel: 'GMV', amountLabelAr: 'إجمالي قيمة المعاملات',
    extraFields: [
      { key: 'takeRatePct', label: 'Take Rate (%)', labelAr: 'نسبة العمولة (%)', type: 'number', placeholder: '10' },
      { key: 'buyerName', label: 'Buyer', labelAr: 'المشتري', type: 'text', placeholder: 'Buyer name' },
      { key: 'sellerName', label: 'Seller / Provider', labelAr: 'البائع / مزود الخدمة', type: 'text', placeholder: 'Seller name' },
      { key: 'category', label: 'Category', labelAr: 'الفئة', type: 'text', placeholder: 'e.g. Logistics' },
    ],
    kpiLabels: {
      revenue: 'Net Revenue (Take)', revenueAr: 'الإيراد الصافي (العمولة)',
      pipeline: 'Pending GMV', pipelineAr: 'GMV المعلق',
      weighted: 'Weighted GMV', weightedAr: 'GMV المرجّح',
      winRate: 'Completion Rate', winRateAr: 'معدل الإتمام',
    },
    unitEconLabels: {
      arpc: 'Avg GMV / Transaction', arpcAr: 'متوسط GMV لكل معاملة',
      ltv: 'Buyer LTV', ltvAr: 'القيمة الدائمة للمشتري',
      cac: 'CAC (Buyer)', cacAr: 'تكلفة اكتساب المشتري',
      payback: 'Payback Period', paybackAr: 'فترة الاسترداد',
      extraMetric: 'Avg Take Rate', extraMetricAr: 'متوسط نسبة العمولة',
    },
    benchmarks: [
      { metric: 'Take Rate', metricAr: 'نسبة العمولة', b2b: '5–15%', b2c: '10–25%' },
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '60–75%', b2c: '55–70%' },
      { metric: 'Completion Rate', metricAr: 'معدل الإتمام', b2b: '70–85%', b2c: '80–90%' },
      { metric: 'Repeat Rate', metricAr: 'معدل التكرار', b2b: '40–60%', b2c: '30–50%' },
      { metric: 'LTV/CAC', metricAr: 'نسبة LTV/CAC', b2b: '3–6x', b2c: '2–4x' },
    ],
  },

  agency: {
    label: 'Agency / Services',
    labelAr: 'وكالة / خدمات',
    icon: Briefcase,
    stages: {
      brief:      { label: 'Brief',      labelAr: 'موجز المشروع',  color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Users,         defaultProb: 15 },
      proposal:   { label: 'Proposal',   labelAr: 'عرض سعر',      color: 'text-sky-600',    bg: 'bg-sky-50',      icon: Clock,         defaultProb: 30 },
      scoping:    { label: 'Scoping',    labelAr: 'تحديد النطاق',  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: Activity,      defaultProb: 50 },
      contract:   { label: 'Contract',   labelAr: 'عقد',           color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: ArrowUpDown,   defaultProb: 75 },
      delivery:   { label: 'Delivery',   labelAr: 'تسليم',         color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      lost:       { label: 'Lost',       labelAr: 'خسارة',         color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'delivery', lostStage: 'lost',
    dealLabel: 'Project / Retainer', dealLabelAr: 'مشروع / عقد شهري',
    amountLabel: 'Project Value', amountLabelAr: 'قيمة المشروع',
    extraFields: [
      { key: 'projectType', label: 'Project Type', labelAr: 'نوع المشروع', type: 'select', options: ['Retainer', 'One-off', 'Hourly', 'Performance'] },
      { key: 'estimatedHours', label: 'Estimated Hours', labelAr: 'الساعات المقدرة', type: 'number', placeholder: '40' },
      { key: 'monthlyRetainer', label: 'Monthly Retainer', labelAr: 'الرسوم الشهرية', type: 'number', placeholder: '0' },
      { key: 'deliveryWeeks', label: 'Delivery Timeline (wks)', labelAr: 'مدة التسليم (أسابيع)', type: 'number', placeholder: '4' },
    ],
    kpiLabels: {
      revenue: 'Total Billed', revenueAr: 'إجمالي المبالغ المفوترة',
      pipeline: 'Active Pipeline', pipelineAr: 'خط الأنابيب النشط',
      weighted: 'Weighted Pipeline', weightedAr: 'خط الأنابيب المرجّح',
      winRate: 'Pitch Win Rate', winRateAr: 'معدل الفوز بالعروض',
    },
    unitEconLabels: {
      arpc: 'Avg Project Value', arpcAr: 'متوسط قيمة المشروع',
      ltv: 'Client LTV', ltvAr: 'القيمة الدائمة للعميل',
      cac: 'CAC', cacAr: 'تكلفة اكتساب العميل',
      payback: 'Payback Period', paybackAr: 'فترة الاسترداد',
      extraMetric: 'Revenue / FTE', extraMetricAr: 'الإيراد لكل موظف',
    },
    benchmarks: [
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '40–60%', b2c: '50–65%' },
      { metric: 'Win Rate (pitches)', metricAr: 'معدل الفوز بالعروض', b2b: '25–40%', b2c: '30–50%' },
      { metric: 'Avg Project Value', metricAr: 'متوسط قيمة المشروع', b2b: '$10k–$100k', b2c: '$1k–$10k' },
      { metric: 'Client Retention', metricAr: 'معدل الاحتفاظ بالعملاء', b2b: '70–85%', b2c: '50–70%' },
      { metric: 'Utilisation Rate', metricAr: 'معدل الاستخدام', b2b: '65–80%', b2c: '60–75%' },
    ],
  },

  hardware: {
    label: 'Hardware / IoT',
    labelAr: 'أجهزة / إنترنت الأشياء',
    icon: Cpu,
    stages: {
      lead:       { label: 'Lead',       labelAr: 'عميل محتمل',   color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Users,         defaultProb: 10 },
      demo:       { label: 'Demo / PoC', labelAr: 'عرض / إثبات', color: 'text-sky-600',    bg: 'bg-sky-50',      icon: Activity,      defaultProb: 25 },
      pilot:      { label: 'Pilot',      labelAr: 'تجربة تجريبية',color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: Package,       defaultProb: 50 },
      po_received:{ label: 'PO Received',labelAr: 'أمر شراء',     color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: CheckCircle2,  defaultProb: 85 },
      shipped:    { label: 'Shipped',    labelAr: 'تم الشحن',     color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      lost:       { label: 'Lost',       labelAr: 'خسارة',        color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'shipped', lostStage: 'lost',
    dealLabel: 'Order / Account', dealLabelAr: 'طلب / حساب',
    amountLabel: 'Order Value', amountLabelAr: 'قيمة الطلب',
    extraFields: [
      { key: 'units', label: 'Units', labelAr: 'الكمية', type: 'number', placeholder: '10' },
      { key: 'unitPrice', label: 'Unit Price', labelAr: 'سعر الوحدة', type: 'number', placeholder: '0' },
      { key: 'supportContract', label: 'Support Contract (mo)', labelAr: 'عقد الدعم (شهر)', type: 'number', placeholder: '12' },
      { key: 'hardwareCOGS', label: 'COGS per Unit', labelAr: 'تكلفة الوحدة', type: 'number', placeholder: '0' },
    ],
    kpiLabels: {
      revenue: 'Total Revenue', revenueAr: 'إجمالي الإيرادات',
      pipeline: 'Pipeline Value', pipelineAr: 'قيمة خط الأنابيب',
      weighted: 'Weighted Pipeline', weightedAr: 'خط الأنابيب المرجّح',
      winRate: 'Win Rate', winRateAr: 'معدل الفوز',
    },
    unitEconLabels: {
      arpc: 'Avg Order Value', arpcAr: 'متوسط قيمة الطلب',
      ltv: 'Customer LTV', ltvAr: 'القيمة الدائمة للعميل',
      cac: 'CAC', cacAr: 'تكلفة اكتساب العميل',
      payback: 'Payback Period', paybackAr: 'فترة الاسترداد',
      extraMetric: 'Gross Margin / Unit', extraMetricAr: 'هامش الربح لكل وحدة',
    },
    benchmarks: [
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '40–60%', b2c: '30–50%' },
      { metric: 'Win Rate', metricAr: 'معدل الفوز', b2b: '20–35%', b2c: '2–8%' },
      { metric: 'LTV/CAC', metricAr: 'نسبة LTV/CAC', b2b: '3–5x', b2c: '2–3x' },
      { metric: 'Avg Deal Size', metricAr: 'متوسط حجم الصفقة', b2b: '$5k–$500k', b2c: '$50–$500' },
      { metric: 'Sales Cycle', metricAr: 'دورة المبيعات', b2b: '3–12 mo', b2c: '1–7 days' },
    ],
  },

  procurement: {
    label: 'Procurement / Group Buying',
    labelAr: 'مشتريات كخدمة / شراء جماعي',
    icon: Package,
    stages: {
      lead:          { label: 'Lead Buyer',      labelAr: 'مشترٍ محتمل',    color: 'text-slate-600',  bg: 'bg-slate-100',   icon: Users,         defaultProb: 10 },
      qualification: { label: 'Qualification',   labelAr: 'تأهيل',          color: 'text-sky-600',    bg: 'bg-sky-50',      icon: UserCheck,     defaultProb: 20 },
      rfq:           { label: 'RFQ Sent',        labelAr: 'طلب عرض سعر',    color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',     icon: Activity,      defaultProb: 40 },
      negotiation:   { label: 'Negotiation',     labelAr: 'تفاوض',          color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30',   icon: ArrowUpDown,   defaultProb: 65 },
      po_received:   { label: 'PO Received',     labelAr: 'أمر شراء',       color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30',   icon: CheckCircle2,  defaultProb: 85 },
      fulfilled:     { label: 'Fulfilled',       labelAr: 'مُنجز',          color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',    icon: CheckCircle2,  defaultProb: 100 },
      lost:          { label: 'Lost',            labelAr: 'خسارة',          color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/30',      icon: XCircle,       defaultProb: 0 },
    },
    wonStage: 'fulfilled', lostStage: 'lost',
    dealLabel: 'Buyer / Order', dealLabelAr: 'مشترٍ / طلب',
    amountLabel: 'Procurement Volume', amountLabelAr: 'حجم المشتريات',
    extraFields: [
      { key: 'category', label: 'Product Category', labelAr: 'فئة المنتج', type: 'text', placeholder: 'e.g. Office Supplies' },
      { key: 'supplierCount', label: 'Suppliers Quoted', labelAr: 'عدد الموردين', type: 'number', placeholder: '3' },
      { key: 'savingsPct', label: 'Savings vs. Market (%)', labelAr: 'التوفير مقارنة بالسوق (%)', type: 'number', placeholder: '15' },
      { key: 'serviceFeePct', label: 'Service Fee (%)', labelAr: 'رسوم الخدمة (%)', type: 'number', placeholder: '2.5' },
    ],
    kpiLabels: {
      revenue: 'Total PVF', revenueAr: 'إجمالي حجم المشتريات',
      pipeline: 'Pipeline PVF', pipelineAr: 'خط أنابيب المشتريات',
      weighted: 'Weighted PVF', weightedAr: 'حجم المشتريات المرجّح',
      winRate: 'Conversion Rate', winRateAr: 'معدل التحويل',
    },
    unitEconLabels: {
      arpc: 'Avg Order Value (AOV)', arpcAr: 'متوسط قيمة الطلب',
      ltv: 'Buyer LTV', ltvAr: 'القيمة الدائمة للمشترٍ',
      cac: 'Buyer CAC', cacAr: 'تكلفة اكتساب المشترٍ',
      payback: 'CAC Payback', paybackAr: 'فترة استرداد التكلفة',
      extraMetric: 'Take Rate', extraMetricAr: 'معدل الأخذ',
    },
    benchmarks: [
      { metric: 'Take Rate', metricAr: 'معدل الأخذ', b2b: '1.5–5% of PVF', b2c: '3–8% of PVF' },
      { metric: 'Gross Margin', metricAr: 'هامش الربح الإجمالي', b2b: '25–50%', b2c: '20–40%' },
      { metric: 'Buyer Retention', metricAr: 'الاحتفاظ بالمشترين', b2b: '70–90%/yr', b2c: '40–65%/yr' },
      { metric: 'Avg Order Value', metricAr: 'متوسط قيمة الطلب', b2b: '$10k–$500k', b2c: '$200–$5k' },
      { metric: 'Savings vs Market', metricAr: 'التوفير مقارنة بالسوق', b2b: '10–30%', b2c: '5–20%' },
    ],
  },
};

// Must match server z.enum values
const CHANNELS: Array<'direct' | 'online' | 'referral' | 'partner' | 'inbound' | 'outbound' | 'other'> = ['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other'];
const CHANNEL_LABELS: Record<string, string> = { direct: 'Direct', online: 'Online', referral: 'Referral', partner: 'Partner', inbound: 'Inbound', outbound: 'Outbound', other: 'Other' };
const CHANNEL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

function fmt(n: number, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'SAR' ? 'SAR ' : currency === 'AED' ? 'AED ' : currency + ' ';
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function dateStr(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

function isoDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

const emptyForm = (): Omit<Deal, 'id' | 'createdAt'> => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  currency: 'USD',
  channel: 'direct',
  product: '',
  customer: '',
  dealStage: 'lead',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  dealValue: 0,
  probability: 10,
  expectedCloseDate: '',
  lostReason: '',
  nextAction: '',
  notes: '',
});

// ── Main Component ─────────────────────────────────────────────────────────
export default function SalesTracker() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [businessModel, setBusinessModel] = useState<BusinessModel>('saas');
  const [motion, setMotion] = useState<Motion>('b2b');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<Omit<Deal, 'id' | 'createdAt'>>(emptyForm());
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetAmount, setTargetAmount] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState('USD');

  // Unit Economics inputs
  const [cacInput, setCacInput] = useState(0);
  const [churnRatePct, setChurnRatePct] = useState(5);
  const [grossMarginPct, setGrossMarginPct] = useState(70);

  const cfg = MODEL_CONFIGS[businessModel];

  // ── tRPC ───────────────────────────────────────────────────────────────
  const { data: rawEntries = [], refetch } = trpc.sales.listEntries.useQuery({ limit: 500 });
  const { data: analyticsData } = trpc.sales.getAnalytics.useQuery();
  const { data: kpiBenchmarks } = trpc.sales.getKpiBenchmarks.useQuery();
  const entries: Deal[] = rawEntries as Deal[];
  const addMutation = trpc.sales.addEntry.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setForm(emptyForm()); setExtraValues({}); toast.success(isRTL ? 'تمت إضافة الصفقة' : 'Deal added'); } });
  const updateMutation = trpc.sales.updateEntry.useMutation({ onSuccess: () => { refetch(); setEditingDeal(null); toast.success(isRTL ? 'تم تحديث الصفقة' : 'Deal updated'); } });
  const deleteMutation = trpc.sales.deleteEntry.useMutation({ onSuccess: () => { refetch(); toast.success(isRTL ? 'تم حذف الصفقة' : 'Deal deleted'); } });
  const targetMutation = trpc.sales.setTarget.useMutation({ onSuccess: () => toast.success(isRTL ? 'تم حفظ الهدف' : 'Target saved') });
  const analyzeMutation = trpc.ai.analyzeCOGS.useMutation({
    onSuccess: (d: any) => setAiAnalysis(d?.analysis ?? ''),
    onError: () => toast.error(isRTL ? 'فشل التحليل' : 'AI analysis failed'),
  });

  // ── Computed ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = entries;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.customer.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        (d.contactName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, searchQuery]);

  const kpis = useMemo(() => {
    const won = entries.filter(d => d.dealStage === cfg.wonStage);
    const lost = entries.filter(d => d.dealStage === cfg.lostStage);
    const active = entries.filter(d => d.dealStage !== cfg.wonStage && d.dealStage !== cfg.lostStage);
    const totalRevenue = won.reduce((s, d) => s + d.amount, 0);
    const pipeline = active.reduce((s, d) => s + (d.dealValue ?? d.amount), 0);
    const weighted = active.reduce((s, d) => s + (d.dealValue ?? d.amount) * ((d.probability ?? 50) / 100), 0);
    const winRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    const avgDealSize = won.length > 0 ? totalRevenue / won.length : 0;
    return { totalRevenue, pipeline, weighted, winRate, avgDealSize, wonCount: won.length, lostCount: lost.length, activeCount: active.length };
  }, [entries, cfg]);

  const stageGroups = useMemo(() => {
    const groups: Record<string, Deal[]> = {};
    for (const stage of Object.keys(cfg.stages)) groups[stage] = [];
    for (const d of filtered) {
      if (groups[d.dealStage] !== undefined) groups[d.dealStage].push(d);
    }
    return groups;
  }, [filtered, cfg]);

  const channelData = useMemo(() => {
    const map: Record<string, { revenue: number; deals: number }> = {};
    for (const d of entries.filter(e => e.dealStage === cfg.wonStage)) {
      const ch = d.channel || 'Other';
      if (!map[ch]) map[ch] = { revenue: 0, deals: 0 };
      map[ch].revenue += d.amount;
      map[ch].deals++;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [entries, cfg]);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of entries.filter(e => e.dealStage === cfg.wonStage)) {
      const mo = new Date(d.date).toISOString().slice(0, 7);
      map[mo] = (map[mo] ?? 0) + d.amount;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue }));
  }, [entries, cfg]);

  const unitEcon = useMemo(() => {
    const won = entries.filter(d => d.dealStage === cfg.wonStage);
    const arpc = won.length > 0 ? won.reduce((s, d) => s + d.amount, 0) / won.length : 0;
    const churnDecimal = churnRatePct / 100;
    const ltv = churnDecimal > 0 ? arpc / churnDecimal : 0;
    const ltvCacRatio = cacInput > 0 ? ltv / cacInput : 0;
    const grossMarginDecimal = grossMarginPct / 100;
    const paybackMonths = cacInput > 0 && arpc * grossMarginDecimal > 0 ? cacInput / (arpc * grossMarginDecimal) : 0;
    const totalDeals = entries.length;
    const leadToQualified = totalDeals > 0 ? ((won.length + entries.filter(d => d.dealStage === cfg.lostStage).length + entries.filter(d => d.dealStage !== cfg.wonStage && d.dealStage !== cfg.lostStage && d.dealStage !== Object.keys(cfg.stages)[0]).length) / totalDeals) * 100 : 0;
    const qualifiedToWon = (won.length + entries.filter(d => d.dealStage === cfg.lostStage).length) > 0 ? (won.length / (won.length + entries.filter(d => d.dealStage === cfg.lostStage).length)) * 100 : 0;
    const closedWithDates = won.filter(d => d.createdAt && d.date);
    const avgCycleDays = closedWithDates.length > 0 ? closedWithDates.reduce((s, d) => { const cr = new Date(d.createdAt!).getTime(); const cl = new Date(d.date).getTime(); return s + Math.max(0, (cl - cr) / 86400000); }, 0) / closedWithDates.length : 0;
    const totalRev = won.reduce((s, d) => s + d.amount, 0);
    const customerRevMap: Record<string, number> = {};
    for (const d of won) customerRevMap[d.customer] = (customerRevMap[d.customer] ?? 0) + d.amount;
    const topCustomerRev = Object.values(customerRevMap).length > 0 ? Math.max(...Object.values(customerRevMap)) : 0;
    const topCustomerPct = totalRev > 0 ? (topCustomerRev / totalRev) * 100 : 0;
    return { arpc, ltv, ltvCacRatio, paybackMonths, leadToQualified, qualifiedToWon, avgCycleDays, topCustomerPct };
  }, [entries, cfg, cacInput, churnRatePct, grossMarginPct]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    const firstStage = Object.keys(cfg.stages)[0];
    setForm({ ...emptyForm(), dealStage: firstStage, probability: cfg.stages[firstStage].defaultProb });
    setExtraValues({});
    setEditingDeal(null);
    setShowForm(true);
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      date: isoDate(deal.date),
      amount: deal.amount,
      currency: deal.currency,
      channel: (deal.channel as any) ?? 'direct',
      product: deal.product,
      customer: deal.customer,
      dealStage: deal.dealStage,
      contactName: deal.contactName ?? '',
      contactEmail: deal.contactEmail ?? '',
      contactPhone: deal.contactPhone ?? '',
      dealValue: deal.dealValue ?? 0,
      probability: deal.probability ?? cfg.stages[deal.dealStage]?.defaultProb ?? 50,
      expectedCloseDate: isoDate(deal.expectedCloseDate),
      lostReason: deal.lostReason ?? '',
      nextAction: deal.nextAction ?? '',
      notes: deal.notes ?? '',
    });
    setExtraValues({});
    setShowForm(true);
  };

  const setField = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleStageChange = (stage: string) => {
    setField('dealStage', stage);
    setField('probability', cfg.stages[stage]?.defaultProb ?? 50);
  };

  const handleSubmit = () => {
    const dateStr2 = typeof form.date === 'string' ? form.date : new Date(form.date).toISOString().split('T')[0];
    // Embed extra fields in notes as JSON prefix
    const extraJson = Object.keys(extraValues).length > 0 ? `[EXTRA:${JSON.stringify(extraValues)}] ` : '';
    type ValidChannel = 'direct' | 'online' | 'referral' | 'partner' | 'inbound' | 'outbound' | 'other';
    const validChannels: ValidChannel[] = ['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other'];
    const safeChannel: ValidChannel = validChannels.includes(form.channel as ValidChannel) ? (form.channel as ValidChannel) : 'direct';
    // Map adaptive model stages to server-side enum
    type ValidStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    const serverStages: ValidStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const stageToServer = (s: string): ValidStage => {
      if (serverStages.includes(s as ValidStage)) return s as ValidStage;
      if (s === cfg.wonStage) return 'closed_won';
      if (s === cfg.lostStage) return 'closed_lost';
      const idx = Object.keys(cfg.stages).indexOf(s);
      const serverMap: ValidStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      return serverMap[Math.min(idx, serverMap.length - 3)] ?? 'lead';
    };
    const safeStage = stageToServer(form.dealStage);
    const payload = {
      ...form,
      channel: safeChannel,
      dealStage: safeStage,
      date: dateStr2,
      amount: Number(form.amount) || 0,
      dealValue: Number(form.dealValue) || undefined,
      probability: Number(form.probability) || undefined,
      expectedCloseDate: form.expectedCloseDate ? String(form.expectedCloseDate) : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      lostReason: form.lostReason || undefined,
      nextAction: form.nextAction || undefined,
      notes: extraJson + (form.notes || ''),
    };
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleAI = useCallback(() => {
    analyzeMutation.mutate({
      businessModel: businessModel as any,
      totalCOGS: 0,
      grossMarginPct,
      totalOpEx: 0,
      ebitda: kpis.totalRevenue,
      directCosts: [],
      indirectCosts: channelData.slice(0, 3).map(c => ({ name: c.name, amount: c.revenue, category: 'sales' as const })),
      monthlyRevenue: kpis.totalRevenue,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
    setActiveTab('ai');
  }, [entries, kpis, channelData, businessModel, grossMarginPct, lang]);

  const currency = entries[0]?.currency ?? 'USD';

  // ── Deal Card ──────────────────────────────────────────────────────────
  const DealCard = ({ deal }: { deal: Deal }) => {
    const stageCfg = cfg.stages[deal.dealStage];
    const isExpanded = expandedDeal === deal.id;
    if (!stageCfg) return null;
    return (
      <div className={`rounded-lg border border-border bg-card shadow-sm transition-all ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
        <div
          className="p-2.5 cursor-pointer"
          onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{deal.customer || '—'}</p>
              {deal.product && <p className="text-[10px] text-muted-foreground truncate">{deal.product}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); openEdit(deal); }} className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); deleteMutation.mutate({ id: deal.id }); }} className="p-1 rounded hover:bg-red-50 dark:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-bold text-foreground">{fmt(deal.dealValue ?? deal.amount, deal.currency)}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${stageCfg.bg} ${stageCfg.color}`}>{deal.probability ?? stageCfg.defaultProb}%</span>
          </div>
        </div>
        {isExpanded && (
          <div className="px-2.5 pb-2.5 pt-0 border-t border-border/50 space-y-1.5 text-[10px] text-muted-foreground">
            {deal.contactName && <div className="flex items-center gap-1"><Users className="w-3 h-3" />{deal.contactName}</div>}
            {deal.contactEmail && <div className="flex items-center gap-1"><span>✉</span>{deal.contactEmail}</div>}
            {deal.expectedCloseDate && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />Close: {dateStr(deal.expectedCloseDate)}</div>}
            {deal.nextAction && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />{deal.nextAction}</div>}
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 w-full min-w-0">

      {/* ── Model Selector ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            {isRTL ? 'نموذج العمل' : 'Business Model'}
          </Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODEL_CONFIGS) as BusinessModel[]).map(m => {
              const mc = MODEL_CONFIGS[m];
              const Icon = mc.icon;
              return (
                <button
                  key={m}
                  onClick={() => { setBusinessModel(m); setActiveTab('pipeline'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    businessModel === m
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {isRTL ? mc.labelAr : mc.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="shrink-0">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            {isRTL ? 'نوع السوق' : 'Market Motion'}
          </Label>
          <div className="flex gap-2">
            {(['b2b', 'b2c'] as Motion[]).map(m => (
              <button
                key={m}
                onClick={() => setMotion(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  motion === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {(() => { const Icon = cfg.icon; return <Icon className="w-5 h-5 text-primary" />; })()}
            {isRTL ? cfg.labelAr : cfg.label} {motion.toUpperCase()} {isRTL ? 'متتبع المبيعات' : 'Sales Tracker'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRTL
              ? `${Object.keys(cfg.stages).length} مراحل · ${cfg.extraFields.length} حقول مخصصة · اقتصاديات الوحدة`
              : `${Object.keys(cfg.stages).length} stages · ${cfg.extraFields.length} custom fields · unit economics`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAI} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            {isRTL ? 'تحليل ذكاء اصطناعي' : 'AI Analysis'}
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            {isRTL ? `إضافة ${cfg.dealLabelAr}` : `Add ${cfg.dealLabel}`}
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
        {[
          { label: isRTL ? cfg.kpiLabels.revenueAr : cfg.kpiLabels.revenue, value: fmt(kpis.totalRevenue, currency), sub: isRTL ? `${kpis.wonCount} ${cfg.dealLabelAr} مُغلق` : `${kpis.wonCount} ${cfg.dealLabel}s closed`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', accent: 'border-l-4 border-l-emerald-500' },
          { label: isRTL ? cfg.kpiLabels.pipelineAr : cfg.kpiLabels.pipeline, value: fmt(kpis.pipeline, currency), sub: isRTL ? `${kpis.activeCount} نشط` : `${kpis.activeCount} active`, icon: GitMerge, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', accent: 'border-l-4 border-l-blue-500' },
          { label: isRTL ? cfg.kpiLabels.weightedAr : cfg.kpiLabels.weighted, value: fmt(kpis.weighted, currency), sub: isRTL ? 'مُعدَّل حسب الاحتمالية' : 'probability-adjusted', icon: BarChart3, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', accent: 'border-l-4 border-l-violet-500' },
          { label: isRTL ? cfg.kpiLabels.winRateAr : cfg.kpiLabels.winRate, value: `${kpis.winRate.toFixed(1)}%`, sub: isRTL ? `متوسط الصفقة: ${fmt(kpis.avgDealSize, currency)}` : `Avg deal: ${fmt(kpis.avgDealSize, currency)}`, icon: TrendingUp, color: kpis.winRate >= 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500', bg: kpis.winRate >= 25 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30', accent: kpis.winRate >= 25 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-orange-400' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col gap-2 min-w-0 overflow-hidden ${card.accent}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div>
              <p className={`text-lg font-bold tracking-tight truncate ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="pipeline">{isRTL ? 'خط الأنابيب' : 'Pipeline'}</TabsTrigger>
          <TabsTrigger value="list">{isRTL ? `قائمة ${cfg.dealLabelAr}` : `${cfg.dealLabel} List`}</TabsTrigger>
          <TabsTrigger value="revenue">{isRTL ? 'الإيرادات' : 'Revenue'}</TabsTrigger>
          <TabsTrigger value="channels">{isRTL ? 'القنوات' : 'Channels'}</TabsTrigger>
          <TabsTrigger value="unit-econ">{isRTL ? 'اقتصاديات الوحدة' : 'Unit Economics'}</TabsTrigger>
          <TabsTrigger value="analytics">{isRTL ? 'التحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="targets">{isRTL ? 'الأهداف' : 'Targets'}</TabsTrigger>
          <TabsTrigger value="ai">{isRTL ? 'تحليل ذكاء اصطناعي' : 'AI Analysis'}</TabsTrigger>
        </TabsList>

        {/* ── PIPELINE (Kanban) ── */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isRTL ? `بحث في ${cfg.dealLabelAr}…` : `Search ${cfg.dealLabel}s…`} className="pl-9 h-9" />
            </div>
            <div className="text-xs text-muted-foreground shrink-0">
              {isRTL ? `${filtered.length} ${cfg.dealLabelAr}` : `${filtered.length} ${cfg.dealLabel}s`}
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {(Object.keys(cfg.stages) as string[]).map(stage => {
                const stageCfg = cfg.stages[stage];
                const deals = stageGroups[stage] ?? [];
                const total = deals.reduce((s, d) => s + (d.dealValue ?? d.amount), 0);
                const isWon = stage === cfg.wonStage;
                const isLost = stage === cfg.lostStage;
                return (
                  <div key={stage} className="flex flex-col w-[200px] shrink-0">
                    <div className={`rounded-t-xl px-3 py-2.5 ${stageCfg.bg} border border-b-0 border-border`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <stageCfg.icon className={`w-3.5 h-3.5 ${stageCfg.color}`} />
                          <span className={`text-xs font-bold ${stageCfg.color}`}>{isRTL ? stageCfg.labelAr : stageCfg.label}</span>
                        </div>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${stageCfg.bg} ${stageCfg.color} border border-current/20`}>{deals.length}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{fmt(total, currency)}</p>
                    </div>
                    <div className={`flex-1 space-y-2 p-2 rounded-b-xl border border-t-0 border-border min-h-[200px] ${isWon ? 'bg-emerald-50 dark:bg-emerald-950/30/40' : isLost ? 'bg-red-50 dark:bg-red-950/30/40' : 'bg-muted/10'}`}>
                      {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                      {deals.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-1">
                          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                            <stageCfg.icon className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/60">{isRTL ? `لا توجد ${cfg.dealLabelAr}` : `No ${cfg.dealLabel}s`}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── DEAL LIST ── */}
        <TabsContent value="list" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isRTL ? `بحث…` : `Search…`} className="pl-9 h-9" />
            </div>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                {isRTL ? `لا توجد ${cfg.dealLabelAr} بعد. أضف أول ${cfg.dealLabelAr}.` : `No ${cfg.dealLabel}s yet. Add your first ${cfg.dealLabel}.`}
              </div>
            )}
            {filtered.map(deal => {
              const stageCfg = cfg.stages[deal.dealStage];
              if (!stageCfg) return null;
              return (
                <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-8 rounded-full shrink-0 ${stageCfg.bg.replace('bg-', 'bg-').replace('-50', '-400').replace('-100', '-400')}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{deal.customer}</p>
                      <p className="text-xs text-muted-foreground truncate">{deal.product} · {dateStr(deal.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${stageCfg.color} ${stageCfg.bg} border-0`}>{isRTL ? stageCfg.labelAr : stageCfg.label}</Badge>
                    <span className="text-sm font-bold text-foreground">{fmt(deal.amount, deal.currency)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(deal)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate({ id: deal.id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── REVENUE ── */}
        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{isRTL ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">{isRTL ? 'لا توجد بيانات إيرادات بعد.' : 'No revenue data yet.'}</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip formatter={(v: number) => fmt(v, currency)} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHANNELS ── */}
        <TabsContent value="channels" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{isRTL ? 'الإيرادات حسب القناة' : 'Revenue by Channel'}</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {channelData.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">{isRTL ? 'لا توجد بيانات قنوات بعد.' : 'No channel data yet.'}</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={channelData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {channelData.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {channelData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} /><span>{c.name}</span></div>
                        <div className="flex items-center gap-4"><span className="text-muted-foreground">{c.deals} {isRTL ? cfg.dealLabelAr : cfg.dealLabel}s</span><span className="font-medium">{fmt(c.revenue, currency)}</span></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── UNIT ECONOMICS ── */}
        <TabsContent value="unit-econ" className="mt-4 space-y-5">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                {isRTL ? 'مدخلات اقتصاديات الوحدة' : 'Unit Economics Inputs'}
                <Badge variant="outline" className="text-[10px] ml-2">{motion.toUpperCase()} · {isRTL ? cfg.labelAr : cfg.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">{isRTL ? cfg.unitEconLabels.cacAr : cfg.unitEconLabels.cac} ({currency})</Label>
                  <Input type="number" min={0} value={cacInput || ''} onChange={e => setCacInput(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">{isRTL ? 'إجمالي الإنفاق على التسويق والمبيعات ÷ عدد العملاء الجدد' : 'Total sales & marketing spend ÷ new customers'}</p>
                </div>
                <div>
                  <Label className="text-xs">{isRTL ? 'معدل التراجع الشهري (%)' : 'Monthly Churn Rate (%)'}</Label>
                  <Input type="number" min={0} max={100} step={0.1} value={churnRatePct || ''} onChange={e => setChurnRatePct(parseFloat(e.target.value) || 0)} placeholder="5" className="mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">{isRTL ? 'نسبة العملاء الذين يتوقفون شهرياً' : '% of customers who stop each month'}</p>
                </div>
                <div>
                  <Label className="text-xs">{isRTL ? 'هامش الربح الإجمالي (%)' : 'Gross Margin (%)'}</Label>
                  <Input type="number" min={0} max={100} step={1} value={grossMarginPct || ''} onChange={e => setGrossMarginPct(parseFloat(e.target.value) || 0)} placeholder="70" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
            {[
              { label: isRTL ? cfg.unitEconLabels.arpcAr : cfg.unitEconLabels.arpc, value: fmt(unitEcon.arpc, currency), sub: isRTL ? `من ${kpis.wonCount} ${cfg.dealLabelAr} مُغلق` : `from ${kpis.wonCount} closed ${cfg.dealLabel}s`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', accent: 'border-l-4 border-l-emerald-500' },
              { label: isRTL ? cfg.unitEconLabels.ltvAr : cfg.unitEconLabels.ltv, value: unitEcon.ltv > 0 ? fmt(unitEcon.ltv, currency) : '—', sub: isRTL ? `عند ${churnRatePct}% معدل تراجع` : `at ${churnRatePct}% churn`, icon: Repeat, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', accent: 'border-l-4 border-l-blue-500' },
              { label: isRTL ? 'نسبة LTV/CAC' : 'LTV / CAC Ratio', value: cacInput > 0 ? `${unitEcon.ltvCacRatio.toFixed(1)}x` : '—', sub: unitEcon.ltvCacRatio >= 3 ? (isRTL ? '✓ ممتاز (≥ 3x)' : '✓ Excellent (≥ 3x)') : unitEcon.ltvCacRatio >= 1 ? (isRTL ? '⚠ مقبول (1–3x)' : '⚠ Acceptable (1–3x)') : (isRTL ? '✗ تحت الهدف' : '✗ Below target'), icon: Activity, color: unitEcon.ltvCacRatio >= 3 ? 'text-emerald-600 dark:text-emerald-400' : unitEcon.ltvCacRatio >= 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500', bg: unitEcon.ltvCacRatio >= 3 ? 'bg-emerald-100 dark:bg-emerald-900/30' : unitEcon.ltvCacRatio >= 1 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30', accent: unitEcon.ltvCacRatio >= 3 ? 'border-l-4 border-l-emerald-500' : unitEcon.ltvCacRatio >= 1 ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-red-400' },
              { label: isRTL ? cfg.unitEconLabels.paybackAr : cfg.unitEconLabels.payback, value: cacInput > 0 && unitEcon.paybackMonths > 0 ? `${unitEcon.paybackMonths.toFixed(1)} ${isRTL ? 'شهر' : 'mo'}` : '—', sub: unitEcon.paybackMonths > 0 && unitEcon.paybackMonths <= 12 ? (isRTL ? '✓ جيد (≤ 12 شهر)' : '✓ Good (≤ 12 mo)') : unitEcon.paybackMonths > 12 ? (isRTL ? '⚠ طويل (> 12 شهر)' : '⚠ Long (> 12 mo)') : (isRTL ? 'أدخل CAC للحساب' : 'Enter CAC to compute'), icon: Clock, color: unitEcon.paybackMonths > 0 && unitEcon.paybackMonths <= 12 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500', bg: unitEcon.paybackMonths > 0 && unitEcon.paybackMonths <= 12 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30', accent: unitEcon.paybackMonths > 0 && unitEcon.paybackMonths <= 12 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-orange-400' },
            ].map(card => (
              <div key={card.label} className={`rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col gap-2 min-w-0 overflow-hidden ${card.accent}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}><card.icon className={`w-4 h-4 ${card.color}`} /></div>
                </div>
                <div>
                  <p className={`text-lg font-bold tracking-tight truncate ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Funnel + Velocity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{isRTL ? 'قمع التحويل' : 'Conversion Funnel'}</CardTitle></CardHeader>
              <CardContent className="pb-4 space-y-3">
                {[
                  { label: isRTL ? `إجمالي ${cfg.dealLabelAr}` : `Total ${cfg.dealLabel}s`, value: entries.length, pct: 100, color: 'bg-blue-500' },
                  { label: isRTL ? 'مؤهلة وما فوق' : 'Qualified & Above', value: entries.filter(d => d.dealStage !== Object.keys(cfg.stages)[0]).length, pct: unitEcon.leadToQualified, color: 'bg-violet-500' },
                  { label: isRTL ? `${cfg.dealLabelAr} مُكتملة` : `${cfg.dealLabel}s Won`, value: kpis.wonCount, pct: unitEcon.qualifiedToWon, color: 'bg-emerald-500' },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold text-foreground">{row.value} ({row.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{isRTL ? 'مؤشرات سرعة المبيعات' : 'Sales Velocity'}</CardTitle></CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {[
                    { label: isRTL ? 'متوسط دورة الإغلاق' : 'Avg Deal Cycle', value: unitEcon.avgCycleDays > 0 ? `${unitEcon.avgCycleDays.toFixed(0)} ${isRTL ? 'يوم' : 'days'}` : '—', tip: isRTL ? 'من إنشاء الصفقة حتى الإغلاق' : 'From creation to close' },
                    { label: isRTL ? cfg.kpiLabels.winRateAr : cfg.kpiLabels.winRate, value: `${kpis.winRate.toFixed(1)}%`, tip: isRTL ? `${kpis.wonCount} فوز من ${kpis.wonCount + kpis.lostCount} مُغلق` : `${kpis.wonCount} won of ${kpis.wonCount + kpis.lostCount} closed` },
                    { label: isRTL ? 'تركّز الإيرادات' : 'Revenue Concentration', value: unitEcon.topCustomerPct > 0 ? `${unitEcon.topCustomerPct.toFixed(1)}%` : '—', tip: unitEcon.topCustomerPct > 30 ? (isRTL ? '⚠ تركّز مرتفع — تنويع موصى به' : '⚠ High concentration — diversify') : (isRTL ? '✓ توزيع صحي' : '✓ Healthy distribution') },
                    { label: isRTL ? `متوسط حجم ${cfg.dealLabelAr}` : `Avg ${cfg.dealLabel} Size`, value: fmt(kpis.avgDealSize, currency), tip: isRTL ? 'من الصفقات المُغلقة' : 'From closed deals' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-xs font-medium text-foreground">{row.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{row.tip}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0 ml-3">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benchmarks */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">{isRTL ? `معايير الصناعة — ${cfg.labelAr}` : `Industry Benchmarks — ${cfg.label}`}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">{isRTL ? 'المقياس' : 'Metric'}</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">{isRTL ? 'قيمتك' : 'Your Value'}</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">B2B</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">B2C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cfg.benchmarks.map(row => {
                      let yourValue = '—';
                      if (row.metric === 'LTV/CAC' || row.metricAr === 'نسبة LTV/CAC') yourValue = cacInput > 0 ? `${unitEcon.ltvCacRatio.toFixed(1)}x` : '—';
                      else if (row.metric.includes('Win Rate') || row.metricAr.includes('الفوز')) yourValue = `${kpis.winRate.toFixed(1)}%`;
                      else if (row.metric.includes('Gross Margin') || row.metricAr.includes('هامش الربح الإجمالي')) yourValue = `${grossMarginPct}%`;
                      else if (row.metric.includes('Payback') || row.metricAr.includes('الاسترداد')) yourValue = cacInput > 0 && unitEcon.paybackMonths > 0 ? `${unitEcon.paybackMonths.toFixed(1)} mo` : '—';
                      else if (row.metric.includes('AOV') || row.metric.includes('Avg Order') || row.metricAr.includes('متوسط قيمة')) yourValue = fmt(unitEcon.arpc, currency);
                      return (
                        <tr key={row.metric} className="border-b border-border/50 last:border-0">
                          <td className="py-2 font-medium text-foreground">{isRTL ? row.metricAr : row.metric}</td>
                          <td className="py-2 text-center font-bold text-primary">{yourValue}</td>
                          <td className={`py-2 text-center ${motion === 'b2b' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{row.b2b}</td>
                          <td className={`py-2 text-center ${motion === 'b2c' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{row.b2c}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                {isRTL ? `المصدر: SaaStr، OpenView، Bessemer Venture Partners 2024 — المعيار النشط: ${motion.toUpperCase()} (굵게)` : `Source: SaaStr, OpenView, Bessemer VP 2024 — Active benchmark: ${motion.toUpperCase()} (bold)`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ANALYTICS ── */}
        <TabsContent value="analytics" className="mt-4 space-y-5">
          {/* Top KPI Row: MRR / ARR / YTD / LTD */}
          {(() => {
            const s = analyticsData?.summary;
            const hasRevenue = s && s.ltd > 0;
            const isNewStartup = !hasRevenue;

            // Helper: format growth badge
            const GrowthBadge = ({ pct, label }: { pct: number | null | undefined; label: string }) => {
              if (pct === null || pct === undefined) return <span className="text-xs text-muted-foreground">{isRTL ? 'لا توجد بيانات كافية' : 'Not enough data'}</span>;
              const isPos = pct >= 0;
              return (
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}>
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(pct).toFixed(1)}% {label}
                </span>
              );
            };

            return (
              <>
                {/* Early-stage banner */}
                {isNewStartup && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <Rocket className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{isRTL ? 'مرحبًا بك في مرحلة الإطلاق!' : 'Welcome to Launch Stage!'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{isRTL ? 'أضف أول صفقة مُغلقة لبدء حساب MRR وARR وYTD وLTD تلقائيًا.' : 'Add your first Closed Won deal and MRR, ARR, YTD, and LTD will calculate automatically.'}</p>
                    </div>
                  </div>
                )}

                {/* MRR / ARR / YTD / LTD cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'MRR',
                      labelAr: 'الإيراد الشهري المتكرر',
                      value: s ? fmt(s.mrr, currency) : '—',
                      sub: s?.lastMonthWithData ? (isRTL ? `آخر شهر: ${s.lastMonthWithData}` : `Latest month: ${s.lastMonthWithData}`) : (isRTL ? 'لا توجد إيرادات بعد' : 'No revenue yet'),
                      icon: DollarSign,
                      color: 'text-emerald-600 dark:text-emerald-400',
                      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                      accent: 'border-l-4 border-l-emerald-500',
                      growth: s ? <GrowthBadge pct={s.momGrowthPct} label={isRTL ? 'شهريًا' : 'MoM'} /> : null,
                    },
                    {
                      label: 'ARR',
                      labelAr: 'الإيراد السنوي المتكرر',
                      value: s ? fmt(s.arr, currency) : '—',
                      sub: isRTL ? 'MRR × 12 (تقدير)' : 'MRR × 12 (annualised)',
                      icon: TrendingUp,
                      color: 'text-blue-600 dark:text-blue-400',
                      bg: 'bg-blue-100 dark:bg-blue-900/30',
                      accent: 'border-l-4 border-l-blue-500',
                      growth: s ? <GrowthBadge pct={s.qoqGrowthPct} label={isRTL ? 'ربع سنوي' : 'QoQ'} /> : null,
                    },
                    {
                      label: 'YTD',
                      labelAr: 'الإيراد منذ بداية العام',
                      value: s ? fmt(s.ytd, currency) : '—',
                      sub: isRTL ? `إيرادات ${new Date().getFullYear()}` : `Revenue in ${new Date().getFullYear()}`,
                      icon: Calendar,
                      color: 'text-violet-600 dark:text-violet-400',
                      bg: 'bg-violet-100 dark:bg-violet-900/30',
                      accent: 'border-l-4 border-l-violet-500',
                      growth: null,
                    },
                    {
                      label: 'LTD',
                      labelAr: 'الإيراد منذ الإطلاق',
                      value: s ? fmt(s.ltd, currency) : '—',
                      sub: s?.firstRevenueDate
                        ? (isRTL ? `منذ ${new Date(s.firstRevenueDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' })}` : `Since ${new Date(s.firstRevenueDate).toLocaleDateString('en', { year: 'numeric', month: 'short' })}`)
                        : (isRTL ? 'لا توجد إيرادات بعد' : 'No revenue yet'),
                      icon: CalendarRange,
                      color: 'text-orange-600 dark:text-orange-400',
                      bg: 'bg-orange-100 dark:bg-orange-900/30',
                      accent: 'border-l-4 border-l-orange-500',
                      growth: null,
                    },
                  ].map(card => (
                    <div key={card.label} className={`rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col gap-2 min-w-0 overflow-hidden ${card.accent}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">{card.label}</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}>
                          <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                      </div>
                      <div>
                        <p className={`text-xl font-bold tracking-tight truncate ${card.color}`}>{card.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
                      </div>
                      {card.growth && <div className="mt-0.5">{card.growth}</div>}
                    </div>
                  ))}
                </div>

                {/* Growth trend chart */}
                {(analyticsData?.monthly?.length ?? 0) > 1 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {isRTL ? 'اتجاه الإيرادات الشهرية' : 'Monthly Revenue Trend'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={analyticsData!.monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <Tooltip formatter={(v: number) => fmt(v, currency)} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Quarterly breakdown */}
                {(analyticsData?.quarterly?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm">{isRTL ? 'الإيرادات الفصلية' : 'Quarterly Revenue'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData!.quarterly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <Tooltip formatter={(v: number) => fmt(v, currency)} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* MoM growth table */}
                {(analyticsData?.monthly?.length ?? 0) > 1 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm">{isRTL ? 'النمو الشهري (MoM)' : 'Month-over-Month Growth'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-muted-foreground font-medium">{isRTL ? 'الشهر' : 'Month'}</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">{isRTL ? 'الإيراد' : 'Revenue'}</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">{isRTL ? 'النمو' : 'Growth'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(analyticsData?.monthly ?? [])].reverse().map(row => (
                              <tr key={row.month} className="border-b border-border/50 last:border-0">
                                <td className="py-2 text-foreground font-medium">{row.month}</td>
                                <td className="py-2 text-right font-semibold text-foreground">{fmt(row.revenue, currency)}</td>
                                <td className="py-2 text-right">
                                  {row.momGrowth !== null ? (
                                    <span className={`font-semibold ${
                                      row.momGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                                    }`}>
                                      {row.momGrowth >= 0 ? '+' : ''}{row.momGrowth.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              {/* ── KPI Benchmarking Section ── */}
              {kpiBenchmarks && (
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-2 pt-2">
                    <Award className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      {isRTL ? 'مقاييس الأداء ومعايير الصناعة' : 'KPI Benchmarks vs. Industry'}
                    </h3>
                    <span className="ml-auto text-[10px] text-muted-foreground capitalize">
                      {kpiBenchmarks.businessModel} · {kpiBenchmarks.sector || (isRTL ? 'عام' : 'General')}
                    </span>
                  </div>

                  {/* North Star Metric Card */}
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            {isRTL ? '★ النجم الشمالي' : '★ North Star Metric'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {isRTL ? kpiBenchmarks.northStar.labelAr : kpiBenchmarks.northStar.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {isRTL ? kpiBenchmarks.northStar.whyAr : kpiBenchmarks.northStar.why}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {kpiBenchmarks.northStar.actual !== null ? (
                          <>
                            <p className="text-xl font-bold text-primary">
                              {kpiBenchmarks.northStar.key === 'arr'
                                ? fmt(kpiBenchmarks.northStar.actual, currency)
                                : kpiBenchmarks.northStar.key === 'revenue_per_employee'
                                ? fmt(kpiBenchmarks.northStar.actual, currency)
                                : `${kpiBenchmarks.northStar.actual.toFixed(1)}${kpiBenchmarks.northStar.unit === '%' ? '%' : ''}`
                              }
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {kpiBenchmarks.northStar.unit === '$' ? (isRTL ? 'الإيراد السنوي' : 'Annualised') : (isRTL ? 'الشهر الأخير' : 'Latest month')}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">{isRTL ? 'أدخل بيانات' : 'Add data'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* KPI vs Benchmark rows */}
                  {!kpiBenchmarks.hasRevenueData && !kpiBenchmarks.hasProfileData ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                      <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {isRTL
                          ? 'أضف صفقات مُغلقة أو أكمل ملف شركتك الناشئة (الهامش الإجمالي، معدل التراجع، LTV، CAC) لرؤية مقاييس الأداء.'
                          : 'Add closed-won deals or complete your startup profile (Gross Margin, Churn Rate, LTV, CAC) to see your KPI benchmarks.'}
                      </p>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          {isRTL ? 'مقاييسك مقابل معايير الصناعة' : 'Your KPIs vs. Industry Benchmarks'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="space-y-3">
                          {kpiBenchmarks.kpis.map(kpi => {
                            const hasData = kpi.actual !== null;
                            const statusColors: Record<string, string> = {
                              excellent: 'text-emerald-600 dark:text-emerald-400',
                              good: 'text-blue-600 dark:text-blue-400',
                              fair: 'text-amber-600 dark:text-amber-400',
                              poor: 'text-red-500',
                              'no-data': 'text-muted-foreground',
                            };
                            const statusBg: Record<string, string> = {
                              excellent: 'bg-emerald-100 dark:bg-emerald-900/30',
                              good: 'bg-blue-100 dark:bg-blue-900/30',
                              fair: 'bg-amber-100 dark:bg-amber-900/30',
                              poor: 'bg-red-100 dark:bg-red-900/30',
                              'no-data': 'bg-muted',
                            };
                            const statusLabel: Record<string, string> = {
                              excellent: isRTL ? 'ممتاز' : 'Excellent',
                              good: isRTL ? 'جيد' : 'Good',
                              fair: isRTL ? 'مقبول' : 'Fair',
                              poor: isRTL ? 'يحتاج تحسين' : 'Needs work',
                              'no-data': isRTL ? 'لا توجد بيانات' : 'No data',
                            };

                            // Compute gauge fill %
                            let gaugePct = 0;
                            if (hasData && kpi.actual !== null) {
                              if (kpi.lowerIsBetter) {
                                const worst = (kpi.fair.max ?? 100) * 1.5;
                                gaugePct = Math.max(0, Math.min(100, 100 - (kpi.actual / worst) * 100));
                              } else {
                                const target = kpi.excellent.min;
                                gaugePct = Math.min(100, (kpi.actual / target) * 100);
                              }
                            }

                            return (
                              <div key={kpi.key} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                      {isRTL ? kpi.labelAr : kpi.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {isRTL ? 'المعيار:' : 'Benchmark:'} {kpi.benchmarkLabel} · {kpi.source}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {hasData && kpi.actual !== null ? (
                                      <span className={`text-sm font-bold ${statusColors[kpi.status]}`}>
                                        {kpi.unit === '$' ? fmt(kpi.actual, currency)
                                          : kpi.unit === 'x' ? `${kpi.actual.toFixed(1)}x`
                                          : kpi.unit === 'months' ? `${kpi.actual.toFixed(0)} mo`
                                          : kpi.unit === 'score' ? kpi.actual.toFixed(0)
                                          : `${kpi.actual.toFixed(1)}%`
                                        }
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[kpi.status]} ${statusBg[kpi.status]}`}>
                                      {statusLabel[kpi.status]}
                                    </span>
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      kpi.status === 'excellent' ? 'bg-emerald-500'
                                      : kpi.status === 'good' ? 'bg-blue-500'
                                      : kpi.status === 'fair' ? 'bg-amber-500'
                                      : kpi.status === 'poor' ? 'bg-red-500'
                                      : 'bg-muted-foreground/30'
                                    }`}
                                    style={{ width: `${hasData ? gaugePct : 0}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Industry context note */}
                  {kpiBenchmarks.industryNote && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/30">
                      <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-foreground mb-0.5">
                          {isRTL ? kpiBenchmarks.industryNote.labelAr : kpiBenchmarks.industryNote.label} {isRTL ? '— ملاحظات الصناعة' : '— Industry Notes'}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {isRTL ? kpiBenchmarks.industryNote.notesAr : kpiBenchmarks.industryNote.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Profile data prompt */}
                  {kpiBenchmarks.hasRevenueData && !kpiBenchmarks.hasProfileData && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        {isRTL
                          ? 'أكمل ملف شركتك الناشئة (الهامش الإجمالي، معدل التراجع، LTV، CAC) للحصول على مقارنة أكثر دقة.'
                          : 'Complete your startup profile (Gross Margin, Churn Rate, LTV, CAC) for more accurate benchmark comparisons.'}
                      </p>
                      <ArrowRight className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 ml-auto" />
                    </div>
                  )}
                </div>
              )}
              </>
            );
          })()}
        </TabsContent>

        {/* ── TARGETS ── */}
        <TabsContent value="targets" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{isRTL ? 'هدف المبيعات الشهري' : 'Monthly Sales Target'}</CardTitle></CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{isRTL ? 'الشهر' : 'Month'}</Label>
                  <Input type="month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{isRTL ? 'المبلغ المستهدف' : 'Target Amount'}</Label>
                  <Input type="number" min={0} value={targetAmount || ''} onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{isRTL ? 'العملة' : 'Currency'}</Label>
                  <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{['USD', 'SAR', 'AED', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => targetMutation.mutate({ month: targetMonth, targetAmount, currency: targetCurrency })} disabled={targetMutation.isPending}>
                {targetMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {isRTL ? 'حفظ الهدف' : 'Save Target'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI ── */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {isRTL ? 'تحليل المبيعات بالذكاء الاصطناعي' : 'AI Sales Analysis'}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAI} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                  {analyzeMutation.isPending ? (isRTL ? 'جارٍ التحليل…' : 'Analyzing…') : (isRTL ? 'تحديث' : 'Refresh')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {!aiAnalysis && !analyzeMutation.isPending && (
                <div className="text-center py-10">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">{isRTL ? 'احصل على تحليل ذكاء اصطناعي لصحة خط الأنابيب ومعدل الفوز وتوقعات الإيرادات.' : 'Get AI-powered analysis of your pipeline health, win rate, and revenue forecast.'}</p>
                  <Button onClick={handleAI}><Sparkles className="w-4 h-4 mr-2" /> {isRTL ? 'إنشاء التحليل' : 'Generate Analysis'}</Button>
                </div>
              )}
              {analyzeMutation.isPending && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{isRTL ? 'جارٍ تحليل خط الأنابيب…' : 'Analyzing your pipeline…'}</span>
                </div>
              )}
              {aiAnalysis && !analyzeMutation.isPending && (
                <div className="prose prose-sm max-w-none"><Streamdown>{aiAnalysis}</Streamdown></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Deal Form Dialog ── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditingDeal(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDeal
                ? (isRTL ? `تعديل ${cfg.dealLabelAr}` : `Edit ${cfg.dealLabel}`)
                : (isRTL ? `إضافة ${cfg.dealLabelAr} جديد` : `Add New ${cfg.dealLabel}`)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Basic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">{isRTL ? 'الشركة / العميل *' : 'Company / Customer *'}</Label>
                <Input value={form.customer} onChange={e => setField('customer', e.target.value)} placeholder={isRTL ? 'مثال: شركة أكمي' : 'e.g. Acme Corp'} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'المنتج / الخدمة' : 'Product / Service'}</Label>
                <Input value={form.product} onChange={e => setField('product', e.target.value)} placeholder={isRTL ? 'مثال: الخطة الاحترافية' : 'e.g. Pro Plan'} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'المرحلة' : 'Stage'}</Label>
                <Select value={form.dealStage} onValueChange={handleStageChange}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(cfg.stages) as string[]).map(s => (
                      <SelectItem key={s} value={s}>{isRTL ? cfg.stages[s].labelAr : cfg.stages[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Model-specific extra fields */}
            {cfg.extraFields.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {isRTL ? `حقول ${cfg.labelAr}` : `${cfg.label} Fields`}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {cfg.extraFields.map(field => (
                    <div key={field.key}>
                      <Label className="text-xs">{isRTL ? field.labelAr : field.label}</Label>
                      {field.type === 'select' ? (
                        <Select value={extraValues[field.key] ?? ''} onValueChange={v => setExtraValues(prev => ({ ...prev, [field.key]: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر…' : 'Select…'} /></SelectTrigger>
                          <SelectContent>{(field.options ?? []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={extraValues[field.key] ?? ''}
                          onChange={e => setExtraValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Separator />
              </>
            )}

            {/* Contact */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRTL ? 'بيانات التواصل' : 'Contact Details'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRTL ? 'اسم جهة الاتصال' : 'Contact Name'}</Label>
                <Input value={form.contactName ?? ''} onChange={e => setField('contactName', e.target.value)} placeholder="John Smith" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input type="email" value={form.contactEmail ?? ''} onChange={e => setField('contactEmail', e.target.value)} placeholder="john@acme.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'الهاتف' : 'Phone'}</Label>
                <Input value={form.contactPhone ?? ''} onChange={e => setField('contactPhone', e.target.value)} placeholder="+966 50 000 0000" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'قناة الاكتساب' : 'Channel'}</Label>
                <Select value={form.channel} onValueChange={v => setField('channel', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{CHANNEL_LABELS[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Financials */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRTL ? 'الماليات' : 'Financials'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRTL ? cfg.amountLabelAr : cfg.amountLabel} ({isRTL ? 'متوقع' : 'Expected'})</Label>
                <Input type="number" min={0} value={form.dealValue ?? ''} onChange={e => setField('dealValue', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'المبلغ الفعلي (مُغلق)' : 'Closed Amount (Actual)'}</Label>
                <Input type="number" min={0} value={form.amount || ''} onChange={e => setField('amount', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'العملة' : 'Currency'}</Label>
                <Select value={form.currency} onValueChange={v => setField('currency', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['USD', 'SAR', 'AED', 'EUR', 'GBP', 'EGP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'احتمالية الفوز (%)' : 'Win Probability (%)'}</Label>
                <Input type="number" min={0} max={100} value={form.probability ?? ''} onChange={e => setField('probability', parseInt(e.target.value) || 0)} placeholder="50" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'التاريخ' : 'Date'}</Label>
                <Input type="date" value={typeof form.date === 'string' ? form.date : isoDate(form.date)} onChange={e => setField('date', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? 'تاريخ الإغلاق المتوقع' : 'Expected Close Date'}</Label>
                <Input type="date" value={form.expectedCloseDate ? String(form.expectedCloseDate) : ''} onChange={e => setField('expectedCloseDate', e.target.value)} className="mt-1" />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{isRTL ? 'الإجراء التالي' : 'Next Action'}</Label>
                <Input value={form.nextAction ?? ''} onChange={e => setField('nextAction', e.target.value)} placeholder={isRTL ? 'مثال: متابعة الأربعاء' : 'e.g. Follow up Wednesday'} className="mt-1" />
              </div>
              {form.dealStage === cfg.lostStage && (
                <div>
                  <Label className="text-xs">{isRTL ? 'سبب الخسارة' : 'Lost Reason'}</Label>
                  <Input value={form.lostReason ?? ''} onChange={e => setField('lostReason', e.target.value)} placeholder={isRTL ? 'مثال: السعر مرتفع' : 'e.g. Price too high'} className="mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs">{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                <textarea value={form.notes ?? ''} onChange={e => setField('notes', e.target.value)} placeholder={isRTL ? 'سياق إضافي…' : 'Additional context…'} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingDeal(null); }}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingDeal ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
