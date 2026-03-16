/**
 * AI Fundraising Advisor Chat
 * Persistent chat with an expert fundraising advisor
 */

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Loader2, Trash2, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Streamdown } from 'streamdown';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTORS, STARTUP_STAGES, COUNTRIES } from '@shared/dropdowns';

type Message = { role: 'user' | 'assistant'; content: string };

const STARTER_QUESTIONS = [
  "How do I prepare for my first investor meeting?",
  "What's a realistic pre-seed valuation for a SaaS startup in MENA?",
  "How do I find angel investors in the Gulf region?",
  "What should I include in my pitch deck?",
  "How do I negotiate a term sheet as a first-time founder?",
  "When should I raise a seed round vs. bootstrap longer?",
];

export default function AIFundraisingAdvisor() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [startupContext, setStartupContext] = useState({ name: '', sector: '', stage: '', country: '' });
  const [showContext, setShowContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setIsLoading(true);
    setShowContext(false);
    mutation.mutate({
      messages: newMessages,
      startupContext: startupContext.name || startupContext.sector ? startupContext : undefined,
    });
  };

  const clearChat = () => {
    setMessages([]);
    setShowContext(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ background: 'oklch(0.18 0.05 240)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.55 0.13 30)' }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{t('aiFundraisingTitle')}</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px]" style={{ color: 'oklch(0.62 0.02 240)' }}>Expert advisor · Always available</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Context bar (shown when no messages) */}
      <AnimatePresence>
        {showContext && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Optional: Tell me about your startup for personalized advice</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input value={startupContext.name} onChange={e => setStartupContext(c => ({ ...c, name: e.target.value }))} placeholder="Company name" className="text-xs h-7" />
                <Select value={startupContext.sector} onValueChange={v => setStartupContext(c => ({ ...c, sector: v }))}>
                  <SelectTrigger className="text-xs h-7"><SelectValue placeholder="Sector…" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {SECTORS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={startupContext.stage} onValueChange={v => setStartupContext(c => ({ ...c, stage: v }))}>
                  <SelectTrigger className="text-xs h-7"><SelectValue placeholder="Stage…" /></SelectTrigger>
                  <SelectContent>
                    {STARTUP_STAGES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={startupContext.country} onValueChange={v => setStartupContext(c => ({ ...c, country: v }))}>
                  <SelectTrigger className="text-xs h-7"><SelectValue placeholder="Country…" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <MessageCircle className="w-7 h-7" style={{ color: 'oklch(0.55 0.13 30)' }} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ask Me Anything About Fundraising
            </h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              I have 20+ years of VC experience and know the MENA, US, and European ecosystems. Ask me anything.
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
              style={msg.role === 'assistant' ? { background: 'oklch(0.55 0.13 30)' } : {}}>
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
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.55 0.13 30)' }}>
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
            placeholder="Ask about fundraising, investors, term sheets, pitch decks…"
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="shrink-0" style={{ background: 'oklch(0.18 0.05 240)', color: 'white' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
