/**
 * FreeZones.tsx — Free Zones & Jurisdictions Guide
 * Covers: ADGM, DIFC, Delaware, Cayman Islands, BVI, Singapore,
 *         Saudi Arabia SEZs, Bahrain, Egypt, Jordan
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Globe, MapPin, DollarSign, Shield, Users, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Scale, Building2, Landmark, Star, Info, ArrowRight, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  implications: {
    fundraising: string;
    tax: string;
    operations: string;
    exit: string;
  };
  implicationsAr: {
    fundraising: string;
    tax: string;
    operations: string;
    exit: string;
  };
  idealFor: string;
  idealForAr: string;
  notIdealFor: string;
  notIdealForAr: string;
  officialUrl: string;
  annualFees: string;
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
    corporateTax: '0% (50-year guarantee)',
    foreignOwnership: '100%',
    setupCost: '$2,000 – $15,000',
    setupTime: '5–10 business days',
    legalSystem: 'English Common Law',
    currency: 'USD / AED',
    minCapital: 'No minimum (most structures)',
    vcFriendly: 'high',
    annualFees: '$2,000 – $8,000/year',
    overview: 'ADGM is Abu Dhabi\'s international financial centre, operating under English common law — the same legal framework used in the UK, US, and major financial hubs. It is the preferred jurisdiction for VC-backed startups and holding structures in the Gulf, offering a 50-year tax exemption guarantee, 100% foreign ownership, and full profit repatriation.',
    overviewAr: 'سوق أبوظبي العالمي هو المركز المالي الدولي لأبوظبي، ويعمل وفق القانون الإنجليزي العام — نفس الإطار القانوني المستخدم في المملكة المتحدة والولايات المتحدة والمراكز المالية الكبرى. وهو الاختصاص القضائي المفضل للشركات الناشئة المدعومة برأس المال المغامر وهياكل الاحتجاز في الخليج.',
    keyRules: [
      'Companies must have a registered office on Al Maryah Island (Abu Dhabi)',
      'Minimum 1 director and 1 shareholder (can be same person)',
      'Annual financial statements required; audit required for regulated entities',
      'Startups can use ADGM\'s simplified SPV structure for holding shares',
      'ADGM\'s Regulatory Laboratory (RegLab) available for FinTech sandboxes',
      'No requirement to hire local staff for holding companies',
      'Shares can be denominated in any currency',
    ],
    keyRulesAr: [
      'يجب أن يكون للشركات مكتب مسجل في جزيرة المارية (أبوظبي)',
      'الحد الأدنى مدير واحد ومساهم واحد (يمكن أن يكون نفس الشخص)',
      'البيانات المالية السنوية مطلوبة؛ التدقيق مطلوب للكيانات المنظمة',
      'يمكن للشركات الناشئة استخدام هيكل SPV المبسط من ADGM لحيازة الأسهم',
      'المختبر التنظيمي (RegLab) متاح لصناديق FinTech',
    ],
    pros: [
      'English Common Law — familiar to international VCs and lawyers',
      '50-year tax exemption guarantee (0% corporate and personal income tax)',
      '100% foreign ownership with full profit repatriation',
      'Strong investor protection framework aligned with global standards',
      'ADGM SPV is a popular, cost-effective holding structure for MENA startups',
      'Access to Abu Dhabi\'s sovereign wealth network (Mubadala, ADQ, ADIA)',
      'Recognized by US and UK courts — easier cross-border enforcement',
    ],
    prosAr: [
      'القانون الإنجليزي العام — مألوف لدى المستثمرين المغامرين والمحامين الدوليين',
      'ضمان إعفاء ضريبي لمدة 50 عامًا (0% ضريبة على الشركات والدخل الشخصي)',
      'ملكية أجنبية 100% مع إعادة الأرباح الكاملة',
      'إطار قوي لحماية المستثمرين متوافق مع المعايير العالمية',
    ],
    cons: [
      'Physical office on Al Maryah Island required (adds cost)',
      'Annual fees can be $2,000–$8,000+ depending on structure',
      'Less recognized than Delaware for US-focused VC rounds',
      'Regulated financial activities require FSRA license (expensive)',
      'Limited local market access — primarily a holding/structuring jurisdiction',
    ],
    consAr: [
      'يلزم وجود مكتب فعلي في جزيرة المارية (يضيف تكلفة)',
      'الرسوم السنوية يمكن أن تكون 2000 إلى 8000 دولار أو أكثر حسب الهيكل',
      'أقل شهرة من ديلاوير للجولات الاستثمارية المركزة في الولايات المتحدة',
    ],
    implications: {
      fundraising: 'Highly VC-friendly. ADGM\'s English Common Law framework means standard SAFE notes, convertible notes, and preferred share structures are all enforceable. Most Gulf VCs and many international funds are comfortable investing into ADGM entities.',
      tax: '0% corporate tax with a 50-year guarantee. No capital gains tax, no withholding tax on dividends. UAE\'s 9% corporate tax does not apply to ADGM free zone entities on qualifying income.',
      operations: 'Primarily a holding/structuring jurisdiction. Operational subsidiaries are typically set up in mainland UAE or other jurisdictions. ADGM entities can own shares in mainland companies.',
      exit: 'Strong exit infrastructure. ADGM has its own stock exchange (ADX) and supports M&A transactions under English law. IPO pathways available through ADX or international exchanges.',
    },
    implicationsAr: {
      fundraising: 'ودية جداً لرأس المال المغامر. يعني إطار القانون الإنجليزي العام في ADGM أن ملاحظات SAFE القياسية وملاحظات قابلة للتحويل وهياكل الأسهم المفضلة قابلة للتنفيذ.',
      tax: '0% ضريبة على الشركات مع ضمان 50 عامًا. لا ضريبة على أرباح رأس المال، ولا ضريبة استقطاع على الأرباح.',
      operations: 'في المقام الأول اختصاص قضائي للاحتجاز والهيكلة. عادةً ما يتم إنشاء الشركات التابعة التشغيلية في البر الرئيسي للإمارات أو اختصاصات قضائية أخرى.',
      exit: 'بنية تحتية قوية للخروج. تمتلك ADGM بورصتها الخاصة (ADX) وتدعم معاملات الاندماج والاستحواذ بموجب القانون الإنجليزي.',
    },
    idealFor: 'MENA-focused startups raising Series A+, holding companies, FinTech companies, SPVs for real estate or investments, and founders seeking a Gulf-based alternative to Cayman Islands.',
    idealForAr: 'الشركات الناشئة المركزة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع جولة Series A+، وشركات القابضة، وشركات FinTech.',
    notIdealFor: 'Bootstrapped startups (costs are high), companies needing mainland UAE trade licenses, or founders targeting US VCs who prefer Delaware.',
    notIdealForAr: 'الشركات الناشئة ذاتية التمويل (التكاليف مرتفعة)، والشركات التي تحتاج إلى رخص تجارية في البر الرئيسي للإمارات.',
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
    corporateTax: '0% (50-year guarantee)',
    foreignOwnership: '100%',
    setupCost: '$5,000 – $25,000',
    setupTime: '7–14 business days',
    legalSystem: 'English Common Law (DIFC Courts)',
    currency: 'USD / AED',
    minCapital: '$500 (most structures)',
    vcFriendly: 'high',
    annualFees: '$3,000 – $12,000/year',
    overview: 'DIFC is one of the world\'s top 10 financial centres, operating under its own English Common Law legal system with independent courts. It hosts over 5,000 companies including major global banks, VC funds, and professional services firms. DIFC is particularly strong for financial services, FinTech, and companies wanting a prestigious Dubai address.',
    overviewAr: 'مركز دبي المالي العالمي هو أحد أفضل 10 مراكز مالية في العالم، ويعمل وفق نظامه القانوني الخاص المستند إلى القانون الإنجليزي العام مع محاكم مستقلة.',
    keyRules: [
      'Must have a registered office within DIFC boundaries',
      'Minimum 1 director; corporate directors permitted',
      'Annual audit required for all DIFC entities',
      'DIFC Courts have jurisdiction over all DIFC company disputes',
      'Prescribed Companies (PCs) offer a lighter-touch structure for holding',
      'Financial services activities require DFSA authorization',
      'Employees must have DIFC employment contracts',
    ],
    keyRulesAr: [
      'يجب أن يكون للشركة مكتب مسجل داخل حدود مركز دبي المالي العالمي',
      'الحد الأدنى مدير واحد؛ يُسمح بمديرين من الشركات',
      'التدقيق السنوي مطلوب لجميع كيانات مركز دبي المالي العالمي',
    ],
    pros: [
      'World-class legal system — DIFC Courts are internationally recognized',
      '0% corporate and personal income tax (50-year guarantee)',
      'Prestigious address — home to Goldman Sachs, HSBC, Sequoia, etc.',
      'Strong FinTech ecosystem with DIFC FinTech Hive accelerator',
      'Access to Dubai\'s vast network of family offices and HNWIs',
      'Prescribed Company structure is cost-effective for holding',
      'DIFC Wills service for estate planning (unique in the region)',
    ],
    prosAr: [
      'نظام قانوني عالمي المستوى — محاكم DIFC معترف بها دوليًا',
      '0% ضريبة على الشركات والدخل الشخصي (ضمان 50 عامًا)',
      'عنوان مرموق — موطن Goldman Sachs وHSBC وSequoia وغيرها',
    ],
    cons: [
      'Higher setup and annual costs than ADGM for equivalent structures',
      'Office space within DIFC is expensive (premium Dubai real estate)',
      'Annual audit is mandatory (adds $3,000–$10,000/year in costs)',
      'Regulated activities require DFSA license — complex and expensive',
      'Less startup-friendly than ADGM for early-stage companies',
    ],
    consAr: [
      'تكاليف إعداد وسنوية أعلى من ADGM للهياكل المماثلة',
      'مساحة المكاتب داخل DIFC باهظة الثمن (عقارات دبي المتميزة)',
    ],
    implications: {
      fundraising: 'Excellent for raising from Gulf family offices and institutional investors. DIFC\'s reputation and legal framework make it attractive for Series A+ rounds. Less common for seed-stage deals due to higher costs.',
      tax: '0% corporate and personal income tax with a 50-year guarantee. UAE\'s 9% corporate tax does not apply to DIFC qualifying income. No withholding tax on dividends or capital gains.',
      operations: 'DIFC is both a holding and operational jurisdiction. Companies can conduct business directly from DIFC, unlike some other free zones. Strong talent pool available within DIFC.',
      exit: 'DIFC supports M&A, secondary transactions, and IPOs. Nasdaq Dubai is located within DIFC and provides a listing venue for regional companies.',
    },
    implicationsAr: {
      fundraising: 'ممتاز لجمع التمويل من مكاتب العائلات الخليجية والمستثمرين المؤسسيين.',
      tax: '0% ضريبة على الشركات والدخل الشخصي مع ضمان 50 عامًا.',
      operations: 'DIFC هو اختصاص قضائي للاحتجاز والتشغيل معًا.',
      exit: 'يدعم DIFC عمليات الاندماج والاستحواذ والمعاملات الثانوية والاكتتابات العامة.',
    },
    idealFor: 'Financial services companies, FinTech startups, family offices, professional services firms, and companies wanting a prestigious Dubai address for client meetings.',
    idealForAr: 'شركات الخدمات المالية، وشركات FinTech الناشئة، ومكاتب العائلات، وشركات الخدمات المهنية.',
    notIdealFor: 'Early-stage bootstrapped startups (high costs), e-commerce or consumer apps needing mainland UAE presence, or companies with primarily US investors.',
    notIdealForAr: 'الشركات الناشئة في المراحل المبكرة ذاتية التمويل (تكاليف مرتفعة)، والتجارة الإلكترونية أو تطبيقات المستهلكين التي تحتاج إلى حضور في البر الرئيسي للإمارات.',
    officialUrl: 'https://www.difc.ae',
  },
  {
    id: 'delaware',
    name: 'Delaware C-Corp',
    nameAr: 'شركة ديلاوير C-Corp',
    region: 'USA – Delaware',
    flag: '🇺🇸',
    tagline: 'The Global Standard for VC-Backed Startups',
    taglineAr: 'المعيار العالمي للشركات الناشئة المدعومة برأس المال المغامر',
    type: 'onshore',
    bestFor: ['US-focused startups', 'YC/Sequoia-backed companies', 'SaaS', 'B2B Tech', 'Companies targeting US IPO'],
    corporateTax: '21% federal + 8.7% Delaware state',
    foreignOwnership: '100% (non-US founders allowed)',
    setupCost: '$500 – $2,000',
    setupTime: '1–3 business days',
    legalSystem: 'Delaware General Corporation Law',
    currency: 'USD',
    minCapital: 'No minimum',
    vcFriendly: 'high',
    annualFees: '$300 – $2,000/year (franchise tax)',
    overview: 'Delaware C-Corp is the gold standard for venture-backed startups globally. Over 60% of Fortune 500 companies and the vast majority of VC-backed startups are incorporated in Delaware. Its court system (Court of Chancery) has centuries of corporate law precedent, making it the most predictable and investor-friendly jurisdiction in the world.',
    overviewAr: 'شركة ديلاوير C-Corp هي المعيار الذهبي للشركات الناشئة المدعومة برأس المال المغامر على مستوى العالم. أكثر من 60% من شركات Fortune 500 وغالبية الشركات الناشئة المدعومة برأس المال المغامر مؤسسة في ديلاوير.',
    keyRules: [
      'Must have a registered agent in Delaware (not required to operate there)',
      'Annual franchise tax based on shares issued or assumed par value method',
      'Board of directors required; no residency requirements for directors',
      'Authorized shares structure — common and preferred share classes',
      'Annual report filing required with Delaware Secretary of State',
      'Foreign founders can own 100% — no US citizenship required',
      'S-Corp election not available to non-US residents (C-Corp only)',
    ],
    keyRulesAr: [
      'يجب أن يكون لديك وكيل مسجل في ديلاوير (لا يلزم التشغيل هناك)',
      'ضريبة الامتياز السنوية بناءً على الأسهم الصادرة أو طريقة القيمة الاسمية المفترضة',
      'مجلس الإدارة مطلوب؛ لا توجد متطلبات إقامة للمديرين',
    ],
    pros: [
      'Universal VC acceptance — Y Combinator, Sequoia, a16z all require Delaware',
      'SAFE notes, convertible notes, and standard term sheets are all built for Delaware',
      'Court of Chancery — dedicated corporate court with 200+ years of precedent',
      'Fastest and cheapest incorporation in the world ($500, 1–3 days)',
      'No requirement to live or operate in Delaware',
      'Strong secondary market — easier to transfer shares',
      'Nasdaq/NYSE IPO pathway — most US exchanges prefer Delaware entities',
    ],
    prosAr: [
      'قبول عالمي من رأس المال المغامر — Y Combinator وSequoia وa16z يطلبون جميعًا ديلاوير',
      'ملاحظات SAFE وملاحظات قابلة للتحويل وأوراق الشروط القياسية مبنية لديلاوير',
      'محكمة المستشارية — محكمة شركات مخصصة بسوابق تمتد لأكثر من 200 عام',
    ],
    cons: [
      'Corporate tax applies (21% federal) — unlike UAE free zones',
      'US tax reporting required even for non-US founders (Form 5471, etc.)',
      'Double taxation on dividends (corporate tax + personal income tax)',
      'US banking and compliance requirements can be complex for non-US founders',
      'FATCA/FBAR reporting obligations for foreign founders',
      'Less optimal for MENA-focused businesses not targeting US investors',
    ],
    consAr: [
      'تنطبق ضريبة الشركات (21% فيدرالية) — على عكس المناطق الحرة في الإمارات',
      'التقارير الضريبية الأمريكية مطلوبة حتى للمؤسسين من غير الأمريكيين',
      'الازدواج الضريبي على الأرباح (ضريبة الشركات + ضريبة الدخل الشخصي)',
    ],
    implications: {
      fundraising: 'The de facto standard for US VC funding. All major accelerators (YC, Techstars), and virtually all US VCs require Delaware incorporation. SAFE notes, Series A/B term sheets are all standardized for Delaware C-Corps.',
      tax: '21% federal corporate tax + Delaware franchise tax. However, many early-stage startups have no taxable income for years. R&D tax credits available. Non-US founders face complex US tax reporting obligations.',
      operations: 'Can operate anywhere in the world. Most MENA founders incorporate in Delaware but operate from their home country. Need to register as a "foreign corporation" in any US state where you have employees or offices.',
      exit: 'Best exit pathway for US IPO (Nasdaq/NYSE). M&A transactions are well-understood by US acquirers. Strong secondary market for shares.',
    },
    implicationsAr: {
      fundraising: 'المعيار الفعلي لتمويل رأس المال المغامر الأمريكي. جميع المسرّعات الكبرى (YC، Techstars) وجميع رأس المال المغامر الأمريكي تقريبًا تتطلب التأسيس في ديلاوير.',
      tax: '21% ضريبة فيدرالية على الشركات + ضريبة امتياز ديلاوير.',
      operations: 'يمكن التشغيل في أي مكان في العالم. معظم المؤسسين في منطقة الشرق الأوسط وشمال أفريقيا يؤسسون في ديلاوير لكنهم يعملون من بلدانهم الأصلية.',
      exit: 'أفضل مسار خروج للاكتتاب العام الأمريكي (Nasdaq/NYSE).',
    },
    idealFor: 'Startups targeting US VCs, companies planning a US IPO, SaaS/B2B tech companies, and any startup applying to Y Combinator or major US accelerators.',
    idealForAr: 'الشركات الناشئة التي تستهدف رأس المال المغامر الأمريكي، والشركات التي تخطط للاكتتاب العام الأمريكي، وشركات SaaS/B2B التقنية.',
    notIdealFor: 'MENA-focused startups with no US investors, companies wanting 0% tax, or founders who want to avoid complex US tax reporting.',
    notIdealForAr: 'الشركات الناشئة المركزة في منطقة الشرق الأوسط وشمال أفريقيا بدون مستثمرين أمريكيين، والشركات التي تريد ضريبة 0%.',
    officialUrl: 'https://corp.delaware.gov',
  },
  {
    id: 'cayman',
    name: 'Cayman Islands',
    nameAr: 'جزر كايمان',
    region: 'British Overseas Territory',
    flag: '🇰🇾',
    tagline: 'The Global Standard for VC Fund Structures',
    taglineAr: 'المعيار العالمي لهياكل صناديق رأس المال المغامر',
    type: 'offshore',
    bestFor: ['VC Fund Structures', 'Holding Companies', 'Crypto/Web3', 'International Investors', 'Tax-Neutral Holding'],
    corporateTax: '0%',
    foreignOwnership: '100%',
    setupCost: '$3,000 – $10,000',
    setupTime: '3–7 business days',
    legalSystem: 'English Common Law',
    currency: 'USD / KYD',
    minCapital: 'No minimum',
    vcFriendly: 'high',
    annualFees: '$1,000 – $4,000/year',
    overview: 'The Cayman Islands is the world\'s leading jurisdiction for VC fund structures, hedge funds, and offshore holding companies. It is particularly popular for the "Cayman Sandwich" — a three-tier structure used by many MENA and LatAm startups to attract international investment while maintaining local operations.',
    overviewAr: 'جزر كايمان هي الاختصاص القضائي الرائد في العالم لهياكل صناديق رأس المال المغامر وصناديق التحوط وشركات القابضة الخارجية.',
    keyRules: [
      'No corporate tax, income tax, capital gains tax, or withholding tax',
      'Exempt Company is the most common structure for startups',
      'Cayman Sandwich: Cayman holdco → Delaware LLC → Operating Company',
      'Annual return and fees required to the Cayman Registrar',
      'Economic Substance requirements apply to certain activities',
      'CIMA (Cayman Islands Monetary Authority) regulates financial services',
      'No public register of shareholders (privacy advantage)',
    ],
    keyRulesAr: [
      'لا توجد ضريبة على الشركات أو الدخل أو أرباح رأس المال أو الاستقطاع',
      'الشركة المعفاة هي الهيكل الأكثر شيوعًا للشركات الناشئة',
      'Cayman Sandwich: Cayman holdco → Delaware LLC → الشركة التشغيلية',
    ],
    pros: [
      '0% tax on all income, capital gains, and dividends',
      'Privacy — no public register of shareholders',
      'Preferred by international VCs for fund structures',
      'Flexible corporate law — easy to create complex share structures',
      'No economic substance requirements for pure holding companies',
      'Strong legal system based on English Common Law',
      'Widely accepted by US and European institutional investors',
    ],
    prosAr: [
      '0% ضريبة على جميع الدخل وأرباح رأس المال والأرباح',
      'الخصوصية — لا يوجد سجل عام للمساهمين',
      'مفضل من قبل رأس المال المغامر الدولي لهياكل الصناديق',
    ],
    cons: [
      'Increasing regulatory scrutiny (FATF, OECD BEPS)',
      'Economic Substance rules require genuine activity for certain sectors',
      'Reputational risk — some perceive Cayman as a "tax haven"',
      'Not ideal for operational companies (no local market)',
      'Annual costs can add up for complex structures',
      'US founders face PFIC rules if using Cayman structure',
    ],
    consAr: [
      'تزايد التدقيق التنظيمي (FATF، OECD BEPS)',
      'قواعد الجوهر الاقتصادي تتطلب نشاطًا حقيقيًا لقطاعات معينة',
      'مخاطر السمعة — يرى البعض أن كايمان "ملاذ ضريبي"',
    ],
    implications: {
      fundraising: 'The "Cayman Sandwich" is widely used by MENA startups raising from international VCs. Structure: Cayman Islands exempted company (holdco) → Delaware LLC (intermediate) → Local operating company. This allows US-style preferred share structures while maintaining tax efficiency.',
      tax: '0% on all income. However, founders must consider their home country\'s CFC (Controlled Foreign Corporation) rules, which may tax offshore income at the domestic rate regardless of where it is earned.',
      operations: 'Cayman is purely a holding jurisdiction — no operations happen there. The operational entity is typically in the founder\'s home country or a UAE free zone.',
      exit: 'Excellent for M&A exits — acquirers are familiar with Cayman structures. For IPO, a re-domiciliation to Delaware or another jurisdiction is often required.',
    },
    implicationsAr: {
      fundraising: '"Cayman Sandwich" يستخدم على نطاق واسع من قبل الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع التمويل من رأس المال المغامر الدولي.',
      tax: '0% على جميع الدخل. ومع ذلك، يجب على المؤسسين مراعاة قواعد CFC في بلدانهم الأصلية.',
      operations: 'كايمان هي اختصاص قضائي للاحتجاز فقط — لا تحدث عمليات هناك.',
      exit: 'ممتاز لعمليات الاندماج والاستحواذ — المستحوذون على دراية بهياكل كايمان.',
    },
    idealFor: 'MENA startups raising from international VCs, companies with complex multi-jurisdiction structures, crypto/Web3 projects, and founders wanting tax-neutral holding.',
    idealForAr: 'الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تجمع التمويل من رأس المال المغامر الدولي، والشركات ذات الهياكل متعددة الاختصاصات القضائية.',
    notIdealFor: 'Founders who want a single operating entity, companies needing local market access, or those concerned about reputational risk.',
    notIdealForAr: 'المؤسسون الذين يريدون كيانًا تشغيليًا واحدًا، والشركات التي تحتاج إلى الوصول إلى السوق المحلية.',
    officialUrl: 'https://www.gov.ky/portal/page/portal/cighome/business',
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
    bestFor: ['Holding Companies', 'Joint Ventures', 'Real Estate Holdings', 'IP Holding', 'Simple Offshore Structures'],
    corporateTax: '0%',
    foreignOwnership: '100%',
    setupCost: '$1,500 – $5,000',
    setupTime: '2–5 business days',
    legalSystem: 'English Common Law',
    currency: 'USD',
    minCapital: 'No minimum',
    vcFriendly: 'medium',
    annualFees: '$450 – $1,200/year',
    overview: 'The British Virgin Islands (BVI) is one of the world\'s most popular offshore jurisdictions, home to over 400,000 registered companies. It is simpler and cheaper than Cayman Islands but less preferred by institutional VCs. BVI is commonly used for holding companies, joint ventures, and IP holding structures.',
    overviewAr: 'جزر فيرجن البريطانية هي واحدة من أكثر الاختصاصات القضائية الخارجية شعبية في العالم، وتضم أكثر من 400,000 شركة مسجلة.',
    keyRules: [
      'BVI Business Company (BC) is the standard structure',
      'No requirement to file annual accounts publicly',
      'Minimum 1 director and 1 shareholder',
      'Economic Substance Act applies to certain "relevant activities"',
      'Beneficial ownership register maintained (not public)',
      'Annual government fees based on authorized share capital',
      'No requirement for local directors or shareholders',
    ],
    keyRulesAr: [
      'شركة BVI Business Company (BC) هي الهيكل القياسي',
      'لا يوجد شرط لتقديم الحسابات السنوية علنًا',
      'الحد الأدنى مدير واحد ومساهم واحد',
    ],
    pros: [
      'Very low annual fees ($450–$1,200/year)',
      '0% tax on all income and capital gains',
      'Simple, flexible corporate law',
      'Privacy — no public shareholder register',
      'Fast and cheap to incorporate',
      'Widely recognized globally',
      'Easy to restructure and dissolve',
    ],
    prosAr: [
      'رسوم سنوية منخفضة جدًا (450 إلى 1200 دولار سنويًا)',
      '0% ضريبة على جميع الدخل وأرباح رأس المال',
      'قانون شركات بسيط ومرن',
    ],
    cons: [
      'Less VC-friendly than Cayman Islands or Delaware',
      'Economic Substance rules increasingly complex',
      'Reputational concerns in some jurisdictions',
      'Not suitable for operational businesses',
      'Limited local banking options',
      'FATF grey-listing risk in some periods',
    ],
    consAr: [
      'أقل ودية لرأس المال المغامر من جزر كايمان أو ديلاوير',
      'قواعد الجوهر الاقتصادي معقدة بشكل متزايد',
      'مخاوف تتعلق بالسمعة في بعض الاختصاصات القضائية',
    ],
    implications: {
      fundraising: 'Less preferred by institutional VCs compared to Cayman or Delaware. Better suited for angel rounds, family office investments, or joint ventures where parties are comfortable with BVI structures.',
      tax: '0% on all income. Same CFC risk as Cayman — founders must check their home country rules.',
      operations: 'Purely a holding jurisdiction. No operational activities in BVI.',
      exit: 'M&A exits are straightforward. Less suitable for IPO without re-domiciliation.',
    },
    implicationsAr: {
      fundraising: 'أقل تفضيلًا من قبل رأس المال المغامر المؤسسي مقارنة بكايمان أو ديلاوير.',
      tax: '0% على جميع الدخل. نفس مخاطر CFC كجزر كايمان.',
      operations: 'اختصاص قضائي للاحتجاز فقط.',
      exit: 'عمليات الاندماج والاستحواذ مباشرة. أقل ملاءمة للاكتتاب العام بدون إعادة التوطين.',
    },
    idealFor: 'Simple holding structures, joint ventures, IP holding, and founders who want a cheap offshore entity without complex VC requirements.',
    idealForAr: 'هياكل الاحتجاز البسيطة، والمشاريع المشتركة، وحيازة الملكية الفكرية.',
    notIdealFor: 'Startups raising from institutional VCs, companies needing operational presence, or founders concerned about reputational risk.',
    notIdealForAr: 'الشركات الناشئة التي تجمع التمويل من رأس المال المغامر المؤسسي، والشركات التي تحتاج إلى حضور تشغيلي.',
    officialUrl: 'https://www.bvifsc.vg',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    nameAr: 'سنغافورة',
    region: 'Southeast Asia',
    flag: '🇸🇬',
    tagline: 'Asia\'s Premier Startup Hub — Stable, Tax-Efficient, VC-Friendly',
    taglineAr: 'مركز الشركات الناشئة الرائد في آسيا — مستقر وفعّال ضريبيًا وودي لرأس المال المغامر',
    type: 'onshore',
    bestFor: ['Asia-Pacific expansion', 'SaaS', 'FinTech', 'Deep Tech', 'Companies targeting Asian VCs'],
    corporateTax: '17% (effective rate often lower with exemptions)',
    foreignOwnership: '100%',
    setupCost: '$1,000 – $3,000',
    setupTime: '1–3 business days',
    legalSystem: 'English Common Law',
    currency: 'SGD / USD',
    minCapital: 'SGD 1 (~$0.75)',
    vcFriendly: 'high',
    annualFees: '$300 – $1,500/year',
    overview: 'Singapore is Asia\'s most startup-friendly jurisdiction, offering political stability, a strong rule of law, and an extensive network of double tax treaties. The Startup Tax Exemption (SUTE) scheme provides significant tax relief for the first three years. Singapore is particularly attractive for MENA founders expanding into Asia.',
    overviewAr: 'سنغافورة هي الاختصاص القضائي الأكثر ملاءمة للشركات الناشئة في آسيا، وتقدم استقرارًا سياسيًا وسيادة قانون قوية وشبكة واسعة من معاهدات الازدواج الضريبي.',
    keyRules: [
      'Private Limited Company (Pte. Ltd.) is the standard structure',
      'Must have at least one Singapore-resident director',
      'Annual filing with ACRA (Accounting and Corporate Regulatory Authority)',
      'Startup Tax Exemption (SUTE): 75% exemption on first SGD 100,000 for 3 years',
      'GST registration required if revenue exceeds SGD 1 million',
      'Employment Pass required for foreign founders working in Singapore',
      'No capital gains tax; dividends are tax-exempt at shareholder level',
    ],
    keyRulesAr: [
      'الشركة الخاصة المحدودة (Pte. Ltd.) هي الهيكل القياسي',
      'يجب أن يكون هناك مدير مقيم واحد على الأقل في سنغافورة',
      'التسجيل السنوي مع ACRA مطلوب',
    ],
    pros: [
      'Startup Tax Exemption — effectively 0% on first SGD 100,000 for 3 years',
      'No capital gains tax',
      'Extensive double tax treaty network (80+ countries)',
      'Strong IP protection and R&D incentives',
      'Gateway to Southeast Asia\'s 680 million consumer market',
      'Strong VC ecosystem — Sequoia, SoftBank, GIC all active in Singapore',
      'EntrePass visa for foreign founders',
    ],
    prosAr: [
      'إعفاء ضريبي للشركات الناشئة — فعليًا 0% على أول 100,000 دولار سنغافوري لمدة 3 سنوات',
      'لا توجد ضريبة على أرباح رأس المال',
      'شبكة واسعة من معاهدات الازدواج الضريبي (80+ دولة)',
    ],
    cons: [
      'Must have a Singapore-resident director (adds cost if outsourced)',
      '17% corporate tax rate (higher than UAE free zones)',
      'GST compliance required at scale',
      'Less relevant for MENA-focused businesses',
      'Cost of living and office space is high',
    ],
    consAr: [
      'يجب أن يكون هناك مدير مقيم في سنغافورة (يضيف تكلفة إذا كان خارجيًا)',
      'معدل ضريبة الشركات 17% (أعلى من المناطق الحرة في الإمارات)',
    ],
    implications: {
      fundraising: 'Strong VC ecosystem. Singapore is the preferred hub for Southeast Asian VCs and many global funds. Less relevant for MENA-focused startups unless expanding to Asia.',
      tax: 'Effective tax rate is often much lower than 17% due to SUTE and partial exemptions. No capital gains tax is a major advantage for founders.',
      operations: 'Singapore is both a holding and operational jurisdiction. Strong talent pool, excellent infrastructure, and easy to hire internationally.',
      exit: 'Singapore Exchange (SGX) provides a listing venue. M&A exits are well-understood. Strong secondary market.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي قوي لرأس المال المغامر. سنغافورة هي المركز المفضل لرأس المال المغامر في جنوب شرق آسيا.',
      tax: 'معدل الضريبة الفعلي غالبًا أقل بكثير من 17% بسبب SUTE والإعفاءات الجزئية.',
      operations: 'سنغافورة هي اختصاص قضائي للاحتجاز والتشغيل معًا.',
      exit: 'بورصة سنغافورة (SGX) توفر مكانًا للإدراج.',
    },
    idealFor: 'MENA startups expanding to Asia, companies targeting Southeast Asian markets, and founders who want a stable, tax-efficient Asian base.',
    idealForAr: 'الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا التي تتوسع في آسيا، والشركات التي تستهدف أسواق جنوب شرق آسيا.',
    notIdealFor: 'MENA-only focused startups, companies wanting 0% tax, or founders who cannot afford a Singapore-resident director.',
    notIdealForAr: 'الشركات الناشئة المركزة في منطقة الشرق الأوسط وشمال أفريقيا فقط، والشركات التي تريد ضريبة 0%.',
    officialUrl: 'https://www.acra.gov.sg',
  },
  {
    id: 'saudi-sez',
    name: 'Saudi Arabia SEZs',
    nameAr: 'المناطق الاقتصادية الخاصة في السعودية',
    region: 'Saudi Arabia',
    flag: '🇸🇦',
    tagline: 'Special Economic Zones — Vision 2030\'s Investment Gateway',
    taglineAr: 'المناطق الاقتصادية الخاصة — بوابة الاستثمار لرؤية 2030',
    type: 'special-economic-zone',
    bestFor: ['Manufacturing', 'Logistics', 'Cloud/Tech', 'Life Sciences', 'Companies targeting Saudi market'],
    corporateTax: '5% (SEZ rate, vs 20% standard)',
    foreignOwnership: '100% (in SEZs)',
    setupCost: '$5,000 – $30,000',
    setupTime: '2–4 weeks',
    legalSystem: 'Saudi Law (with SEZ-specific regulations)',
    currency: 'SAR / USD',
    minCapital: 'Varies by SEZ and activity',
    vcFriendly: 'medium',
    annualFees: 'Varies by SEZ',
    overview: 'Saudi Arabia launched four Special Economic Zones (SEZs) in 2023 as part of Vision 2030: King Abdullah Economic City (KAEC), Ras Al-Khair, Jazan, and the Cloud Computing SEZ in Riyadh. These offer reduced corporate tax (5%), 100% foreign ownership, and streamlined regulations. New corporate rules effective April 2026 further enhance the framework.',
    overviewAr: 'أطلقت المملكة العربية السعودية أربع مناطق اقتصادية خاصة في 2023 كجزء من رؤية 2030: مدينة الملك عبدالله الاقتصادية، ورأس الخير، وجازان، ومنطقة الحوسبة السحابية في الرياض.',
    keyRules: [
      'Four SEZs: King Abdullah Economic City, Ras Al-Khair, Jazan, Cloud Computing SEZ (Riyadh)',
      '5% corporate tax rate (vs 20% standard Saudi rate)',
      '100% foreign ownership permitted in SEZs',
      'Zakat exemption for SEZ entities',
      'Customs duty exemptions on imports/exports within SEZ',
      'New corporate rules effective April 2026 (draft published March 2026)',
      'Regional HQ requirement: companies contracting with Saudi government must have regional HQ in KSA',
    ],
    keyRulesAr: [
      'أربع مناطق اقتصادية خاصة: مدينة الملك عبدالله الاقتصادية، ورأس الخير، وجازان، ومنطقة الحوسبة السحابية (الرياض)',
      'معدل ضريبة الشركات 5% (مقابل 20% المعدل السعودي القياسي)',
      'يُسمح بالملكية الأجنبية 100% في المناطق الاقتصادية الخاصة',
    ],
    pros: [
      'Access to Saudi Arabia\'s $1 trillion+ economy',
      '5% corporate tax (vs 20% standard) — significant saving',
      '100% foreign ownership in SEZs',
      'Zakat and customs duty exemptions',
      'Government procurement advantage — regional HQ in KSA required for gov contracts',
      'Vision 2030 tailwinds — massive government investment in tech and innovation',
      'Growing VC ecosystem (STV, Wa\'ed, Sanabil)',
    ],
    prosAr: [
      'الوصول إلى اقتصاد المملكة العربية السعودية بقيمة تتجاوز تريليون دولار',
      '5% ضريبة على الشركات (مقابل 20% قياسي) — توفير كبير',
      'ملكية أجنبية 100% في المناطق الاقتصادية الخاصة',
    ],
    cons: [
      'Still evolving regulatory framework (new rules April 2026)',
      'Higher corporate tax than UAE free zones (5% vs 0%)',
      'Saudization (Nitaqat) requirements for workforce',
      'Complex compliance requirements',
      'Less internationally recognized than ADGM/DIFC for VC structures',
      'Banking and financial infrastructure still developing',
    ],
    consAr: [
      'الإطار التنظيمي لا يزال يتطور (قواعد جديدة أبريل 2026)',
      'ضريبة شركات أعلى من المناطق الحرة في الإمارات (5% مقابل 0%)',
      'متطلبات السعودة (نطاقات) للقوى العاملة',
    ],
    implications: {
      fundraising: 'Growing VC ecosystem with STV, Wa\'ed Ventures, Sanabil, and international funds increasingly active. Saudi VCs often require Saudi or GCC incorporation. Regional HQ requirement (since 2024) means companies contracting with Saudi government must be locally incorporated.',
      tax: '5% corporate tax in SEZs (vs 20% standard). Zakat exemption is significant for Saudi-incorporated entities. No capital gains tax on listed securities.',
      operations: 'Saudi SEZs are designed for operational companies, not just holding structures. Strong government support and procurement opportunities for companies in priority sectors.',
      exit: 'Tadawul (Saudi Stock Exchange) and Nomu (parallel market) provide IPO pathways. M&A activity increasing with Vision 2030 consolidation.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي متنامٍ لرأس المال المغامر مع STV وWa\'ed Ventures وSanabil وصناديق دولية نشطة بشكل متزايد.',
      tax: '5% ضريبة على الشركات في المناطق الاقتصادية الخاصة (مقابل 20% قياسي). إعفاء الزكاة مهم للكيانات المؤسسة في السعودية.',
      operations: 'المناطق الاقتصادية الخاصة السعودية مصممة للشركات التشغيلية، وليس فقط هياكل الاحتجاز.',
      exit: 'تداول (البورصة السعودية) ونمو (السوق الموازية) يوفران مسارات للاكتتاب العام.',
    },
    idealFor: 'Companies targeting the Saudi market, startups in Vision 2030 priority sectors (tech, health, logistics, manufacturing), and companies seeking government procurement contracts.',
    idealForAr: 'الشركات التي تستهدف السوق السعودية، والشركات الناشئة في قطاعات أولوية رؤية 2030 (التقنية والصحة والخدمات اللوجستية والتصنيع).',
    notIdealFor: 'Pure holding structures, companies not targeting Saudi market, or founders wanting the simplest possible structure.',
    notIdealForAr: 'هياكل الاحتجاز البحتة، والشركات التي لا تستهدف السوق السعودية.',
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
    bestFor: ['FinTech', 'Islamic Finance', 'E-commerce', 'Startups targeting GCC market', 'Cost-conscious founders'],
    corporateTax: '0% (non-oil companies)',
    foreignOwnership: '100% (in free zones and most sectors)',
    setupCost: '$1,500 – $8,000',
    setupTime: '5–10 business days',
    legalSystem: 'Civil Law (with English Common Law influence)',
    currency: 'BHD (pegged to USD)',
    minCapital: 'BHD 50 (~$130) for most structures',
    vcFriendly: 'medium',
    annualFees: '$500 – $3,000/year',
    overview: 'Bahrain is the GCC\'s most open and cost-effective jurisdiction for startups, particularly in FinTech and Islamic Finance. It has no corporate tax for non-oil companies, a progressive regulatory sandbox (CBB FinTech Regulatory Sandbox), and lower costs than Dubai or Abu Dhabi. Bahrain EDB (Economic Development Board) offers strong startup support.',
    overviewAr: 'البحرين هي الاختصاص القضائي الأكثر انفتاحًا وفعالية من حيث التكلفة في دول الخليج للشركات الناشئة، لا سيما في FinTech والتمويل الإسلامي.',
    keyRules: [
      '0% corporate tax for non-oil and gas companies',
      '100% foreign ownership in most sectors (including outside free zones)',
      'Bahrain Investment Wharf and Bahrain Logistics Zone are key free zones',
      'CBB FinTech Regulatory Sandbox for financial innovation',
      'No personal income tax',
      'VAT at 10% (introduced 2022)',
      'Tamkeen support programs for startups (training, funding, subsidies)',
    ],
    keyRulesAr: [
      '0% ضريبة على الشركات لشركات غير النفط والغاز',
      'ملكية أجنبية 100% في معظم القطاعات',
      'صندوق FinTech التنظيمي لبنك البحرين المركزي للابتكار المالي',
    ],
    pros: [
      '0% corporate tax for most businesses',
      'Lowest cost of doing business in the GCC',
      'Progressive FinTech regulation — first GCC country with open banking rules',
      'Strong Islamic finance ecosystem',
      'Tamkeen subsidies can cover up to 50% of salary costs',
      'Easy access to Saudi market (connected by King Fahd Causeway)',
      'Bahrain EDB provides strong startup support',
    ],
    prosAr: [
      '0% ضريبة على الشركات لمعظم الأعمال',
      'أقل تكلفة لممارسة الأعمال في دول الخليج',
      'تنظيم FinTech تقدمي — أول دولة خليجية بقواعد الخدمات المصرفية المفتوحة',
    ],
    cons: [
      'Smaller market than UAE or Saudi Arabia',
      'Less prestigious address than Dubai/Abu Dhabi',
      'Limited VC ecosystem compared to UAE',
      'VAT at 10% (higher than UAE\'s 5%)',
      'Less internationally recognized for complex VC structures',
    ],
    consAr: [
      'سوق أصغر من الإمارات أو المملكة العربية السعودية',
      'عنوان أقل مكانة من دبي/أبوظبي',
      'نظام بيئي محدود لرأس المال المغامر مقارنة بالإمارات',
    ],
    implications: {
      fundraising: 'Limited local VC ecosystem but growing. Best for bootstrapped or grant-funded startups, or those raising from regional angels. Tamkeen subsidies are a significant non-dilutive funding source.',
      tax: '0% corporate tax. VAT at 10% applies to most B2C transactions. No personal income tax.',
      operations: 'Excellent for FinTech companies due to CBB sandbox. Lower operational costs than UAE. Good access to Saudi market via causeway.',
      exit: 'Bahrain Bourse provides a listing venue but is small. M&A exits typically involve regional acquirers.',
    },
    implicationsAr: {
      fundraising: 'نظام بيئي محلي محدود لرأس المال المغامر ولكنه متنامٍ. الأفضل للشركات الناشئة ذاتية التمويل أو الممولة بالمنح.',
      tax: '0% ضريبة على الشركات. ضريبة القيمة المضافة 10% تنطبق على معظم المعاملات B2C.',
      operations: 'ممتاز لشركات FinTech بسبب صندوق CBB. تكاليف تشغيلية أقل من الإمارات.',
      exit: 'بورصة البحرين توفر مكانًا للإدراج ولكنها صغيرة.',
    },
    idealFor: 'FinTech startups, Islamic finance companies, cost-conscious founders, and companies wanting easy access to the Saudi market.',
    idealForAr: 'شركات FinTech الناشئة، وشركات التمويل الإسلامي، والمؤسسون المهتمون بالتكلفة.',
    notIdealFor: 'Companies needing a prestigious address, startups raising from international VCs, or businesses targeting markets outside the GCC.',
    notIdealForAr: 'الشركات التي تحتاج إلى عنوان مرموق، والشركات الناشئة التي تجمع التمويل من رأس المال المغامر الدولي.',
    officialUrl: 'https://www.bahrainedb.com',
  },
];

const REGION_FILTERS = ['All', 'UAE', 'Offshore', 'USA', 'Asia', 'GCC'];
const TYPE_LABELS: Record<string, string> = {
  'free-zone': 'Free Zone',
  'offshore': 'Offshore',
  'onshore': 'Onshore',
  'special-economic-zone': 'Special Economic Zone',
};
const TYPE_COLORS: Record<string, string> = {
  'free-zone': 'bg-blue-100 text-blue-700',
  'offshore': 'bg-purple-100 text-purple-700',
  'onshore': 'bg-green-100 text-green-700',
  'special-economic-zone': 'bg-amber-100 text-amber-700',
};
const VC_FRIENDLY_COLORS: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-amber-600',
  low: 'text-red-600',
};
const VC_FRIENDLY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function getRegionFilter(j: Jurisdiction): string {
  if (j.region.includes('UAE')) return 'UAE';
  if (j.region.includes('British Overseas') || j.id === 'bvi') return 'Offshore';
  if (j.region.includes('USA')) return 'USA';
  if (j.region.includes('Southeast Asia') || j.region.includes('Singapore')) return 'Asia';
  if (j.region.includes('GCC') || j.region.includes('Saudi') || j.region.includes('Bahrain')) return 'GCC';
  return 'All';
}

export default function FreeZones() {
  const { t, isRTL, lang } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = activeFilter === 'All'
    ? JURISDICTIONS
    : JURISDICTIONS.filter(j => getRegionFilter(j) === activeFilter);

  const toggleCompare = (id: string) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compareJurisdictions = JURISDICTIONS.filter(j => compareList.includes(j.id));

  const getName = (j: Jurisdiction) => lang === 'ar' ? j.nameAr : j.name;
  const getTagline = (j: Jurisdiction) => lang === 'ar' ? j.taglineAr : j.tagline;
  const getOverview = (j: Jurisdiction) => lang === 'ar' ? j.overviewAr : j.overview;
  const getPros = (j: Jurisdiction) => lang === 'ar' ? j.prosAr : j.pros;
  const getCons = (j: Jurisdiction) => lang === 'ar' ? j.consAr : j.cons;
  const getKeyRules = (j: Jurisdiction) => lang === 'ar' ? j.keyRulesAr : j.keyRules;
  const getImplications = (j: Jurisdiction) => lang === 'ar' ? j.implicationsAr : j.implications;
  const getIdealFor = (j: Jurisdiction) => lang === 'ar' ? j.idealForAr : j.idealFor;
  const getNotIdealFor = (j: Jurisdiction) => lang === 'ar' ? j.notIdealForAr : j.notIdealFor;

  if (selectedJurisdiction) {
    const j = selectedJurisdiction;
    const impl = getImplications(j);
    return (
      <div className={`max-w-4xl mx-auto p-5 lg:p-6 space-y-6 ${isRTL ? 'text-right' : ''}`}>
        {/* Back */}
        <button
          onClick={() => setSelectedJurisdiction(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <ArrowRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
          {lang === 'ar' ? 'العودة إلى جميع الاختصاصات' : 'Back to all jurisdictions'}
        </button>

        {/* Header */}
        <div className="flex items-start gap-4" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="text-5xl">{j.flag}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <h1 className="text-2xl font-bold text-foreground">{getName(j)}</h1>
              <Badge className={`text-xs ${TYPE_COLORS[j.type]}`}>{TYPE_LABELS[j.type]}</Badge>
              <Badge variant="outline" className="text-xs">{j.region}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{getTagline(j)}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: lang === 'ar' ? 'ضريبة الشركات' : 'Corporate Tax', value: j.corporateTax, icon: DollarSign, color: 'text-green-600' },
            { label: lang === 'ar' ? 'الملكية الأجنبية' : 'Foreign Ownership', value: j.foreignOwnership, icon: Globe, color: 'text-blue-600' },
            { label: lang === 'ar' ? 'تكلفة الإعداد' : 'Setup Cost', value: j.setupCost, icon: Building2, color: 'text-amber-600' },
            { label: lang === 'ar' ? 'وقت الإعداد' : 'Setup Time', value: j.setupTime, icon: TrendingUp, color: 'text-purple-600' },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-sm font-bold text-foreground">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* More Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: lang === 'ar' ? 'النظام القانوني' : 'Legal System', value: j.legalSystem },
            { label: lang === 'ar' ? 'الحد الأدنى لرأس المال' : 'Min Capital', value: j.minCapital },
            { label: lang === 'ar' ? 'الرسوم السنوية' : 'Annual Fees', value: j.annualFees },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/40 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-sm font-semibold text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* VC Friendliness */}
        <div className="flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">{lang === 'ar' ? 'ودية لرأس المال المغامر:' : 'VC Friendliness:'}</span>
          <span className={`text-sm font-bold ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
            {VC_FRIENDLY_LABELS[j.vcFriendly]}
          </span>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <Info className="w-4 h-4 text-blue-500" />
              {lang === 'ar' ? 'نظرة عامة' : 'Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{getOverview(j)}</p>
          </CardContent>
        </Card>

        {/* Tabs: Rules, Pros/Cons, Implications */}
        <Tabs defaultValue="rules">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="rules">{lang === 'ar' ? 'القواعد الرئيسية' : 'Key Rules'}</TabsTrigger>
            <TabsTrigger value="proscons">{lang === 'ar' ? 'المزايا والعيوب' : 'Pros & Cons'}</TabsTrigger>
            <TabsTrigger value="implications">{lang === 'ar' ? 'التداعيات' : 'Implications'}</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {getKeyRules(j).map((rule, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                      <Scale className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proscons" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <CheckCircle className="w-4 h-4" />
                    {lang === 'ar' ? 'المزايا' : 'Advantages'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getPros(j).map((pro, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <XCircle className="w-4 h-4" />
                    {lang === 'ar' ? 'العيوب' : 'Disadvantages'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getCons(j).map((con, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{con}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="implications" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'fundraising', label: lang === 'ar' ? 'جمع التمويل' : 'Fundraising', icon: TrendingUp, color: 'text-blue-500' },
                { key: 'tax', label: lang === 'ar' ? 'الضرائب' : 'Tax', icon: DollarSign, color: 'text-green-500' },
                { key: 'operations', label: lang === 'ar' ? 'العمليات' : 'Operations', icon: Building2, color: 'text-amber-500' },
                { key: 'exit', label: lang === 'ar' ? 'الخروج' : 'Exit', icon: BarChart3, color: 'text-purple-500' },
              ].map(item => (
                <Card key={item.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {impl[item.key as keyof typeof impl]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Ideal For / Not Ideal For */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{lang === 'ar' ? 'مثالي لـ' : 'Ideal For'}</span>
            </div>
            <p className="text-xs text-green-700 leading-relaxed">{getIdealFor(j)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">{lang === 'ar' ? 'غير مثالي لـ' : 'Not Ideal For'}</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{getNotIdealFor(j)}</p>
          </div>
        </div>

        {/* Best For Tags */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">{lang === 'ar' ? 'الأفضل لـ' : 'Best For'}</div>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {j.bestFor.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Official Link */}
        <a
          href={j.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <Globe className="w-4 h-4" />
          {lang === 'ar' ? 'الموقع الرسمي' : 'Official Website'}
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto p-5 lg:p-6 space-y-6 ${isRTL ? 'text-right' : ''}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Landmark className="w-6 h-6" style={{ color: 'oklch(0.55 0.13 30)' }} />
          {lang === 'ar' ? 'المناطق الحرة والاختصاصات القضائية' : 'Free Zones & Jurisdictions'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'ar'
            ? 'دليل شامل لاختيار الاختصاص القضائي المناسب لشركتك الناشئة — القواعد والتداعيات والمقارنات'
            : 'A comprehensive guide to choosing the right jurisdiction for your startup — rules, implications, and comparisons'}
        </p>
      </div>

      {/* Filter + Compare Toggle */}
      <div className={`flex items-center justify-between gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          {REGION_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              style={activeFilter === f ? { background: 'oklch(0.18 0.05 240)' } : {}}
            >
              {f}
            </button>
          ))}
        </div>
        {compareList.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCompare(v => !v)}
            className="text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            {lang === 'ar' ? `مقارنة (${compareList.length})` : `Compare (${compareList.length})`}
            {showCompare ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
        )}
      </div>

      {/* Comparison Table */}
      {showCompare && compareJurisdictions.length > 0 && (
        <Card className="overflow-x-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{lang === 'ar' ? 'مقارنة الاختصاصات القضائية' : 'Jurisdiction Comparison'}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{lang === 'ar' ? 'المعيار' : 'Criteria'}</th>
                  {compareJurisdictions.map(j => (
                    <th key={j.id} className="text-left py-2 px-2 font-semibold">
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
                  <tr key={row.key} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground font-medium">{row.label}</td>
                    {compareJurisdictions.map(j => (
                      <td key={j.id} className="py-2 px-2 text-foreground">
                        {j[row.key as keyof Jurisdiction] as string}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground font-medium">{lang === 'ar' ? 'ودية لرأس المال المغامر' : 'VC Friendly'}</td>
                  {compareJurisdictions.map(j => (
                    <td key={j.id} className={`py-2 px-2 font-bold ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
                      {VC_FRIENDLY_LABELS[j.vcFriendly]}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Jurisdiction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(j => (
          <Card
            key={j.id}
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group relative"
            onClick={() => setSelectedJurisdiction(j)}
          >
            {/* Compare checkbox */}
            <div
              className="absolute top-3 right-3 z-10"
              onClick={e => { e.stopPropagation(); toggleCompare(j.id); }}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                compareList.includes(j.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-border bg-background hover:border-blue-400'
              }`}>
                {compareList.includes(j.id) && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
            </div>

            <CardContent className="pt-4 pb-4">
              <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl">{j.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="font-bold text-foreground text-sm">{getName(j)}</h3>
                    <Badge className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[j.type]}`}>
                      {TYPE_LABELS[j.type]}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"
                    style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <MapPin className="w-3 h-3" />
                    {j.region}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'ضريبة' : 'Tax'}</div>
                  <div className="text-xs font-bold text-green-600">{j.corporateTax}</div>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'إعداد' : 'Setup'}</div>
                  <div className="text-xs font-bold text-foreground">{j.setupCost}</div>
                </div>
              </div>

              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Star className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'ودية لـ VC:' : 'VC:'}</span>
                  <span className={`text-[11px] font-bold ${VC_FRIENDLY_COLORS[j.vcFriendly]}`}>
                    {VC_FRIENDLY_LABELS[j.vcFriendly]}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {lang === 'ar' ? 'التفاصيل' : 'Details'}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className={`flex flex-wrap gap-1 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {j.bestFor.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                ))}
                {j.bestFor.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{j.bestFor.length - 3}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compare hint */}
      <p className="text-xs text-muted-foreground text-center">
        {lang === 'ar'
          ? 'انقر على مربع الاختيار في أي بطاقة لمقارنة ما يصل إلى 4 اختصاصات قضائية جنبًا إلى جنب'
          : 'Click the checkbox on any card to compare up to 4 jurisdictions side-by-side'}
      </p>
    </div>
  );
}
