/**
 * Debt Instruments & Equity Hub
 * Unified interface for SAFE notes, OQAL notes, Convertible notes, and Zest equity
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, TrendingUp, DollarSign } from 'lucide-react';
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
      description: 'Simple Agreements for Future Equity',
      badge: 'Standard',
      component: <SAFENoteBuilder />,
    },
    {
      id: 'oqal',
      label: 'OQAL Notes',
      icon: Shield,
      color: '#10B981',
      description: 'Shariah-compliant financing',
      badge: 'Shariah',
      component: <OQALNotes />,
    },
    {
      id: 'zest',
      label: 'Zest Equity',
      icon: TrendingUp,
      color: '#4F6EF7',
      description: 'Cap table & equity tracking',
      badge: 'Equity',
      component: <ZestEquity />,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full min-h-0 gap-4 p-4 lg:p-6 overflow-hidden">
      {/* Header - Compact */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Debt & Equity</h1>
        <p className="text-sm text-muted-foreground">Manage financing instruments in one place</p>
      </div>

      {/* Quick Overview Cards - Horizontal Scroll on Mobile */}
      <div className="shrink-0 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {instruments.map((instrument) => {
            const Icon = instrument.icon;
            return (
              <button
                key={instrument.id}
                onClick={() => setActiveTab(instrument.id)}
                className={`flex-shrink-0 p-3 rounded-lg border transition-all ${
                  activeTab === instrument.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ minWidth: '140px' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: `${instrument.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: instrument.color }} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {instrument.badge}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground">{instrument.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Content - Flex 1 with proper constraints */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 shrink-0 mb-3">
          {instruments.map((instrument) => (
            <TabsTrigger key={instrument.id} value={instrument.id} className="text-xs sm:text-sm">
              {instrument.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {instruments.map((instrument) => (
            <TabsContent
              key={instrument.id}
              value={instrument.id}
              className="h-full overflow-y-auto m-0 p-0"
            >
              <div className="h-full overflow-y-auto">
                {instrument.component}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Info Section - Compact */}
      <div className="shrink-0 text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
        <div className="flex gap-2 items-start">
          <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p><strong>SAFE & Convertible:</strong> Debt instruments that convert to equity</p>
            <p><strong>OQAL Notes:</strong> Shariah-compliant financing for Islamic markets</p>
            <p><strong>Zest Equity:</strong> Cap table and equity management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
