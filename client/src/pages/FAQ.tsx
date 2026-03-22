/**
 * FAQ Page — Polaris Arabia
 * Comprehensive frequently asked questions for founders
 * Design: matches LandingPage dark theme (Visible.vc dark)
 */
import { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, ChevronUp, TrendingUp, ArrowLeft, Search } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

const BG        = 'oklch(0.165 0 0)';
const BG_CARD   = 'oklch(0.20 0 0)';
const BG_CARD2  = 'oklch(0.22 0 0)';
const BORDER    = 'oklch(0.28 0 0)';
const TEXT_HI   = 'oklch(0.97 0 0)';
const TEXT_MED  = 'oklch(0.75 0 0)';
const TEXT_LOW  = 'oklch(0.55 0 0)';
const BLUE      = 'oklch(0.50 0.22 264)';
const GREEN     = 'oklch(0.72 0.19 155)';
const AMBER     = 'oklch(0.75 0.18 55)';
const VIOLET    = 'oklch(0.65 0.20 290)';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

export default function FAQ() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const faqs: FAQItem[] = isRTL ? [
    // General
    { category: 'عام', q: 'ما هي منصة بولاريس أرابيا؟', a: 'بولاريس أرابيا هي منصة ذكاء اصطناعي شاملة للشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا. تضم أكثر من 35 أداة متخصصة تشمل حاسبات التقييم، وإدارة جدول الملكية، والتحليل المالي، وإعداد وثائق التمويل — كل ذلك مجاناً.' },
    { category: 'عام', q: 'هل المنصة مجانية؟', a: 'نعم، جميع الأدوات الأساسية مجانية تماماً. بعض الأدوات المتقدمة مثل مطابقة المستثمرين بالذكاء الاصطناعي وتحليل العناية الواجبة متاحة في الخطط المدفوعة.' },
    { category: 'عام', q: 'هل المنصة متاحة باللغة العربية؟', a: 'نعم، المنصة بالكامل ثنائية اللغة (عربي وإنجليزي) مع دعم كامل للكتابة من اليمين إلى اليسار. يمكنك التبديل بين اللغتين من أي صفحة.' },
    { category: 'عام', q: 'من يمكنه استخدام بولاريس أرابيا؟', a: 'صُممت المنصة للمؤسسين والمستثمرين الملائكيين وصناديق رأس المال المخاطر والمستشارين في منطقة الشرق الأوسط وشمال أفريقيا. سواء كنت في مرحلة الفكرة أو تستعد لجولة السلسلة أ، ستجد أدوات مناسبة لك.' },
    // Valuation
    { category: 'التقييم', q: 'كيف تعمل حاسبة التقييم؟', a: 'تستخدم الحاسبة 7 طرق تقييم معيارية: التدفق النقدي المخصوم (DCF)، طريقة بطاقة الأداء، طريقة بيركوس، طريقة رأس المال المخاطر، المعاملات المقارنة، جمع عوامل المخاطر، وطريقة شيكاغو الأولى. تُدخل بيانات شركتك وتحصل على تقييم شامل فورياً.' },
    { category: 'التقييم', q: 'هل نتائج التقييم دقيقة؟', a: 'التقييمات تقديرية وتعتمد على المدخلات التي تقدمها. تعكس النتائج نطاق التقييم المعقول بناءً على معايير الصناعة، لكنها لا تُعدّ مشورة مالية رسمية. يُنصح دائماً باستشارة متخصص مؤهل.' },
    { category: 'التقييم', q: 'هل يمكنني تصدير تقرير التقييم؟', a: 'نعم، يمكنك تنزيل تقرير تقييم كامل بصيغة PDF يشمل جميع الطرق السبع مع الرسوم البيانية والتحليل المفصل. يمكنك أيضاً مشاركة رابط التقييم مع المستثمرين أو المؤسسين المشاركين.' },
    // Financial Projection
    { category: 'التوقعات المالية', q: 'ما هي نماذج الأعمال المدعومة في أداة التوقعات المالية؟', a: 'تدعم الأداة 15 نموذج عمل: SaaS، التجارة الإلكترونية، السوق الإلكتروني، الوكالة/الخدمات، الأجهزة/إنترنت الأشياء، الشراء كخدمة، الاشتراك المادي، Freemium، الاستخدام المدفوع، الإعلانات/الإعلام، D2C/التجزئة، التكنولوجيا المالية/الإقراض، التعليم الإلكتروني، الطلب الفوري/العمل الحر، والعقارات/PropTech.' },
    { category: 'التوقعات المالية', q: 'ما الفرق بين النهج التصاعدي والتنازلي؟', a: 'النهج التصاعدي يبني التوقعات من الوحدات الأساسية (عدد العملاء × متوسط الإيراد). النهج التنازلي يبدأ من حجم السوق الكلي ويحدد نسبة الاستحواذ المتوقعة. كلاهما صحيح ومفيد لأغراض مختلفة.' },
    { category: 'التوقعات المالية', q: 'هل يمكنني تصدير التوقعات المالية؟', a: 'نعم، يمكنك تصدير التوقعات كملف PDF أو Excel. يتضمن Excel جميع البيانات الشهرية لمدة 3 أو 5 أو 10 سنوات مع القوائم المالية الكاملة.' },
    // Cap Table & Equity
    { category: 'الملكية والأسهم', q: 'ما هو جدول الملكية (Cap Table)؟', a: 'جدول الملكية هو وثيقة تُظهر توزيع ملكية الشركة بين المؤسسين والمستثمرين وحاملي الخيارات. يساعدك على تتبع التخفيف عبر جولات التمويل المختلفة.' },
    { category: 'الملكية والأسهم', q: 'كيف تعمل أداة محاكاة التخفيف؟', a: 'تُدخل هيكل الملكية الحالي وشروط الجولة المقترحة (حجم الاستثمار، التقييم، نوع الأسهم)، وتُظهر الأداة التوزيع الجديد للملكية بعد التخفيف مع رسوم بيانية توضيحية.' },
    { category: 'الملكية والأسهم', q: 'ما هو ESOP وكيف تساعدني الأداة؟', a: 'ESOP هو برنامج خيارات الأسهم للموظفين. تساعدك الأداة على تصميم برنامج خيارات عادل مع جداول الاستحقاق، وحساب التأثير على جدول الملكية، وإنشاء وثائق الخيارات.' },
    // Data Room
    { category: 'غرفة البيانات', q: 'ما هي غرفة البيانات الافتراضية؟', a: 'غرفة البيانات هي مخزن آمن للمستندات يمكنك مشاركته مع المستثمرين أثناء عملية العناية الواجبة. يمكنك رفع الوثائق وإنشاء روابط مشاركة قابلة للتتبع مع التحكم في الصلاحيات.' },
    { category: 'غرفة البيانات', q: 'ما مستوى أمان غرفة البيانات؟', a: 'تستخدم المنصة تشفير SSL وتخزين آمن على السحابة. يمكنك التحكم في من يمكنه الوصول إلى كل مستند وتتبع من قام بعرضه ومتى.' },
    // Privacy & Security
    { category: 'الخصوصية والأمان', q: 'كيف تحمون بيانات شركتي؟', a: 'نلتزم بنظام حماية البيانات الشخصية السعودي (PDPL). بياناتك مشفرة ومحمية ولن تُشارك مع أطراف ثالثة. يمكنك حذف حسابك وجميع بياناتك في أي وقت.' },
    { category: 'الخصوصية والأمان', q: 'هل تشاركون بيانات الشركات مع المستثمرين؟', a: 'لا. بياناتك ملكك حصراً. لن نشارك أي معلومات مع المستثمرين أو أطراف ثالثة دون إذنك الصريح.' },
  ] : [
    // General
    { category: 'General', q: 'What is Polaris Arabia?', a: 'Polaris Arabia is a comprehensive AI-powered startup toolkit for MENA founders. It includes 35+ specialized tools covering valuation calculators, cap table management, financial projections, fundraising documents, and more — all free to use.' },
    { category: 'General', q: 'Is Polaris Arabia free to use?', a: 'Yes, all core tools are completely free. Some advanced features like AI investor matching and due diligence analysis are available on paid plans. We believe every MENA founder should have access to world-class startup tools regardless of budget.' },
    { category: 'General', q: 'Is the platform available in Arabic?', a: 'Yes, the entire platform is fully bilingual (Arabic and English) with complete RTL support. You can switch between languages from any page using the language toggle.' },
    { category: 'General', q: 'Who is Polaris Arabia for?', a: 'Polaris Arabia is designed for founders, angel investors, venture capital funds, and advisors in the MENA region. Whether you\'re at the idea stage or preparing for a Series A, you\'ll find tools suited to your current stage.' },
    { category: 'General', q: 'Do I need to create an account?', a: 'Some tools are accessible without an account. However, to save your work, access your history, and use advanced features like AI review and report generation, you\'ll need a free account.' },
    // Valuation
    { category: 'Valuation', q: 'How does the valuation calculator work?', a: 'The calculator uses 7 industry-standard valuation methods: Discounted Cash Flow (DCF), Scorecard Method, Berkus Method, VC Method, Comparable Transactions, Risk-Factor Summation, and First Chicago Method. Enter your startup data and get a comprehensive valuation range instantly.' },
    { category: 'Valuation', q: 'How accurate are the valuations?', a: 'Valuations are estimates based on the inputs you provide and industry benchmarks. The results reflect a reasonable valuation range but should not be treated as formal financial advice. We always recommend consulting a qualified financial advisor for official valuations.' },
    { category: 'Valuation', q: 'Can I export my valuation report?', a: 'Yes. You can download a full PDF valuation report covering all 7 methods with charts and detailed analysis. You can also share a link to your valuation with investors or co-founders.' },
    { category: 'Valuation', q: 'What stage startups is the valuation tool designed for?', a: 'The tool supports all stages from pre-revenue to Series B. Different valuation methods are more appropriate at different stages — for example, the Berkus Method is ideal for pre-revenue startups, while DCF is better suited for companies with predictable revenue.' },
    // Financial Projection
    { category: 'Financial Projection', q: 'What business models does the Financial Projection tool support?', a: 'The tool supports 15 business models: SaaS, E-commerce, Marketplace, Agency/Services, Hardware/IoT, Procurement-as-a-Service, Subscription (Physical), Freemium, Usage-Based/Pay-as-you-go, Advertising/Media, D2C/Retail, Fintech/Lending, EdTech/Content, On-Demand/Gig, and Real Estate/PropTech.' },
    { category: 'Financial Projection', q: 'What is the difference between bottom-up and top-down forecasting?', a: 'Bottom-up forecasting builds projections from unit economics (number of customers × average revenue per customer). Top-down starts from the total addressable market and estimates your expected market capture percentage. Both approaches are valid and useful for different purposes — bottom-up is more credible for early-stage startups, while top-down helps contextualize your opportunity for investors.' },
    { category: 'Financial Projection', q: 'Can I export my financial projections?', a: 'Yes. You can export projections as a PDF report or an Excel file. The Excel export includes all monthly data for 3, 5, or 10 years with full P&L statements, making it easy to share with investors or use in your own models.' },
    { category: 'Financial Projection', q: 'What does the AI Review feature do?', a: 'The AI Review analyzes your financial model from a VC partner perspective. It identifies strengths, risks, and red flags in your assumptions, benchmarks your metrics against industry standards, and provides actionable recommendations to make your model more investor-ready.' },
    // Cap Table & Equity
    { category: 'Cap Table & Equity', q: 'What is a cap table?', a: 'A capitalization table (cap table) is a document showing the ownership structure of your company — who owns what percentage, including founders, investors, and option holders. It\'s one of the first things investors ask for during due diligence.' },
    { category: 'Cap Table & Equity', q: 'How does the dilution simulator work?', a: 'Enter your current ownership structure and the terms of a proposed funding round (investment size, valuation, share type). The tool shows the new ownership distribution after dilution with visual charts, helping you understand the impact before you sign.' },
    { category: 'Cap Table & Equity', q: 'What is ESOP and how does the tool help?', a: 'An Employee Stock Option Plan (ESOP) gives employees the right to buy company shares at a fixed price. The tool helps you design a fair option plan with vesting schedules, calculate the impact on your cap table, and understand the tax and legal implications.' },
    // Data Room
    { category: 'Data Room', q: 'What is a virtual data room?', a: 'A virtual data room is a secure document repository you share with investors during due diligence. You can upload documents, create shareable links with access controls, and track who viewed what and when.' },
    { category: 'Data Room', q: 'What documents should I put in my data room?', a: 'Typically: incorporation documents, cap table, financial statements, pitch deck, product demo, customer contracts, IP documentation, team bios, and any regulatory filings. The platform includes a checklist to guide you through what investors typically expect.' },
    // Privacy & Security
    { category: 'Privacy & Security', q: 'How do you protect my company data?', a: 'We comply with the Saudi Personal Data Protection Law (PDPL). Your data is encrypted at rest and in transit and will never be shared with third parties. You can delete your account and all associated data at any time.' },
    { category: 'Privacy & Security', q: 'Do you share company data with investors?', a: 'No. Your data belongs exclusively to you. We will never share any information with investors or third parties without your explicit consent.' },
  ];

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filtered = faqs.filter(f => {
    const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryColors: Record<string, string> = {
    'General': BLUE, 'عام': BLUE,
    'Valuation': VIOLET, 'التقييم': VIOLET,
    'Financial Projection': GREEN, 'التوقعات المالية': GREEN,
    'Cap Table & Equity': AMBER, 'الملكية والأسهم': AMBER,
    'Data Room': BLUE, 'غرفة البيانات': BLUE,
    'Privacy & Security': GREEN, 'الخصوصية والأمان': GREEN,
  };

  return (
    <div
      className="min-h-screen"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: BG, color: TEXT_HI, fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      {/* Nav */}
      <nav
        className="border-b px-5 py-4 flex items-center justify-between"
        style={{ background: BG_CARD, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base" style={{ color: TEXT_HI }}>Polaris Arabia</span>
            </div>
          </Link>
        </div>
        <Link href="/">
          <button
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-white/5"
            style={{ color: TEXT_MED }}
          >
            {isRTL ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-5 pt-16 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
          style={{ background: `${BLUE}18`, borderColor: `${BLUE}40`, color: 'oklch(0.75 0.18 264)' }}
        >
          {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: TEXT_HI }}>
          {isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'}
        </h1>
        <p className="text-base mb-8" style={{ color: TEXT_MED }}>
          {isRTL
            ? 'إجابات على الأسئلة الأكثر شيوعاً حول منصة بولاريس أرابيا وأدواتها'
            : 'Answers to the most common questions about Polaris Arabia and its tools'}
        </p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_LOW }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isRTL ? 'ابحث في الأسئلة...' : 'Search questions...'}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none border"
            style={{
              background: BG_CARD,
              borderColor: BORDER,
              color: TEXT_HI,
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-4xl mx-auto px-5 pb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={{
                background: activeCategory === cat ? BLUE : BG_CARD,
                borderColor: activeCategory === cat ? BLUE : BORDER,
                color: activeCategory === cat ? 'white' : TEXT_MED,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ items */}
      <div className="max-w-4xl mx-auto px-5 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: TEXT_LOW }}>
            {isRTL ? 'لا توجد نتائج مطابقة' : 'No matching questions found'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((faq, i) => {
              const isOpen = openIndex === i;
              const catColor = categoryColors[faq.category] || BLUE;
              return (
                <div
                  key={i}
                  className="rounded-lg border overflow-hidden transition-all"
                  style={{
                    background: isOpen ? BG_CARD2 : BG_CARD,
                    borderColor: isOpen ? catColor + '50' : BORDER,
                  }}
                >
                  <button
                    className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                        style={{ background: catColor + '20', color: catColor }}
                      >
                        {faq.category}
                      </span>
                      <span className="text-sm font-semibold text-left" style={{ color: TEXT_HI }}>
                        {faq.q}
                      </span>
                    </div>
                    <div className="shrink-0 mt-0.5" style={{ color: TEXT_LOW }}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div
                        className="h-px mb-4"
                        style={{ background: BORDER }}
                      />
                      <p className="text-sm leading-relaxed" style={{ color: TEXT_MED }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still have questions CTA */}
        <div
          className="mt-12 rounded-xl p-8 text-center border"
          style={{ background: BG_CARD, borderColor: BORDER }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: TEXT_HI }}>
            {isRTL ? 'لم تجد إجابتك؟' : 'Still have questions?'}
          </h3>
          <p className="text-sm mb-5" style={{ color: TEXT_MED }}>
            {isRTL
              ? 'فريقنا جاهز للمساعدة. تواصل معنا مباشرة.'
              : 'Our team is ready to help. Reach out to us directly.'}
          </p>
          <a
            href="mailto:hello@polarisarabia.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: BLUE }}
          >
            {isRTL ? 'تواصل معنا' : 'Contact Us'}
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
