/**
 * LandingPage — Polaris Arabia
 * Design: "Startup Energy" — Light, colorful, playful, founder-native
 * Vibe: Notion × Linear × Duolingo — bold, fun, confident, not corporate
 * Colors: Warm white bg, vibrant coral/orange primary, violet secondary, emerald accent
 * Typography: Nunito (headings) + DM Sans (body) + JetBrains Mono (numbers)
 */
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  TrendingUp, Sparkles, Users, GitBranch, Target, BookOpen,
  BarChart3, Rocket, Gauge, Layers, Building2, Gift, Scale,
  ArrowRight, Star, Zap, Globe, Shield, Brain, CheckCircle,
  DollarSign, FileText, PieChart, BarChart2, Menu, X,
  Briefcase, LineChart, Calculator, Database, Search, Lightbulb,
  ChevronRight
} from 'lucide-react';
import { APP_PATH, REGISTER_PATH, LOGIN_PATH } from '@/const';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const TOOLS = [
    { icon: TrendingUp,  label: isRTL ? 'محرك التقييم' : 'Startup Valuation Engine',   desc: isRTL ? '٧ طرق: DCF، بطاقة الأداء، بيركوس، طريقة رأس المال المخاطر والمزيد' : '7 methods: DCF, Scorecard, Berkus, VC Method, and more', color: 'oklch(0.62 0.22 30)', bg: 'oklch(0.97 0.03 30)' },
    { icon: Brain,       label: isRTL ? 'محرك التحقق من الفكرة' : 'Concept Validation Engine', desc: isRTL ? 'الذكاء الاصطناعي يقيّم فكرتك عبر ٨ أبعاد مع المخاطر والخطوات التالية' : 'AI scores your idea across 8 dimensions with risks & next steps', color: 'oklch(0.60 0.24 290)', bg: 'oklch(0.96 0.04 290)' },
    { icon: PieChart,    label: isRTL ? 'جدول الرأسمال' : 'Capitalization Table',       desc: isRTL ? 'توزيع الملكية المرئي مع تتبع التخفيف عبر جميع الجولات' : 'Visual ownership breakdown with dilution tracking across all rounds', color: 'oklch(0.56 0.22 150)', bg: 'oklch(0.95 0.05 150)' },
    { icon: Users,       label: isRTL ? 'توزيع حقوق المؤسسين' : 'Founder Equity Allocation', desc: isRTL ? 'تقييم بـ٧ عوامل لتقسيم الأسهم بعدالة بين المؤسسين' : '7-factor scoring to split equity fairly among founders', color: 'oklch(0.62 0.20 55)', bg: 'oklch(0.97 0.04 55)' },
    { icon: Gauge,       label: isRTL ? 'تقييم الاستعداد للمستثمرين' : 'Investor Readiness Assessment', desc: isRTL ? 'قائمة تحقق من ٢٠ نقطة لمعرفة ما إذا كنت مستعداً للتمويل' : '20-point checklist to know if you\'re ready to raise', color: 'oklch(0.55 0.18 330)', bg: 'oklch(0.96 0.03 330)' },
    { icon: Target,      label: isRTL ? 'إدارة خط أنابيب المستثمرين' : 'Investor Pipeline CRM',   desc: isRTL ? 'تتبع خط الأنابيب بالمراحل والملاحظات وتصدير CSV' : 'Track your pipeline with stages, notes, and CSV export', color: 'oklch(0.52 0.24 290)', bg: 'oklch(0.95 0.04 290)' },
    { icon: Database,    label: isRTL ? 'غرفة البيانات الافتراضية' : 'Virtual Data Room',         desc: isRTL ? 'خزنة مستندات آمنة مع روابط مشاركة للمستثمرين وتتبع الوصول' : 'Secure document vault with shareable investor links and access tracking', color: 'oklch(0.50 0.20 250)', bg: 'oklch(0.95 0.04 250)' },
    { icon: LineChart,   label: isRTL ? 'ذكاء الإيرادات' : 'Revenue Intelligence',       desc: isRTL ? 'CRM كامل مع خط أنابيب Kanban وتحليلات القنوات والتنبؤ بالذكاء الاصطناعي' : 'Full CRM with Kanban pipeline, channel analytics, and AI forecasting', color: 'oklch(0.58 0.20 200)', bg: 'oklch(0.95 0.04 200)' },
    { icon: Calculator,  label: isRTL ? 'اقتصاديات الوحدة' : 'Unit Economics',           desc: isRTL ? 'تكلفة المنتج، هامش الربح، نقطة التعادل، وتوزيع التكاليف العامة' : 'Product-level costing, margin waterfall, break-even, and overhead allocation', color: 'oklch(0.56 0.22 150)', bg: 'oklch(0.95 0.05 150)' },
    { icon: Rocket,      label: isRTL ? 'دليل المسرّعات والحاضنات' : 'Accelerator & Incubator Finder', desc: isRTL ? 'أكثر من ١٠٠ برنامج في الولايات المتحدة وأوروبا والشرق الأوسط وأفريقيا وجنوب شرق آسيا' : '100+ programs across US, EU, MENA, Africa, and SEA', color: 'oklch(0.62 0.22 30)', bg: 'oklch(0.97 0.03 30)' },
    { icon: Building2,   label: isRTL ? 'قاعدة بيانات استخبارات المستثمرين' : 'Investor Intelligence Database', desc: isRTL ? 'أكثر من ٣٠ مستثمراً منتقى مع أحجام الشيكات وبيانات المحفظة' : '30+ curated investors with check sizes and portfolio data', color: 'oklch(0.62 0.20 55)', bg: 'oklch(0.97 0.04 55)' },
    { icon: BookOpen,    label: isRTL ? 'مسرد شروط الاستثمار' : 'Investment Terms Glossary', desc: isRTL ? '٧٥ مصطلحاً في ٨ فئات مع مؤشرات العلامات الحمراء' : '75 terms across 8 categories with red flag indicators', color: 'oklch(0.50 0.18 200)', bg: 'oklch(0.95 0.03 200)' },
  ];

  const STATS = [
    { value: '33+', label: isRTL ? 'أداة متخصصة' : 'Startup Tools',     color: 'oklch(0.62 0.22 30)' },
    { value: '7',   label: isRTL ? 'طريقة تقييم' : 'Valuation Methods',  color: 'oklch(0.60 0.24 290)' },
    { value: '100+', label: isRTL ? 'مسرّع أعمال' : 'Accelerators',      color: 'oklch(0.56 0.22 150)' },
    { value: isRTL ? 'مجاني' : 'Free', label: isRTL ? 'للأبد' : 'Forever', color: 'oklch(0.62 0.20 55)' },
  ];

  const STEPS = [
    {
      num: '01',
      title: isRTL ? 'أجب على أسئلة بسيطة' : 'Answer simple questions',
      desc: isRTL ? 'واجهتنا التفاعلية تقودك عبر أسئلة بلغة بسيطة. لا تحتاج خلفية مالية.' : 'Our chat-based interface guides you through plain-English questions. No finance background needed.',
      color: 'oklch(0.62 0.22 30)',
    },
    {
      num: '02',
      title: isRTL ? 'احصل على نتائج فورية' : 'Get instant results',
      desc: isRTL ? 'الحسابات تعمل في الوقت الفعلي باستخدام ٧ طرق تقييم معيارية وتحليل بالذكاء الاصطناعي.' : 'Calculations run in real-time using 7 industry-standard valuation methods and AI-powered analysis.',
      color: 'oklch(0.60 0.24 290)',
    },
    {
      num: '03',
      title: isRTL ? 'صدّر وشارك' : 'Export & share',
      desc: isRTL ? 'نزّل تقريراً كاملاً بصيغة PDF، شارك رابطاً مع المؤسسين المشاركين، أو صدّر خط أنابيب المستثمرين كملف CSV.' : 'Download a full PDF report, share a link with co-founders, or export your investor pipeline as CSV.',
      color: 'oklch(0.56 0.22 150)',
    },
  ];

  const TESTIMONIALS = [
    { name: 'Sarah Al-Rashid', role: isRTL ? 'مؤسسة، الرياض' : 'Founder, Riyadh', text: isRTL ? 'حاسبة التقييم وفّرت علينا أسابيع من النقاش مع المستثمرين. دخلنا جولة السلسلة أ بثقة كاملة.' : 'The valuation calculator saved us weeks of back-and-forth with investors. We walked into our Series A with confidence.', stars: 5 },
    { name: 'Omar Khalil', role: isRTL ? 'مؤسس مشارك، القاهرة' : 'Co-Founder, Cairo', text: isRTL ? 'أداة تقسيم الأسهم وحدها تستحق كل شيء. تجنبنا نزاعاً بين المؤسسين يقتل معظم الشركات الناشئة قبل انطلاقها.' : 'The equity split tool alone is worth it. We avoided a co-founder conflict that kills most startups before they launch.', stars: 5 },
    { name: 'Lina Mansour', role: isRTL ? 'رئيسة تنفيذية، دبي' : 'CEO, Dubai', text: isRTL ? 'أخيراً مجموعة أدوات مصممة للمؤسسين في منطقة الشرق الأوسط وشمال أفريقيا — ليس فقط لوادي السيليكون. دعم اللغة العربية وقاعدة بيانات المستثمرين الإقليميين رائعة.' : 'Finally a toolkit built for MENA founders — not just Silicon Valley. The Arabic support and regional investor database are game-changers.', stars: 5 },
  ];

  const ctaPath = isAuthenticated ? APP_PATH : REGISTER_PATH;

  return (
    <div
      className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'oklch(0.99 0.005 60)', color: 'oklch(0.18 0.03 30)', fontFamily: "'DM Sans', sans-serif" }}
    >

      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
        style={{
          background: scrolled ? 'rgba(255,252,248,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1.5px solid oklch(0.91 0.015 60)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30) 0%, oklch(0.60 0.24 290) 100%)' }}
            >
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base" style={{ fontFamily: "'Nunito', sans-serif", color: 'oklch(0.18 0.03 30)' }}>
                Polaris Arabia
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#tools" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'oklch(0.45 0.03 60)' }}>
              {isRTL ? 'الأدوات' : 'Tools'}
            </a>
            <a href="#how" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'oklch(0.45 0.03 60)' }}>
              {isRTL ? 'كيف يعمل' : 'How It Works'}
            </a>
            <a href="#testimonials" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'oklch(0.45 0.03 60)' }}>
              {isRTL ? 'آراء المستخدمين' : 'Reviews'}
            </a>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link href={APP_PATH}>
                <button
                  className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}
                >
                  {isRTL ? 'فتح التطبيق' : 'Open App'}
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={LOGIN_PATH}>
                  <button className="text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-black/5" style={{ color: 'oklch(0.45 0.03 60)' }}>
                    {isRTL ? 'تسجيل الدخول' : 'Sign in'}
                  </button>
                </Link>
                <Link href={REGISTER_PATH}>
                  <button
                    className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}
                  >
                    {isRTL ? 'ابدأ مجاناً' : 'Get started free'}
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl transition-colors hover:bg-black/5"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-5 py-4 space-y-3"
            style={{ background: 'oklch(0.99 0.005 60)', borderColor: 'oklch(0.91 0.015 60)' }}
          >
            <a href="#tools" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'الأدوات' : 'Tools'}</a>
            <a href="#how" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'كيف يعمل' : 'How It Works'}</a>
            <a href="#testimonials" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'آراء المستخدمين' : 'Reviews'}</a>
            <div className="pt-2 flex flex-col gap-2">
              <LanguageSwitcher />
              <Link href={ctaPath}>
                <button
                  className="w-full text-sm font-bold px-4 py-3 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isRTL ? 'ابدأ مجاناً' : 'Get started free'}
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Colorful background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'oklch(0.75 0.18 30)' }} />
          <div className="absolute top-10 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'oklch(0.72 0.20 290)' }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'oklch(0.75 0.18 150)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-5 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 border"
            style={{ background: 'oklch(0.97 0.03 30)', borderColor: 'oklch(0.88 0.08 30)', color: 'oklch(0.55 0.22 30)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            {isRTL ? '٣٣ أداة · بدون رسوم · بدون بطاقة ائتمانية' : '33 tools · No fees · No credit card required'}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={{ fontFamily: "'Nunito', sans-serif", letterSpacing: '-0.02em' }}>
            <span style={{ color: 'oklch(0.18 0.03 30)' }}>
              {isRTL ? 'المجموعة الكاملة' : 'The complete toolkit'}
            </span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, oklch(0.62 0.22 30) 0%, oklch(0.60 0.24 290) 50%, oklch(0.56 0.22 150) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {isRTL ? 'للمؤسسين في المراحل المبكرة' : 'for early-stage founders'}
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'oklch(0.45 0.03 60)' }}>
            {isRTL
              ? 'قيّم شركتك الناشئة، اقسم حقوق الملكية بعدالة، ابحث عن المستثمرين، وتابع جمع التمويل — كل ذلك في مكان واحد. مصمم للمؤسسين، لا للمستشارين الماليين.'
              : 'Value your startup, split equity fairly, find investors, track fundraising, and evaluate your idea — all in one place. Built for founders, not financial advisors.'}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href={ctaPath}>
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))', boxShadow: '0 8px 32px oklch(0.62 0.22 30 / 0.35)' }}
              >
                <Zap className="w-4 h-4" />
                {isRTL ? 'ابدأ مجاناً الآن' : 'Get started free'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#tools">
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base transition-all hover:bg-black/5 border"
                style={{ color: 'oklch(0.40 0.03 60)', borderColor: 'oklch(0.88 0.02 60)' }}
              >
                {isRTL ? 'استكشف الأدوات' : 'Explore tools'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </a>
          </div>

          {/* Trust line */}
          <p className="text-sm" style={{ color: 'oklch(0.62 0.02 60)' }}>
            {isRTL ? 'بدون رسوم · بدون بطاقة ائتمانية · بدون مستشار مالي' : 'No fees · No credit card · No financial advisor required'}
          </p>
        </div>

        {/* Stats row */}
        <div className="relative max-w-3xl mx-auto px-5 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-2xl border"
                style={{ background: 'white', borderColor: 'oklch(0.91 0.015 60)', boxShadow: '0 2px 12px oklch(0.18 0.03 30 / 0.06)' }}
              >
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "'Nunito', sans-serif", color: s.color }}>{s.value}</div>
                <div className="text-xs font-medium" style={{ color: 'oklch(0.55 0.02 60)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section id="tools" className="py-20 px-5" style={{ background: 'oklch(0.975 0.008 60)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest"
              style={{ background: 'oklch(0.94 0.05 290)', color: 'oklch(0.50 0.24 290)' }}>
              <Sparkles className="w-3 h-3" />
              {isRTL ? 'الأدوات' : 'Tools'}
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: "'Nunito', sans-serif", color: 'oklch(0.18 0.03 30)' }}>
              {isRTL ? 'كل أداة يحتاجها المؤسس' : 'Every tool a founder needs'}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'oklch(0.45 0.03 60)' }}>
              {isRTL
                ? 'من فكرتك الأولى حتى جولة السلسلة أ — بنينا الأدوات التي تحل محل المستشارين المكلفين وجداول البيانات المتناثرة.'
                : 'From your first idea to your Series A — we\'ve built the tools that replace expensive consultants and scattered spreadsheets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link href={ctaPath} key={i}>
                  <div
                    className="group p-5 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1"
                    style={{
                      background: 'white',
                      borderColor: 'oklch(0.91 0.015 60)',
                      boxShadow: '0 2px 12px oklch(0.18 0.03 30 / 0.05)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${tool.color}22`; (e.currentTarget as HTMLDivElement).style.borderColor = tool.color + '44'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px oklch(0.18 0.03 30 / 0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'oklch(0.91 0.015 60)'; }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tool.bg }}>
                        <Icon className="w-5 h-5" style={{ color: tool.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-1" style={{ color: 'oklch(0.22 0.03 30)', fontFamily: "'Nunito', sans-serif" }}>{tool.label}</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'oklch(0.52 0.02 60)' }}>{tool.desc}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href={ctaPath}>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 text-white"
                style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}
              >
                {isRTL ? 'عرض جميع الأدوات الـ٣٣' : 'View all 33 tools'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest"
              style={{ background: 'oklch(0.95 0.05 150)', color: 'oklch(0.45 0.22 150)' }}>
              <Zap className="w-3 h-3" />
              {isRTL ? 'كيف يعمل' : 'How It Works'}
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: "'Nunito', sans-serif", color: 'oklch(0.18 0.03 30)' }}>
              {isRTL ? 'مصمم للمؤسسين، لا لخبراء المال' : 'Built for founders, not finance PhDs'}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'oklch(0.45 0.03 60)' }}>
              {isRTL ? 'بدون مصطلحات معقدة. بدون جداول بيانات. فقط أسئلة بسيطة ونتائج فورية احترافية.' : 'No jargon. No spreadsheets. Just plain-English questions and instant, professional-grade results.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative p-6 rounded-2xl border text-center"
                style={{ background: 'white', borderColor: 'oklch(0.91 0.015 60)', boxShadow: '0 2px 12px oklch(0.18 0.03 30 / 0.05)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black"
                  style={{ background: `${step.color}18`, color: step.color, fontFamily: "'Nunito', sans-serif" }}>
                  {step.num}
                </div>
                <h3 className="font-extrabold text-base mb-2" style={{ fontFamily: "'Nunito', sans-serif", color: 'oklch(0.22 0.03 30)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.50 0.02 60)' }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10"
                    style={{ background: 'white', borderColor: 'oklch(0.88 0.02 60)', transform: 'translateY(-50%)' }}>
                    <ChevronRight className="w-3 h-3" style={{ color: 'oklch(0.62 0.02 60)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-5" style={{ background: 'oklch(0.975 0.008 60)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest"
              style={{ background: 'oklch(0.97 0.04 55)', color: 'oklch(0.50 0.20 55)' }}>
              <Star className="w-3 h-3" />
              {isRTL ? 'آراء المستخدمين' : 'Reviews'}
            </div>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Nunito', sans-serif", color: 'oklch(0.18 0.03 30)' }}>
              {isRTL ? 'موثوق به من مؤسسين حول العالم' : 'Trusted by founders worldwide'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border"
                style={{ background: 'white', borderColor: 'oklch(0.91 0.015 60)', boxShadow: '0 2px 12px oklch(0.18 0.03 30 / 0.05)' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: 'oklch(0.75 0.18 55)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'oklch(0.40 0.02 60)' }}>"{t.text}"</p>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'oklch(0.22 0.03 30)' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.02 60)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="p-10 md:p-16 rounded-3xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30) 0%, oklch(0.60 0.24 290) 60%, oklch(0.56 0.22 150) 100%)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-2xl" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-2xl" style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {isRTL ? 'هل أنت مستعد للبناء بوضوح؟' : 'Ready to build with clarity?'}
              </h2>
              <p className="text-base text-white/80 mb-8 max-w-lg mx-auto">
                {isRTL
                  ? 'انضم إلى آلاف المؤسسين الذين يستخدمون Polaris Arabia لاتخاذ قرارات أفضل وأسرع.'
                  : 'Join thousands of founders using Polaris Arabia to make better decisions, faster.'}
              </p>
              <Link href={ctaPath}>
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'white', color: 'oklch(0.55 0.22 30)' }}
                >
                  <Zap className="w-4 h-4" />
                  {isRTL ? 'ابدأ مجاناً — بدون بطاقة ائتمانية' : 'Get started free — no credit card'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-10 px-5" style={{ borderColor: 'oklch(0.91 0.015 60)', background: 'white' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}>
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>Polaris Arabia</span>
          </div>
          <p className="text-xs text-center" style={{ color: 'oklch(0.60 0.02 60)' }}>
            {isRTL ? 'جميع الحسابات تقديرية فقط ولا تشكل مشورة مالية.' : 'All calculations are estimates only and do not constitute financial advice.'}
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'oklch(0.55 0.02 60)' }}>
            <a href="#" className="hover:opacity-70 transition-opacity">{isRTL ? 'الخصوصية' : 'Privacy'}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{isRTL ? 'الشروط' : 'Terms'}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
