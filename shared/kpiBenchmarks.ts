/**
 * KPI Benchmark Library
 * Defines North Star metrics, KPI definitions, and benchmark ranges
 * per business model and industry sector.
 *
 * Sources: SaaStr, OpenView, Bessemer VP, a16z, McKinsey, Gartner (2024)
 */

export type KpiStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'no-data';

export interface KpiBenchmark {
  key: string;
  label: string;
  labelAr: string;
  unit: '%' | 'x' | '$' | 'months' | 'score' | 'ratio';
  description: string;
  descriptionAr: string;
  excellent: { min: number; max?: number };
  good: { min: number; max?: number };
  fair: { min: number; max?: number };
  // lower is better flag (e.g. churn, CAC)
  lowerIsBetter?: boolean;
  source: string;
}

export interface NorthStarMetric {
  key: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  unit: string;
  why: string;
  whyAr: string;
}

export interface BusinessModelProfile {
  northStar: NorthStarMetric;
  kpis: KpiBenchmark[];
}

// ── North Star Metrics per Business Model ──────────────────────────────────
const NORTH_STARS: Record<string, NorthStarMetric> = {
  saas: {
    key: 'arr',
    label: 'Annual Recurring Revenue (ARR)',
    labelAr: 'الإيراد السنوي المتكرر (ARR)',
    description: 'The single most predictive metric for SaaS company health and valuation.',
    descriptionAr: 'المقياس الأكثر تنبؤاً بصحة شركة SaaS وتقييمها.',
    unit: '$',
    why: 'ARR captures growth velocity, retention, and expansion in one number. Investors use ARR multiples as the primary SaaS valuation lens.',
    whyAr: 'يعكس ARR سرعة النمو والاحتفاظ والتوسع في رقم واحد. يستخدم المستثمرون مضاعفات ARR كمقياس أساسي لتقييم SaaS.',
  },
  ecommerce: {
    key: 'revenue_growth',
    label: 'Monthly Revenue Growth Rate',
    labelAr: 'معدل نمو الإيرادات الشهري',
    description: 'E-commerce success is driven by compounding revenue growth and repeat purchase rate.',
    descriptionAr: 'يعتمد نجاح التجارة الإلكترونية على نمو الإيرادات المتراكم ومعدل الشراء المتكرر.',
    unit: '%',
    why: 'Revenue growth rate determines market share capture speed. Combined with gross margin, it defines the path to profitability.',
    whyAr: 'يحدد معدل نمو الإيرادات سرعة اكتساب حصة السوق. مع هامش الربح الإجمالي، يحدد المسار نحو الربحية.',
  },
  marketplace: {
    key: 'gmv_growth',
    label: 'Gross Merchandise Value (GMV) Growth',
    labelAr: 'نمو إجمالي قيمة البضائع (GMV)',
    description: 'GMV growth reflects the health of both supply and demand sides of your marketplace.',
    descriptionAr: 'يعكس نمو GMV صحة جانبي العرض والطلب في سوقك.',
    unit: '%',
    why: 'Marketplace valuation is primarily driven by GMV scale and take rate. Growing GMV signals network effects are working.',
    whyAr: 'يعتمد تقييم السوق بشكل أساسي على حجم GMV ومعدل الأخذ. يشير نمو GMV إلى أن تأثيرات الشبكة تعمل.',
  },
  agency: {
    key: 'revenue_per_employee',
    label: 'Revenue per Employee',
    labelAr: 'الإيراد لكل موظف',
    description: 'For service businesses, revenue per employee is the primary efficiency and scalability metric.',
    descriptionAr: 'بالنسبة لشركات الخدمات، يعد الإيراد لكل موظف مقياس الكفاءة والقابلية للتوسع الأساسي.',
    unit: '$',
    why: 'Agencies scale by improving output per person. High revenue/employee signals strong pricing power and operational efficiency.',
    whyAr: 'تتوسع الوكالات من خلال تحسين الإنتاج لكل شخص. يشير الإيراد المرتفع لكل موظف إلى قوة تسعير قوية وكفاءة تشغيلية.',
  },
  hardware: {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    description: 'Hardware companies live and die by gross margin — it determines reinvestment capacity.',
    descriptionAr: 'تعيش شركات الأجهزة وتموت بهامش الربح الإجمالي — فهو يحدد قدرة إعادة الاستثمار.',
    unit: '%',
    why: 'Hardware gross margin funds R&D and sales. Investors require >40% to fund growth without constant dilution.',
    whyAr: 'يمول هامش الربح الإجمالي للأجهزة البحث والتطوير والمبيعات. يتطلب المستثمرون >40% لتمويل النمو دون تخفيف مستمر.',
  },
  services: {
    key: 'net_revenue_retention',
    label: 'Net Revenue Retention (NRR)',
    labelAr: 'صافي الاحتفاظ بالإيرادات (NRR)',
    description: 'For professional services, NRR shows whether existing clients are growing their spend.',
    descriptionAr: 'بالنسبة للخدمات المهنية، يُظهر NRR ما إذا كان العملاء الحاليون يزيدون إنفاقهم.',
    unit: '%',
    why: 'NRR >100% means the business grows even without new clients. It is the strongest signal of product-market fit in services.',
    whyAr: 'NRR >100% يعني أن الأعمال تنمو حتى بدون عملاء جدد. إنه أقوى إشارة لملاءمة المنتج للسوق في الخدمات.',
  },
  procurement: {
    key: 'procurement_volume',
    label: 'Procurement Volume Facilitated (PVF)',
    labelAr: 'حجم المشتريات الميسّرة (PVF)',
    description: 'Total value of purchases aggregated and facilitated on behalf of buyers — the primary scale metric for a procurement agent.',
    descriptionAr: 'إجمالي قيمة المشتريات المجمّعة والميسّرة نيابةً عن المشترين — مقياس الحجم الأساسي لوكيل المشتريات.',
    unit: '$',
    why: 'PVF drives everything: higher volume unlocks better bulk discounts, increases service fee revenue, and is the primary valuation driver for procurement platforms. Investors benchmark PVF growth rate and take rate (service fee ÷ PVF) to assess unit economics.',
    whyAr: 'يقود PVF كل شيء: يفتح الحجم الأعلى خصومات الجملة الأفضل، ويزيد إيرادات رسوم الخدمة، وهو المحرك الأساسي للتقييم لمنصات المشتريات.',
  },
  other: {
    key: 'revenue_growth',
    label: 'Monthly Revenue Growth Rate',
    labelAr: 'معدل نمو الإيرادات الشهري',
    description: 'Revenue growth is the universal north star for early-stage startups.',
    descriptionAr: 'نمو الإيرادات هو النجم الشمالي العالمي للشركات الناشئة في مراحلها الأولى.',
    unit: '%',
    why: 'Consistent revenue growth signals product-market fit and is the primary driver of startup valuation at early stages.',
    whyAr: 'يشير النمو المتسق في الإيرادات إلى ملاءمة المنتج للسوق وهو المحرك الأساسي لتقييم الشركات الناشئة في المراحل المبكرة.',
  },
};

// ── KPI Benchmarks per Business Model ─────────────────────────────────────
const SAAS_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM Revenue Growth',
    labelAr: 'نمو الإيرادات الشهري',
    unit: '%',
    description: 'Month-over-month revenue growth rate',
    descriptionAr: 'معدل نمو الإيرادات من شهر لآخر',
    excellent: { min: 15 },
    good: { min: 8 },
    fair: { min: 3 },
    source: 'SaaStr 2024',
  },
  {
    key: 'churn_rate',
    label: 'Monthly Churn Rate',
    labelAr: 'معدل التراجع الشهري',
    unit: '%',
    description: 'Percentage of MRR lost each month from cancellations',
    descriptionAr: 'نسبة MRR المفقودة كل شهر من الإلغاءات',
    excellent: { min: 0, max: 1 },
    good: { min: 1, max: 2.5 },
    fair: { min: 2.5, max: 5 },
    lowerIsBetter: true,
    source: 'Bessemer VP 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Customer lifetime value divided by customer acquisition cost',
    descriptionAr: 'قيمة العميل مدى الحياة مقسومة على تكلفة اكتساب العميل',
    excellent: { min: 5 },
    good: { min: 3 },
    fair: { min: 1.5 },
    source: 'OpenView 2024',
  },
  {
    key: 'cac_payback_months',
    label: 'CAC Payback Period',
    labelAr: 'فترة استرداد CAC',
    unit: 'months',
    description: 'Months to recover customer acquisition cost from gross margin',
    descriptionAr: 'أشهر لاسترداد تكلفة اكتساب العميل من هامش الربح الإجمالي',
    excellent: { min: 0, max: 12 },
    good: { min: 12, max: 18 },
    fair: { min: 18, max: 24 },
    lowerIsBetter: true,
    source: 'SaaStr 2024',
  },
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Revenue minus cost of goods sold as a percentage of revenue',
    descriptionAr: 'الإيرادات ناقص تكلفة البضائع المباعة كنسبة مئوية من الإيرادات',
    excellent: { min: 75 },
    good: { min: 65 },
    fair: { min: 50 },
    source: 'Bessemer VP 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Customer satisfaction and loyalty metric (-100 to +100)',
    descriptionAr: 'مقياس رضا العملاء وولائهم (-100 إلى +100)',
    excellent: { min: 50 },
    good: { min: 30 },
    fair: { min: 0 },
    source: 'Satmetrix 2024',
  },
];

const ECOMMERCE_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM Revenue Growth',
    labelAr: 'نمو الإيرادات الشهري',
    unit: '%',
    description: 'Month-over-month revenue growth rate',
    descriptionAr: 'معدل نمو الإيرادات من شهر لآخر',
    excellent: { min: 20 },
    good: { min: 10 },
    fair: { min: 5 },
    source: 'Shopify Commerce Report 2024',
  },
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Revenue minus COGS as a percentage of revenue',
    descriptionAr: 'الإيرادات ناقص تكلفة البضائع المباعة كنسبة مئوية من الإيرادات',
    excellent: { min: 50 },
    good: { min: 35 },
    fair: { min: 20 },
    source: 'McKinsey Retail 2024',
  },
  {
    key: 'churn_rate',
    label: 'Customer Churn Rate',
    labelAr: 'معدل تراجع العملاء',
    unit: '%',
    description: 'Percentage of customers who do not return within 90 days',
    descriptionAr: 'نسبة العملاء الذين لا يعودون خلال 90 يوماً',
    excellent: { min: 0, max: 20 },
    good: { min: 20, max: 40 },
    fair: { min: 40, max: 60 },
    lowerIsBetter: true,
    source: 'Klaviyo E-commerce 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Customer lifetime value vs. acquisition cost',
    descriptionAr: 'قيمة العميل مدى الحياة مقابل تكلفة الاكتساب',
    excellent: { min: 4 },
    good: { min: 2.5 },
    fair: { min: 1.5 },
    source: 'Shopify 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Customer satisfaction metric',
    descriptionAr: 'مقياس رضا العملاء',
    excellent: { min: 45 },
    good: { min: 25 },
    fair: { min: 0 },
    source: 'Satmetrix 2024',
  },
];

const MARKETPLACE_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM GMV Growth',
    labelAr: 'نمو GMV الشهري',
    unit: '%',
    description: 'Month-over-month gross merchandise value growth',
    descriptionAr: 'معدل نمو إجمالي قيمة البضائع من شهر لآخر',
    excellent: { min: 25 },
    good: { min: 12 },
    fair: { min: 5 },
    source: 'a16z Marketplace 2024',
  },
  {
    key: 'gross_margin',
    label: 'Take Rate / Net Margin',
    labelAr: 'معدل الأخذ / صافي الهامش',
    unit: '%',
    description: 'Revenue as a percentage of GMV (take rate)',
    descriptionAr: 'الإيرادات كنسبة مئوية من GMV (معدل الأخذ)',
    excellent: { min: 20 },
    good: { min: 12 },
    fair: { min: 5 },
    source: 'a16z 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Supplier + buyer LTV vs. blended CAC',
    descriptionAr: 'LTV للموردين والمشترين مقابل CAC المدمج',
    excellent: { min: 4 },
    good: { min: 2.5 },
    fair: { min: 1.5 },
    source: 'a16z 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Combined buyer and seller satisfaction',
    descriptionAr: 'رضا المشترين والبائعين المشترك',
    excellent: { min: 40 },
    good: { min: 20 },
    fair: { min: 0 },
    source: 'Satmetrix 2024',
  },
];

const AGENCY_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM Revenue Growth',
    labelAr: 'نمو الإيرادات الشهري',
    unit: '%',
    description: 'Month-over-month revenue growth rate',
    descriptionAr: 'معدل نمو الإيرادات من شهر لآخر',
    excellent: { min: 10 },
    good: { min: 5 },
    fair: { min: 2 },
    source: 'Agency Analytics 2024',
  },
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Revenue minus direct service delivery costs',
    descriptionAr: 'الإيرادات ناقص تكاليف تقديم الخدمة المباشرة',
    excellent: { min: 60 },
    good: { min: 45 },
    fair: { min: 30 },
    source: 'Gartner Services 2024',
  },
  {
    key: 'churn_rate',
    label: 'Annual Client Churn',
    labelAr: 'تراجع العملاء السنوي',
    unit: '%',
    description: 'Percentage of clients lost per year',
    descriptionAr: 'نسبة العملاء المفقودين سنوياً',
    excellent: { min: 0, max: 10 },
    good: { min: 10, max: 20 },
    fair: { min: 20, max: 35 },
    lowerIsBetter: true,
    source: 'Agency Analytics 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Client lifetime value vs. acquisition cost',
    descriptionAr: 'قيمة العميل مدى الحياة مقابل تكلفة الاكتساب',
    excellent: { min: 5 },
    good: { min: 3 },
    fair: { min: 1.5 },
    source: 'HubSpot 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Client satisfaction and referral likelihood',
    descriptionAr: 'رضا العملاء واحتمالية الإحالة',
    excellent: { min: 50 },
    good: { min: 30 },
    fair: { min: 10 },
    source: 'Satmetrix 2024',
  },
];

const HARDWARE_KPIS: KpiBenchmark[] = [
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Revenue minus COGS including manufacturing',
    descriptionAr: 'الإيرادات ناقص تكلفة البضائع المباعة بما في ذلك التصنيع',
    excellent: { min: 50 },
    good: { min: 35 },
    fair: { min: 20 },
    source: 'Gartner Hardware 2024',
  },
  {
    key: 'mom_growth',
    label: 'MoM Revenue Growth',
    labelAr: 'نمو الإيرادات الشهري',
    unit: '%',
    description: 'Month-over-month revenue growth rate',
    descriptionAr: 'معدل نمو الإيرادات من شهر لآخر',
    excellent: { min: 15 },
    good: { min: 7 },
    fair: { min: 3 },
    source: 'PitchBook Hardware 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Customer lifetime value vs. acquisition cost',
    descriptionAr: 'قيمة العميل مدى الحياة مقابل تكلفة الاكتساب',
    excellent: { min: 4 },
    good: { min: 2.5 },
    fair: { min: 1.5 },
    source: 'PitchBook 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Customer satisfaction metric',
    descriptionAr: 'مقياس رضا العملاء',
    excellent: { min: 40 },
    good: { min: 20 },
    fair: { min: 0 },
    source: 'Satmetrix 2024',
  },
];

const SERVICES_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM Revenue Growth',
    labelAr: 'نمو الإيرادات الشهري',
    unit: '%',
    description: 'Month-over-month revenue growth rate',
    descriptionAr: 'معدل نمو الإيرادات من شهر لآخر',
    excellent: { min: 10 },
    good: { min: 5 },
    fair: { min: 2 },
    source: 'McKinsey Services 2024',
  },
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Revenue minus direct service costs',
    descriptionAr: 'الإيرادات ناقص تكاليف الخدمة المباشرة',
    excellent: { min: 55 },
    good: { min: 40 },
    fair: { min: 25 },
    source: 'McKinsey 2024',
  },
  {
    key: 'churn_rate',
    label: 'Client Churn Rate',
    labelAr: 'معدل تراجع العملاء',
    unit: '%',
    description: 'Percentage of clients lost per year',
    descriptionAr: 'نسبة العملاء المفقودين سنوياً',
    excellent: { min: 0, max: 8 },
    good: { min: 8, max: 15 },
    fair: { min: 15, max: 25 },
    lowerIsBetter: true,
    source: 'Bain & Company 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Client lifetime value vs. acquisition cost',
    descriptionAr: 'قيمة العميل مدى الحياة مقابل تكلفة الاكتساب',
    excellent: { min: 5 },
    good: { min: 3 },
    fair: { min: 1.5 },
    source: 'Bain 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Client satisfaction and loyalty',
    descriptionAr: 'رضا العملاء وولائهم',
    excellent: { min: 50 },
    good: { min: 30 },
    fair: { min: 10 },
    source: 'Satmetrix 2024',
  },
];

// ── Industry-specific benchmark adjustments ────────────────────────────────
// These overlay on top of business model benchmarks for sector-specific context
export const INDUSTRY_CONTEXT: Record<string, { label: string; labelAr: string; notes: string; notesAr: string }> = {
  fintech: {
    label: 'Fintech',
    labelAr: 'التكنولوجيا المالية',
    notes: 'Fintech benchmarks: Churn <1.5%/mo, LTV:CAC >4x, Gross Margin >65% (SaaS layer). Regulatory compliance costs reduce margins by ~5-10%.',
    notesAr: 'معايير فينتك: تراجع <1.5%/شهر، LTV:CAC >4x، هامش إجمالي >65% (طبقة SaaS). تقلل تكاليف الامتثال التنظيمي الهوامش بنسبة ~5-10%.',
  },
  healthtech: {
    label: 'HealthTech',
    labelAr: 'التكنولوجيا الصحية',
    notes: 'HealthTech benchmarks: Longer sales cycles (6-18 mo), Churn <2%/mo, NPS >50 critical for hospital/clinic buyers. HIPAA compliance adds ~15% to COGS.',
    notesAr: 'معايير التكنولوجيا الصحية: دورات مبيعات أطول (6-18 شهر)، تراجع <2%/شهر، NPS >50 حاسم لمشتري المستشفيات/العيادات.',
  },
  edtech: {
    label: 'EdTech',
    labelAr: 'تكنولوجيا التعليم',
    notes: 'EdTech benchmarks: Seasonal revenue spikes (Sep, Jan), Churn 3-5%/mo acceptable, NPS >40, CAC payback <18 months.',
    notesAr: 'معايير التكنولوجيا التعليمية: ارتفاعات موسمية في الإيرادات (سبتمبر، يناير)، تراجع 3-5%/شهر مقبول، NPS >40.',
  },
  ecommerce: {
    label: 'E-commerce',
    labelAr: 'التجارة الإلكترونية',
    notes: 'E-commerce benchmarks: Gross Margin 30-60% (product-dependent), Repeat purchase rate >30%, Customer LTV >3x CAC.',
    notesAr: 'معايير التجارة الإلكترونية: هامش إجمالي 30-60% (يعتمد على المنتج)، معدل الشراء المتكرر >30%، LTV العميل >3x CAC.',
  },
  logistics: {
    label: 'Logistics & Supply Chain',
    labelAr: 'الخدمات اللوجستية وسلسلة التوريد',
    notes: 'Logistics benchmarks: Gross Margin 15-30% (asset-heavy), Revenue growth >15%/yr, On-time delivery >95% as operational KPI.',
    notesAr: 'معايير اللوجستيات: هامش إجمالي 15-30% (كثيف الأصول)، نمو الإيرادات >15%/سنة.',
  },
  proptech: {
    label: 'PropTech',
    labelAr: 'تكنولوجيا العقارات',
    notes: 'PropTech benchmarks: Gross Margin 40-70% (SaaS layer), Churn <3%/mo, CAC payback <24 months due to long sales cycles.',
    notesAr: 'معايير تكنولوجيا العقارات: هامش إجمالي 40-70%، تراجع <3%/شهر، استرداد CAC <24 شهراً.',
  },
  retail: {
    label: 'Retail',
    labelAr: 'تجارة التجزئة',
    notes: 'Retail benchmarks: Gross Margin 20-50%, Inventory turnover >6x/yr, Same-store sales growth >5%.',
    notesAr: 'معايير تجارة التجزئة: هامش إجمالي 20-50%، دوران المخزون >6x/سنة.',
  },
  saas: {
    label: 'SaaS / Software',
    labelAr: 'البرمجيات كخدمة',
    notes: 'SaaS benchmarks: Gross Margin >70%, NRR >110%, Churn <2%/mo, Magic Number >0.75, Rule of 40 score >40.',
    notesAr: 'معايير SaaS: هامش إجمالي >70%، NRR >110%، تراجع <2%/شهر، رقم السحر >0.75، قاعدة 40 >40.',
  },
  ai: {
    label: 'AI / ML',
    labelAr: 'الذكاء الاصطناعي / تعلم الآلة',
    notes: 'AI/ML benchmarks: Gross Margin 60-80% (inference costs reduce margin), ARR growth >100%/yr at seed, NPS >45.',
    notesAr: 'معايير الذكاء الاصطناعي: هامش إجمالي 60-80%، نمو ARR >100%/سنة عند seed، NPS >45.',
  },
  marketplace: {
    label: 'Marketplace',
    labelAr: 'السوق الإلكتروني',
    notes: 'Marketplace benchmarks: Take rate 10-30%, Liquidity ratio >25%, Repeat transaction rate >60%, NPS >35.',
    notesAr: 'معايير السوق: معدل الأخذ 10-30%، نسبة السيولة >25%، معدل المعاملات المتكررة >60%.',
  },
  procurement: {
    label: 'Procurement-as-a-Service / Group Buying',
    labelAr: 'المشتريات كخدمة / الشراء الجماعي',
    notes: 'PaaS benchmarks: Take rate 1.5–5% of PVF, Gross Margin 25–50%, Buyer Retention >70%/yr, AOV >$10K for B2B. Key advantage: bulk discount savings passed to buyers (typically 10–30% below market price) drives retention and referrals. Investors value on PVF growth rate and take rate expansion.',
    notesAr: 'معايير PaaS: معدل الأخذ 1.5-5% من PVF، هامش إجمالي 25-50%، احتفاظ بالمشترين >70%/سنة، AOV >10K$ لـ B2B. الميزة الرئيسية: توفير خصومات الجملة للمشترين (عادةً 10-30% أقل من سعر السوق) يدفع الاحتفاظ والإحالات.',
  },
};

// ── Procurement-as-a-Service / Group Buying KPIs ─────────────────────────
// Sources: Proxtera, Tradeshift, Coupa benchmarks; McKinsey Procurement 2024;
// Gartner Procurement Tech 2024; a16z Supply Chain 2023
const PROCUREMENT_KPIS: KpiBenchmark[] = [
  {
    key: 'mom_growth',
    label: 'MoM Procurement Volume Growth',
    labelAr: 'نمو حجم المشتريات الشهري',
    unit: '%',
    description: 'Month-over-month growth in total procurement volume facilitated',
    descriptionAr: 'معدل نمو إجمالي حجم المشتريات الميسّرة من شهر لآخر',
    excellent: { min: 15 },
    good: { min: 8 },
    fair: { min: 3 },
    source: 'McKinsey Procurement 2024',
  },
  {
    key: 'take_rate',
    label: 'Take Rate (Service Fee %)',
    labelAr: 'معدل الأخذ (نسبة رسوم الخدمة)',
    unit: '%',
    description: 'Service fee revenue as a percentage of total procurement volume facilitated',
    descriptionAr: 'إيرادات رسوم الخدمة كنسبة مئوية من إجمالي حجم المشتريات الميسّرة',
    excellent: { min: 3 },
    good: { min: 1.5 },
    fair: { min: 0.5 },
    source: 'Coupa / Tradeshift Benchmarks 2024',
  },
  {
    key: 'gross_margin',
    label: 'Gross Margin',
    labelAr: 'هامش الربح الإجمالي',
    unit: '%',
    description: 'Service fee revenue minus direct procurement facilitation costs',
    descriptionAr: 'إيرادات رسوم الخدمة ناقص تكاليف تيسير المشتريات المباشرة',
    excellent: { min: 40 },
    good: { min: 25 },
    fair: { min: 15 },
    source: 'McKinsey Procurement 2024',
  },
  {
    key: 'buyer_retention',
    label: 'Annual Buyer Retention Rate',
    labelAr: 'معدل الاحتفاظ بالمشترين السنوي',
    unit: '%',
    description: 'Percentage of buyers who repeat procurement through the platform year-over-year',
    descriptionAr: 'نسبة المشترين الذين يكررون المشتريات عبر المنصة من سنة لأخرى',
    excellent: { min: 85 },
    good: { min: 70 },
    fair: { min: 55 },
    source: 'Proxtera / Tradeshift 2024',
  },
  {
    key: 'avg_deal_size',
    label: 'Average Order Value (AOV)',
    labelAr: 'متوسط قيمة الطلب',
    unit: '$',
    description: 'Average value of each procurement order facilitated — higher AOV means more leverage per transaction',
    descriptionAr: 'متوسط قيمة كل طلب مشتريات ميسّر — يعني AOV الأعلى مزيداً من الرافعة لكل معاملة',
    excellent: { min: 50000 },
    good: { min: 10000 },
    fair: { min: 2000 },
    source: 'McKinsey B2B Procurement 2024',
  },
  {
    key: 'ltv_cac_ratio',
    label: 'LTV:CAC Ratio',
    labelAr: 'نسبة LTV:CAC',
    unit: 'x',
    description: 'Buyer lifetime value vs. cost to acquire each buyer',
    descriptionAr: 'قيمة المشتري مدى الحياة مقابل تكلفة اكتساب كل مشترٍ',
    excellent: { min: 5 },
    good: { min: 3 },
    fair: { min: 1.5 },
    source: 'a16z Supply Chain 2023',
  },
  {
    key: 'supplier_count',
    label: 'Active Supplier Count',
    labelAr: 'عدد الموردين النشطين',
    unit: 'ratio',
    description: 'Number of active suppliers in the procurement network — more suppliers = better pricing and coverage',
    descriptionAr: 'عدد الموردين النشطين في شبكة المشتريات — المزيد من الموردين = أسعار وتغطية أفضل',
    excellent: { min: 50 },
    good: { min: 20 },
    fair: { min: 5 },
    source: 'Gartner Procurement Tech 2024',
  },
  {
    key: 'nps_score',
    label: 'Net Promoter Score (NPS)',
    labelAr: 'صافي نقاط المروج (NPS)',
    unit: 'score',
    description: 'Buyer satisfaction — critical for referral-driven growth in B2B procurement',
    descriptionAr: 'رضا المشترين — حاسم للنمو القائم على الإحالة في مشتريات B2B',
    excellent: { min: 45 },
    good: { min: 25 },
    fair: { min: 5 },
    source: 'Satmetrix B2B 2024',
  },
];

// ── Main export: get benchmark profile for a business model ────────────────
export const BUSINESS_MODEL_BENCHMARKS: Record<string, BusinessModelProfile> = {
  saas: { northStar: NORTH_STARS.saas, kpis: SAAS_KPIS },
  ecommerce: { northStar: NORTH_STARS.ecommerce, kpis: ECOMMERCE_KPIS },
  marketplace: { northStar: NORTH_STARS.marketplace, kpis: MARKETPLACE_KPIS },
  agency: { northStar: NORTH_STARS.agency, kpis: AGENCY_KPIS },
  hardware: { northStar: NORTH_STARS.hardware, kpis: HARDWARE_KPIS },
  services: { northStar: NORTH_STARS.services, kpis: SERVICES_KPIS },
  manufacturing: { northStar: NORTH_STARS.hardware, kpis: HARDWARE_KPIS },
  procurement: { northStar: NORTH_STARS.procurement, kpis: PROCUREMENT_KPIS },
  'group-buying': { northStar: NORTH_STARS.procurement, kpis: PROCUREMENT_KPIS },
  'supply-chain': { northStar: NORTH_STARS.procurement, kpis: PROCUREMENT_KPIS },
  other: { northStar: NORTH_STARS.other, kpis: SAAS_KPIS },
};

// ── Helper: compute KPI status from actual value vs benchmark ──────────────
export function getKpiStatus(kpi: KpiBenchmark, value: number | null | undefined): KpiStatus {
  if (value === null || value === undefined) return 'no-data';

  if (kpi.lowerIsBetter) {
    if (kpi.excellent.max !== undefined && value <= kpi.excellent.max) return 'excellent';
    if (kpi.good.max !== undefined && value <= kpi.good.max) return 'good';
    if (kpi.fair.max !== undefined && value <= kpi.fair.max) return 'fair';
    return 'poor';
  } else {
    if (value >= kpi.excellent.min) return 'excellent';
    if (value >= kpi.good.min) return 'good';
    if (value >= kpi.fair.min) return 'fair';
    return 'poor';
  }
}

export function getBenchmarkLabel(kpi: KpiBenchmark): string {
  if (kpi.lowerIsBetter) {
    return `< ${kpi.excellent.max}${kpi.unit === '%' ? '%' : ''}`;
  }
  return `> ${kpi.excellent.min}${kpi.unit === '%' ? '%' : ''}`;
}
