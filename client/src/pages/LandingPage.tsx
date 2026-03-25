/**
 * LandingPage — Polaris Arabia
 * Design: "Visible.vc Dark" — Professional, dark charcoal, vivid blue CTA
 * Vibe: Visible.vc × Linear × Notion — dark, precise, founder-grade
 * Colors: #202020 bg, #0F52DE blue CTA, #2a2a2a card, near-white text
 * Typography: Inter (all) + JetBrains Mono (numbers)
 */
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TrendingUp, Sparkles, Users, GitBranch, Target, BookOpen,
  BarChart3, Rocket, Gauge, Layers, Building2,
  ArrowRight, Star, Zap, Brain, CheckCircle,
  DollarSign, FileText, PieChart, BarChart2, Menu, X,
  Briefcase, LineChart, Calculator, Database, Search, Lightbulb,
  ChevronRight, Shield, Globe
} from 'lucide-react';
import { APP_PATH, REGISTER_PATH, LOGIN_PATH } from '@/const';
import SiteFooter from '@/components/SiteFooter';
import FeaturedStartups from '@/components/FeaturedStartups';
import EcosystemSection from '@/components/EcosystemSection';

// ── Design tokens (Light mode - Professional) ──────────────────────────────────────────
const BG        = 'oklch(0.98 0.002 80)';    // #FAFAF8 - off-white
const BG_CARD   = 'oklch(1 0 0)';            // #FFFFFF - white
const BG_CARD2  = 'oklch(0.97 0.001 80)';    // #F5F5F3 - light gray
const BG_HOVER  = 'oklch(0.95 0.001 80)';    // #F0F0ED
const BORDER    = 'oklch(0.92 0.002 80)';    // #EBEBEB
const BORDER_HI = 'oklch(0.88 0.003 80)';    // #E0E0DC
const TEXT_HI   = 'oklch(0.15 0.01 240)';    // #1A1A1A - near-black
const TEXT_MED  = 'oklch(0.45 0.01 240)';    // #6B6B6B - medium gray
const TEXT_LOW  = 'oklch(0.65 0.01 240)';    // #A8A8A8 - light gray
const BLUE      = 'oklch(0.50 0.22 264)';    // #0F52DE - vivid blue (unchanged)
const BLUE_DIM  = 'oklch(0.60 0.18 264)';    // lighter blue for hover
const GREEN     = 'oklch(0.55 0.19 155)';    // darker green for light mode
const AMBER     = 'oklch(0.60 0.18 55)';     // darker amber for light mode
const VIOLET    = 'oklch(0.55 0.20 290)';    // darker violet for light mode

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
    { icon: TrendingUp,  label: isRTL ? 'محرك التقييم' : 'Startup Valuation Engine',        desc: isRTL ? '٧ طرق: DCF، بطاقة الأداء، بيركوس، طريقة رأس المال المخاطر والمزيد' : '7 methods: DCF, Scorecard, Berkus, VC Method & more', accent: BLUE, toolId: 'valuation' },
    { icon: Brain,       label: isRTL ? 'محرك التحقق من الفكرة' : 'Concept Validation Engine', desc: isRTL ? 'الذكاء الاصطناعي يقيّم فكرتك عبر ٨ أبعاد' : 'AI scores your idea across 8 dimensions with risks & next steps', accent: VIOLET, toolId: 'idea-validator' },
    { icon: PieChart,    label: isRTL ? 'جدول الرأسمال' : 'Capitalization Table',             desc: isRTL ? 'توزيع الملكية المرئي مع تتبع التخفيف' : 'Visual ownership breakdown with dilution tracking across all rounds', accent: GREEN, toolId: 'cap-table' },
    { icon: Users,       label: isRTL ? 'توزيع حقوق المؤسسين' : 'Founder Equity Allocation',  desc: isRTL ? 'تقييم بـ٧ عوامل لتقسيم الأسهم بعدالة' : '7-factor scoring to split equity fairly among founders', accent: AMBER, toolId: 'equity-split' },
    { icon: Gauge,       label: isRTL ? 'تقييم الاستعداد للمستثمرين' : 'Investor Readiness',  desc: isRTL ? 'قائمة تحقق من ٢٠ نقطة لمعرفة ما إذا كنت مستعداً للتمويل' : '20-point checklist to know if you\'re ready to raise', accent: BLUE, toolId: 'readiness' },
    { icon: Target,      label: isRTL ? 'إدارة خط أنابيب المستثمرين' : 'Investor Pipeline CRM', desc: isRTL ? 'تتبع خط الأنابيب بالمراحل والملاحظات وتصدير CSV' : 'Track your pipeline with stages, notes, and CSV export', accent: VIOLET, toolId: 'investor-crm' },
    { icon: Database,    label: isRTL ? 'غرفة البيانات الافتراضية' : 'Virtual Data Room',      desc: isRTL ? 'خزنة مستندات آمنة مع روابط مشاركة للمستثمرين' : 'Secure document vault with shareable investor links and access tracking', accent: GREEN, toolId: 'data-room' },
    { icon: LineChart,   label: isRTL ? 'ذكاء الإيرادات' : 'Revenue Intelligence',            desc: isRTL ? 'CRM كامل مع خط أنابيب Kanban وتحليلات القنوات' : 'Full CRM with Kanban pipeline, channel analytics, and AI forecasting', accent: BLUE, toolId: 'sales' },
    { icon: Calculator,  label: isRTL ? 'اقتصاديات الوحدة' : 'Unit Economics',                desc: isRTL ? 'تكلفة المنتج، هامش الربح، نقطة التعادل' : 'Product-level costing, margin waterfall, break-even, overhead allocation', accent: AMBER, toolId: 'cogs' },
    { icon: Rocket,      label: isRTL ? 'دليل المسرّعات والحاضنات' : 'Accelerator Finder',    desc: isRTL ? 'أكثر من ١٠٠ برنامج في الولايات المتحدة وأوروبا والشرق الأوسط' : '100+ programs across US, EU, MENA, Africa, and SEA', accent: VIOLET, toolId: 'accelerators' },
    { icon: Building2,   label: isRTL ? 'قاعدة بيانات المستثمرين' : 'Investor Intelligence',  desc: isRTL ? 'أكثر من ٣٠ مستثمراً منتقى مع أحجام الشيكات' : '30+ curated investors with check sizes and portfolio data', accent: GREEN, toolId: 'resources' },
    { icon: BookOpen,    label: isRTL ? 'مسرد شروط الاستثمار' : 'Investment Terms Glossary',  desc: isRTL ? '٧٥ مصطلحاً في ٨ فئات مع مؤشرات العلامات الحمراء' : '75 terms across 8 categories with red flag indicators', accent: BLUE, toolId: 'term-sheet' },
  ];

  const STATS = [
    { value: '35+',  label: isRTL ? 'أداة متخصصة' : 'Startup Tools',    accent: BLUE },
    { value: '7',    label: isRTL ? 'طريقة تقييم' : 'Valuation Methods', accent: VIOLET },
    { value: '100+', label: isRTL ? 'مسرّع أعمال' : 'Accelerators',      accent: GREEN },
    { value: isRTL ? 'مجاني' : 'Free', label: isRTL ? 'للأبد' : 'Forever', accent: AMBER },
  ];

  const STEPS = [
    { num: '01', title: isRTL ? 'أجب على أسئلة بسيطة' : 'Answer simple questions', desc: isRTL ? 'واجهتنا التفاعلية تقودك عبر أسئلة بلغة بسيطة. لا تحتاج خلفية مالية.' : 'Our chat-based interface guides you through plain-English questions. No finance background needed.', accent: BLUE },
    { num: '02', title: isRTL ? 'احصل على نتائج فورية' : 'Get instant results', desc: isRTL ? 'الحسابات تعمل في الوقت الفعلي باستخدام ٧ طرق تقييم معيارية.' : 'Calculations run in real-time using 7 industry-standard valuation methods and AI-powered analysis.', accent: VIOLET },
    { num: '03', title: isRTL ? 'صدّر وشارك' : 'Export & share', desc: isRTL ? 'نزّل تقريراً كاملاً بصيغة PDF، شارك رابطاً مع المؤسسين المشاركين.' : 'Download a full PDF report, share a link with co-founders, or export your investor pipeline as CSV.', accent: GREEN },
  ];

  const TESTIMONIALS = [
    { name: 'Sarah Al-Rashid', role: isRTL ? 'مؤسسة، الرياض' : 'Founder, Riyadh', text: isRTL ? 'حاسبة التقييم وفّرت علينا أسابيع من النقاش مع المستثمرين. دخلنا جولة السلسلة أ بثقة كاملة.' : 'The valuation calculator saved us weeks of back-and-forth with investors. We walked into our Series A with confidence.', stars: 5 },
    { name: 'Omar Khalil', role: isRTL ? 'مؤسس مشارك، القاهرة' : 'Co-Founder, Cairo', text: isRTL ? 'أداة تقسيم الأسهم وحدها تستحق كل شيء. تجنبنا نزاعاً بين المؤسسين يقتل معظم الشركات الناشئة.' : 'The equity split tool alone is worth it. We avoided a co-founder conflict that kills most startups before they launch.', stars: 5 },
    { name: 'Lina Mansour', role: isRTL ? 'رئيسة تنفيذية، دبي' : 'CEO, Dubai', text: isRTL ? 'أخيراً مجموعة أدوات مصممة للمؤسسين في منطقة الشرق الأوسط وشمال أفريقيا — ليس فقط لوادي السيليكون.' : 'Finally a toolkit built for MENA founders — not just Silicon Valley. The Arabic support and regional investor database are game-changers.', stars: 5 },
  ];

  const ctaPath = isAuthenticated ? APP_PATH : REGISTER_PATH;

  return (
    <div
      className="min-h-screen ltr"
      dir="ltr"
      style={{ background: BG, color: TEXT_HI, fontFamily: "'Inter', -apple-system, sans-serif" }}
    >

      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'oklch(0.165 0 0 / 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BORDER}` : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: BLUE }}
            >
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: TEXT_HI, fontFamily: "'Inter', sans-serif" }}>
              Polaris Arabia
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: '#tools', label: isRTL ? 'الأدوات' : 'Tools' },
              { href: '#how', label: isRTL ? 'كيف يعمل' : 'How It Works' },
              { href: '#testimonials', label: isRTL ? 'آراء المستخدمين' : 'Reviews' },
              { href: '/startups', label: isRTL ? 'دليل الشركات الناشئة' : 'Startup Directory', isLink: true },
            ].map(link => (
              (link as any).isLink ? (
                <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: TEXT_MED }}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: TEXT_MED }}>
                  {link.label}
                </a>
              )
            ))}
            {isAuthenticated ? (
              <Link href={APP_PATH} className="text-sm font-semibold px-4 py-2 rounded-md text-white transition-all hover:opacity-90 active:scale-95" style={{ background: BLUE }}>
                {isRTL ? 'فتح التطبيق' : 'Open App'}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={LOGIN_PATH} className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-white/5" style={{ color: TEXT_MED }}>
                  {isRTL ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
                <Link href={REGISTER_PATH} className="text-sm font-semibold px-4 py-2 rounded-md text-white transition-all hover:opacity-90 active:scale-95" style={{ background: BLUE }}>
                  {isRTL ? 'ابدأ مجاناً' : 'Get started free'}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md transition-colors hover:bg-white/5"
            onClick={() => setMobileMenuOpen(v => !v)}
            style={{ color: TEXT_MED }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t px-5 py-4 space-y-3" style={{ background: BG_CARD, borderColor: BORDER }}>
              <a href="#tools" className="block text-sm font-medium py-2" style={{ color: TEXT_MED }} onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'الأدوات' : 'Tools'}</a>
              <a href="#how" className="block text-sm font-medium py-2" style={{ color: TEXT_MED }} onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'كيف يعمل' : 'How It Works'}</a>
              <a href="#testimonials" className="block text-sm font-medium py-2" style={{ color: TEXT_MED }} onClick={() => setMobileMenuOpen(false)}>{isRTL ? 'آراء المستخدمين' : 'Reviews'}</a>
              <Link href="/startups" className="block text-sm font-medium py-2" style={{ color: TEXT_MED }} onClick={() => setMobileMenuOpen(false)}>
                {isRTL ? 'دليل الشركات الناشئة' : 'Startup Directory'}
              </Link>
            <div className="pt-2 flex flex-col gap-2">
                <Link href={ctaPath} className="w-full text-sm font-semibold px-4 py-3 rounded-md text-white" style={{ background: BLUE }} onClick={() => setMobileMenuOpen(false)}>
                  {isRTL ? 'ابدأ مجاناً' : 'Get started free'}
                </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }} />
        {/* Blue glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BLUE }} />

        <div className="relative max-w-5xl mx-auto px-5 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
            style={{ background: `${BLUE}18`, borderColor: `${BLUE}40`, color: 'oklch(0.75 0.18 264)' }}
          >
            <Sparkles className="w-3 h-3" />
            {isRTL ? '٣٥+ أداة · بدون رسوم · بدون بطاقة ائتمانية' : '35+ tools · No fees · No credit card required'}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em', color: TEXT_HI }}>
            {isRTL ? 'المجموعة الكاملة' : 'The complete toolkit'}
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${BLUE} 0%, oklch(0.65 0.20 290) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {isRTL ? 'للمؤسسين في المراحل المبكرة' : 'for early-stage founders'}
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: TEXT_MED }}>
            {isRTL
              ? 'قيّم شركتك الناشئة، اقسم حقوق الملكية بعدالة، ابحث عن المستثمرين، وتابع جمع التمويل — كل ذلك في مكان واحد.'
              : 'Value your startup, split equity fairly, find investors, track fundraising, and evaluate your idea — all in one place. Built for founders, not financial advisors.'}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href={ctaPath}>
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-md text-white font-semibold text-base transition-all hover:opacity-90 active:scale-95"
                style={{ background: BLUE, boxShadow: `0 4px 20px ${BLUE}40` }}
              >
                <Zap className="w-4 h-4" />
                {isRTL ? 'ابدأ مجاناً الآن' : 'Get started free'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#tools">
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-md font-medium text-base transition-all border"
                style={{ color: TEXT_MED, borderColor: BORDER, background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BG_CARD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {isRTL ? 'استكشف الأدوات' : 'Explore tools'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </a>
          </div>

          {/* Trust line */}
          <p className="text-sm" style={{ color: TEXT_LOW }}>
            {isRTL ? 'بدون رسوم · بدون بطاقة ائتمانية · بدون مستشار مالي' : 'No fees · No credit card · No financial advisor required'}
          </p>
        </div>

        {/* Stats row */}
        <div className="relative max-w-3xl mx-auto px-5 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-lg border"
                style={{ background: BG_CARD, borderColor: BORDER }}
              >
                <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: s.accent, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                <div className="text-xs font-medium" style={{ color: TEXT_LOW }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section id="tools" className="py-20 px-5" style={{ background: BG_CARD }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-widest border"
              style={{ background: `${BLUE}15`, borderColor: `${BLUE}35`, color: 'oklch(0.70 0.18 264)' }}
            >
              <Sparkles className="w-3 h-3" />
              {isRTL ? 'الأدوات' : 'Tools'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: TEXT_HI }}>
              {isRTL ? 'كل أداة يحتاجها المؤسس' : 'Every tool a founder needs'}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_MED }}>
              {isRTL
                ? 'من فكرتك الأولى حتى جولة السلسلة أ — بنينا الأدوات التي تحل محل المستشارين المكلفين.'
                : 'From your first idea to your Series A — we\'ve built the tools that replace expensive consultants and scattered spreadsheets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              const toolHref = isAuthenticated ? `/app#${tool.toolId}` : `${REGISTER_PATH}?next=/app%23${tool.toolId}`;
              return (
                <Link href={toolHref} key={i}>
                  <div
                    className="group p-5 rounded-lg border cursor-pointer transition-all"
                    style={{ background: BG, borderColor: BORDER }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = tool.accent + '60';
                      (e.currentTarget as HTMLDivElement).style.background = BG_CARD2;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                      (e.currentTarget as HTMLDivElement).style.background = BG;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: tool.accent + '18' }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: tool.accent }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold mb-1" style={{ color: TEXT_HI }}>{tool.label}</div>
                        <div className="text-xs leading-relaxed" style={{ color: TEXT_LOW }}>{tool.desc}</div>
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90 active:scale-95 text-white"
                style={{ background: BLUE }}
              >
                {isRTL ? 'عرض جميع الأدوات الـ٣٥+' : 'View all 35+ tools'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-20 px-5" style={{ background: BG }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-widest border"
              style={{ background: `${GREEN}15`, borderColor: `${GREEN}35`, color: GREEN }}
            >
              <Zap className="w-3 h-3" />
              {isRTL ? 'كيف يعمل' : 'How It Works'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: TEXT_HI }}>
              {isRTL ? 'مصمم للمؤسسين، لا لخبراء المال' : 'Built for founders, not finance PhDs'}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_MED }}>
              {isRTL ? 'بدون مصطلحات معقدة. بدون جداول بيانات. فقط أسئلة بسيطة ونتائج فورية احترافية.' : 'No jargon. No spreadsheets. Just plain-English questions and instant, professional-grade results.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div key={i} className="relative p-6 rounded-lg border text-center" style={{ background: BG_CARD, borderColor: BORDER }}>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold tabular-nums"
                  style={{ background: step.accent + '18', color: step.accent, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {step.num}
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: TEXT_HI }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_MED }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden md:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full border items-center justify-center z-10"
                    style={{ background: BG_CARD, borderColor: BORDER, transform: 'translateY(-50%)' }}
                  >
                    <ChevronRight className="w-3 h-3" style={{ color: TEXT_LOW }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-5" style={{ background: BG_CARD }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-widest border"
              style={{ background: `${AMBER}15`, borderColor: `${AMBER}35`, color: AMBER }}
            >
              <Star className="w-3 h-3" />
              {isRTL ? 'آراء المستخدمين' : 'Reviews'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: TEXT_HI }}>
              {isRTL ? 'موثوق به من مؤسسين حول العالم' : 'Trusted by founders worldwide'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-lg border" style={{ background: BG, borderColor: BORDER }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: AMBER }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: TEXT_MED }}>"{t.text}"</p>
                <div>
                  <div className="text-sm font-semibold" style={{ color: TEXT_HI }}>{t.name}</div>
                  <div className="text-xs" style={{ color: TEXT_LOW }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ecosystem Section: Jurisdictions & Accelerators ── */}
      <EcosystemSection BG={BG} BG_CARD={BG_CARD} BG_CARD2={BG_CARD2} BORDER={BORDER} TEXT_HI={TEXT_HI} TEXT_MED={TEXT_MED} TEXT_LOW={TEXT_LOW} BLUE={BLUE} GREEN={GREEN} VIOLET={VIOLET} isRTL={isRTL} />

      {/* ── Featured Startups ── */}
      <FeaturedStartups />

      {/* ── CTA ── */}
      <section className="py-20 px-5" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="p-10 md:p-16 rounded-xl relative overflow-hidden border"
            style={{ background: `linear-gradient(135deg, ${BLUE}22 0%, oklch(0.60 0.24 290 / 0.15) 100%)`, borderColor: `${BLUE}40` }}
          >
            {/* Blue glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: BLUE }} />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT_HI }}>
                {isRTL ? 'هل أنت مستعد للبناء بوضوح؟' : 'Ready to build with clarity?'}
              </h2>
              <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: TEXT_MED }}>
                {isRTL
                  ? 'انضم إلى آلاف المؤسسين الذين يستخدمون Polaris Arabia لاتخاذ قرارات أفضل وأسرع.'
                  : 'Join thousands of founders using Polaris Arabia to make better decisions, faster.'}
              </p>
              <Link href={ctaPath}>
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-semibold text-base transition-all hover:opacity-90 active:scale-95 text-white"
                  style={{ background: BLUE, boxShadow: `0 4px 24px ${BLUE}50` }}
                >
                  <Zap className="w-4 h-4" />
                  {isRTL ? 'ابدأ مجاناً — بدون بطاقة ائتمانية' : 'Get started free — no credit card'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
