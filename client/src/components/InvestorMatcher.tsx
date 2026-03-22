import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search, TrendingUp, Users, Sparkles, ExternalLink, Linkedin,
  ChevronDown, Filter, Building2, User, Star, Target, Loader2,
  AlertCircle
} from 'lucide-react';

const SECTORS = [
  'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'AI/ML', 'CleanTech',
  'E-commerce', 'Cybersecurity', 'Logistics', 'AgriTech', 'PropTech',
  'LegalTech', 'HRTech', 'MarTech', 'DeepTech', 'Consumer', 'Gaming',
  'Web3/Crypto', 'BioTech', 'SpaceTech',
];

const STAGES = [
  { value: 'idea', label: 'Idea / Pre-Revenue' },
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'UAE', 'Saudi Arabia',
  'India', 'Nigeria', 'Kenya', 'Brazil', 'Canada', 'Australia', 'Singapore',
  'Israel', 'Netherlands', 'Sweden', 'South Africa', 'Egypt', 'Pakistan',
];

function formatMoney(n?: number | null) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? { bg: '#D1FAE5', text: '#065F46', label: 'Excellent' }
    : score >= 60
    ? { bg: '#DBEAFE', text: '#1E40AF', label: 'Strong' }
    : { bg: '#FEF3C7', text: '#92400E', label: 'Partial' };

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: color.bg, color: color.text }}>
      <Star className="w-3 h-3" />
      {score}% · {color.label}
    </div>
  );
}

interface MatchResult {
  id: number;
  type: 'vc' | 'angel';
  name: string;
  description?: string | null;
  location?: string | null;
  sectors?: unknown;
  stages?: unknown;
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  website?: string | null;
  applyUrl?: string | null;
  linkedinUrl?: string | null;
  notablePortfolio?: unknown;
  score: number;
  matchReasons: string[];
  isCommunity: boolean;
}

function MatchCard({ match, isRTL }: { match: MatchResult; isRTL: boolean }) {
  const sectors = (match.sectors as string[]) ?? [];
  const stages = (match.stages as string[]) ?? [];
  const portfolio = (match.notablePortfolio as string[]) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: match.type === 'vc' ? '#0F52DE' : '#7C3AED' }}>
            {match.type === 'vc' ? <Building2 className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{match.name}</span>
              {match.isCommunity && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--background)', color: 'var(--primary)' }}>
                  Community
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {match.type === 'vc' ? 'VC Firm' : 'Angel Investor'}{match.location ? ` · ${match.location}` : ''}
            </div>
          </div>
        </div>
        <ScoreBadge score={match.score} />
      </div>

      {match.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{match.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {sectors.slice(0, 4).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{s}</span>
        ))}
        {stages.slice(0, 2).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {(match.checkSizeMin || match.checkSizeMax) && (
            <span>
              {formatMoney(match.checkSizeMin)} – {formatMoney(match.checkSizeMax)}
            </span>
          )}
          {portfolio.length > 0 && (
            <span className="ml-2 text-muted-foreground/60">
              {portfolio.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {match.linkedinUrl && (
            <a href={match.linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {(match.applyUrl || match.website) && (
            <a href={match.applyUrl ?? match.website ?? '#'} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              {isRTL ? 'تواصل' : 'Connect'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestorMatcher() {
  const { isRTL } = useLanguage();
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [country, setCountry] = useState('');
  const [targetRaise, setTargetRaise] = useState('');
  const [investorTypes, setInvestorTypes] = useState<('vc' | 'angel')[]>(['vc', 'angel']);
  const [hasSearched, setHasSearched] = useState(false);
  const [queryInput, setQueryInput] = useState<{
    sector?: string; stage?: string; country?: string;
    targetRaise?: number; investorTypes: ('vc' | 'angel')[];
  } | null>(null);

  const { data: matches, isLoading, error } = trpc.matching.findMatches.useQuery(
    queryInput ?? { investorTypes: ['vc', 'angel'] },
    { enabled: !!queryInput }
  );

  const handleSearch = () => {
    setHasSearched(true);
    setQueryInput({
      sector: sector || undefined,
      stage: stage || undefined,
      country: country || undefined,
      targetRaise: targetRaise ? parseFloat(targetRaise) * 1_000_000 : undefined,
      investorTypes,
    });
  };

  const toggleType = (type: 'vc' | 'angel') => {
    setInvestorTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily }}>
            {isRTL ? 'مطابقة المستثمرين' : 'Investor Matching'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isRTL ? 'اعثر على المستثمرين المناسبين لشركتك الناشئة' : 'Find investors that match your startup profile'}
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{isRTL ? 'معايير البحث' : 'Search Criteria'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sector */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              {isRTL ? 'القطاع' : 'Sector'}
            </label>
            <div className="relative">
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none bg-background border border-border text-foreground"
              >
                <option value="">{isRTL ? 'جميع القطاعات' : 'All Sectors'}</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              {isRTL ? 'مرحلة الشركة' : 'Stage'}
            </label>
            <div className="relative">
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none bg-background border border-border text-foreground"
              >
                <option value="">{isRTL ? 'جميع المراحل' : 'All Stages'}</option>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              {isRTL ? 'البلد' : 'Country'}
            </label>
            <div className="relative">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none bg-background border border-border text-foreground"
              >
                <option value="">{isRTL ? 'جميع الدول' : 'All Countries'}</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Target Raise */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              {isRTL ? 'المبلغ المستهدف (مليون دولار)' : 'Target Raise ($M)'}
            </label>
            <input
              type="number"
              value={targetRaise}
              onChange={e => setTargetRaise(e.target.value)}
              placeholder={isRTL ? 'مثال: 2' : 'e.g. 2'}
              min="0"
              step="0.1"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-background border border-border text-foreground"
            />
          </div>
        </div>

        {/* Investor Type Toggle */}
        <div>
          <label className="block text-xs font-medium mb-2 text-muted-foreground">
            {isRTL ? 'نوع المستثمر' : 'Investor Type'}
          </label>
          <div className="flex gap-2">
            {(['vc', 'angel'] as const).map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={investorTypes.includes(type)
                  ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                  : { background: 'var(--background)', color: 'var(--muted-foreground)' }
                }
              >
                {type === 'vc' ? <Building2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {type === 'vc' ? (isRTL ? 'رأس المال المخاطر' : 'VC Firms') : (isRTL ? 'المستثمرون الملائكيون' : 'Angel Investors')}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading || investorTypes.length === 0}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {isRTL ? 'جارٍ البحث...' : 'Finding matches…'}</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {isRTL ? 'ابحث عن المستثمرين المناسبين' : 'Find Matching Investors'}</>
          )}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl text-sm border border-border bg-background text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {isRTL ? 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.'}
        </div>
      )}

      {hasSearched && !isLoading && matches && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {isRTL
                ? `تم العثور على ${matches.length} مستثمر مناسب`
                : `${matches.length} matching investor${matches.length !== 1 ? 's' : ''} found`}
            </h3>
            {matches.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {isRTL ? 'مرتبة حسب درجة التطابق' : 'Sorted by match score'}
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{isRTL ? 'لم يتم العثور على مستثمرين مناسبين. جرب معايير مختلفة.' : 'No matching investors found. Try different criteria.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matches.map(match => (
                <MatchCard key={`${match.type}-${match.id}`} match={match} isRTL={isRTL} />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium mb-1">
            {isRTL ? 'ابدأ بتحديد معايير شركتك الناشئة' : 'Start by setting your startup criteria'}
          </p>
          <p className="text-xs opacity-60">
            {isRTL ? 'سيقوم النظام بمطابقتك مع المستثمرين المناسبين من قاعدة بياناتنا' : 'Our algorithm will score and rank investors from our database'}
          </p>
        </div>
      )}
    </div>
  );
}
