/**
 * Ecosystem Hub — Combined view of accelerators and jurisdictions
 * Helps founders discover the best startup ecosystems and programs
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Globe } from 'lucide-react';
import AcceleratorRecommender from './AcceleratorRecommender';
import FreeZones from './FreeZones';

export default function EcosystemHub() {
  const [activeTab, setActiveTab] = useState('accelerators');

  const tabs = [
    {
      id: 'accelerators',
      label: 'Accelerators & Incubators',
      icon: Rocket,
      color: '#10B981',
      description: 'Find the best startup programs for your stage and sector',
      component: <AcceleratorRecommender />,
    },
    {
      id: 'jurisdictions',
      label: 'Jurisdictions & Free Zones',
      icon: Globe,
      color: '#4F6EF7',
      description: 'Explore the best places to incorporate and operate',
      component: <FreeZones />,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full min-h-0 gap-4 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Startup Ecosystem</h1>
        <p className="text-sm text-muted-foreground">Discover accelerators, programs, and the best jurisdictions for your startup</p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="shrink-0 grid grid-cols-2 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-lg border transition-all text-left ${
                activeTab === tab.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${tab.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: tab.color }} />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{tab.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{tab.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 shrink-0 mb-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="h-full overflow-y-auto m-0 p-0"
            >
              <div className="h-full overflow-y-auto">
                {tab.component}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
