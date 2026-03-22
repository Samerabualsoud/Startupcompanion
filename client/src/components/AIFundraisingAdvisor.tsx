/**
 * AI Fundraising Advisor Chat
 * Personalized with founder's startup profile data
 */

import ToolGuide from '@/components/ToolGuide';
import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Loader2, Trash2, User, Bot, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Streamdown } from 'streamdown';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AIFundraisingAdvisor() {
  const { t, lang } = useLanguage();
  const { snapshot } = useStartup();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build rich context from the startup profile snapshot
  const hasProfile = !!(snapshot.companyName || snapshot.sector || snapshot.stage);

  const buildStartupContext = () => ({
    name: snapshot.companyName || '',
    sector: snapshot.sector || '',
    stage: snapshot.stage || '',
    country: snapshot.country || '',
    problem: snapshot.problem || '',
    solution: snapshot.solution || '',
    businessModel: snapshot.businessModel || '',
    mrr: snapshot.mrr || undefined,
    currentARR: snapshot.currentARR || undefined,
    monthlyBurnRate: snapshot.monthlyBurnRate || undefined,
    numberOfCustomers: snapshot.numberOfCustomers || undefined,
    teamSize: snapshot.employeeCount || undefined,
    targetRaise: snapshot.targetRaise || undefined,
    runwayMonths: undefined,
    grossMargin: snapshot.grossMargin || undefined,
    revenueGrowthRate: snapshot.revenueGrowthRate || undefined,
  });

  const STARTER_QUESTIONS = hasProfile
    ? [
        `What's a realistic valuation for a ${snapshot.stage || 'early-stage'} ${snapshot.sector || 'tech'} startup in ${snapshot.country || 'MENA'}?`,
        `Which investors should I target for my ${snapshot.sector || 'startup'} at ${snapshot.stage || 'this stage'}?`,
        `How should I structure my ${snapshot.targetRaise ? `$${(snapshot.targetRaise / 1e6).toFixed(1)}M` : ''} fundraise?`,
        "What are the biggest red flags investors will see in my pitch?",
        "How do I negotiate a term sheet as a first-time founder?",
        "When should I raise vs. bootstrap longer?",
      ]
    : [
        "How do I prepare for my first investor meeting?",
        "What's a realistic pre-seed valuation for a SaaS startup in MENA?",
        "How do I find angel investors in the Gulf region?",
        "What should I include in my pitch deck?",
        "How do I negotiate a term sheet as a first-time founder?",
        "When should I raise a seed round vs. bootstrap longer?",
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const mutation = trpc.ai.fundraisingChat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error('Failed to get response: ' + err.message);
      setIsLoading(false);
    },
  });

  const sendMessage = (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setIsLoading(true);
    mutation.mutate({
      messages: newMessages,
      startupContext: hasProfile ? buildStartupContext() as any : undefined,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ToolGuide
        toolName='AI Fundraising Advisor'
        tagline='Get personalized fundraising advice — context auto-loaded from your Startup Profile.'
        steps={[
          { step: 1, title: 'Profile loaded', description: 'Your company name, stage, sector, and financials are automatically loaded as context.' },
          { step: 2, title: 'Ask your question', description: 'Type any fundraising question — term sheets, investor types, pitch strategy, etc.' },
          { step: 3, title: 'Get tailored advice', description: "AI responds with advice specific to your startup's stage and sector." },
          { step: 4, title: 'Follow up', description: 'Continue the conversation to drill into specific topics.' },
        ]}
        connections={[
          { from: 'Startup Profile', to: 'auto-loads company name, stage, sector, MRR, and burn rate as AI context' },
        ]}
        tip='The more complete your Startup Profile, the more personalized and accurate the advice will be.'
      />

      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ background: 'oklch(0.35 0.2 270)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.45 0.2 270)' }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{t('aiFundraisingTitle')}</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px]" style={{ color: 'oklch(0.75 0.08 270)' }}>
                {hasProfile ? `Personalized for ${snapshot.companyName || 'your startup'}` : 'Expert advisor · Always available'}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Profile context banner */}
      {hasProfile && messages.length === 0 && (
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-green-700 dark:text-green-400">
              <span className="font-semibold">Profile loaded:</span>{' '}
              Advice is personalized for{' '}
              <span className="font-semibold">{snapshot.companyName}</span>
              {snapshot.stage && ` · ${snapshot.stage}`}
              {snapshot.sector && ` · ${snapshot.sector}`}
              {snapshot.country && ` · ${snapshot.country}`}
              {snapshot.targetRaise && ` · raising $${(snapshot.targetRaise / 1e6).toFixed(1)}M`}
            </div>
          </div>
        </div>
      )}

      {/* No profile nudge */}
      {!hasProfile && messages.length === 0 && (
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Tip:</span> Fill in your{' '}
              <span className="font-semibold">Company Profile</span> to get personalized advice based on your sector, stage, metrics, and fundraising target.
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.93 0.05 270)' }}>
              <MessageCircle className="w-7 h-7" style={{ color: 'oklch(0.45 0.2 270)' }} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">
              {hasProfile ? `Ask Me Anything, ${snapshot.companyName || 'Founder'}` : 'Ask Me Anything About Fundraising'}
            </h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              {hasProfile
                ? `I know your startup — ${snapshot.sector || 'your sector'}, ${snapshot.stage || 'your stage'}, your metrics. My advice will be specific to your situation.`
                : 'I have 20+ years of VC experience and know the MENA, US, and European ecosystems. Ask me anything.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary' : ''}`}
              style={msg.role === 'assistant' ? { background: 'oklch(0.45 0.2 270)' } : {}}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-foreground" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm bg-foreground text-background' : 'rounded-tl-sm bg-card border border-border'}`}>
              {msg.role === 'assistant' ? (
                <div className="text-sm text-foreground prose prose-sm max-w-none">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.45 0.2 270)' }}>
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-card">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={hasProfile ? `Ask about fundraising for ${snapshot.companyName || 'your startup'}…` : 'Ask about fundraising, investors, term sheets, pitch decks…'}
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="shrink-0" style={{ background: 'oklch(0.45 0.2 270)', color: 'white' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
