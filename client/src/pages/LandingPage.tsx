/**
 * LandingPage — Polaris Arabia
 * Design: "Venture Capital Night" — Deep navy + warm amber/terracotta accents
 * Layout: Asymmetric hero with floating stats, diagonal section breaks, editorial grid
 * Typography: Plus Jakarta Sans (headings) + Inter (body) + JetBrains Mono (numbers/labels)
 */
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  TrendingUp, Sparkles, Users, GitBranch, Target, BookOpen,
  BarChart3, Rocket, Gauge, Layers, Building2, Gift, Scale,
  ArrowRight, Star, Zap, Globe, Shield, Brain, ChevronRight,
  DollarSign, FileText, PieChart, BarChart2, CheckCircle, Menu, X,
  Briefcase, LineChart, Calculator, Database, Search, Lightbulb
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
    { icon: TrendingUp,  label: 'Valuation Calculator',   labelAr: 'حاسبة التقييم',              desc: '7 methods: DCF, Scorecard, Berkus, VC Method, and more',                   color: '#E07B54', group: 'Valuation' },
    { icon: Brain,       label: 'Idea Validator',          labelAr: 'مدقق الفكرة',                desc: 'AI scores your idea across 8 dimensions with risks & next steps',           color: '#8B5CF6', group: 'Validation' },
    { icon: FileText,    label: 'Term Sheet Builder',      labelAr: 'منشئ صحيفة الشروط',          desc: 'Generate SAFE, convertible note, or priced round term sheets instantly',     color: '#3B82F6', group: 'Legal' },
    { icon: PieChart,    label: 'Cap Table Manager',       labelAr: 'مدير جدول الرأسمال',         desc: 'Visual ownership breakdown with dilution tracking across all rounds',        color: '#10B981', group: 'Equity' },
    { icon: Users,       label: 'Co-Founder Equity Split', labelAr: 'تقسيم أسهم المؤسسين',        desc: '7-factor scoring to split equity fairly among founders',                    color: '#F59E0B', group: 'Equity' },
    { icon: GitBranch,   label: 'Dilution Simulator',      labelAr: 'محاكي التخفيف',              desc: 'Track ownership through Pre-Seed → Series E with named founders',           color: '#059669', group: 'Equity' },
    { icon: Gauge,       label: 'Fundraising Readiness',   labelAr: 'الاستعداد للتمويل',          desc: '20-point checklist to know if you\'re ready to raise',                      color: '#EF4444', group: 'Fundraising' },
    { icon: Layers,      label: 'Pitch Deck Scorecard',    labelAr: 'تقييم العرض التقديمي',       desc: 'Score all 10 slides of your deck with actionable feedback',                 color: '#6366F1', group: 'Fundraising' },
    { icon: Target,      label: 'Investor CRM',            labelAr: 'إدارة علاقات المستثمرين',    desc: 'Track your pipeline with stages, notes, and CSV export',                    color: '#C4614A', group: 'Fundraising' },
    { icon: LineChart,   label: 'Sales Pipeline Tracker',  labelAr: 'متتبع خط أنابيب المبيعات',  desc: 'Full CRM with Kanban pipeline, channel analytics, and AI forecasting',       color: '#0EA5E9', group: 'Operations' },
    { icon: Calculator,  label: 'COGS & Cost Suite',       labelAr: 'مجموعة التكاليف',            desc: 'Product-level costing, margin waterfall, break-even, and overhead allocation', color: '#84CC16', group: 'Operations' },
    { icon: BarChart3,   label: 'Runway Optimizer',        labelAr: 'محسّن المدرج',               desc: 'Model burn rate, revenue, and months of runway',                            color: '#059669', group: 'Operations' },
    { icon: Rocket,      label: 'Accelerator Finder',      labelAr: 'محرك البحث عن مسرّعات',     desc: '100+ programs across US, EU, MENA, Africa, and SEA',                        color: '#F97316', group: 'Resources' },
    { icon: Building2,   label: 'VC & Angel Database',     labelAr: 'قاعدة بيانات المستثمرين',   desc: '30+ curated investors with check sizes and portfolio data',                  color: '#2D4A6B', group: 'Resources' },
    { icon: Gift,        label: 'Grants Database',         labelAr: 'قاعدة بيانات المنح',         desc: '20+ equity-free grants from government, EU, and corporates',                color: '#10B981', group: 'Resources' },
    { icon: Scale,       label: 'Venture Lawyers',         labelAr: 'محامو المشاريع',             desc: '20+ startup-friendly law firms across every major region',                  color: '#6366F1', group: 'Resources' },
    { icon: BookOpen,    label: 'Term Sheet Glossary',      labelAr: 'مسرد شروط الاستثمار',        desc: '75 terms across 8 categories with red flag indicators',                     color: '#0F1B2D', group: 'Resources' },
    { icon: Database,    label: 'Data Room',               labelAr: 'غرفة البيانات',              desc: 'Secure document vault with shareable investor links and access tracking',    color: '#8B5CF6', group: 'Fundraising' },
  ];

  const STATS = [
    { value: '18+', label: 'Tools', labelAr: 'أداة' },
    { value: '7',   label: 'Valuation Methods', labelAr: 'طريقة تقييم' },
    { value: '100+', label: 'Accelerators', labelAr: 'مسرّع أعمال' },
    { value: 'Free', label: 'Forever', labelAr: 'مجاناً للأبد' },
  ];

  const TESTIMONIALS = [
    { name: 'Sarah Al-Rashid', role: 'Founder, Riyadh', text: 'The valuation calculator saved us weeks of back-and-forth with investors. We walked into our Series A with confidence.', stars: 5 },
    { name: 'Omar Khalil', role: 'Co-Founder, Cairo', text: 'The equity split tool alone is worth it. We avoided a co-founder conflict that kills most startups before they launch.', stars: 5 },
    { name: 'Lina Mansour', role: 'CEO, Dubai', text: 'Finally a toolkit built for MENA founders — not just Silicon Valley. The Arabic support and regional investor database are game-changers.', stars: 5 },
  ];

  const ctaPath = isAuthenticated ? APP_PATH : REGISTER_PATH;

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: '#0A0F1E', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl border-b' : ''}`}
        style={{ background: scrolled ? 'rgba(10,15,30,0.92)' : 'transparent', borderColor: scrolled ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)' }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Polaris Arabia
              </span>
              <span className="text-xs ml-2 hidden sm:inline" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
                v2.0
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#tools" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(240,237,232,0.6)' }}>Tools</a>
            <a href="#how" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(240,237,232,0.6)' }}>How It Works</a>
            <a href="#testimonials" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(240,237,232,0.6)' }}>Reviews</a>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link href={APP_PATH}>
                <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)', color: '#fff' }}>
                  Open App <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={LOGIN_PATH}>
                  <span className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: 'rgba(240,237,232,0.6)' }}>Sign in</span>
                </Link>
                <Link href={REGISTER_PATH}>
                  <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)', color: '#fff' }}>
                    Get Started Free
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={() => setMobileMenuOpen(v => !v)} className="p-1.5 rounded-lg" style={{ color: 'rgba(240,237,232,0.7)' }}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-5 pb-5 space-y-3 border-t" style={{ background: 'rgba(10,15,30,0.97)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {['#tools', '#how', '#testimonials'].map(href => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-2 transition-colors hover:text-white" style={{ color: 'rgba(240,237,232,0.6)' }}>
                {href.replace('#', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </a>
            ))}
            <Link href={ctaPath}>
              <button className="w-full text-sm font-semibold px-4 py-2.5 rounded-lg mt-2"
                style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)', color: '#fff' }}>
                {isAuthenticated ? 'Open App' : 'Get Started Free'}
              </button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #E07B54 0%, transparent 70%)', filter: 'blur(80px)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* Floating accent dots */}
          <div className="absolute top-24 right-[15%] w-2 h-2 rounded-full" style={{ background: '#E07B54', opacity: 0.6 }} />
          <div className="absolute top-48 right-[25%] w-1 h-1 rounded-full" style={{ background: '#8B5CF6', opacity: 0.5 }} />
          <div className="absolute top-32 left-[20%] w-1.5 h-1.5 rounded-full" style={{ background: '#10B981', opacity: 0.5 }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className={isRTL ? 'order-2' : 'order-1'}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
                style={{ background: 'rgba(224,123,84,0.1)', borderColor: 'rgba(224,123,84,0.3)', color: '#E07B54', fontFamily: "'JetBrains Mono', monospace" }}>
                <Sparkles className="w-3 h-3" />
                {isRTL ? 'مجاني للأبد · ١٨+ أداة' : 'Free forever · 18+ tools'}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F0EDE8' }}>
                {isRTL ? (
                  <>
                    <span>أدوات </span>
                    <span style={{ color: '#E07B54' }}>المؤسسين</span>
                    <br />
                    <span>التي تحتاجها</span>
                    <br />
                    <span>للتمويل</span>
                  </>
                ) : (
                  <>
                    <span>The Founder</span>
                    <br />
                    <span style={{ color: '#E07B54' }}>Toolkit</span>
                    <span> Built</span>
                    <br />
                    <span>for MENA</span>
                  </>
                )}
              </h1>

              <p className="text-base md:text-lg leading-relaxed mb-8 max-w-lg"
                style={{ color: 'rgba(240,237,232,0.65)', fontWeight: 300 }}>
                {isRTL
                  ? 'كل ما تحتاجه من التقييم إلى جمع التمويل — حاسبة التقييم، محاكي التخفيف، إدارة علاقات المستثمرين، وأكثر من ١٨ أداة مجانية.'
                  : 'Everything from valuation to fundraising — valuation calculator, dilution simulator, investor CRM, sales tracker, and 18+ more tools. Built for MENA founders, free forever.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={ctaPath}>
                  <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)', color: '#fff', boxShadow: '0 8px 32px rgba(224,123,84,0.35)' }}>
                    {isRTL ? 'ابدأ مجاناً' : 'Start for Free'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <a href="#tools">
                  <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 border"
                    style={{ borderColor: 'rgba(240,237,232,0.15)', color: 'rgba(240,237,232,0.8)' }}>
                    {isRTL ? 'استعرض الأدوات' : 'Explore Tools'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </a>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {['#E07B54', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ background: c, borderColor: '#0A0F1E', color: '#fff' }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>
                  <span style={{ color: '#E07B54' }}>★★★★★</span>
                  {isRTL ? ' · مستخدم بثقة من مئات المؤسسين' : ' · Trusted by hundreds of MENA founders'}
                </div>
              </div>
            </div>

            {/* Right: Stats card grid */}
            <div className={`${isRTL ? 'order-1' : 'order-2'} grid grid-cols-2 gap-4`}>
              {STATS.map((s, i) => (
                <div key={i} className="rounded-2xl p-5 border transition-all hover:border-white/10"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#E07B54' }}>
                    {s.value}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(240,237,232,0.55)' }}>
                    {isRTL ? s.labelAr : s.label}
                  </div>
                </div>
              ))}

              {/* Featured tool card */}
              <div className="col-span-2 rounded-2xl p-5 border"
                style={{ background: 'linear-gradient(135deg, rgba(224,123,84,0.12) 0%, rgba(139,92,246,0.08) 100%)', borderColor: 'rgba(224,123,84,0.2)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224,123,84,0.2)' }}>
                    <TrendingUp className="w-4.5 h-4.5" style={{ color: '#E07B54' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Valuation Calculator</div>
                    <div className="text-xs" style={{ color: 'rgba(240,237,232,0.45)', fontFamily: "'JetBrains Mono', monospace" }}>7 methods · instant results</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['DCF', 'Scorecard', 'Berkus', 'VC Method', 'Comparable', 'Risk Factor'].map(m => (
                    <div key={m} className="text-center py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,232,0.6)' }}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diagonal divider ── */}
      <div className="relative h-16 overflow-hidden" style={{ background: '#0A0F1E' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.02)', clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }} />
      </div>

      {/* ── How It Works ── */}
      <section id="how" className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 border"
              style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6', fontFamily: "'JetBrains Mono', monospace" }}>
              <Zap className="w-3 h-3" /> {isRTL ? 'كيف يعمل' : 'How It Works'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isRTL ? 'من الفكرة إلى التمويل في ٣ خطوات' : 'From Idea to Funding in 3 Steps'}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(240,237,232,0.55)' }}>
              {isRTL ? 'لا تضيع وقتك في الجداول. احصل على نتائج احترافية في دقائق.' : "No spreadsheets. No consultants. Professional results in minutes."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Lightbulb, title: isRTL ? 'أدخل بيانات شركتك' : 'Enter Your Startup Data', desc: isRTL ? 'أجب على أسئلة موجّهة حول نموذج عملك والسوق والفريق.' : 'Answer guided questions about your business model, market, and team.', color: '#E07B54' },
              { step: '02', icon: Sparkles, title: isRTL ? 'احصل على تحليل فوري' : 'Get Instant Analysis', desc: isRTL ? 'تحسب أدواتنا التقييم والأسهم والجاهزية وأكثر في ثوانٍ.' : 'Our tools calculate valuation, equity, readiness, and more in seconds.', color: '#8B5CF6' },
              { step: '03', icon: Rocket, title: isRTL ? 'اذهب إلى المستثمرين بثقة' : 'Approach Investors with Confidence', desc: isRTL ? 'استخدم التقارير والتقييمات وغرفة البيانات لتقديم عرض احترافي.' : 'Use reports, valuations, and the data room to present like a pro.', color: '#10B981' },
            ].map((item, i) => (
              <div key={i} className="relative rounded-2xl p-6 border group hover:border-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-2" style={{ color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      STEP {item.step}
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,237,232,0.55)' }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section id="tools" className="py-20" style={{ background: '#0A0F1E' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 border"
                style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#10B981', fontFamily: "'JetBrains Mono', monospace" }}>
                <Globe className="w-3 h-3" /> {isRTL ? 'مجموعة الأدوات' : 'The Full Toolkit'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {isRTL ? '١٨+ أداة لكل مرحلة' : '18+ Tools for Every Stage'}
              </h2>
            </div>
            <Link href={ctaPath}>
              <button className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 shrink-0"
                style={{ background: 'rgba(224,123,84,0.15)', color: '#E07B54', border: '1px solid rgba(224,123,84,0.25)' }}>
                {isRTL ? 'ابدأ مجاناً' : 'Access All Tools Free'} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool, i) => (
              <Link href={ctaPath} key={i}>
                <div className="group rounded-2xl p-5 border cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:border-white/10"
                  style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                      style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}25` }}>
                      <tool.icon className="w-4.5 h-4.5" style={{ color: tool.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {isRTL ? tool.labelAr : tool.label}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,232,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {tool.group}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.5)' }}>
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 border"
              style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace" }}>
              <Star className="w-3 h-3" /> {isRTL ? 'آراء المؤسسين' : 'Founder Reviews'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isRTL ? 'ماذا يقول المؤسسون' : 'What Founders Say'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: '#F59E0B' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(240,237,232,0.7)' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `hsl(${i * 120}, 60%, 45%)`, color: '#fff' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: 'rgba(240,237,232,0.45)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20" style={{ background: '#0A0F1E' }}>
        <div className="max-w-4xl mx-auto px-5 text-center">
          <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden border"
            style={{ background: 'linear-gradient(135deg, rgba(224,123,84,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.06) 100%)', borderColor: 'rgba(224,123,84,0.2)' }}>
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-30"
              style={{ background: 'radial-gradient(ellipse, #E07B54 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {isRTL ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}
              </h2>
              <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'rgba(240,237,232,0.6)' }}>
                {isRTL
                  ? 'انضم إلى مئات المؤسسين في منطقة الشرق الأوسط وشمال أفريقيا الذين يستخدمون Polaris Arabia لبناء شركاتهم.'
                  : 'Join hundreds of MENA founders using Polaris Arabia to build, fund, and scale their startups. Free forever.'}
              </p>
              <Link href={ctaPath}>
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)', color: '#fff', boxShadow: '0 12px 40px rgba(224,123,84,0.4)' }}>
                  {isRTL ? 'ابدأ مجاناً الآن' : 'Get Started for Free'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <p className="text-xs mt-4" style={{ color: 'rgba(240,237,232,0.35)' }}>
                {isRTL ? 'لا بطاقة ائتمانية مطلوبة · مجاني للأبد' : 'No credit card required · Free forever'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-10" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #E07B54 0%, #C4614A 100%)' }}>
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(240,237,232,0.8)' }}>
                Polaris Arabia
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>
              <span>{isRTL ? 'أدوات مجانية للمؤسسين' : 'Free tools for founders'}</span>
              <span>·</span>
              <span>MENA & Global</span>
              <span>·</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>v2.0</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(240,237,232,0.3)' }}>
              <Shield className="w-3 h-3" />
              {isRTL ? 'بياناتك آمنة دائماً' : 'Your data is always secure'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
