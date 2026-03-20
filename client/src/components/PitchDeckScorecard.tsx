/**
 * PitchDeckScorecard — 10-slide pitch deck scoring with fundability score
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useReport } from '@/contexts/ReportContext';
import { useToolState } from '@/hooks/useToolState';

interface Slide {
  id: string;
  name: string;
  emoji: string;
  description: string;
  score: number; // 0-10
  weight: number;
  tips: string[];
  redFlags: string[];
}

const INITIAL_SLIDES: Slide[] = [
  {
    id: 'problem', name: 'Problem', emoji: '🔥', weight: 3,
    description: 'Clearly defines a painful, urgent problem that a large number of people have.',
    score: 5, tips: [
      'Make the problem visceral — use a story or statistic that makes investors feel the pain.',
      'Quantify the problem: "X million people lose $Y per year because of Z."',
      'Show you understand the problem better than anyone else.',
    ], redFlags: [
      'Problem is vague or not clearly defined.',
      'Problem affects too small a market.',
      'Solution is looking for a problem.',
    ],
  },
  {
    id: 'solution', name: 'Solution', emoji: '💡', weight: 3,
    description: 'Your product/service clearly solves the problem in a unique, defensible way.',
    score: 5, tips: [
      'Show the product, don\'t just describe it. A 30-second demo video is worth 10 slides.',
      'Explain your "secret sauce" — what makes your solution uniquely effective.',
      'Keep it simple: "We help X do Y by doing Z."',
    ], redFlags: [
      'Solution is too complex to explain in 60 seconds.',
      'No clear differentiation from existing solutions.',
      'Technology-first, not customer-first.',
    ],
  },
  {
    id: 'market', name: 'Market Size', emoji: '📊', weight: 2,
    description: 'TAM/SAM/SOM analysis showing a large, growing, addressable market.',
    score: 5, tips: [
      'Use bottom-up market sizing, not just top-down. Show how you calculated it.',
      'VCs want TAM > $1B. SAM should be $100M+.',
      'Show the market is growing, not shrinking.',
    ], redFlags: [
      'Market size is too small (<$500M TAM).',
      'Market sizing is clearly made up or copied from a report.',
      'No differentiation between TAM, SAM, and SOM.',
    ],
  },
  {
    id: 'traction', name: 'Traction', emoji: '📈', weight: 3,
    description: 'Evidence of product-market fit: revenue, users, growth rate, retention.',
    score: 5, tips: [
      'Show a "hockey stick" growth chart. Month-over-month is more compelling than year-over-year.',
      'Include logos of notable customers or partners.',
      'Show retention data — it\'s the strongest PMF signal.',
    ], redFlags: [
      'No traction data at all (for seed+).',
      'Vanity metrics only (downloads, signups) with no engagement data.',
      'Declining or flat growth.',
    ],
  },
  {
    id: 'business-model', name: 'Business Model', emoji: '💰', weight: 2,
    description: 'Clear explanation of how you make money, unit economics, and path to profitability.',
    score: 5, tips: [
      'Show LTV/CAC ratio (ideally 3:1 or better).',
      'Explain pricing clearly. Why is this the right price?',
      'Show gross margin. VCs love 70%+ gross margins.',
    ], redFlags: [
      'No clear monetization plan.',
      'CAC is higher than LTV.',
      '"We\'ll figure out monetization later."',
    ],
  },
  {
    id: 'competition', name: 'Competition', emoji: '⚔️', weight: 2,
    description: 'Honest competitive landscape with a clear articulation of your defensible advantage.',
    score: 5, tips: [
      'Never say "we have no competition." Every problem has alternative solutions.',
      'Use a 2x2 matrix showing where you uniquely win.',
      'Focus on your moat: network effects, data, switching costs, brand, IP.',
    ], redFlags: [
      '"We have no competitors."',
      'Dismissing large incumbents without a clear reason.',
      'No defensible moat articulated.',
    ],
  },
  {
    id: 'go-to-market', name: 'Go-to-Market', emoji: '🚀', weight: 2,
    description: 'Specific, credible plan for acquiring customers at scale.',
    score: 5, tips: [
      'Show your first 100 customers strategy, not just your "eventual" strategy.',
      'Include CAC by channel and which channels you\'ve validated.',
      'Name specific partnerships or distribution deals if you have them.',
    ], redFlags: [
      '"We\'ll use social media and word of mouth."',
      'No unit economics for customer acquisition.',
      'GTM strategy doesn\'t match the target customer.',
    ],
  },
  {
    id: 'team', name: 'Team', emoji: '👥', weight: 3,
    description: 'Exceptional team with relevant experience, domain expertise, and complementary skills.',
    score: 5, tips: [
      '"Why are YOU the right team?" is the most important question. Answer it explicitly.',
      'Highlight relevant exits, domain expertise, or "unfair advantages."',
      'Show full-time commitment. Part-time founders are a red flag.',
    ], redFlags: [
      'All founders have the same background (e.g., all engineers, no business).',
      'Advisors listed to fill gaps that should be co-founders.',
      'Founders are part-time.',
    ],
  },
  {
    id: 'financials', name: 'Financials', emoji: '📋', weight: 2,
    description: '3-5 year financial projections with clear assumptions and milestones.',
    score: 5, tips: [
      'Show a 3-year model with monthly detail for year 1.',
      'Include key assumptions (growth rate, churn, CAC, LTV).',
      'Show the milestones you\'ll hit with this funding round.',
    ], redFlags: [
      'Hockey stick projections with no supporting assumptions.',
      'No path to profitability.',
      'Projections don\'t match the ask (e.g., raising $1M but projecting $100M revenue in 2 years).',
    ],
  },
  {
    id: 'ask', name: 'The Ask', emoji: '🤝', weight: 2,
    description: 'Clear funding ask with specific use of funds and key milestones it unlocks.',
    score: 5, tips: [
      'Be specific: "We\'re raising $2M to hire 3 engineers and reach $1M ARR in 18 months."',
      'Show a use-of-funds breakdown (% to engineering, sales, marketing).',
      'Explain what milestone this round gets you to (the "Series A story").',
    ], redFlags: [
      'Vague ask ("we\'re raising $1-5M").',
      'No clear use of funds.',
      'Asking for too much or too little relative to the stage.',
    ],
  },
];

export default function PitchDeckScorecard() {
  const { state: slides, setState: setSlides } = useToolState<Slide[]>('pitch_scorecard', INITIAL_SLIDES);
  const [expandedId, setExpandedId] = useState<string | null>('problem');
  const { setPitchScore } = useReport();

  const updateScore = (id: string, score: number) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, score } : s));
  };

  const { totalScore, maxScore, pct, radarData } = useMemo(() => {
    const totalScore = slides.reduce((sum, s) => sum + s.score * s.weight, 0);
    const maxScore = slides.reduce((sum, s) => sum + 10 * s.weight, 0);
    const pct = Math.round((totalScore / maxScore) * 100);
    const radarData = slides.map(s => ({ subject: s.name, score: s.score * 10, fullMark: 100 }));
    return { totalScore, maxScore, pct, radarData };
  }, [slides]);

  const fundabilityLabel = pct >= 80 ? { label: 'Highly Fundable', color: '#10B981' }
    : pct >= 65 ? { label: 'Fundable with Work', color: '#F59E0B' }
    : pct >= 50 ? { label: 'Needs Improvement', color: '#F97316' }
    : { label: 'Major Gaps', color: '#EF4444' };

  const weakSlides = slides.filter(s => s.score < 6).sort((a, b) => (a.score * a.weight) - (b.score * b.weight));

  // Publish to report context
  useEffect(() => {
    setPitchScore({
      totalScore,
      maxScore,
      pct,
      slideScores: slides.map(s => ({ slide: s.name, score: s.score * s.weight, max: 10 * s.weight })),
    });
  }, [totalScore, maxScore, pct, slides, setPitchScore]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Pitch Deck Scorecard
        </h2>
        <p className="text-sm text-muted-foreground">
          Rate each slide 0-10. Get a fundability score and specific tips to improve your deck.
        </p>
      </div>

      {/* Score summary */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="text-center">
            <div className="text-6xl font-black metric-value mb-1" style={{ color: fundabilityLabel.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {pct}%
            </div>
            <div className="text-base font-semibold text-foreground mb-1">{fundabilityLabel.label}</div>
            <div className="text-xs text-muted-foreground mb-3">Fundability Score</div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: fundabilityLabel.color }}
              />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="oklch(0.88 0.01 80)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontFamily: 'DM Sans' }} />
              <Radar name="Score" dataKey="score" stroke="#C4614A" fill="#C4614A" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`${v / 10}/10`, 'Score']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 6 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {weakSlides.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-xs font-semibold text-amber-800 mb-1.5">🎯 Priority Improvements</div>
            <div className="flex flex-wrap gap-2">
              {weakSlides.slice(0, 4).map(s => (
                <button key={s.id} onClick={() => setExpandedId(s.id)}
                  className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-white border border-amber-300 px-2 py-1 rounded-full hover:bg-amber-50 transition-colors">
                  {s.emoji} {s.name}: {s.score}/10
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide cards */}
      <div className="space-y-2">
        {slides.map(slide => {
          const isExpanded = expandedId === slide.id;
          const scoreColor = slide.score >= 8 ? '#10B981' : slide.score >= 6 ? '#F59E0B' : '#EF4444';

          return (
            <div key={slide.id} className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setExpandedId(isExpanded ? null : slide.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/20 transition-colors"
              >
                <span className="text-xl shrink-0">{slide.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">{slide.name}</div>
                  <div className="text-[10px] text-muted-foreground">{slide.description}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold metric-value" style={{ color: scoreColor }}>{slide.score}/10</div>
                    {slide.weight === 3 && <div className="text-[9px] text-muted-foreground">Critical</div>}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border p-4 space-y-4">
                  {/* Score slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground">Your Score</label>
                      <span className="text-sm font-bold metric-value" style={{ color: scoreColor }}>{slide.score}/10</span>
                    </div>
                    <input
                      type="range" min={0} max={10} step={1} value={slide.score}
                      onChange={e => updateScore(slide.id, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, ${scoreColor} ${slide.score * 10}%, oklch(0.88 0.01 80) ${slide.score * 10}%)` }}
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                      <span>0 — Weak</span><span>5 — Average</span><span>10 — Exceptional</span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <div className="text-xs font-semibold text-foreground mb-2">💡 Tips to Score Higher</div>
                    <ul className="space-y-1.5">
                      {slide.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Red flags */}
                  <div>
                    <div className="text-xs font-semibold text-foreground mb-2">🚩 Common Red Flags</div>
                    <ul className="space-y-1.5">
                      {slide.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          <span className="shrink-0">✗</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
