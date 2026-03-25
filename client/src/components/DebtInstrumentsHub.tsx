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
      label: 'SAFE & Convertible Notes',
      icon: FileText,
      color: '#7C3AED',
      description: 'Simple Agreements for Future Equity and Convertible debt instruments',
      badge: 'Standard',
      component: <SAFENoteBuilder />,
    },
    {
      id: 'oqal',
      label: 'OQAL Notes (Shariah)',
      icon: Shield,
      color: '#10B981',
      description: 'Shariah-compliant financing instruments for Islamic markets',
      badge: 'Shariah',
      component: <OQALNotes />,
    },
    {
      id: 'zest',
      label: 'Zest Equity & Cap Table',
      icon: TrendingUp,
      color: '#4F6EF7',
      description: 'Equity management and cap table tracking with dilution analysis',
      badge: 'Equity',
      component: <ZestEquity />,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Debt Instruments & Equity</h1>
        <p className="text-muted-foreground">Manage all your financing instruments in one unified hub</p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {instruments.map((instrument) => {
          const Icon = instrument.icon;
          return (
            <Card
              key={instrument.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab(instrument.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${instrument.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: instrument.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{instrument.label}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {instrument.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{instrument.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          {instruments.map((instrument) => (
            <TabsTrigger key={instrument.id} value={instrument.id}>
              {instrument.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {instruments.map((instrument) => (
          <TabsContent
            key={instrument.id}
            value={instrument.id}
            className="flex-1 overflow-y-auto"
          >
            {instrument.component}
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            About These Instruments
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>SAFE & Convertible Notes:</strong> Flexible debt instruments that convert to equity at a future funding round, commonly used in early-stage fundraising.
          </p>
          <p>
            <strong>OQAL Notes:</strong> Shariah-compliant financing instruments designed for Islamic markets and investors who follow Islamic finance principles.
          </p>
          <p>
            <strong>Zest Equity:</strong> Comprehensive equity management tool for tracking cap tables, dilution scenarios, and ownership structures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
