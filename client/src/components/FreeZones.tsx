/**
 * FreeZones.tsx — Free Zones & Jurisdictions Guide (Rebuilt)
 * New: AI-powered recommender quiz, improved card design, 13 jurisdictions,
 *      visual score bars, better detail view, comparison table
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Globe, MapPin, DollarSign, Shield, Users, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Scale, Building2, Landmark, Star, Info, ArrowRight, BarChart3,
  Sparkles, ArrowLeft, ExternalLink, Filter, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Jurisdiction {
  id: string;
  name: string;
  nameAr: string;
  region: string;
  flag: string;
  tagline: string;
  taglineAr: string;
  type: 'free-zone' | 'offshore' | 'onshore' | 'special-economic-zone';
  bestFor: string[];
  corporateTax: string;
  foreignOwnership: string;
  setupCost: string;
  setupTime: string;
  legalSystem: string;
  currency: string;
  minCapital: string;
  vcFriendly: 'high' | 'medium' | 'low';
  overview: string;
  overviewAr: string;
  keyRules: string[];
  keyRulesAr: string[];
  pros: string[];
  prosAr: string[];
  cons: string[];
  consAr: string[];
  implications: { fundraising: string; tax: string; operations: string; exit: string };
  implicationsAr: { fundraising: string; tax: string; operations: string; exit: string };
  idealFor: string;
  idealForAr: string;
  notIdealFor: string;
  notIdealForAr: string;
  officialUrl: string;
  annualFees: string;
  // Scoring dimensions (0-10)
  scores: { vcFriendliness: number; taxEfficiency: number; setupEase: number; costEfficiency: number; marketAccess: number };
  // Recommender tags
  tags: string[];
}

const JURISDICTIONS: Jurisdiction[] = [
  {
    id: 'adgm',
    name: 'ADGM',
    nameAr: 'سوق أبوظبي العالمي',
    region: 'UAE – Abu Dhabi',
    flag: '🇦🇪',
    tagline: 'Abu Dhabi Global Market — English Common Law in the Gulf',
    taglineAr: 'سوق أبوظبي العالمي — القانون الإنجليزي في الخليج',
    type: 'free-zone',
    bestFor: ['FinTech', 'Asset Management', 'Holding Companies', 'SPVs', 'Tech Startups'],
    corporateTax: '0% (50-yr guarantee)',
    foreignOwnership: '100%',
    setupCost: '$2,000 – $15,000',
    setupTime: '5–10 days',
    legalSystem: 'English Common Law',
    currency: 'USD / AED',
    minCapital: 'None (most structures)',
    vcFriendly: 'high',
    annualFees: '$2,000 – $8,000/yr',
    scores: { vcFriendliness: 9, taxEfficiency: 10, setupEase: 8, costEfficiency: 6, marketAccess: 8 },
    tags: ['vc-backed', 'holding', 'fintech', 'mena-focus', 'series-a-plus'],
    overview: 'ADGM is Abu Dhabi\'s international financial centre, operating under English common law — the same legal framework used in the UK, US, and major financial hubs. It is the preferred jurisdiction for VC-backed startups and holding structures in the Gulf, offering a 50-year tax exemption guarantee, 100% foreign ownership, and full profit repatriation.',
    overviewAr: 'سوق أبوظبي العالمي هو المركز المالي الدولي لأبوظبي، ويعمل وفق القانون الإنجليزي العام. وهو الاختصاص القضائي المفضل للشركات الناشئة المدعومة برأس المال المغامر وهياكل الاحتجاز في الخليج.',
    keyRules: [
      'Registered office on Al Maryah Island (Abu Dhabi) required',
      'Minimum 1 director and 1 shareholder (can be same person)',
      'Annual financial statements required; audit required for regulated entities',
      'ADGM SPV structure available for holding shares',
      'RegLab available for FinTech sandboxes',
    ],
    keyRulesAr: [
      'يجب أن يكون للشركات مكتب مسجل في جزيرة المارية (أبوظبي)',
      'الحد الأدنى مدير واحد ومساهم واحد',
      'البيانات المالية السنوية مطلوبة',
      'هيكل SPV المبسط متاح لحيازة الأسهم',
    ],
    pros: [
      'English Common Law — familiar to international VCs',
      '50-year 0% tax guarantee',
      '100% foreign ownership with full profit repatriation',
      'ADGM SPV is cost-effective for MENA holding structures',
      'Access to Abu Dhabi sovereign wealth (Mubadala, ADQ, ADIA)',
    ],
    prosAr: [
      'القانون الإنجليزي العام — مألوف للمستثمرين الدوليين',
      'ضمان إعفاء ضريبي 0% لمدة 50 عامًا',
      'ملكية أجنبية 100% مع إعادة الأرباح الكاملة',
    ],
    cons: [
      'Physical office on Al Maryah Island required',
      'Annual fees $2,000–$8,000+',
      'Less recognized than Delaware for US-focused VC rounds',
      'Limited local market access',
    ],
    consAr: [
      'يلزم وجود مكتب فعلي في جزيرة المارية',
      'الرسوم السنوية 2000–8000 دولار أو أكثر',
    ],
    implications: {
      fundraising: 'Highly VC-friendly. SAFE notes, convertible notes, and preferred share structures are all enforceable. Most Gulf VCs and many international funds invest into ADGM entities.',
      tax: '0% corporate tax with 50-year guarantee. No capital gains tax, no withholding tax on dividends.',
      operations: 'Primarily a holding/structuring jurisdiction. Operational subsidiaries typically set up in mainland UAE.',
      exit: 'Strong exit infrastructure. ADGM has its own stock exchange (ADX) and supports M&A under English law.',
    },
    implicationsAr: {
      fundraising: 'ودية جداً لرأس المال المغامر. ملاحظات SAFE وهياكل الأسهم المفضلة قابلة للتنفيذ.',
      tax: '0% ضريبة على الشركات مع ضمان 50 عامًا.',
      operations: 'في المقام الأول اختصاص قضائي للاحتجاز والهيكلة.',
      exit: 'بنية تحتية قوية للخروج مع بورصة ADX.',
    },
    idealFor: 'MENA-focused startups raising Series A+, holding companies, FinTech companies, SPVs for real estate or investments.',
    idealForAr: 'الشركات الناشئة المركزة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع جولة Series A+.',
    notIdealFor: 'Bootstrapped startups (costs are high), companies needing mainland UAE trade licenses.',
    notIdealForAr: 'الشركات الناشئة ذاتية التمويل (التكاليف مرتفعة).',
    officialUrl: 'https://www.adgm.com',
  },
  {
    id: 'difc',
    name: 'DIFC',
    nameAr: 'مركز دبي المالي العالمي',
    region: 'UAE – Dubai',
    flag: '🇦🇪',
    tagline: 'Dubai International Financial Centre — The Middle East\'s Financial Hub',
    taglineAr: 'مركز دبي المالي العالمي — المركز المالي للشرق الأوسط',
    type: 'free-zone',
    bestFor: ['FinTech', 'Financial Services', 'Professional Services', 'Holding Companies', 'Family Offices'],
    corporateTax: '0% (50-yr guarantee)',
    foreignOwnership: '100%',
    setupCost: '$5,000 – $25,000',
    setupTime: '7–14 days',
    legalSystem: 'English Common Law (DIFC Courts)',
    currency: 'USD / AED',
    minCapital: '$500 (most structures)',
    vcFriendly: 'high',
    annualFees: '$3,000 – $12,000/yr',
    scores: { vcFriendliness: 9, taxEfficiency: 10, setupEase: 7, costEfficiency: 5, marketAccess: 9 },
    tags: ['vc-backed', 'fintech', 'financial-services', 'prestige', 'series-a-plus'],
    overview: 'DIFC is one of the world\'s top 10 financial centres, operating under its own English Common Law legal system with independent courts. It hosts over 5,000 companies including major global banks, VC funds, and professional services firms.',
    overviewAr: 'مركز دبي المالي العالمي هو أحد أفضل 10 مراكز مالية في العالم، ويعمل وفق نظامه القانوني الخاص المستند إلى القانون الإنجليزي العام مع محاكم مستقلة.',
    keyRules: [
      'Registered office within DIFC boundaries required',
      'Annual audit mandatory for all DIFC entities',
      'DIFC Courts have jurisdiction over all DIFC company disputes',
      'Prescribed Companies (PCs) offer lighter-touch holding structure',
      'Financial services activities require DFSA authorization',
    ],
    keyRulesAr: [
      'يجب أن يكون للشركة مكتب مسجل داخل حدود مركز دبي المالي العالمي',
      'التدقيق السنوي مطلوب لجميع كيانات المركز',
    ],
    pros: [
      'World-class legal system — DIFC Courts internationally recognized',
      '0% corporate and personal income tax (50-year guarantee)',
      'Prestigious address — home to Goldman Sachs, HSBC, Sequoia',
      'Strong FinTech ecosystem with DIFC FinTech Hive accelerator',
      'Access to Dubai\'s vast network of family offices and HNWIs',
    ],
    prosAr: [
      'نظام قانوني عالمي المستوى',
      '0% ضريبة على الشركات والدخل الشخصي',
      'عنوان مرموق',
    ],
    cons: [
      'Higher setup and annual costs than ADGM',
      'Office space within DIFC is expensive',
      'Annual audit is mandatory (adds $3,000–$10,000/yr)',
      'Less startup-friendly than ADGM for early-stage',
    ],
    consAr: [
      'تكاليف أعلى من ADGM',
      'مساحة المكاتب باهظة الثمن',
    ],
    implications: {
      fundraising: 'Highly VC-friendly. DIFC is the address of choice for regional VCs and family offices. Prescribed Company structure is popular for holding.',
      tax: '0% corporate tax with 50-year guarantee. No capital gains tax.',
      operations: 'Both a holding and operational jurisdiction. Strong professional services ecosystem.',
      exit: 'DIFC supports M&A under English law. Nasdaq Dubai provides a listing venue.',
    },
    implicationsAr: {
      fundraising: 'ودية جداً لرأس المال المغامر. DIFC هو العنوان المفضل لصناديق رأس المال المغامر الإقليمية.',
      tax: '0% ضريبة على الشركات مع ضمان 50 عامًا.',
      operations: 'اختصاص قضائي للاحتجاز والتشغيل معًا.',
      exit: 'DIFC يدعم عمليات الاندماج والاستحواذ بموجب القانون الإنجليزي.',
    },
    idealFor: 'Financial services companies, FinTech startups, professional services firms, and companies wanting a prestigious Dubai address.',
    idealForAr: 'شركات الخدمات المالية وشركات FinTech والشركات التي تريد عنوانًا مرموقًا في دبي.',
    notIdealFor: 'Early-stage startups with tight budgets, or companies not in financial/professional services.',
    notIdealForAr: 'الشركات الناشئة في المراحل المبكرة ذات الميزانيات المحدودة.',
    officialUrl: 'https://www.difc.ae',
  },
  {
    id: 'rakez',
    name: 'RAKEZ',
    nameAr: 'المنطقة الاقتصادية رأس الخيمة',
    region: 'UAE – Ras Al Khaimah',
    flag: '🇦🇪',
    tagline: 'Ras Al Khaimah Economic Zone — The Affordable UAE Free Zone',
    taglineAr: 'المنطقة الاقتصادية رأس الخيمة — المنطقة الحرة الإماراتية الأكثر تكلفة معقولة',
    type: 'free-zone',
    bestFor: ['Bootstrapped Startups', 'E-commerce', 'Trading', 'Freelancers', 'SMEs', 'Cost-conscious founders'],
    corporateTax: '0%',
    foreignOwnership: '100%',
    setupCost: '$750 – $5,000',
    setupTime: '3–7 days',
    legalSystem: 'UAE Law (RAK Courts)',
    currency: 'AED / USD',
    minCapital: 'None',
    vcFriendly: 'low',
    annualFees: '$750 – $2,500/yr',
    scores: { vcFriendliness: 4, taxEfficiency: 10, setupEase: 10, costEfficiency: 10, marketAccess: 7 },
    tags: ['bootstrapped', 'cost-effective', 'ecommerce', 'trading', 'freelancer', 'early-stage'],
    overview: 'RAKEZ (Ras Al Khaimah Economic Zone) is the most affordable UAE free zone, offering 0% corporate tax, 100% foreign ownership, and fast setup at a fraction of the cost of Dubai or Abu Dhabi free zones. Ideal for bootstrapped founders, e-commerce businesses, trading companies, and freelancers who want a UAE presence without the premium price tag.',
    overviewAr: 'RAKEZ هي أكثر المناطق الحرة الإماراتية بأسعار معقولة، وتقدم 0% ضريبة على الشركات وملكية أجنبية 100% وإعداد سريع بجزء من تكلفة المناطق الحرة في دبي أو أبوظبي.',
    keyRules: [
      '0% corporate tax (UAE 9% CT does not apply to qualifying free zone income)',
      '100% foreign ownership',
      'No minimum share capital required',
      'Flexi-desk and virtual office options available',
      'Over 50 business activities permitted',
      'Can operate across UAE with a local service agent',
    ],
    keyRulesAr: [
      '0% ضريبة على الشركات',
      'ملكية أجنبية 100%',
      'لا يوجد حد أدنى لرأس المال',
      'خيارات المكتب المرن والافتراضي متاحة',
    ],
    pros: [
      'Lowest setup cost in UAE ($750 for freelance license)',
      'Fastest setup — as quick as 3 days',
      'No minimum capital requirement',
      'Virtual office options available',
      '0% corporate tax',
      'Multiple license types (trading, service, industrial)',
    ],
    prosAr: [
      'أقل تكلفة إعداد في الإمارات',
      'أسرع إعداد — في 3 أيام',
      'لا يوجد حد أدنى لرأس المال',
      'خيارات المكتب الافتراضي متاحة',
    ],
    cons: [
      'Not VC-friendly — not recognized by most institutional investors',
      'Less prestigious than ADGM/DIFC',
      'Not suitable for complex holding structures',
      'Limited access to Abu Dhabi/Dubai banking relationships',
    ],
    consAr: [
      'غير ودية لرأس المال المغامر',
      'أقل مكانة من ADGM/DIFC',
      'غير مناسبة للهياكل المعقدة',
    ],
    implications: {
      fundraising: 'Not suitable for institutional VC fundraising. Best for bootstrapped businesses, angel-funded startups, or companies not planning to raise institutional capital.',
      tax: '0% corporate tax on qualifying free zone income. Simple, low-cost tax structure.',
      operations: 'Good for trading, e-commerce, and service businesses. Virtual office options reduce overhead.',
      exit: 'Limited exit infrastructure. M&A exits possible but less common.',
    },
    implicationsAr: {
      fundraising: 'غير مناسبة لجمع رأس المال المغامر المؤسسي. الأفضل للشركات ذاتية التمويل.',
      tax: '0% ضريبة على الشركات على الدخل المؤهل للمنطقة الحرة.',
      operations: 'جيدة للتجارة والتجارة الإلكترونية وأعمال الخدمات.',
      exit: 'بنية تحتية محدودة للخروج.',
    },
    idealFor: 'Bootstrapped founders, freelancers, e-commerce businesses, trading companies, and anyone wanting a UAE presence at the lowest possible cost.',
    idealForAr: 'المؤسسون ذاتيو التمويل والمستقلون وشركات التجارة الإلكترونية.',
    notIdealFor: 'VC-backed startups, companies needing English Common Law, or businesses requiring complex holding structures.',
    notIdealForAr: 'الشركات الناشئة المدعومة برأس المال المغامر.',
    officialUrl: 'https://www.rakez.com',
  },
  {
    id: 'delaware',
    name: 'Delaware C-Corp',
    nameAr: 'شركة ديلاوير C-Corp',
    region: 'USA – Delaware',
    flag: '🇺🇸',
    tagline: 'The Gold Standard for US VC-Backed Startups',
    taglineAr: 'المعيار الذهبي للشركات الناشئة الممولة من رأس المال المغامر الأمريكي',
    type: 'onshore',
    bestFor: ['US VC-backed startups', 'Companies targeting US market', 'Pre-IPO companies', 'YC/Techstars alumni'],
    corporateTax: '21% federal + state',
    foreignOwnership: '100%',
    setupCost: '$500 – $3,000',
    setupTime: '1–5 days',
    legalSystem: 'Delaware Corporate Law',
    currency: 'USD',
    minCapital: 'None',
    vcFriendly: 'high',
    annualFees: '$300 – $2,000/yr',
    scores: { vcFriendliness: 10, taxEfficiency: 5, setupEase: 9, costEfficiency: 8, marketAccess: 10 },
    tags: ['vc-backed', 'us-market', 'yc', 'series-a-plus', 'ipo-track'],
    overview: 'Delaware C-Corporation is the default structure for US-backed startups. YC, Sequoia, a16z, and virtually all US VCs require Delaware incorporation. It offers the most developed corporate law in the world, predictable court outcomes (Court of Chancery), and standard equity structures (SAFEs, convertible notes, preferred shares).',
    overviewAr: 'شركة ديلاوير C-Corp هي الهيكل الافتراضي للشركات الناشئة المدعومة من الولايات المتحدة. تتطلب YC وSequoia وa16z وجميع صناديق رأس المال المغامر الأمريكية تقريبًا التأسيس في ديلاوير.',
    keyRules: [
      'Registered agent in Delaware required (can be outsourced)',
      'Annual Delaware franchise tax ($400+ depending on shares)',
      'Board of directors required',
      'Standard SAFE notes and preferred share structures',
      'Foreign founders can incorporate remotely',
      'Must file US taxes (federal + state)',
    ],
    keyRulesAr: [
      'وكيل مسجل في ديلاوير مطلوب',
      'ضريبة الامتياز السنوية لديلاوير',
      'مجلس إدارة مطلوب',
      'المؤسسون الأجانب يمكنهم التأسيس عن بُعد',
    ],
    pros: [
      'Required by virtually all US VCs (YC, Sequoia, a16z, etc.)',
      'Most developed corporate law in the world',
      'Court of Chancery — predictable, fast corporate dispute resolution',
      'Standard equity structures (SAFE, convertible notes, preferred shares)',
      'Easy to set up remotely — no need to be in the US',
      'Largest VC ecosystem in the world',
    ],
    prosAr: [
      'مطلوب من جميع صناديق رأس المال المغامر الأمريكية تقريبًا',
      'أكثر قوانين الشركات تطورًا في العالم',
      'محكمة المستشارية — حل سريع ومتوقع للنزاعات',
    ],
    cons: [
      '21% federal corporate tax (plus state taxes)',
      'Complex US tax compliance for foreign founders',
      'Annual franchise tax can be significant',
      'May require US bank account (harder for non-US founders)',
      'Less relevant for MENA-only focused businesses',
    ],
    consAr: [
      '21% ضريبة على الشركات الفيدرالية',
      'امتثال ضريبي أمريكي معقد للمؤسسين الأجانب',
      'قد يتطلب حسابًا مصرفيًا أمريكيًا',
    ],
    implications: {
      fundraising: 'The gold standard for US VC fundraising. All major US accelerators (YC, Techstars) require Delaware. SAFEs are the standard early-stage instrument.',
      tax: '21% federal corporate tax. However, startups often have losses in early years. R&D tax credits available.',
      operations: 'Can operate globally from Delaware. US bank account (Mercury, Brex) recommended. Stripe Atlas can help with setup.',
      exit: 'Best exit infrastructure in the world. Nasdaq/NYSE IPO pathways. Largest M&A market.',
    },
    implicationsAr: {
      fundraising: 'المعيار الذهبي لجمع رأس المال المغامر الأمريكي.',
      tax: '21% ضريبة على الشركات الفيدرالية.',
      operations: 'يمكن العمل عالميًا من ديلاوير.',
      exit: 'أفضل بنية تحتية للخروج في العالم.',
    },
    idealFor: 'Startups targeting US VCs, YC/Techstars applicants, companies planning a US IPO, and founders who want the most VC-friendly structure globally.',
    idealForAr: 'الشركات الناشئة التي تستهدف صناديق رأس المال المغامر الأمريكية ومتقدمو YC/Techstars.',
    notIdealFor: 'MENA-only focused businesses, bootstrapped startups, or founders who want to avoid US tax complexity.',
    notIdealForAr: 'الأعمال التجارية المركزة في منطقة الشرق الأوسط وشمال أفريقيا فقط.',
    officialUrl: 'https://corp.delaware.gov',
  },
  {
    id: 'cayman',
    name: 'Cayman Islands',
    nameAr: 'جزر كايمان',
    region: 'British Overseas Territory',
    flag: '🇰🇾',
    tagline: 'The Classic Offshore Holding Structure for Global VCs',
    taglineAr: 'هيكل الاحتجاز الكلاسيكي في الخارج لصناديق رأس المال المغامر العالمية',
    type: 'offshore',
    bestFor: ['VC fund structures', 'Holding companies', 'Pre-IPO companies', 'Global fundraising'],
    corporateTax: '0%',
    foreignOwnership: '100%',
    setupCost: '$5,000 – $20,000',
    setupTime: '5–15 days',
    legalSystem: 'English Common Law',
    currency: 'USD / KYD',
    minCapital: 'None',
    vcFriendly: 'high',
    annualFees: '$3,000 – $10,000/yr',
    scores: { vcFriendliness: 8, taxEfficiency: 10, setupEase: 6, costEfficiency: 5, marketAccess: 7 },
    tags: ['vc-backed', 'holding', 'offshore', 'global-fundraising', 'series-b-plus'],
    overview: 'The Cayman Islands is the world\'s most popular offshore jurisdiction for VC fund structures and holding companies. It offers 0% tax, English Common Law, and is recognized by investors globally. The "Cayman flip" is a common structure for MENA startups raising from global VCs.',
    overviewAr: 'جزر كايمان هي الاختصاص القضائي الخارجي الأكثر شيوعًا لهياكل صناديق رأس المال المغامر وشركات القابضة.',
    keyRules: [
      'Exempted Company is the standard structure for startups',
      'No corporate tax, no capital gains tax, no withholding tax',
      'Annual government fee required',
      'Registered office in Cayman required',
      'Economic Substance requirements for certain activities',
      '"Cayman flip" structure: Cayman holdco → operating subsidiary in home country',
    ],
    keyRulesAr: [
      'الشركة المعفاة هي الهيكل القياسي للشركات الناشئة',
      'لا توجد ضريبة على الشركات أو أرباح رأس المال',
      'متطلبات الجوهر الاقتصادي لأنشطة معينة',
    ],
    pros: [
      '0% corporate tax, capital gains tax, and withholding tax',
      'Recognized by US, European, and Asian VCs',
      'Flexible corporate law — easy to issue preferred shares, warrants',
      'No public disclosure of shareholders',
      'Cayman flip is a standard structure for MENA startups raising globally',
    ],
    prosAr: [
      '0% ضريبة على الشركات وأرباح رأس المال',
      'معترف به من قبل صناديق رأس المال المغامر الأمريكية والأوروبية والآسيوية',
      'قانون شركات مرن',
    ],
    cons: [
      'Higher setup and maintenance costs',
      'Economic Substance requirements add complexity',
      'Increasing scrutiny from tax authorities globally',
      'Requires local registered office (adds cost)',
      'Less relevant for MENA-only fundraising',
    ],
    consAr: [
      'تكاليف إعداد وصيانة أعلى',
      'متطلبات الجوهر الاقتصادي تضيف تعقيدًا',
    ],
    implications: {
      fundraising: 'Recognized by global VCs. The "Cayman flip" is standard for MENA startups raising from US/European funds. Less necessary if only raising from Gulf VCs.',
      tax: '0% on all income types. Economic Substance rules require genuine activity for certain regulated activities.',
      operations: 'Pure holding structure — operational subsidiary in home country. Cayman holdco owns the operating company.',
      exit: 'Excellent exit infrastructure. Recognized by global acquirers and IPO markets.',
    },
    implicationsAr: {
      fundraising: '"Cayman flip" هو هيكل قياسي للشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع من صناديق أمريكية/أوروبية.',
      tax: '0% على جميع أنواع الدخل.',
      operations: 'هيكل احتجاز بحت — الشركة التابعة التشغيلية في البلد الأصلي.',
      exit: 'بنية تحتية ممتازة للخروج.',
    },
    idealFor: 'MENA startups raising from US/European VCs, companies planning global fundraising, and founders wanting the most internationally recognized offshore structure.',
    idealForAr: 'الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع من صناديق أمريكية/أوروبية.',
    notIdealFor: 'Bootstrapped startups, companies raising only from Gulf VCs, or businesses where cost is the primary concern.',
    notIdealForAr: 'الشركات الناشئة ذاتية التمويل أو تلك التي تجمع فقط من صناديق الخليج.',
    officialUrl: 'https://www.gov.ky/business',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    nameAr: 'سنغافورة',
    region: 'Southeast Asia',
    flag: '🇸🇬',
    tagline: 'Asia\'s Premier Startup Hub — Gateway to Southeast Asia',
    taglineAr: 'مركز الشركات الناشئة الرائد في آسيا — بوابة جنوب شرق آسيا',
    type: 'onshore',
    bestFor: ['Asia-Pacific expansion', 'FinTech', 'Deep Tech', 'Companies targeting SEA market'],
    corporateTax: '17% (effective rate often lower)',
    foreignOwnership: '100%',
    setupCost: '$1,000 – $5,000',
    setupTime: '1–3 days',
    legalSystem: 'English Common Law',
    currency: 'SGD',
    minCapital: 'SGD 1',
    vcFriendly: 'high',
    annualFees: '$500 – $3,000/yr',
    scores: { vcFriendliness: 8, taxEfficiency: 7, setupEase: 9, costEfficiency: 7, marketAccess: 9 },
    tags: ['asia-expansion', 'fintech', 'deep-tech', 'sea-market', 'series-a-plus'],
    overview: 'Singapore is Asia\'s premier startup hub, offering English Common Law, a strong VC ecosystem, and gateway access to Southeast Asia\'s 680 million consumers. The Startup Tax Exemption (SUTE) effectively reduces the tax rate to near 0% for the first 3 years.',
    overviewAr: 'سنغافورة هي مركز الشركات الناشئة الرائد في آسيا، وتقدم القانون الإنجليزي العام ونظامًا بيئيًا قويًا لرأس المال المغامر.',
    keyRules: [
      'Startup Tax Exemption (SUTE): 75% exemption on first SGD 100K for 3 years',
      'Must have Singapore-resident director',
      'Annual filing with ACRA required',
      'EntrePass visa for foreign founders',
      'GST registration required above SGD 1M revenue',
    ],
    keyRulesAr: [
      'إعفاء ضريبي للشركات الناشئة: 75% إعفاء على أول 100,000 دولار سنغافوري لمدة 3 سنوات',
      'يجب أن يكون هناك مدير مقيم في سنغافورة',
    ],
    pros: [
      'Effective 0% tax for first 3 years (SUTE)',
      'No capital gains tax',
      '80+ double tax treaties',
      'Strong VC ecosystem (Sequoia, SoftBank, GIC)',
      'EntrePass visa for foreign founders',
      'Gateway to SEA\'s 680M consumer market',
    ],
    prosAr: [
      'ضريبة فعلية 0% للسنوات الثلاث الأولى',
      'لا توجد ضريبة على أرباح رأس المال',
      'نظام بيئي قوي لرأس المال المغامر',
    ],
    cons: [
      '17% corporate tax rate after exemption period',
      'Must have Singapore-resident director (adds cost)',
      'High cost of living and office space',
      'Less relevant for MENA-only businesses',
    ],
    consAr: [
      'معدل ضريبة الشركات 17% بعد فترة الإعفاء',
      'يجب أن يكون هناك مدير مقيم في سنغافورة',
    ],
    implications: {
      fundraising: 'Strong VC ecosystem. Less relevant for MENA-focused startups unless expanding to Asia.',
      tax: 'Effective rate often much lower than 17% due to SUTE. No capital gains tax.',
      operations: 'Both holding and operational jurisdiction. Strong talent pool.',
      exit: 'SGX provides a listing venue. Strong secondary market.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي قوي لرأس المال المغامر.',
      tax: 'المعدل الفعلي غالبًا أقل بكثير من 17%.',
      operations: 'اختصاص قضائي للاحتجاز والتشغيل معًا.',
      exit: 'بورصة سنغافورة توفر مكانًا للإدراج.',
    },
    idealFor: 'MENA startups expanding to Asia, companies targeting Southeast Asian markets, deep tech companies.',
    idealForAr: 'الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تتوسع في آسيا.',
    notIdealFor: 'MENA-only focused startups or companies wanting 0% tax long-term.',
    notIdealForAr: 'الشركات الناشئة المركزة في منطقة الشرق الأوسط وشمال أفريقيا فقط.',
    officialUrl: 'https://www.acra.gov.sg',
  },
  {
    id: 'saudi-sez',
    name: 'Saudi Arabia SEZs',
    nameAr: 'المناطق الاقتصادية الخاصة في السعودية',
    region: 'GCC – Saudi Arabia',
    flag: '🇸🇦',
    tagline: 'Vision 2030\'s Investment Gateway — Access the $1T Saudi Economy',
    taglineAr: 'بوابة الاستثمار لرؤية 2030 — الوصول إلى الاقتصاد السعودي بتريليون دولار',
    type: 'special-economic-zone',
    bestFor: ['Companies targeting Saudi market', 'Manufacturing', 'Logistics', 'Cloud/Tech', 'Gov contracts'],
    corporateTax: '5% (SEZ rate)',
    foreignOwnership: '100% (in SEZs)',
    setupCost: '$5,000 – $30,000',
    setupTime: '2–4 weeks',
    legalSystem: 'Saudi Law (SEZ-specific regulations)',
    currency: 'SAR / USD',
    minCapital: 'Varies by SEZ',
    vcFriendly: 'medium',
    annualFees: 'Varies by SEZ',
    scores: { vcFriendliness: 6, taxEfficiency: 8, setupEase: 6, costEfficiency: 6, marketAccess: 10 },
    tags: ['saudi-market', 'vision-2030', 'manufacturing', 'logistics', 'gov-contracts'],
    overview: 'Saudi Arabia launched four Special Economic Zones in 2023 as part of Vision 2030: King Abdullah Economic City (KAEC), Ras Al-Khair, Jazan, and the Cloud Computing SEZ in Riyadh. These offer reduced corporate tax (5%), 100% foreign ownership, and streamlined regulations.',
    overviewAr: 'أطلقت المملكة العربية السعودية أربع مناطق اقتصادية خاصة في 2023 كجزء من رؤية 2030.',
    keyRules: [
      '5% corporate tax (vs 20% standard Saudi rate)',
      '100% foreign ownership in SEZs',
      'Zakat exemption for SEZ entities',
      'Regional HQ requirement for government contracts',
      'Saudization (Nitaqat) workforce requirements',
    ],
    keyRulesAr: [
      'معدل ضريبة الشركات 5% (مقابل 20% المعدل القياسي)',
      'ملكية أجنبية 100% في المناطق الاقتصادية الخاصة',
      'متطلبات السعودة للقوى العاملة',
    ],
    pros: [
      'Access to Saudi Arabia\'s $1T+ economy',
      '5% corporate tax (vs 20% standard)',
      'Government procurement advantage',
      'Vision 2030 tailwinds — massive government investment',
      'Growing VC ecosystem (STV, Wa\'ed, Sanabil)',
    ],
    prosAr: [
      'الوصول إلى اقتصاد المملكة العربية السعودية',
      '5% ضريبة على الشركات',
      'ميزة المشتريات الحكومية',
    ],
    cons: [
      'Higher tax than UAE free zones (5% vs 0%)',
      'Saudization workforce requirements',
      'Complex compliance',
      'Less recognized for VC structures than ADGM/DIFC',
    ],
    consAr: [
      'ضريبة أعلى من المناطق الحرة في الإمارات',
      'متطلبات السعودة',
    ],
    implications: {
      fundraising: 'Growing VC ecosystem. Saudi VCs often require Saudi or GCC incorporation.',
      tax: '5% in SEZs. Zakat exemption is significant.',
      operations: 'Designed for operational companies. Strong government support.',
      exit: 'Tadawul and Nomu provide IPO pathways.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي متنامٍ لرأس المال المغامر.',
      tax: '5% في المناطق الاقتصادية الخاصة.',
      operations: 'مصممة للشركات التشغيلية.',
      exit: 'تداول ونمو يوفران مسارات للاكتتاب.',
    },
    idealFor: 'Companies targeting the Saudi market, Vision 2030 priority sectors, government procurement.',
    idealForAr: 'الشركات التي تستهدف السوق السعودية وقطاعات رؤية 2030.',
    notIdealFor: 'Pure holding structures or companies not targeting Saudi market.',
    notIdealForAr: 'هياكل الاحتجاز البحتة.',
    officialUrl: 'https://investsaudi.sa',
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    nameAr: 'البحرين',
    region: 'GCC – Bahrain',
    flag: '🇧🇭',
    tagline: 'GCC\'s FinTech Hub — Low Cost, Open Banking Friendly',
    taglineAr: 'مركز FinTech في الخليج — تكلفة منخفضة وودي للخدمات المصرفية المفتوحة',
    type: 'free-zone',
    bestFor: ['FinTech', 'Islamic Finance', 'E-commerce', 'Cost-conscious founders'],
    corporateTax: '0% (non-oil)',
    foreignOwnership: '100%',
    setupCost: '$1,500 – $8,000',
    setupTime: '5–10 days',
    legalSystem: 'Civil Law (English Common Law influence)',
    currency: 'BHD (pegged to USD)',
    minCapital: 'BHD 50 (~$130)',
    vcFriendly: 'medium',
    annualFees: '$500 – $3,000/yr',
    scores: { vcFriendliness: 5, taxEfficiency: 10, setupEase: 8, costEfficiency: 9, marketAccess: 7 },
    tags: ['fintech', 'islamic-finance', 'cost-effective', 'bootstrapped', 'gcc-market'],
    overview: 'Bahrain is the GCC\'s most open and cost-effective jurisdiction for startups, particularly in FinTech and Islamic Finance. No corporate tax for non-oil companies, a progressive regulatory sandbox (CBB FinTech Regulatory Sandbox), and lower costs than Dubai or Abu Dhabi.',
    overviewAr: 'البحرين هي الاختصاص القضائي الأكثر انفتاحًا وفعالية من حيث التكلفة في دول الخليج للشركات الناشئة.',
    keyRules: [
      '0% corporate tax for non-oil companies',
      '100% foreign ownership in most sectors',
      'CBB FinTech Regulatory Sandbox',
      'VAT at 10%',
      'Tamkeen support programs for startups',
    ],
    keyRulesAr: [
      '0% ضريبة على الشركات لشركات غير النفط',
      'ملكية أجنبية 100% في معظم القطاعات',
      'صندوق FinTech التنظيمي',
    ],
    pros: [
      '0% corporate tax',
      'Lowest cost of doing business in GCC',
      'Progressive FinTech regulation',
      'Tamkeen subsidies (up to 50% of salary costs)',
      'Easy access to Saudi market via causeway',
    ],
    prosAr: [
      '0% ضريبة على الشركات',
      'أقل تكلفة لممارسة الأعمال في دول الخليج',
      'تنظيم FinTech تقدمي',
    ],
    cons: [
      'Smaller market than UAE or Saudi Arabia',
      'Less prestigious than Dubai/Abu Dhabi',
      'Limited VC ecosystem',
      'VAT at 10%',
    ],
    consAr: [
      'سوق أصغر من الإمارات أو السعودية',
      'نظام بيئي محدود لرأس المال المغامر',
    ],
    implications: {
      fundraising: 'Limited local VC ecosystem. Best for bootstrapped or grant-funded startups.',
      tax: '0% corporate tax. VAT at 10%.',
      operations: 'Excellent for FinTech. Lower costs than UAE.',
      exit: 'Bahrain Bourse is small. M&A exits via regional acquirers.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي محلي محدود لرأس المال المغامر.',
      tax: '0% ضريبة على الشركات.',
      operations: 'ممتاز لشركات FinTech.',
      exit: 'بورصة البحرين صغيرة.',
    },
    idealFor: 'FinTech startups, Islamic finance companies, cost-conscious founders.',
    idealForAr: 'شركات FinTech والتمويل الإسلامي.',
    notIdealFor: 'Companies needing a prestigious address or raising from international VCs.',
    notIdealForAr: 'الشركات التي تحتاج إلى عنوان مرموق.',
    officialUrl: 'https://www.bahrainedb.com',
  },
  {
    id: 'qfc',
    name: 'Qatar QFC',
    nameAr: 'مركز قطر للمال',
    region: 'GCC – Qatar',
    flag: '🇶🇦',
    tagline: 'Qatar Financial Centre — English Law in the Gulf',
    taglineAr: 'مركز قطر للمال — القانون الإنجليزي في الخليج',
    type: 'free-zone',
    bestFor: ['Financial Services', 'Professional Services', 'Companies targeting Qatar market', 'FinTech'],
    corporateTax: '10% (QFC rate)',
    foreignOwnership: '100%',
    setupCost: '$3,000 – $15,000',
    setupTime: '5–10 days',
    legalSystem: 'English Common Law (QFC Courts)',
    currency: 'QAR / USD',
    minCapital: 'None',
    vcFriendly: 'medium',
    annualFees: '$2,000 – $6,000/yr',
    scores: { vcFriendliness: 6, taxEfficiency: 7, setupEase: 7, costEfficiency: 6, marketAccess: 8 },
    tags: ['financial-services', 'qatar-market', 'gcc-market', 'professional-services'],
    overview: 'The Qatar Financial Centre (QFC) operates under English Common Law with its own independent courts, similar to DIFC and ADGM. It offers 100% foreign ownership, a 10% corporate tax rate (lower than Qatar\'s standard 10% but with more favorable rules), and access to Qatar\'s sovereign wealth (QIA).',
    overviewAr: 'مركز قطر للمال يعمل وفق القانون الإنجليزي العام مع محاكم مستقلة، مماثل لـ DIFC وADGM.',
    keyRules: [
      '100% foreign ownership',
      '10% corporate tax (QFC-specific rate)',
      'English Common Law legal system',
      'QFC Courts for dispute resolution',
      'Physical presence in Qatar required',
    ],
    keyRulesAr: [
      'ملكية أجنبية 100%',
      'معدل ضريبة الشركات 10%',
      'نظام القانون الإنجليزي العام',
    ],
    pros: [
      'English Common Law — familiar to international investors',
      '100% foreign ownership',
      'Access to Qatar sovereign wealth (QIA)',
      'Strong financial services ecosystem',
      'QFC FinTech hub growing rapidly',
    ],
    prosAr: [
      'القانون الإنجليزي العام',
      'ملكية أجنبية 100%',
      'الوصول إلى الثروة السيادية القطرية',
    ],
    cons: [
      '10% corporate tax (higher than UAE free zones)',
      'Smaller ecosystem than DIFC/ADGM',
      'Physical presence required',
      'Less internationally recognized',
    ],
    consAr: [
      'ضريبة 10% على الشركات (أعلى من المناطق الحرة الإماراتية)',
      'نظام بيئي أصغر من DIFC/ADGM',
    ],
    implications: {
      fundraising: 'Access to QIA and Qatar-based family offices. Less relevant for international VC fundraising.',
      tax: '10% corporate tax. More favorable than Qatar mainland (also 10% but with different rules).',
      operations: 'Good for companies targeting Qatar market. Physical presence required.',
      exit: 'Qatar Exchange provides a listing venue.',
    },
    implicationsAr: {
      fundraising: 'الوصول إلى QIA ومكاتب العائلات القطرية.',
      tax: 'ضريبة 10% على الشركات.',
      operations: 'جيد للشركات التي تستهدف السوق القطرية.',
      exit: 'بورصة قطر توفر مكانًا للإدراج.',
    },
    idealFor: 'Financial services companies, professional services firms, and companies targeting the Qatar market.',
    idealForAr: 'شركات الخدمات المالية والشركات التي تستهدف السوق القطرية.',
    notIdealFor: 'Early-stage startups, companies wanting 0% tax, or businesses not targeting Qatar.',
    notIdealForAr: 'الشركات الناشئة في المراحل المبكرة أو تلك التي لا تستهدف قطر.',
    officialUrl: 'https://www.qfc.qa',
  },
  {
    id: 'bvi',
    name: 'BVI',
    nameAr: 'جزر فيرجن البريطانية',
    region: 'British Overseas Territory',
    flag: '🇻🇬',
    tagline: 'British Virgin Islands — Flexible Offshore Holding',
    taglineAr: 'جزر فيرجن البريطانية — احتجاز خارجي مرن',
    type: 'offshore',
    bestFor: ['Holding companies', 'Joint ventures', 'Investment vehicles', 'IP holding'],
    corporateTax: '0%',
    foreignOwnership: '100%',
    setupCost: '$1,500 – $5,000',
    setupTime: '3–7 days',
    legalSystem: 'English Common Law',
    currency: 'USD',
    minCapital: 'None',
    vcFriendly: 'medium',
    annualFees: '$1,000 – $3,000/yr',
    scores: { vcFriendliness: 6, taxEfficiency: 10, setupEase: 8, costEfficiency: 7, marketAccess: 6 },
    tags: ['holding', 'offshore', 'ip-holding', 'joint-venture', 'cost-effective'],
    overview: 'The British Virgin Islands (BVI) is one of the world\'s most popular offshore jurisdictions, offering 0% tax, flexible corporate law, and low setup costs. Less prestigious than Cayman for VC structures but more cost-effective for simple holding companies.',
    overviewAr: 'جزر فيرجن البريطانية هي واحدة من أكثر الاختصاصات القضائية الخارجية شيوعًا في العالم.',
    keyRules: [
      '0% corporate tax, capital gains tax, and withholding tax',
      'BVI Business Company (BC) is the standard structure',
      'Annual government fee required',
      'Economic Substance requirements for certain activities',
      'No public register of directors/shareholders',
    ],
    keyRulesAr: [
      '0% ضريبة على الشركات وأرباح رأس المال',
      'شركة BVI Business Company هي الهيكل القياسي',
    ],
    pros: [
      '0% tax on all income',
      'Flexible, simple corporate law',
      'Lower cost than Cayman',
      'No public disclosure of shareholders',
      'Fast setup (3-7 days)',
    ],
    prosAr: [
      '0% ضريبة على جميع الدخل',
      'قانون شركات مرن وبسيط',
      'تكلفة أقل من كايمان',
    ],
    cons: [
      'Less recognized than Cayman for institutional VC',
      'Economic Substance requirements',
      'Increasing regulatory scrutiny',
    ],
    consAr: [
      'أقل شهرة من كايمان لرأس المال المغامر المؤسسي',
      'متطلبات الجوهر الاقتصادي',
    ],
    implications: {
      fundraising: 'Less preferred than Cayman for institutional VC. Good for angel rounds and simpler structures.',
      tax: '0% on all income types.',
      operations: 'Pure holding structure.',
      exit: 'Recognized by global acquirers.',
    },
    implicationsAr: {
      fundraising: 'أقل تفضيلًا من كايمان لرأس المال المغامر المؤسسي.',
      tax: '0% على جميع أنواع الدخل.',
      operations: 'هيكل احتجاز بحت.',
      exit: 'معترف به من قبل المستحوذين العالميين.',
    },
    idealFor: 'Simple holding companies, IP holding structures, joint ventures, and founders wanting a low-cost offshore structure.',
    idealForAr: 'شركات الاحتجاز البسيطة وهياكل الملكية الفكرية.',
    notIdealFor: 'Companies raising from institutional VCs who prefer Cayman, or operational companies.',
    notIdealForAr: 'الشركات التي تجمع من صناديق رأس المال المغامر المؤسسية.',
    officialUrl: 'https://www.bvifsc.vg',
  },
];

// ── Recommender Quiz ──────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  questionAr: string;
  options: { value: string; label: string; labelAr: string; tags: string[] }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'stage',
    question: 'What is your startup\'s current stage?',
    questionAr: 'ما هي المرحلة الحالية لشركتك الناشئة؟',
    options: [
      { value: 'idea', label: 'Idea / Pre-revenue', labelAr: 'فكرة / ما قبل الإيرادات', tags: ['bootstrapped', 'early-stage', 'cost-effective'] },
      { value: 'seed', label: 'Seed / Early traction', labelAr: 'مرحلة البذرة /牵引 مبكرة', tags: ['early-stage', 'vc-backed', 'mena-focus'] },
      { value: 'series-a', label: 'Series A+', labelAr: 'Series A أو أعلى', tags: ['vc-backed', 'series-a-plus', 'holding'] },
      { value: 'growth', label: 'Growth / Pre-IPO', labelAr: 'نمو / ما قبل الاكتتاب', tags: ['series-a-plus', 'ipo-track', 'series-b-plus'] },
    ],
  },
  {
    id: 'investors',
    question: 'Who are you primarily raising from?',
    questionAr: 'ممن تجمع التمويل بشكل رئيسي؟',
    options: [
      { value: 'bootstrapped', label: 'Bootstrapped (no investors)', labelAr: 'ذاتي التمويل (بدون مستثمرين)', tags: ['bootstrapped', 'cost-effective'] },
      { value: 'angels', label: 'Angels / Family offices', labelAr: 'مستثمرون ملائكيون / مكاتب عائلية', tags: ['mena-focus', 'gcc-market'] },
      { value: 'gulf-vcs', label: 'Gulf VCs (STV, Wamda, etc.)', labelAr: 'صناديق رأس المال المغامر الخليجية', tags: ['vc-backed', 'mena-focus', 'gcc-market'] },
      { value: 'us-vcs', label: 'US/Global VCs (YC, Sequoia, etc.)', labelAr: 'صناديق أمريكية/عالمية', tags: ['vc-backed', 'us-market', 'yc', 'global-fundraising'] },
    ],
  },
  {
    id: 'market',
    question: 'What is your primary target market?',
    questionAr: 'ما هو سوقك المستهدف الرئيسي؟',
    options: [
      { value: 'mena', label: 'MENA / GCC', labelAr: 'الشرق الأوسط وشمال أفريقيا / الخليج', tags: ['mena-focus', 'gcc-market'] },
      { value: 'saudi', label: 'Saudi Arabia specifically', labelAr: 'المملكة العربية السعودية تحديدًا', tags: ['saudi-market', 'vision-2030'] },
      { value: 'global', label: 'Global / US', labelAr: 'عالمي / الولايات المتحدة', tags: ['us-market', 'global-fundraising', 'ipo-track'] },
      { value: 'asia', label: 'Asia / Southeast Asia', labelAr: 'آسيا / جنوب شرق آسيا', tags: ['asia-expansion', 'sea-market'] },
    ],
  },
  {
    id: 'budget',
    question: 'What is your setup budget?',
    questionAr: 'ما هي ميزانية الإعداد لديك؟',
    options: [
      { value: 'minimal', label: 'Under $2,000', labelAr: 'أقل من 2,000 دولار', tags: ['bootstrapped', 'cost-effective', 'early-stage'] },
      { value: 'moderate', label: '$2,000 – $10,000', labelAr: '2,000 – 10,000 دولار', tags: ['mena-focus', 'gcc-market'] },
      { value: 'high', label: 'Over $10,000', labelAr: 'أكثر من 10,000 دولار', tags: ['vc-backed', 'prestige', 'series-a-plus'] },
    ],
  },
];

const REGION_FILTERS = ['All', 'UAE', 'GCC', 'Offshore', 'USA', 'Asia'];
const TYPE_LABELS: Record<string, string> = {
  'free-zone': 'Free Zone',
  'offshore': 'Offshore',
  'onshore': 'Onshore',
  'special-economic-zone': 'SEZ',
};
const TYPE_COLORS: Record<string, string> = {
  'free-zone': 'bg-blue-100 text-blue-700',
  'offshore': 'bg-purple-100 text-purple-700',
  'onshore': 'bg-green-100 text-green-700',
  'special-economic-zone': 'bg-amber-100 text-amber-700',
};
const VC_FRIENDLY_COLORS: Record<string, string> = {
  high: 'text-emerald-600',
  medium: 'text-amber-600',
  low: 'text-red-600',
};
const VC_FRIENDLY_BG: Record<string, string> = {
  high: 'bg-emerald-100',
  medium: 'bg-amber-100',
  low: 'bg-red-100',
};

function getRegionFilter(j: Jurisdiction): string {
  if (j.region.includes('UAE')) return 'UAE';
  if (j.id === 'bvi' || j.id === 'cayman') return 'Offshore';
  if (j.region.includes('USA')) return 'USA';
  if (j.region.includes('Southeast Asia') || j.region.includes('Singapore')) return 'Asia';
  if (j.region.includes('GCC') || j.region.includes('Saudi') || j.region.includes('Bahrain') || j.region.includes('Qatar')) return 'GCC';
  return 'All';
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function FreeZones() {
  const { isRTL, lang } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'proscons' | 'implications'>('rules');

  const filtered = useMemo(() => {
    const base = activeFilter === 'All' ? JURISDICTIONS : JURISDICTIONS.filter(j => getRegionFilter(j) === activeFilter);
    if (quizComplete && Object.keys(quizAnswers).length > 0) {
      // Score each jurisdiction by matching tags
      const selectedTags = Object.values(quizAnswers).flatMap(v => {
        const q = QUIZ_QUESTIONS.find(q => Object.values(quizAnswers).includes(v));
        if (!q) return [];
        const opt = q.options.find(o => o.value === v);
        return opt ? opt.tags : [];
      });
      // Collect all tags from all answers
      const allTags: string[] = [];
      for (const [qId, val] of Object.entries(quizAnswers)) {
        const q = QUIZ_QUESTIONS.find(q => q.id === qId);
        if (!q) continue;
        const opt = q.options.find(o => o.value === val);
        if (opt) allTags.push(...opt.tags);
      }
      return [...base].sort((a, b) => {
        const scoreA = a.tags.filter(t => allTags.includes(t)).length;
        const scoreB = b.tags.filter(t => allTags.includes(t)).length;
        return scoreB - scoreA;
      });
    }
    return base;
  }, [activeFilter, quizComplete, quizAnswers]);

  const toggleCompare = (id: string) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compareJurisdictions = JURISDICTIONS.filter(j => compareList.includes(j.id));
  const getName = (j: Jurisdiction) => lang === 'ar' ? j.nameAr : j.name;

  const handleQuizAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...quizAnswers, [questionId]: value };
    setQuizAnswers(newAnswers);
    if (Object.keys(newAnswers).length === QUIZ_QUESTIONS.length) {
      setQuizComplete(true);
      setShowQuiz(false);
    }
  };

  const currentQuizQuestion = QUIZ_QUESTIONS.find(q => !quizAnswers[q.id]);

  // Detail view
  if (selectedJurisdiction) {
    const j = selectedJurisdiction;
    const impl = lang === 'ar' ? j.implicationsAr : j.implications;
    return (
      <div className={`max-w-4xl mx-auto space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Back */}
        <button
          onClick={() => setSelectedJurisdiction(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'ar' ? 'العودة إلى جميع الاختصاصات' : 'Back to all jurisdictions'}
        </button>

        {/* Hero header */}
        <div className="rounded-2xl overflow-hidden border border-border">
          <div className="px-5 py-5 flex items-start gap-4" style={{ background: 'linear-gradient(135deg, oklch(0.35 0.2 270) 0%, oklch(0.45 0.22 300) 100%)' }}>
            <span className="text-5xl">{j.flag}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white">{getName(j)}</h1>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[j.type]}`}>{TYPE_LABELS[j.type]}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${VC_FRIENDLY_BG[j.vcFriendly]} ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
                  VC: {j.vcFriendly === 'high' ? '★★★' : j.vcFriendly === 'medium' ? '★★☆' : '★☆☆'}
                </span>
              </div>
              <p className="text-sm text-white/70 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />{j.region}
              </p>
              <p className="text-sm text-white/80 mt-2 leading-relaxed">
                {lang === 'ar' ? j.taglineAr : j.tagline}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border bg-card">
            {[
              { label: lang === 'ar' ? 'ضريبة الشركات' : 'Corporate Tax', value: j.corporateTax, color: 'text-emerald-600' },
              { label: lang === 'ar' ? 'الملكية الأجنبية' : 'Foreign Ownership', value: j.foreignOwnership, color: 'text-blue-600' },
              { label: lang === 'ar' ? 'تكلفة الإعداد' : 'Setup Cost', value: j.setupCost, color: 'text-amber-600' },
              { label: lang === 'ar' ? 'وقت الإعداد' : 'Setup Time', value: j.setupTime, color: 'text-violet-600' },
            ].map(stat => (
              <div key={stat.label} className="p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</div>
                <div className={`text-xs font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score bars */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-foreground mb-3">{lang === 'ar' ? 'تقييم الأبعاد' : 'Dimension Scores'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ScoreBar label={lang === 'ar' ? 'ودية لرأس المال المغامر' : 'VC Friendliness'} value={j.scores.vcFriendliness} color="#6366F1" />
            <ScoreBar label={lang === 'ar' ? 'الكفاءة الضريبية' : 'Tax Efficiency'} value={j.scores.taxEfficiency} color="#10B981" />
            <ScoreBar label={lang === 'ar' ? 'سهولة الإعداد' : 'Setup Ease'} value={j.scores.setupEase} color="#F59E0B" />
            <ScoreBar label={lang === 'ar' ? 'كفاءة التكلفة' : 'Cost Efficiency'} value={j.scores.costEfficiency} color="#EC4899" />
            <ScoreBar label={lang === 'ar' ? 'الوصول إلى السوق' : 'Market Access'} value={j.scores.marketAccess} color="#8B5CF6" />
          </div>
        </div>

        {/* Overview */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-foreground">{lang === 'ar' ? 'نظرة عامة' : 'Overview'}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{lang === 'ar' ? j.overviewAr : j.overview}</p>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border">
            {(['rules', 'proscons', 'implications'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'rules' ? (lang === 'ar' ? 'القواعد الرئيسية' : 'Key Rules') :
                 tab === 'proscons' ? (lang === 'ar' ? 'المزايا والعيوب' : 'Pros & Cons') :
                 (lang === 'ar' ? 'التداعيات' : 'Implications')}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'rules' && (
              <ul className="space-y-2">
                {(lang === 'ar' ? j.keyRulesAr : j.keyRules).map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Scale className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'proscons' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">{lang === 'ar' ? 'المزايا' : 'Advantages'}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {(lang === 'ar' ? j.prosAr : j.pros).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700">
                        <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">{lang === 'ar' ? 'العيوب' : 'Disadvantages'}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {(lang === 'ar' ? j.consAr : j.cons).map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                        <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'implications' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'fundraising', label: lang === 'ar' ? 'جمع التمويل' : 'Fundraising', icon: TrendingUp, color: 'text-blue-500' },
                  { key: 'tax', label: lang === 'ar' ? 'الضرائب' : 'Tax', icon: DollarSign, color: 'text-emerald-500' },
                  { key: 'operations', label: lang === 'ar' ? 'العمليات' : 'Operations', icon: Building2, color: 'text-amber-500' },
                  { key: 'exit', label: lang === 'ar' ? 'الخروج' : 'Exit', icon: BarChart3, color: 'text-violet-500' },
                ].map(item => (
                  <div key={item.key} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {impl[item.key as keyof typeof impl]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ideal / Not ideal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{lang === 'ar' ? 'مثالي لـ' : 'Ideal For'}</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">{lang === 'ar' ? j.idealForAr : j.idealFor}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">{lang === 'ar' ? 'غير مثالي لـ' : 'Not Ideal For'}</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{lang === 'ar' ? j.notIdealForAr : j.notIdealFor}</p>
          </div>
        </div>

        {/* Best for tags + additional info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">{lang === 'ar' ? 'الأفضل لـ' : 'Best For'}</div>
            <div className="flex flex-wrap gap-1.5">
              {j.bestFor.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">{tag}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">{lang === 'ar' ? 'النظام القانوني' : 'Legal System'}</div>
              <div className="text-xs font-semibold text-foreground">{j.legalSystem}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">{lang === 'ar' ? 'الحد الأدنى لرأس المال' : 'Min Capital'}</div>
              <div className="text-xs font-semibold text-foreground">{j.minCapital}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">{lang === 'ar' ? 'الرسوم السنوية' : 'Annual Fees'}</div>
              <div className="text-xs font-semibold text-foreground">{j.annualFees}</div>
            </div>
          </div>
        </div>

        {/* Official link */}
        <a
          href={j.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Globe className="w-4 h-4" />
          {lang === 'ar' ? 'الموقع الرسمي' : 'Official Website'}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, oklch(0.35 0.2 270) 0%, oklch(0.45 0.22 300) 100%)' }}>
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-white/80" />
            <h1 className="text-xl font-bold text-white">
              {lang === 'ar' ? 'المناطق الحرة والاختصاصات القضائية' : 'Free Zones & Jurisdictions'}
            </h1>
          </div>
          <p className="text-sm text-white/70">
            {lang === 'ar'
              ? 'دليل شامل لاختيار الاختصاص القضائي المناسب لشركتك الناشئة — 10 اختصاصات مع مقارنات ومزايا وعيوب'
              : 'Choose the right jurisdiction for your startup — 10 jurisdictions with scores, comparisons, and implications'}
          </p>
          <button
            onClick={() => { setShowQuiz(true); setQuizAnswers({}); setQuizComplete(false); }}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <Sparkles className="w-4 h-4" />
            {lang === 'ar' ? 'اعثر على اختصاصك المثالي' : 'Find My Ideal Jurisdiction'}
          </button>
        </div>
      </div>

      {/* Quiz modal */}
      <AnimatePresence>
        {showQuiz && currentQuizQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">
                  {lang === 'ar' ? 'موصي الاختصاص القضائي' : 'Jurisdiction Recommender'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(quizAnswers).length + 1} / {QUIZ_QUESTIONS.length}
              </div>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-1.5 mb-4">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((Object.keys(quizAnswers).length) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-foreground mb-3">
              {lang === 'ar' ? currentQuizQuestion.questionAr : currentQuizQuestion.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQuizQuestion.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleQuizAnswer(currentQuizQuestion.id, opt.value)}
                  className="text-left px-4 py-3 rounded-xl border border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-foreground flex items-center justify-between group"
                >
                  <span>{lang === 'ar' ? opt.labelAr : opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowQuiz(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz result banner */}
      {quizComplete && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">
              {lang === 'ar' ? 'الاختصاصات مرتبة حسب توصياتك' : 'Jurisdictions ranked by your profile'}
            </span>
          </div>
          <button
            onClick={() => { setQuizComplete(false); setQuizAnswers({}); }}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </button>
        </div>
      )}

      {/* Filter + Compare */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {REGION_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              style={activeFilter === f ? { background: 'oklch(0.45 0.2 270)' } : {}}
            >
              {f}
            </button>
          ))}
        </div>
        {compareList.length > 0 && (
          <button
            onClick={() => setShowCompare(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {lang === 'ar' ? `مقارنة (${compareList.length})` : `Compare (${compareList.length})`}
            {showCompare ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Comparison Table */}
      <AnimatePresence>
        {showCompare && compareJurisdictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-card overflow-x-auto"
          >
            <div className="p-4 border-b border-border">
              <div className="text-sm font-semibold text-foreground">{lang === 'ar' ? 'مقارنة الاختصاصات القضائية' : 'Jurisdiction Comparison'}</div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-4 font-semibold text-muted-foreground">{lang === 'ar' ? 'المعيار' : 'Criteria'}</th>
                  {compareJurisdictions.map(j => (
                    <th key={j.id} className="text-left py-2 px-3 font-semibold text-foreground">
                      {j.flag} {getName(j)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'corporateTax', label: lang === 'ar' ? 'ضريبة الشركات' : 'Corporate Tax' },
                  { key: 'foreignOwnership', label: lang === 'ar' ? 'الملكية الأجنبية' : 'Foreign Ownership' },
                  { key: 'setupCost', label: lang === 'ar' ? 'تكلفة الإعداد' : 'Setup Cost' },
                  { key: 'setupTime', label: lang === 'ar' ? 'وقت الإعداد' : 'Setup Time' },
                  { key: 'legalSystem', label: lang === 'ar' ? 'النظام القانوني' : 'Legal System' },
                  { key: 'annualFees', label: lang === 'ar' ? 'الرسوم السنوية' : 'Annual Fees' },
                  { key: 'minCapital', label: lang === 'ar' ? 'الحد الأدنى لرأس المال' : 'Min Capital' },
                ].map(row => (
                  <tr key={row.key} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="py-2 px-4 text-muted-foreground font-medium">{row.label}</td>
                    {compareJurisdictions.map(j => (
                      <td key={j.id} className="py-2 px-3 text-foreground">
                        {j[row.key as keyof Jurisdiction] as string}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-border">
                  <td className="py-2 px-4 text-muted-foreground font-medium">{lang === 'ar' ? 'ودية لرأس المال المغامر' : 'VC Friendly'}</td>
                  {compareJurisdictions.map(j => (
                    <td key={j.id} className={`py-2 px-3 font-bold ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
                      {j.vcFriendly === 'high' ? '★★★ High' : j.vcFriendly === 'medium' ? '★★☆ Medium' : '★☆☆ Low'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jurisdiction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((j, idx) => {
          const isRecommended = quizComplete && idx === 0;
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`relative rounded-xl border cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group bg-card ${isRecommended ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-border'}`}
              onClick={() => setSelectedJurisdiction(j)}
            >
              {isRecommended && (
                <div className="absolute -top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'oklch(0.45 0.2 270)' }}>
                  <Sparkles className="w-2.5 h-2.5" />
                  {lang === 'ar' ? 'الأفضل لك' : 'Best Match'}
                </div>
              )}

              {/* Compare checkbox */}
              <div
                className="absolute top-3 right-3 z-10"
                onClick={e => { e.stopPropagation(); toggleCompare(j.id); }}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  compareList.includes(j.id) ? 'border-indigo-500 bg-indigo-500' : 'border-border bg-background hover:border-indigo-400'
                }`}>
                  {compareList.includes(j.id) && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </div>

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{j.flag}</span>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm">{getName(j)}</h3>
                      <span className={`text-[10px] px-1.5 py-0 rounded-full font-semibold ${TYPE_COLORS[j.type]}`}>
                        {TYPE_LABELS[j.type]}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {j.region}
                    </p>
                  </div>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                    <div className="text-[10px] text-emerald-600 font-medium">{lang === 'ar' ? 'ضريبة' : 'Tax'}</div>
                    <div className="text-xs font-bold text-emerald-700">{j.corporateTax}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 border border-border p-2">
                    <div className="text-[10px] text-muted-foreground font-medium">{lang === 'ar' ? 'إعداد' : 'Setup'}</div>
                    <div className="text-xs font-bold text-foreground">{j.setupCost}</div>
                  </div>
                </div>

                {/* Score mini bars */}
                <div className="space-y-1.5 mb-3">
                  {[
                    { label: lang === 'ar' ? 'VC' : 'VC', value: j.scores.vcFriendliness, color: '#6366F1' },
                    { label: lang === 'ar' ? 'ضريبة' : 'Tax', value: j.scores.taxEfficiency, color: '#10B981' },
                    { label: lang === 'ar' ? 'تكلفة' : 'Cost', value: j.scores.costEfficiency, color: '#EC4899' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">{s.label}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value * 10}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* VC + details link */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${VC_FRIENDLY_BG[j.vcFriendly]} ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
                    VC: {j.vcFriendly === 'high' ? '★★★' : j.vcFriendly === 'medium' ? '★★☆' : '★☆☆'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-indigo-600 transition-colors font-medium">
                    {lang === 'ar' ? 'التفاصيل' : 'Details'}
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Best for tags */}
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                  {j.bestFor.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">{tag}</span>
                  ))}
                  {j.bestFor.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">+{j.bestFor.length - 3}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Compare hint */}
      <p className="text-xs text-muted-foreground text-center">
        {lang === 'ar'
          ? 'انقر على مربع الاختيار في أي بطاقة لمقارنة ما يصل إلى 4 اختصاصات جنبًا إلى جنب'
          : 'Click the checkbox on any card to compare up to 4 jurisdictions side-by-side'}
      </p>
    </div>
  );
}
