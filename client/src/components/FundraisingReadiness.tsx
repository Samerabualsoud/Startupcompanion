/**
 * FundraisingReadiness — 20-point fundraising readiness checklist with score
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useReport } from '@/contexts/ReportContext';

interface CheckItem {
  id: string;
  category: string;
  label: string;
  description: string;
  weight: number; // 1-3 importance
  tip: string;
  checked: boolean;
}

const INITIAL_ITEMS: CheckItem[] = [
  // Product
  { id: 'mvp', category: 'Product', label: 'Working MVP or live product', description: 'You have a functional product that real users can use.', weight: 3, tip: 'Investors want to see something working. Even a basic MVP dramatically improves your chances.', checked: false },
  { id: 'users', category: 'Product', label: 'Active users or paying customers', description: 'At least 10-100 users actively using the product.', weight: 3, tip: 'Even 10 paying customers is more convincing than 10,000 signups.', checked: false },
  { id: 'retention', category: 'Product', label: 'Measurable retention or engagement', description: 'You can show DAU/MAU, churn rate, or NPS data.', weight: 2, tip: 'Retention is the #1 signal of product-market fit. Show weekly cohort data if possible.', checked: false },
  // Traction
  { id: 'growth', category: 'Traction', label: 'Month-over-month growth (10%+ MoM)', description: 'Revenue or user base growing consistently.', weight: 3, tip: '"T2D3" (triple, triple, double, double, double) is the gold standard for SaaS. Show your growth chart.', checked: false },
  { id: 'revenue', category: 'Traction', label: 'Revenue or clear path to revenue', description: 'Either generating revenue or have a clear monetization plan with evidence.', weight: 2, tip: 'Pre-revenue is fine at pre-seed/seed, but you need a credible path to monetization.', checked: false },
  { id: 'pmf', category: 'Traction', label: 'Evidence of product-market fit', description: 'Users say they would be "very disappointed" if your product disappeared (40%+ threshold).', weight: 3, tip: 'Run the Sean Ellis PMF survey. 40%+ "very disappointed" = strong PMF signal.', checked: false },
  // Team
  { id: 'cofounder', category: 'Team', label: 'Strong co-founder team (2-3 people)', description: 'Full-time co-founders with complementary skills (tech + business).', weight: 3, tip: 'Solo founders raise at lower valuations. VCs prefer 2-3 co-founders with clear role separation.', checked: false },
  { id: 'domain', category: 'Team', label: 'Domain expertise in the target market', description: 'At least one founder has deep experience in the industry.', weight: 2, tip: '"Why are YOU the right team to solve this?" is the hardest question. Domain expertise is your answer.', checked: false },
  { id: 'fulltime', category: 'Team', label: 'All founders working full-time', description: 'No founders with "day jobs." Full commitment signals conviction.', weight: 2, tip: 'Part-time founders are a major red flag. Quit before you raise.', checked: false },
  // Market
  { id: 'tam', category: 'Market', label: 'Defined TAM > $1B', description: 'Total addressable market is large enough to build a venture-scale business.', weight: 2, tip: 'VCs need to believe you can build a $100M+ company. That requires a $1B+ market.', checked: false },
  { id: 'competition', category: 'Market', label: 'Clear competitive differentiation', description: 'You can articulate why you win vs. alternatives in one sentence.', weight: 2, tip: 'The worst answer is "we have no competition." The best is a specific, defensible moat.', checked: false },
  // Legal & Financial
  { id: 'incorporated', category: 'Legal', label: 'Company properly incorporated', description: 'Delaware C-Corp (US) or equivalent. Clean cap table.', weight: 3, tip: 'VCs strongly prefer Delaware C-Corps. If you\'re not incorporated, do it before raising.', checked: false },
  { id: 'ip', category: 'Legal', label: 'IP assigned to the company', description: 'All founders have signed IP assignment agreements.', weight: 3, tip: 'Unassigned IP is a deal-killer. Every founder must sign an IP assignment before raising.', checked: false },
  { id: 'financials', category: 'Legal', label: 'Clean financial records (12 months)', description: 'Organized bank statements, P&L, and basic accounting.', weight: 2, tip: 'Investors will do financial due diligence. Messy books delay or kill deals.', checked: false },
  { id: 'vesting', category: 'Legal', label: 'Founder vesting schedules in place', description: '4-year vesting with 1-year cliff for all founders.', weight: 2, tip: 'Vesting protects the company if a co-founder leaves. VCs require it.', checked: false },
  // Fundraising
  { id: 'dataroom', category: 'Fundraising', label: 'Data room prepared', description: 'Organized folder with financials, cap table, contracts, and product demos.', weight: 2, tip: 'A well-organized data room signals professionalism. Use Notion, Docsend, or Google Drive.', checked: false },
  { id: 'pitch', category: 'Fundraising', label: 'Polished pitch deck (10-12 slides)', description: 'Clear narrative: Problem → Solution → Market → Traction → Team → Ask.', weight: 2, tip: 'The deck gets you the meeting. The meeting gets you the term sheet. Invest in the deck.', checked: false },
  { id: 'ask', category: 'Fundraising', label: 'Clear ask: amount, use of funds, timeline', description: 'You know exactly how much you\'re raising and what you\'ll do with it.', weight: 2, tip: 'Vague asks ("we\'re raising $1-5M") signal lack of planning. Be specific.', checked: false },
  { id: 'network', category: 'Fundraising', label: 'Warm introductions to target investors', description: 'You have at least 5-10 warm intros lined up, not cold outreach.', weight: 2, tip: 'Cold emails have <1% response rate. Warm intros have 30%+. Work your network.', checked: false },
  { id: 'references', category: 'Fundraising', label: 'Customer/partner references available', description: 'You can provide 3+ references who will speak positively about your product.', weight: 1, tip: 'VCs will call your customers. Make sure they\'re prepared and enthusiastic.', checked: false },
];

const CATEGORY_COLORS: Record<string, string> = {
  Product: '#C4614A',
  Traction: '#10B981',
  Team: '#2D4A6B',
  Market: '#F59E0B',
  Legal: '#8B4A38',
  Fundraising: '#6366F1',
};

export default function FundraisingReadiness() {
  const [items, setItems] = useState<CheckItem[]>(INITIAL_ITEMS);
  const [expandedCat, setExpandedCat] = useState<string | null>('Product');
  const { setReadiness } = useReport();

  const toggle = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const { score, maxScore, pct, categoryScores } = useMemo(() => {
    const score = items.filter(i => i.checked).reduce((s, i) => s + i.weight, 0);
    const maxScore = items.reduce((s, i) => s + i.weight, 0);
    const pct = Math.round((score / maxScore) * 100);

    const categories = Array.from(new Set(items.map(i => i.category)));
    const categoryScores = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const catScore = catItems.filter(i => i.checked).reduce((s, i) => s + i.weight, 0);
      const catMax = catItems.reduce((s, i) => s + i.weight, 0);
      return { category: cat, score: catScore, max: catMax, pct: Math.round((catScore / catMax) * 100) };
    });

    return { score, maxScore, pct, categoryScores };
  }, [items]);

  const readinessLabel = pct >= 80 ? { label: 'Ready to Raise', color: '#10B981', icon: '🚀' }
    : pct >= 60 ? { label: 'Almost Ready', color: '#F59E0B', icon: '⚡' }
    : pct >= 40 ? { label: 'Getting There', color: '#F97316', icon: '🔧' }
    : { label: 'Not Ready Yet', color: '#EF4444', icon: '🛑' };

  const radarData = categoryScores.map(c => ({ subject: c.category, score: c.pct, fullMark: 100 }));

  const categories = Array.from(new Set(INITIAL_ITEMS.map(i => i.category)));

  // Publish to report context whenever score changes
  useEffect(() => {
    setReadiness({
      score,
      maxScore,
      pct,
      checkedItems: items.filter(i => i.checked).map(i => i.label),
      totalItems: items.length,
    });
  }, [score, maxScore, pct, items, setReadiness]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Fundraising Readiness Score
        </h2>
        <p className="text-sm text-muted-foreground">
          Check off what you've completed. Get a readiness score and specific action items to improve it.
        </p>
      </div>

      {/* Score + radar */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="text-center">
            <div className="text-6xl font-black metric-value mb-1" style={{ color: readinessLabel.color, fontFamily: 'Playfair Display, serif' }}>
              {pct}%
            </div>
            <div className="text-lg font-semibold text-foreground mb-1">{readinessLabel.icon} {readinessLabel.label}</div>
            <div className="text-xs text-muted-foreground mb-3">{score} / {maxScore} weighted points</div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: readinessLabel.color }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {categoryScores.map(c => (
                <div key={c.category} className="text-center">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{c.category}</div>
                  <div className="text-sm font-bold metric-value" style={{ color: CATEGORY_COLORS[c.category] }}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="oklch(0.88 0.01 80)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontFamily: 'DM Sans' }} />
              <Radar name="Readiness" dataKey="score" stroke="#C4614A" fill="#C4614A" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Readiness']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 6 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Checklist by category */}
      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        const catScore = categoryScores.find(c => c.category === cat);
        const isExpanded = expandedCat === cat;
        const unchecked = catItems.filter(i => !i.checked);

        return (
          <div key={cat} className="border border-border rounded-xl overflow-hidden bg-card">
            <button
              onClick={() => setExpandedCat(isExpanded ? null : cat)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                <span className="text-sm font-semibold text-foreground">{cat}</span>
                <span className="text-xs text-muted-foreground">
                  {catItems.filter(i => i.checked).length}/{catItems.length} completed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold metric-value" style={{ color: CATEGORY_COLORS[cat] }}>{catScore?.pct}%</div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border divide-y divide-border/50">
                {catItems.map(item => (
                  <div key={item.id}
                    className={`p-3 flex gap-3 cursor-pointer hover:bg-secondary/20 transition-colors ${item.checked ? 'opacity-70' : ''}`}
                    onClick={() => toggle(item.id)}>
                    <div className="shrink-0 mt-0.5">
                      {item.checked
                        ? <CheckCircle2 className="w-4 h-4" style={{ color: CATEGORY_COLORS[cat] }} />
                        : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.label}
                        {item.weight === 3 && <span className="ml-1.5 text-[9px] font-bold text-red-500 uppercase tracking-wider">Critical</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                      {!item.checked && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{item.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
