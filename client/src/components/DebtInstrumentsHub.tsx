/**
 * Debt Instruments & Equity Hub
 * Unified interface for SAFE notes, OQAL notes, Convertible notes, and Zest equity
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, TrendingUp, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import SAFENoteBuilder from './SAFENoteBuilder';
import OQALNotes from './OQALNotes';
import ZestEquity from './ZestEquity';

export default function DebtInstrumentsHub() {
  const [activeTab, setActiveTab] = useState('safe');
  const [helpOpen, setHelpOpen] = useState(false);

  const instruments = [
    {
      id: 'safe',
      label: 'SAFE',
      icon: FileText,
      color: '#7C3AED',
      bgColor: '#7C3AED15',
      description: 'Future Equity',
      badge: 'Standard',
      component: <SAFENoteBuilder />,
    },
    {
      id: 'oqal',
      label: 'OQAL',
      icon: Shield,
      color: '#10B981',
      bgColor: '#10B98115',
      description: 'Shariah',
      badge: 'Shariah',
      component: <OQALNotes />,
    },
    {
      id: 'zest',
      label: 'Zest',
      icon: TrendingUp,
      color: '#4F6EF7',
      bgColor: '#4F6EF715',
      description: 'Equity',
      badge: 'Equity',
      component: <ZestEquity />,
    },
  ];

  const activeInstrument = instruments.find(i => i.id === activeTab);

  return (
    <div className="flex flex-col h-full w-full min-h-0 gap-3 p-3 lg:p-4 overflow-hidden">
      {/* Compact Navigation */}
      <div className="shrink-0 flex gap-2 overflow-x-auto pb-2">
        {instruments.map((instrument) => {
          const Icon = instrument.icon;
          const isActive = activeTab === instrument.id;
          return (
            <button
              key={instrument.id}
              onClick={() => setActiveTab(instrument.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
                isActive
                  ? 'border-current text-white'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
              style={{
                backgroundColor: isActive ? instrument.color : 'transparent',
                borderColor: isActive ? instrument.color : undefined,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{instrument.label}</span>
                <Badge variant="outline" className="text-[10px] ml-1 px-1.5 py-0" style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderColor: isActive ? 'rgba(255,255,255,0.3)' : undefined,
                  color: isActive ? 'white' : undefined,
                }}>
                  {instrument.badge}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area - Main */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card flex flex-col">
        {/* Active Instrument Header - Compact */}
        {activeInstrument && (
          <div className="shrink-0 px-3 lg:px-4 py-2 border-b border-border bg-gradient-to-r flex items-center gap-2" style={{
            backgroundImage: `linear-gradient(135deg, ${activeInstrument.bgColor}, transparent)`
          }}>
            <div
              className="p-1.5 rounded"
              style={{ backgroundColor: `${activeInstrument.color}20` }}
            >
              {(() => {
                const Icon = activeInstrument.icon;
                return <Icon className="w-4 h-4" style={{ color: activeInstrument.color }} />;
              })()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{activeInstrument.label}</h2>
              <p className="text-xs text-muted-foreground truncate">{activeInstrument.description}</p>
            </div>
          </div>
        )}

        {/* Content Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {instruments.map((instrument) => (
            <div
              key={instrument.id}
              className={activeTab === instrument.id ? 'block' : 'hidden'}
            >
              {instrument.component}
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Help Section */}
      <div className="shrink-0">
        <button
          onClick={() => setHelpOpen(!helpOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors text-sm font-medium text-foreground"
        >
          <span className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            About These Instruments
          </span>
          {helpOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Collapsible Content */}
        {helpOpen && (
          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg space-y-2 text-xs">
            <div>
              <strong className="text-foreground">SAFE & Convertible:</strong>
              <p className="text-muted-foreground">Flexible debt instruments that convert to equity at future funding rounds</p>
            </div>
            <div>
              <strong className="text-foreground">OQAL Notes:</strong>
              <p className="text-muted-foreground">Shariah-compliant financing for Islamic markets and investors</p>
            </div>
            <div>
              <strong className="text-foreground">Zest Equity:</strong>
              <p className="text-muted-foreground">Comprehensive cap table and equity management tool</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
