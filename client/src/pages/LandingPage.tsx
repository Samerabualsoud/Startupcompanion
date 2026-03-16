import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  TrendingUp, Sparkles, Users, GitBranch, Target, BookOpen,
  BarChart3, Rocket, Gauge, Layers, Building2, Gift, Scale,
  ArrowRight, CheckCircle2, ChevronRight, Star, Zap, Globe,
  DollarSign, Shield, Brain
} from 'lucide-react';
import { APP_PATH, REGISTER_PATH, LOGIN_PATH } from '@/const';

const TOOLS = [
  { icon: TrendingUp, label: 'Valuation Calculator', desc: '7 methods: DCF, Scorecard, Berkus, VC Method, and more', color: '#C4614A' },
  { icon: Brain, label: 'Idea Feasibility Check', desc: 'AI scores your idea across 8 dimensions with risks & next steps', color: '#8B5CF6' },
  { icon: Users, label: 'Co-Founder Equity Split', desc: '7-factor scoring to split equity fairly among founders', color: '#2D4A6B' },
  { icon: GitBranch, label: 'Dilution Simulator', desc: 'Track ownership through Pre-Seed → Series E with named founders', color: '#059669' },
  { icon: Gauge, label: 'Fundraising Readiness', desc: '20-point checklist to know if you\'re ready to raise', color: '#F59E0B' },
  { icon: Layers, label: 'Pitch Deck Scorecard', desc: 'Score all 10 slides of your deck with actionable feedback', color: '#6366F1' },
  { icon: Target, label: 'Investor CRM', desc: 'Track your pipeline with stages, notes, and CSV export', color: '#C4614A' },
  { icon: Rocket, label: 'Accelerator Finder', desc: '100+ programs across US, EU, MENA, Africa, and SEA', color: '#10B981' },
  { icon: BarChart3, label: 'Runway Optimizer', desc: 'Model burn rate, revenue, and months of runway', color: '#059669' },
  { icon: BookOpen, label: 'Term Sheet Glossary', desc: '75 terms across 8 categories with red flag indicators', color: '#0F1B2D' },
  { icon: Building2, label: 'VC & Angel Database', desc: '25+ curated investors with check sizes and portfolio data', color: '#2D4A6B' },
  { icon: Gift, label: 'Grants Database', desc: '12+ equity-free grants from government, EU, and corporates', color: '#10B981' },
  { icon: Scale, label: 'Venture Lawyers', desc: '12 startup-friendly law firms across every major region', color: '#6366F1' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Founder, HealthTech startup', quote: 'The valuation calculator gave me a number I could actually defend in my seed round. Raised $1.2M shortly after.' },
  { name: 'Ahmed M.', role: 'Co-founder, MENA SaaS', quote: 'The equity split tool saved us months of founder drama. Clear, fair, and data-driven.' },
  { name: 'Priya R.', role: 'Solo founder, EdTech', quote: 'Found my accelerator through the Accelerator Finder. Got into a top program in Singapore.' },
];

const STATS = [
  { value: '13+', label: 'Startup tools' },
  { value: '7', label: 'Valuation methods' },
  { value: '100+', label: 'Accelerators' },
  { value: '25+', label: 'Investors & lawyers' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.65 0.13 30)' }} />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              AI Startup Toolkit
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={APP_PATH}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'oklch(0.18 0.05 240)' }}>
                  Open App <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link href={LOGIN_PATH}>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </button>
                </Link>
                <Link href={REGISTER_PATH}>
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'oklch(0.18 0.05 240)' }}>
                    Get started free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: 'oklch(0.55 0.13 30)' }} />
          <div className="absolute top-32 -left-16 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'oklch(0.18 0.05 240)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'oklch(0.96 0.02 30)', color: 'oklch(0.45 0.12 30)', border: '1px solid oklch(0.88 0.06 30)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            13 tools · Completely free · No credit card
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            The complete toolkit for{' '}
            <span style={{ color: 'oklch(0.55 0.13 30)' }}>early-stage founders</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Value your startup, split equity fairly, find investors, track fundraising, and evaluate your idea — all in one place. Built for founders, not financial advisors.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={isAuthenticated ? APP_PATH : REGISTER_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'oklch(0.18 0.05 240)' }}>
                {isAuthenticated ? 'Open App' : 'Start for free'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href={isAuthenticated ? APP_PATH : LOGIN_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium border border-border hover:bg-white transition-all"
                style={{ color: 'oklch(0.3 0.04 240)' }}>
                {isAuthenticated ? 'Go to dashboard' : 'Sign in'}
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              Every tool a founder needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From your first idea to your Series A — we've built the tools that replace expensive consultants and scattered spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <div key={tool.label}
                  className="group p-5 rounded-2xl border border-border hover:shadow-md transition-all hover:border-transparent cursor-pointer"
                  style={{ background: 'oklch(0.993 0.003 80)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: tool.color + '18' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: tool.color }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: 'oklch(0.18 0.05 240)' }}>{tool.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              Built for founders, not finance PhDs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No jargon. No spreadsheets. Just plain-English questions and instant, professional-grade results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Sparkles, title: 'Answer simple questions', desc: 'Our chat-based interface guides you through plain-English questions. No finance background needed.' },
              { step: '02', icon: Zap, title: 'Get instant results', desc: 'Calculations run in real-time using 7 industry-standard valuation methods and AI-powered analysis.' },
              { step: '03', icon: Shield, title: 'Export & share', desc: 'Download a full PDF report, share a link with co-founders, or export your investor pipeline as CSV.' },
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
                  <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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
                Global coverage
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-5 text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Find the right investors, grants, and lawyers
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'oklch(0.65 0.03 240)' }}>
                Our curated database covers every major startup ecosystem — from Silicon Valley VCs to African angel investors, EU grants to MENA venture lawyers.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: 'VC Firms', count: '15+', desc: 'With check sizes & portfolio' },
                  { icon: Users, label: 'Angel Investors', count: '10+', desc: 'Across all regions' },
                  { icon: Gift, label: 'Grants & Programs', count: '12+', desc: 'Equity-free funding' },
                  { icon: Scale, label: 'Venture Lawyers', count: '12+', desc: 'Startup-friendly firms' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-4 rounded-xl" style={{ background: 'oklch(0.22 0.05 240)' }}>
                      <Icon className="w-5 h-5 mb-2" style={{ color: 'oklch(0.65 0.13 30)' }} />
                      <div className="text-xl font-bold text-white font-mono">{item.count}</div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.03 240)' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { region: 'North America', items: ['Sequoia', 'a16z', 'Benchmark', 'Accel', 'SBIR Grants'] },
                { region: 'Europe', items: ['Balderton', 'Index Ventures', 'EIC Accelerator', 'Horizon Europe', 'Cooley LLP'] },
                { region: 'MENA', items: ['Wamda Capital', 'Algebra Ventures', 'DIFC Fintech Hive', 'Al Tamimi & Co'] },
                { region: 'Africa & SEA', items: ['Partech Africa', 'Sequoia SEA', 'Tony Elumelu Foundation', 'Bowmans'] },
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
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              Trusted by founders worldwide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-border" style={{ background: 'oklch(0.993 0.003 80)' }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'oklch(0.75 0.15 80)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-muted-foreground">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.18 0.05 240)' }}>{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            Ready to build with clarity?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of founders using AI Startup Toolkit to make better decisions, faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={isAuthenticated ? APP_PATH : REGISTER_PATH}>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'oklch(0.18 0.05 240)' }}>
                {isAuthenticated ? 'Open App' : 'Create free account'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free forever · No credit card · No financial advisor required
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
            <span className="font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              AI Startup Toolkit
            </span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} AI Startup Toolkit. All calculations are estimates only and do not constitute financial advice.
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
            <Link href={LOGIN_PATH} className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
