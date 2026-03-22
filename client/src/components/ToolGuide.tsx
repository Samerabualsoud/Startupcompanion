/**
 * ToolGuide — Collapsible education/help panel for each tool.
 * Shows a "How to use this tool" section with steps and key concepts.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, CheckCircle2, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToolGuideStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolGuideConcept {
  term: string;
  definition: string;
}

export interface ToolGuideConnection {
  from: string;  // source tool/data
  to: string;    // what it fills in this tool
}

export interface ToolGuideProps {
  toolName: string;
  tagline: string;
  steps: ToolGuideStep[];
  concepts?: ToolGuideConcept[];
  connections?: ToolGuideConnection[];
  tip?: string;
  defaultOpen?: boolean;
}

export default function ToolGuide({
  toolName,
  tagline,
  steps,
  concepts,
  connections,
  tip,
  defaultOpen = false,
}: ToolGuideProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30/60 dark:bg-indigo-950/20 dark:border-indigo-900 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-100 dark:bg-indigo-900/30/60 dark:hover:bg-indigo-900/30 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">How to use: {toolName}</div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400/80 dark:text-indigo-400/80 truncate">{tagline}</div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-indigo-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-indigo-500 shrink-0" />
        }
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-indigo-200 dark:border-indigo-800 pt-3 space-y-4">
              {/* Steps */}
              <div>
                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  Step-by-step guide
                </div>
                <div className="space-y-2">
                  {steps.map(s => (
                    <div key={s.step} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">{s.title}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400/80 dark:text-indigo-400/80 leading-relaxed">{s.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key concepts */}
              {concepts && concepts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    Key concepts
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {concepts.map(c => (
                      <div key={c.term} className="flex gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">{c.term}: </span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400/80 dark:text-indigo-400/80">{c.definition}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data connections */}
              {connections && connections.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    Connected data sources
                  </div>
                  <div className="space-y-1.5">
                    {connections.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Link2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                          <span className="font-semibold">{c.from}</span> → {c.to}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro tip */}
              {tip && (
                <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>Pro tip:</strong> {tip}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
