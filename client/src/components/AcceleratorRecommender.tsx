/**
 * AcceleratorRecommender — Smart program recommendations by stage, country, sector
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, MapPin, Clock, DollarSign, Percent, Star, ChevronDown, ChevronUp, Filter, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { ACCELERATORS, COUNTRIES, recommendAccelerators, type Accelerator, type Stage } from '@/lib/accelerators';
import { SECTOR_OPTIONS } from '@/lib/valuation';
import { useTrackedApplications } from '@/contexts/TrackedApplicationsContext';
import { nanoid } from 'nanoid';

const STAGE_OPTIONS = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

const TYPE_LABELS: Record<string, string> = {
  accelerator: 'Accelerator',
  incubator: 'Incubator',
  'vc-studio': 'VC Studio',
  corporate: 'Corporate',
};

const TYPE_COLORS: Record<string, string> = {
  accelerator: '#C4614A',
  incubator: '#2D4A6B',
  'vc-studio': '#8B4A38',
  corporate: '#1B3A5C',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Top Global',
  2: 'Strong Regional',
  3: 'Local/Niche',
};

function AcceleratorCard({ acc, index }: { acc: Accelerator; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { trackApplication, isTracked, untrack } = useTrackedApplications();
  const tracked = isTracked(acc.name);

  const handleTrack = () => {
    if (tracked) {
      untrack(acc.name);
    } else {
      trackApplication({
        id: nanoid(),
        acceleratorName: acc.name,
        organization: acc.location,
        deadline: acc.deadline,
        equity: acc.equity,
        website: acc.applyUrl,
        trackedAt: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: TYPE_COLORS[acc.type] }}>
                {TYPE_LABELS[acc.type]}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                {TIER_LABELS[acc.tier]}
              </span>
              {acc.remote && (
                <span className="text-[10px] font-mono text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
                  Remote-friendly
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              {acc.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{acc.location}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold metric-value" style={{ color: '#C4614A' }}>{acc.funding}</div>
            <div className="text-[10px] text-muted-foreground">{acc.equity} equity</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{acc.description}</p>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: DollarSign, label: 'Funding', value: acc.funding },
            { icon: Percent, label: 'Equity', value: acc.equity },
            { icon: Clock, label: 'Duration', value: acc.duration },
          ].map(stat => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-secondary/50">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</div>
              <div className="text-xs font-semibold font-mono text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {acc.highlights.slice(0, 3).map(h => (
            <span key={h} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              {h}
            </span>
          ))}
        </div>

        {/* Deadline + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">Deadline:</span> {acc.deadline}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTrack}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-90"
              style={tracked
                ? { background: '#D1FAE5', color: '#059669', border: '1px solid #6EE7B7' }
                : { background: 'oklch(0.18 0.05 240)', color: '#FAF6EF', border: '1px solid oklch(0.28 0.04 240)' }
              }
              title={tracked ? 'Remove from tracker' : 'Track this application'}
            >
              {tracked ? <BookmarkCheck className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
              {tracked ? 'Tracked' : 'Track'}
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {expanded ? 'Less' : 'Details'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 bg-secondary/30">
              <div className="mb-3">
                <div className="text-xs font-semibold text-foreground mb-2">All Highlights</div>
                <ul className="space-y-1">
                  {acc.highlights.map(h => (
                    <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-3">
                <div className="text-xs font-semibold text-foreground mb-1">Stages Accepted</div>
                <div className="flex gap-1.5 flex-wrap">
                  {acc.stages.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground capitalize">{s}</span>
                  ))}
                </div>
              </div>
              <a
                href={acc.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'oklch(0.18 0.05 240)' }}
              >
                Apply Now
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AcceleratorRecommender() {
  const [stage, setStage] = useState<Stage>('seed');
  const [country, setCountry] = useState('United States');
  const [sector, setSector] = useState('saas');
  const [showFilters, setShowFilters] = useState(false);

  const recommendations = useMemo(
    () => recommendAccelerators(stage, country, sector, 12),
    [stage, country, sector]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Accelerator & Incubator Finder
        </h2>
        <p className="text-sm text-muted-foreground">
          Find the best programs for your stage, location, and sector. Updated with {ACCELERATORS.length}+ programs globally.
        </p>
      </div>

      {/* Filters */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-accent" />
            Filter Programs
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${showFilters ? '' : ''}`}>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Your Stage</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value as Stage)}
              className="vc-input w-full px-3 py-2 text-sm"
            >
              {STAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Your Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="vc-input w-full px-3 py-2 text-sm"
            >
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Your Sector</label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="vc-input w-full px-3 py-2 text-sm"
            >
              {SECTOR_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{recommendations.length}</span> programs recommended for{' '}
          <span className="text-accent font-medium">{stage}</span> stage in{' '}
          <span className="text-accent font-medium">{country}</span>
        </div>
      </div>

      {/* Results */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm">No programs found for this combination. Try adjusting your filters.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((acc, i) => (
            <AcceleratorCard key={acc.id} acc={acc} index={i} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Program details are for reference only. Always verify current terms and deadlines on the official program websites.
      </p>
    </div>
  );
}
