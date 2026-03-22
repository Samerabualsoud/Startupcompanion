/**
 * TermSheetGlossary — Plain-English term sheet glossary with red flag indicators
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Language-aware: shows term name in active language only (EN or AR)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { TERM_SHEET_GLOSSARY, TERM_CATEGORIES, type TermDefinition } from '@/lib/termSheet';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORY_COLORS: Record<string, string> = {
  economics: '#C4614A',
  control: '#2D4A6B',
  protection: '#F59E0B',
  governance: '#10B981',
  exit: '#8B4A38',
  fundraising: '#6366F1',
  captable: '#0EA5E9',
  legal: '#8B5CF6',
  duediligence: '#EC4899',
  metrics: '#059669',
  equity: '#7C3AED',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  economics: 'Economics',
  control: 'Control',
  protection: 'Protection',
  governance: 'Governance',
  exit: 'Exit',
  fundraising: 'Fundraising',
  captable: 'Cap Table',
  legal: 'Legal',
  duediligence: 'Due Diligence',
  metrics: 'Metrics & KPIs',
  equity: 'Equity & ESOP',
};

const CATEGORY_LABELS_AR: Record<string, string> = {
  economics: 'الاقتصاديات',
  control: 'السيطرة',
  protection: 'الحماية',
  governance: 'الحوكمة',
  exit: 'الخروج',
  fundraising: 'جمع التمويل',
  captable: 'جدول الملكية',
  legal: 'القانوني',
  duediligence: 'العناية الواجبة',
  metrics: 'المقاييس والمؤشرات',
  equity: 'الأسهم والخيارات',
};

function TermCard({ term, index, lang }: { term: TermDefinition; index: number; lang: 'en' | 'ar' }) {
  const [expanded, setExpanded] = useState(false);
  const isAr = lang === 'ar';
  const categoryLabels = isAr ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;

  // Show term name in active language only
  const displayName = isAr && term.arabicTerm ? term.arabicTerm : term.term;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`border rounded-xl overflow-hidden bg-card transition-shadow hover:shadow-sm ${term.redFlag ? 'border-red-200' : 'border-border'}`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: CATEGORY_COLORS[term.category] }}>
                {categoryLabels[term.category] ?? term.category}
              </span>
              {term.redFlag && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {isAr ? 'علامة تحذير' : 'Red Flag'}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: isAr ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif' }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {displayName}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{term.plain}</div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{term.detail}</p>

              {term.example && (
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {isAr ? 'مثال' : 'Example'}
                  </div>
                  <div className="text-xs text-foreground font-mono leading-relaxed">{term.example}</div>
                </div>
              )}

              {term.redFlag && term.redFlagReason && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-0.5">
                        {isAr ? 'لماذا هذه علامة تحذير' : 'Why This Is a Red Flag'}
                      </div>
                      <div className="text-xs text-red-700 leading-relaxed">{term.redFlagReason}</div>
                    </div>
                  </div>
                </div>
              )}

              {term.founderTip && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px] font-semibold text-blue-700 uppercase tracking-wider mb-0.5">
                        {isAr ? 'نصيحة للمؤسس' : 'Founder Tip'}
                      </div>
                      <div className="text-xs text-blue-700 leading-relaxed">{term.founderTip}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TermSheetGlossary() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showRedFlagsOnly, setShowRedFlagsOnly] = useState(false);

  const categoryLabels = isAr ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;

  const filtered = useMemo(() => {
    return TERM_SHEET_GLOSSARY.filter(t => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search
        || t.term.toLowerCase().includes(searchLower)
        || (t.arabicTerm && t.arabicTerm.includes(search))
        || t.plain.toLowerCase().includes(searchLower);
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      const matchesRedFlag = !showRedFlagsOnly || t.redFlag;
      return matchesSearch && matchesCategory && matchesRedFlag;
    });
  }, [search, activeCategory, showRedFlagsOnly]);

  const redFlagCount = TERM_SHEET_GLOSSARY.filter(t => t.redFlag).length;

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: isAr ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif' }}>
          {isAr ? 'قاموس مصطلحات الاستثمار' : 'Term Sheet Glossary'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? `شرح مبسط لـ ${TERM_SHEET_GLOSSARY.length} مصطلح استثماري. ${redFlagCount} مصطلحاً تُعدّ غير مواتية للمؤسسين.`
            : `Plain-English explanations of ${TERM_SHEET_GLOSSARY.length} VC term sheet terms. ${redFlagCount} terms flagged as founder-unfriendly.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isAr ? 'إجمالي المصطلحات' : 'Total Terms', value: TERM_SHEET_GLOSSARY.length, color: '#2D4A6B' },
          { label: isAr ? 'علامات تحذير' : 'Red Flags', value: redFlagCount, color: '#EF4444' },
          { label: isAr ? 'الفئات' : 'Categories', value: TERM_CATEGORIES.length - 1, color: '#C4614A' },
        ].map(s => (
          <div key={s.label} className="border border-border rounded-xl p-3 bg-card text-center">
            <div className="text-2xl font-black metric-value" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <input
            type="text"
            placeholder={isAr ? 'ابحث عن مصطلح...' : 'Search terms...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`vc-input w-full ${isAr ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 text-sm`}
            dir={isAr ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {TERM_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === cat.id ? 'text-white' : 'border border-border text-muted-foreground hover:border-accent'}`}
              style={activeCategory === cat.id ? { background: cat.id === 'all' ? '#0F1B2D' : CATEGORY_COLORS[cat.id] } : {}}
            >
              {cat.id === 'all'
                ? (isAr ? 'الكل' : 'All Terms')
                : (categoryLabels[cat.id] ?? cat.label)}
            </button>
          ))}
          <button
            onClick={() => setShowRedFlagsOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showRedFlagsOnly ? 'bg-red-500 text-white' : 'border border-red-200 text-red-600 hover:bg-red-50'}`}
          >
            <AlertTriangle className="w-3 h-3" />
            {isAr ? 'علامات التحذير فقط' : 'Red Flags Only'}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        {isAr
          ? <>عرض <span className="font-semibold text-foreground">{filtered.length}</span> مصطلح</>
          : <>Showing <span className="font-semibold text-foreground">{filtered.length}</span> terms</>}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <div className="text-sm">{isAr ? 'لا توجد نتائج. جرّب بحثاً مختلفاً.' : 'No terms found. Try a different search.'}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((term, i) => (
            <TermCard key={term.term} term={term} index={i} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
