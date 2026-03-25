/**
 * Debt Instruments & Equity Hub
 * Unified interface for SAFE notes, OQAL notes, Convertible notes, and Zest equity
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import SAFENoteBuilder from './SAFENoteBuilder';
import OQALNotes from './OQALNotes';
import ZestEquity from './ZestEquity';

export default function DebtInstrumentsHub() {
  const [activeTab, setActiveTab] = useState('safe');

  const instruments = [
    {
      id: 'safe',
      label: 'SAFE & Convertible',
      icon: FileText,
      color: '#7C3AED',
      bgColor: '#7C3AED15',
      borderColor: '#7C3AED40',
      description: 'Simple Agreements for Future Equity',
      badge: 'Standard',
      component: <SAFENoteBuilder />,
    },
    {
      id: 'oqal',
      label: 'OQAL Notes',
      icon: Shield,
      color: '#10B981',
      bgColor: '#10B98115',
      borderColor: '#10B98140',
      description: 'Shariah-compliant financing',
      badge: 'Shariah',
      component: <OQALNotes />,
    },
    {
      id: 'zest',
      label: 'Zest Equity',
      icon: TrendingUp,
      color: '#4F6EF7',
      bgColor: '#4F6EF715',
      borderColor: '#4F6EF740',
      description: 'Cap table & equity tracking',
      badge: 'Equity',
      component: <ZestEquity />,
    },
  ];

  const activeInstrument = instruments.find(i => i.id === activeTab);

  return (
    <div className="flex flex-col h-full w-full min-h-0 gap-5 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Debt Instruments & Equity</h1>
        <p className="text-sm text-muted-foreground">Manage all your financing instruments in one unified hub</p>
      </div>

      {/* Navigation Cards - Grid Layout */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {instruments.map((instrument) => {
          const Icon = instrument.icon;
          const isActive = activeTab === instrument.id;
          return (
            <button
              key={instrument.id}
              onClick={() => setActiveTab(instrument.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group overflow-hidden ${
                isActive
                  ? `border-[${instrument.borderColor}] bg-[${instrument.bgColor}]`
                  : 'border-border hover:border-primary/50 bg-card hover:bg-accent/5'
              }`}
              style={{
                borderColor: isActive ? instrument.borderColor : undefined,
                backgroundColor: isActive ? instrument.bgColor : undefined,
              }}
            >
              {/* Background gradient on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
                style={{ backgroundColor: instrument.color }}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{ backgroundColor: `${instrument.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: instrument.color }} />
                  </div>
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className="text-xs"
                    style={isActive ? { backgroundColor: instrument.color } : {}}
                  >
                    {instrument.badge}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1">{instrument.label}</h3>
                <p className="text-xs text-muted-foreground mb-3">{instrument.description}</p>

                {/* Active indicator */}
                {isActive && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: instrument.color }}>
                    Active <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        {/* Active Instrument Header */}
        <div className="shrink-0 px-4 lg:px-6 py-4 border-b border-border bg-gradient-to-r" style={{
          backgroundImage: `linear-gradient(135deg, ${activeInstrument?.bgColor || '#f5f5f5'}, transparent)`
        }}>
          <div className="flex items-center gap-3">
            {activeInstrument && (
              <>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${activeInstrument.color}20` }}
                >
                  {(() => {
                    const Icon = activeInstrument.icon;
                    return <Icon className="w-5 h-5" style={{ color: activeInstrument.color }} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeInstrument.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeInstrument.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="h-full overflow-y-auto">
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

      {/* Info Footer */}
      <div className="shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <div className="flex gap-3 items-start">
          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-sm">
            <div>
              <strong className="text-foreground">SAFE & Convertible:</strong>
              <p className="text-xs text-muted-foreground">Flexible debt instruments that convert to equity at future funding rounds</p>
            </div>
            <div>
              <strong className="text-foreground">OQAL Notes:</strong>
              <p className="text-xs text-muted-foreground">Shariah-compliant financing for Islamic markets and investors</p>
            </div>
            <div>
              <strong className="text-foreground">Zest Equity:</strong>
              <p className="text-xs text-muted-foreground">Comprehensive cap table and equity management tool</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
