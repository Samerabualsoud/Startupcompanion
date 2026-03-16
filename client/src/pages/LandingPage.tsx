import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  TrendingUp, Sparkles, Users, GitBranch, Target, BookOpen,
  BarChart3, Rocket, Gauge, Layers, Building2, Gift, Scale,
  ArrowRight, Star, Zap, Globe, Shield, Brain
} from 'lucide-react';
import { APP_PATH, REGISTER_PATH, LOGIN_PATH } from '@/const';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();

  const TOOLS = [
    { icon: TrendingUp, label: 'Valuation Calculator', labelAr: 'حاسبة التقييم', desc: '7 methods: DCF, Scorecard, Berkus, VC Method, and more', descAr: '٧ طرق: DCF، Scorecard، Berkus، طريقة رأس المال المخاطر، والمزيد', color: '#C4614A' },
    { icon: Brain, label: 'Idea Feasibility Check', labelAr: 'فحص جدوى الفكرة', desc: 'AI scores your idea across 8 dimensions with risks & next steps', descAr: 'يقيّم الذكاء الاصطناعي فكرتك عبر ٨ أبعاد مع المخاطر والخطوات التالية', color: '#8B5CF6' },
    { icon: Users, label: 'Co-Founder Equity Split', labelAr: 'تقسيم أسهم المؤسسين', desc: '7-factor scoring to split equity fairly among founders', descAr: 'تقييم ٧ عوامل لتقسيم الأسهم بعدالة بين المؤسسين', color: '#2D4A6B' },
    { icon: GitBranch, label: 'Dilution Simulator', labelAr: 'محاكي التخفيف', desc: 'Track ownership through Pre-Seed → Series E with named founders', descAr: 'تتبع الملكية من مرحلة ما قبل البذرة حتى السلسلة E', color: '#059669' },
    { icon: Gauge, label: 'Fundraising Readiness', labelAr: 'الاستعداد للتمويل', desc: '20-point checklist to know if you\'re ready to raise', descAr: 'قائمة تحقق من ٢٠ نقطة لمعرفة ما إذا كنت مستعداً للتمويل', color: '#F59E0B' },
    { icon: Layers, label: 'Pitch Deck Scorecard', labelAr: 'تقييم العرض التقديمي', desc: 'Score all 10 slides of your deck with actionable feedback', descAr: 'قيّم جميع شرائح العرض العشر مع ملاحظات قابلة للتنفيذ', color: '#6366F1' },
    { icon: Target, label: 'Investor CRM', labelAr: 'إدارة علاقات المستثمرين', desc: 'Track your pipeline with stages, notes, and CSV export', descAr: 'تتبع خط أنابيب المستثمرين مع المراحل والملاحظات وتصدير CSV', color: '#C4614A' },
    { icon: Rocket, label: 'Accelerator Finder', labelAr: 'محرك البحث عن مسرّعات الأعمال', desc: '100+ programs across US, EU, MENA, Africa, and SEA', descAr: 'أكثر من ١٠٠ برنامج في أمريكا وأوروبا والشرق الأوسط وأفريقيا وجنوب شرق آسيا', color: '#10B981' },
    { icon: BarChart3, label: 'Runway Optimizer', labelAr: 'محسّن المدرج', desc: 'Model burn rate, revenue, and months of runway', descAr: 'نمذجة معدل الإنفاق والإيرادات وأشهر المدرج', color: '#059669' },
    { icon: BookOpen, label: 'Term Sheet Glossary', labelAr: 'مسرد شروط الاستثمار', desc: '75 terms across 8 categories with red flag indicators', descAr: '٧٥ مصطلحاً في ٨ فئات مع مؤشرات العلامات الحمراء', color: '#0F1B2D' },
    { icon: Building2, label: 'VC & Angel Database', labelAr: 'قاعدة بيانات رأس المال المخاطر والملائكيين', desc: '30+ curated investors with check sizes and portfolio data', descAr: 'أكثر من ٣٠ مستثمراً منتقى مع أحجام الشيكات وبيانات المحفظة', color: '#2D4A6B' },
    { icon: Gift, label: 'Grants Database', labelAr: 'قاعدة بيانات المنح', desc: '20+ equity-free grants from government, EU, and corporates', descAr: 'أكثر من ٢٠ منحة بدون حصص ملكية من الحكومة والاتحاد الأوروبي والشركات', color: '#10B981' },
    { icon: Scale, label: 'Venture Lawyers', labelAr: 'محامو المشاريع', desc: '20+ startup-friendly law firms across every major region', descAr: 'أكثر من ٢٠ مكتب قانوني صديق للشركات الناشئة في كل منطقة رئيسية', color: '#6366F1' },
  ];

  const TESTIMONIALS_EN = [
    { name: 'Sarah K.', role: 'Founder, HealthTech startup', quote: 'The valuation calculator gave me a number I could actually defend in my seed round. Raised $1.2M shortly after.' },
    { name: 'Ahmed M.', role: 'Co-founder, MENA SaaS', quote: 'The equity split tool saved us months of founder drama. Clear, fair, and data-driven.' },
    { name: 'Priya R.', role: 'Solo founder, EdTech', quote: 'Found my accelerator through the Accelerator Finder. Got into a top program in Singapore.' },
  ];

  const TESTIMONIALS_AR = [
    { name: 'سارة ك.', role: 'مؤسسة، شركة ناشئة في مجال الصحة التقنية', quote: 'أعطتني حاسبة التقييم رقماً يمكنني الدفاع عنه في جولة البذرة. جمعت ١.٢ مليون دولار بعدها بفترة قصيرة.' },
    { name: 'أحمد م.', role: 'مؤسس مشارك، SaaS في منطقة الشرق الأوسط', quote: 'وفّرت أداة تقسيم الأسهم علينا أشهراً من الخلافات بين المؤسسين. واضحة وعادلة ومبنية على البيانات.' },
    { name: 'بريا ر.', role: 'مؤسسة منفردة، تقنية التعليم', quote: 'وجدت مسرّعتي من خلال محرك البحث. قُبلت في برنامج متميز في سنغافورة.' },
  ];

  const TESTIMONIALS = isRTL ? TESTIMONIALS_AR : TESTIMONIALS_EN;

  const STATS = [
    { value: '13+', label: t('statTools') },
    { value: '7', label: t('statMethods') },
    { value: '100+', label: t('statAccelerators') },
    { value: '50+', label: t('statInvestors') },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.65 0.13 30)' }} />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              {t('appName')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link href={APP_PATH}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'oklch(0.18 0.05 240)' }}>
                  {t('openApp')} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link href={LOGIN_PATH}>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {t('signIn')}
                  </button>
                </Link>
                <Link href={REGISTER_PATH}>
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'oklch(0.18 0.05 240)' }}>
                    {t('getStarted')}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: 'oklch(0.55 0.13 30)' }} />
          <div className="absolute top-32 -left-16 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'oklch(0.18 0.05 240)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'oklch(0.96 0.02 30)', color: 'oklch(0.45 0.12 30)', border: '1px solid oklch(0.88 0.06 30)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            {t('heroBadge')}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {t('heroTitle1')}{' '}
            <span style={{ color: 'oklch(0.55 0.13 30)' }}>{t('heroTitle2')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={isAuthenticated ? APP_PATH : REGISTER_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'oklch(0.18 0.05 240)' }}>
                {isAuthenticated ? t('openApp') : t('startForFree')}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <Link href={isAuthenticated ? APP_PATH : LOGIN_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium border border-border hover:bg-white transition-all"
                style={{ color: 'oklch(0.3 0.04 240)' }}>
                {isAuthenticated ? t('goToDashboard') : t('signIn')}
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'oklch(0.55 0.13 30)' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              {t('everyToolTitle')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('everyToolSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.label}
                  className="group p-5 rounded-2xl border border-border hover:shadow-md transition-all hover:border-transparent cursor-pointer"
                  style={{ background: 'oklch(0.993 0.003 80)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: tool.color + '18' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: tool.color }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: 'oklch(0.18 0.05 240)' }}>
                    {isRTL ? tool.labelAr : tool.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRTL ? tool.descAr : tool.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              {t('howItWorksTitle')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Sparkles, titleKey: 'step1Title' as const, descKey: 'step1Desc' as const },
              { step: '02', icon: Zap, titleKey: 'step2Title' as const, descKey: 'step2Desc' as const },
              { step: '03', icon: Shield, titleKey: 'step3Title' as const, descKey: 'step3Desc' as const },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'oklch(0.18 0.05 240)' }}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: 'oklch(0.55 0.13 30)' }}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-2"
                    style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Database highlight ── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'oklch(0.18 0.05 240)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5"
                style={{ background: 'oklch(0.25 0.05 240)', color: 'oklch(0.75 0.05 80)' }}>
                <Globe className="w-3.5 h-3.5" />
                {t('globalCoverage')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-5 text-white"
                style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif' }}>
                {t('dbTitle')}
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'oklch(0.65 0.03 240)' }}>
                {t('dbSubtitle')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, labelKey: 'vcFirms' as const, count: '30+', descKey: 'vcDesc' as const },
                  { icon: Users, labelKey: 'angelInvestors' as const, count: '20+', descKey: 'angelDesc' as const },
                  { icon: Gift, labelKey: 'grantsPrograms' as const, count: '20+', descKey: 'grantsDesc' as const },
                  { icon: Scale, labelKey: 'ventureLawyers' as const, count: '20+', descKey: 'lawyersDesc' as const },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.labelKey} className="p-4 rounded-xl" style={{ background: 'oklch(0.22 0.05 240)' }}>
                      <Icon className="w-5 h-5 mb-2" style={{ color: 'oklch(0.65 0.13 30)' }} />
                      <div className="text-xl font-bold text-white font-mono">{item.count}</div>
                      <div className="text-sm font-medium text-white">{t(item.labelKey)}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.03 240)' }}>{t(item.descKey)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { region: isRTL ? 'أمريكا الشمالية' : 'North America', items: ['Sequoia', 'a16z', 'Benchmark', 'Accel', 'SBIR Grants'] },
                { region: isRTL ? 'أوروبا' : 'Europe', items: ['Balderton', 'Index Ventures', 'EIC Accelerator', 'Horizon Europe', 'Cooley LLP'] },
                { region: isRTL ? 'الشرق الأوسط وشمال أفريقيا' : 'MENA', items: ['Wamda Capital', 'Algebra Ventures', 'DIFC Fintech Hive', 'Al Tamimi & Co'] },
                { region: isRTL ? 'أفريقيا وجنوب شرق آسيا' : 'Africa & SEA', items: ['Partech Africa', 'Sequoia SEA', 'Tony Elumelu Foundation', 'Bowmans'] },
              ].map(region => (
                <div key={region.region} className="p-4 rounded-xl" style={{ background: 'oklch(0.22 0.05 240)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.65 0.13 30)' }}>{region.region}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {region.items.map(item => (
                      <span key={item} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.28 0.04 240)', color: 'oklch(0.7 0.03 240)' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3"
              style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              {t('trustedBy')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(testimonial => (
              <div key={testimonial.name} className="p-6 rounded-2xl border border-border" style={{ background: 'oklch(0.993 0.003 80)' }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'oklch(0.75 0.15 80)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-muted-foreground">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.18 0.05 240)' }}>{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5"
            style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {t('ctaTitle')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={isAuthenticated ? APP_PATH : REGISTER_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'oklch(0.18 0.05 240)' }}>
                {isAuthenticated ? t('openApp') : t('createFreeAccount')}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t('freeForever')}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-4 sm:px-6" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.13 30)' }} />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              {t('appName')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} AI Startup Toolkit. {t('footerDisclaimer')}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground items-center">
            <span className="cursor-pointer hover:text-foreground transition-colors">{t('privacy')}</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">{t('terms')}</span>
            <Link href={LOGIN_PATH} className="hover:text-foreground transition-colors">{t('signIn')}</Link>
            <LanguageSwitcher compact />
          </div>
        </div>
      </footer>
    </div>
  );
}
