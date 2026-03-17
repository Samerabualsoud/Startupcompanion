/**
 * ChatInterface — Conversational input flow for the valuation calculator
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Guides users through plain-English questions, then triggers full valuation
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronRight, RotateCcw, Check, Sparkles, Wand2, Info, Pencil, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { CHAT_QUESTIONS, CHAT_QUESTIONS_AR, formatAnswer, type ChatQuestion } from '@/lib/chatFlow';
import { nanoid } from 'nanoid';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  isTyping?: boolean;
}

interface Props {
  onComplete: (answers: Record<string, any>) => void;
}

// ─── Typing animation component ───────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-current opacity-60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── Input widgets ─────────────────────────────────────────────────────────────

function CurrencyInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const [val, setVal] = useState(q.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    const n = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
    onSubmit(n);
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">$</span>
        <input
          ref={inputRef}
          type="number"
          value={val}
          min={q.min ?? 0}
          step={q.step ?? 1000}
          placeholder={q.placeholder}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="chat-input w-full pl-7 pr-3 py-2.5 text-sm font-mono"
        />
      </div>
      <button onClick={handleSubmit} className="chat-send-btn">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function PercentInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const [val, setVal] = useState(q.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => onSubmit(parseFloat(String(val)) || 0);

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="number"
          value={val}
          min={q.min ?? 0}
          max={q.max ?? 100}
          step={q.step ?? 5}
          placeholder={q.placeholder}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="chat-input w-full px-3 py-2.5 text-sm font-mono pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">%</span>
      </div>
      <button onClick={handleSubmit} className="chat-send-btn">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function TextInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const [val, setVal] = useState(q.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => { if (String(val).trim()) onSubmit(String(val).trim()); };

  return (
    <div className="flex gap-2 items-center">
      <input
        ref={inputRef}
        type="text"
        value={val}
        placeholder={q.placeholder}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="chat-input flex-1 px-3 py-2.5 text-sm"
      />
      <button onClick={handleSubmit} className="chat-send-btn">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function SelectInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const groups = q.options?.reduce((acc, o) => {
    const g = o.group || 'Options';
    if (!acc[g]) acc[g] = [];
    acc[g].push(o);
    return acc;
  }, {} as Record<string, typeof q.options>) ?? {};

  const hasGroups = Object.keys(groups).length > 1;

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {hasGroups
        ? Object.entries(groups).map(([group, opts]) => (
            <div key={group}>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 py-1">{group}</div>
              {opts?.map(o => (
                <button key={o.value} onClick={() => onSubmit(o.value)}
                  className="w-full text-left text-sm px-3 py-2 rounded-md border border-border bg-card hover:bg-accent hover:text-white hover:border-accent transition-all flex items-center justify-between group mb-1">
                  <span>{o.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ))
        : q.options?.map(o => (
            <button key={o.value} onClick={() => onSubmit(o.value)}
              className="w-full text-left text-sm px-3 py-2 rounded-md border border-border bg-card hover:bg-accent hover:text-white hover:border-accent transition-all flex items-center justify-between group">
              <span>{o.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))
      }
    </div>
  );
}

function SliderInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const [val, setVal] = useState<number>(q.defaultValue ?? 50);
  const labels = ['Very Weak', 'Weak', 'Below Average', 'Average', 'Above Average', 'Strong', 'Very Strong', 'Excellent', 'Outstanding', 'World-Class', 'Exceptional'];
  const labelIdx = Math.round((val / 100) * (labels.length - 1));
  const color = val >= 70 ? '#10B981' : val >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Weak</span>
        <div className="text-center">
          <span className="text-2xl font-bold metric-value" style={{ color }}>{val}</span>
          <span className="text-xs text-muted-foreground ml-1">/100</span>
          <div className="text-xs font-medium mt-0.5" style={{ color }}>{labels[labelIdx]}</div>
        </div>
        <span className="text-xs text-muted-foreground">Exceptional</span>
      </div>
      <Slider min={0} max={100} step={5} value={[val]} onValueChange={([v]) => setVal(v)} className="w-full" />
      <button onClick={() => onSubmit(val)} className="w-full chat-send-btn justify-center gap-2">
        <Check className="w-4 h-4" />
        Confirm {val}/100
      </button>
    </div>
  );
}

function MultiSelectInput({ q, onSubmit }: { q: ChatQuestion; onSubmit: (v: any) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (val: string) => setSelected(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
  );

  return (
    <div className="space-y-2">
      {q.options?.map(o => (
        <button key={o.value} onClick={() => toggle(o.value)}
          className={`w-full text-left text-sm px-3 py-2.5 rounded-md border transition-all flex items-center gap-3 ${selected.includes(o.value) ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-card hover:border-accent/50'}`}>
          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${selected.includes(o.value) ? 'bg-accent border-accent' : 'border-border'}`}>
            {selected.includes(o.value) && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          {o.label}
        </button>
      ))}
      <button onClick={() => onSubmit(selected)} className="w-full chat-send-btn justify-center gap-2 mt-2">
        <Check className="w-4 h-4" />
        {selected.length === 0 ? 'None of these yet' : `Confirm ${selected.length} selected`}
      </button>
    </div>
  );
}

function QuestionInput({ question, onSubmit }: { question: ChatQuestion; onSubmit: (v: any) => void }) {
  switch (question.type) {
    case 'text': return <TextInput q={question} onSubmit={onSubmit} />;
    case 'currency': return <CurrencyInput q={question} onSubmit={onSubmit} />;
    case 'percent': return <PercentInput q={question} onSubmit={onSubmit} />;
    case 'select': return <SelectInput q={question} onSubmit={onSubmit} />;
    case 'slider': return <SliderInput q={question} onSubmit={onSubmit} />;
    case 'multiselect': return <MultiSelectInput q={question} onSubmit={onSubmit} />;
    default: return <TextInput q={question} onSubmit={onSubmit} />;
  }
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="px-4 py-2 border-b border-border bg-card">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
        <span className="font-mono">Question {current} of {total}</span>
        <span className="font-mono">{pct}% complete</span>
      </div>
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'oklch(0.55 0.13 30)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Main Chat Interface ───────────────────────────────────────────────────────

export default function ChatInterface({ onComplete }: Props) {
  const { isAuthenticated } = useAuth();
  const { data: profileData } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInferring, setIsInferring] = useState(false);
  const [aiInferredFields, setAiInferredFields] = useState<string[]>([]);

  const fillMissing = trpc.inference.fillMissing.useMutation();

  // Pre-populate answers from startup profile if available
  const p = profileData && 'name' in profileData ? profileData : (profileData as any)?.profile ?? null;
  const profileDefaults = p ? {
    companyName: p.name ?? undefined,
    sector: p.sector ?? undefined,
    stage: p.stage ?? undefined,
    currentARR: p.annualRevenue ? Number(p.annualRevenue) : undefined,
    monthlyBurnRate: p.monthlyBurn ? Number(p.monthlyBurn) : undefined,
    cashOnHand: p.cashOnHand ? Number(p.cashOnHand) : undefined,
    teamSize: p.teamSize ?? undefined,
    country: p.country ?? undefined,
  } : {};

  const [answers, setAnswers] = useState<Record<string, any>>(profileDefaults);
  const [currentQIndex, setCurrentQIndex] = useState(-1); // -1 = intro
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAnsweredPanel, setShowAnsweredPanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addBotMessage = useCallback((text: string, delay = 600) => {
    return new Promise<void>(resolve => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: nanoid(), role: 'bot', text }]);
        scrollToBottom();
        resolve();
      }, delay);
    });
  }, []);

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: nanoid(), role: 'user', text }]);
    scrollToBottom();
  };

  const { isRTL } = useLanguage();
  const questions = isRTL ? CHAT_QUESTIONS_AR : CHAT_QUESTIONS;

  // Start the conversation
  useEffect(() => {
  const start = async () => {
      if (isRTL) {
        await addBotMessage('👋 مرحباً! أنا مساعد تقييم شركتك الناشئة.', 400);
        await addBotMessage('سأطرح عليك بعض الأسئلة البسيطة عن شركتك — لا تحتاج إلى خبرة مالية. في النهاية، سأجري تقييماً احترافياً كاملاً باستخدام 7 طرق معيارية في الصناعة.', 1000);
        await addBotMessage('مستعد؟ لنبدأ بالأساسيات. سيستغرق هذا حوالي دقيقتين. 🚀', 800);
      } else {
        await addBotMessage("👋 Hey! I'm your startup valuation assistant.", 400);
        await addBotMessage("I'll ask you a few simple questions about your startup — no finance degree needed. At the end, I'll run a full professional valuation using 7 industry-standard methods.", 1000);
        await addBotMessage("Ready? Let's start with the basics. This will take about 2 minutes. 🚀", 800);
      }
      setCurrentQIndex(0);
    };
    start();
  }, [isRTL]);

  // Ask the current question
  useEffect(() => {
    if (currentQIndex < 0 || currentQIndex >= questions.length) return;
    const q = questions[currentQIndex];
    const ask = async () => {
      const emoji = q.emoji ? `${q.emoji} ` : '';
      await addBotMessage(`${emoji}${q.text}`, 500);
      if (q.subtext) {
        await addBotMessage(`💬 *${q.subtext}*`, 400);
      }
    };
    ask();
  }, [currentQIndex]);

  const handleSkipWithAI = useCallback(async () => {
    const q = questions[currentQIndex];
    setIsInferring(true);
    addUserMessage(isRTL ? 'لست متأكداً — هل يمكنك تقدير هذا لي؟' : "I'm not sure — can you estimate this for me?");
    await addBotMessage(isRTL ? 'بالتأكيد! دعني أقدّر ذلك بناءً على قطاعك ومرحلتك... 🤖' : "Sure! Let me estimate that based on your sector and stage... 🤖", 500);

    try {
      const result = await fillMissing.mutateAsync({
        knownData: answers,
        missingFields: [q.id],
      });

      const estimatedValue = result[q.id];
      const reasoning = result.reasoning;

      if (estimatedValue !== undefined && estimatedValue !== null) {
        const displayText = formatAnswer(q, estimatedValue);
        const newAnswers = { ...answers, [q.id]: estimatedValue };
        setAnswers(newAnswers);
        setAiInferredFields(prev => [...prev, q.id]);

        await addBotMessage(isRTL ? `قدّرت **${displayText}** لك. ${reasoning ? `\n\n*${reasoning}*` : ''}` : `I estimated **${displayText}** for you. ${reasoning ? `\n\n*${reasoning}*` : ''}`, 400);
        await addBotMessage(isRTL ? 'يمكنك دائماً العودة وتعديل هذا. نكمل المسير! 👍' : "You can always come back and adjust this. Moving on! 👍", 500);

        const nextIndex = currentQIndex + 1;
        if (nextIndex >= questions.length) {
          await addBotMessage(isRTL ? '✅ ℹفضل! لديّ كل ما أحتاجه. 🎉' : "Perfect! I have everything I need. 🎉", 600);
          await addBotMessage(isRTL ? 'جاري تشغيل تقييمك الآن — باستخدام DCF وبطاقة الأداء وبيركوس وطريقة رأس المال المخاطر والمعاملات المماثلة وجمع عوامل المخاطرة وطريقة شيكاغو الأولى...' : "Running your valuation now — using DCF, Scorecard, Berkus, VC Method, Comparables, Risk-Factor Summation, and First Chicago methods...", 800);
          await addBotMessage(isRTL ? '✅ تم! تقرير التقييم الكامل جاهز أدناه.' : "✅ Done! Your full valuation report is ready below.", 1200);
          setIsComplete(true);
          setTimeout(() => onComplete(newAnswers), 600);
        } else {
          setCurrentQIndex(nextIndex);
        }
      } else {
        await addBotMessage(isRTL ? 'لم أتمكن من تقدير هذا بشكل موثوق. هل يمكنك إعطائي رقماً تقريبياً؟ حتى التخمين مقبول! 😊' : "I couldn't estimate that one reliably. Could you give me a rough number? Even a guess is fine! 😊", 400);
      }
    } catch {
      await addBotMessage(isRTL ? 'حدثت مشكلة في التقدير. هل يمكنك إعطائي رقماً تقريبياً؟ 😊' : "Hmm, I had trouble estimating that. Could you give me a rough number? 😊", 400);
    } finally {
      setIsInferring(false);
    }
  }, [currentQIndex, answers, fillMissing, onComplete]);

  const handleAnswer = useCallback(async (value: any) => {
    const q = questions[currentQIndex];

    // Format the answer for display
    const displayText = formatAnswer(q, value);

    // Record answer
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    // Show user message
    addUserMessage(displayText);

    // Advance
    const nextIndex = currentQIndex + 1;

    if (nextIndex >= questions.length) {
      // Done!
      await addBotMessage(isRTL ? '✅ ℹفضل! لديّ كل ما أحتاجه. 🎉' : "Perfect! I have everything I need. 🎉", 600);
      await addBotMessage(isRTL ? 'جاري تشغيل تقييمك الآن — باستخدام DCF وبطاقة الأداء وبيركوس وطريقة رأس المال المخاطر والمعاملات المماثلة وجمع عوامل المخاطرة وطريقة شيكاغو الأولى...' : "Running your valuation now — using DCF, Scorecard, Berkus, VC Method, Comparables, Risk-Factor Summation, and First Chicago methods...", 800);
      await addBotMessage(isRTL ? '✅ تم! تقرير التقييم الكامل جاهز أدناه.' : "✅ Done! Your full valuation report is ready below.", 1200);
      setIsComplete(true);
      setTimeout(() => onComplete(newAnswers), 600);
    } else {
      setCurrentQIndex(nextIndex);
    }
  }, [currentQIndex, answers, onComplete]);

  // Go back to a specific question to edit the answer
  const handleEditAnswer = useCallback((qIndex: number) => {
    setCurrentQIndex(qIndex);
    setIsComplete(false);
    setShowAnsweredPanel(false);
    // Trim messages back to before that question was asked
    // We keep all messages up to (but not including) the bot message for that question
    // A simple approach: just add a bot message indicating we're going back
    setMessages(prev => [
      ...prev,
      { id: nanoid(), role: 'bot', text: isRTL ? `🔄 حسناً، لنعدّل إجابتك على هذا السؤال.` : `🔄 Sure, let's update your answer to that question.` }
    ]);
    scrollToBottom();
  }, [isRTL]);

  const handleReset = () => {
    setMessages([]);
    setAnswers({});
    setCurrentQIndex(-1);
    setIsComplete(false);
    setTimeout(() => {
      const start = async () => {
        await addBotMessage(isRTL ? '👋 لنبدأ من جديد!' : "👋 Let's start over!", 400);
        await addBotMessage(isRTL ? 'سأطرح عليك نفس الأسئلة مرة أخرى. مستعد؟ 🚀' : "I'll ask you the same questions again. Ready? 🚀", 600);
        setCurrentQIndex(0);
      };
      start();
    }, 100);
  };

  const currentQ = currentQIndex >= 0 && currentQIndex < questions.length
    ? questions[currentQIndex]
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      {currentQIndex >= 0 && !isComplete && (
        <ProgressBar current={currentQIndex + 1} total={questions.length} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-full shrink-0 mr-2 flex items-center justify-center text-xs" style={{ background: 'oklch(0.18 0.05 240)', color: 'oklch(0.978 0.008 80)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.13 30)' }} />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm text-white font-medium'
                    : 'rounded-bl-sm border border-border bg-card text-foreground'
                }`}
                style={msg.role === 'user' ? { background: 'oklch(0.55 0.13 30)' } : {}}
              >
                {msg.text.startsWith('💬 *') && msg.text.endsWith('*')
                  ? <span className="text-muted-foreground text-xs italic">{msg.text.slice(4, -1)}</span>
                  : msg.text
                }
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="w-7 h-7 rounded-full shrink-0 mr-2 flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.13 30)' }} />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm border border-border bg-card">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {!isComplete && currentQ && !isTyping && !isInferring && (
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border p-4 bg-card space-y-2"
        >
          <QuestionInput question={currentQ} onSubmit={handleAnswer} />
          {/* AI estimate button for numeric/financial questions */}
          {['currency', 'percent', 'slider', 'number'].includes(currentQ.type) && (
            <button
              onClick={handleSkipWithAI}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-xs font-medium transition-all hover:bg-secondary/50"
              style={{ borderColor: 'oklch(0.55 0.13 30)', color: 'oklch(0.55 0.13 30)' }}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isRTL ? 'لا أعرف — دع الذكاء الاصطناعي يقدّر هذا لي' : "I don't know — let AI estimate this for me"}
            </button>
          )}
        </motion.div>
      )}

      {/* AI inferring indicator */}
      {isInferring && (
        <div className="border-t border-border p-4 bg-card flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'oklch(0.55 0.13 30)', borderTopColor: 'transparent' }} />
          {isRTL ? 'الذكاء الاصطناعي يقدّر قيمة لك...' : 'AI is estimating a value for you...'}
        </div>
      )}

      {/* AI inferred fields notice */}
      {aiInferredFields.length > 0 && !isComplete && (
        <div className="px-4 py-2 flex items-start gap-2 text-[10px] text-muted-foreground" style={{ background: 'oklch(0.55 0.13 30)10' }}>
          <Info className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'oklch(0.55 0.13 30)' }} />
          <span>{isRTL ? `تم تقدير ${aiInferredFields.length} قيمة بواسطة الذكاء الاصطناعي. يمكنك إعادة المحادثة لتعديلها.` : `${aiInferredFields.length} value${aiInferredFields.length > 1 ? 's were' : ' was'} estimated by AI. You can retake the chat to adjust them.`}</span>
        </div>
      )}

      {/* Answered Questions Panel */}
      {currentQIndex > 0 && !isComplete && (
        <div className="border-t border-border bg-card">
          <button
            onClick={() => setShowAnsweredPanel(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Pencil className="w-3 h-3" />
              {isRTL ? `تعديل إجابة سابقة (${currentQIndex} تمت)` : `Edit a previous answer (${currentQIndex} answered)`}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAnsweredPanel ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showAnsweredPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {questions.slice(0, currentQIndex).map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => handleEditAnswer(idx)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border border-border bg-secondary/50 hover:bg-secondary hover:border-accent transition-all"
                      title={isRTL ? 'انقر للتعديل' : 'Click to edit'}
                    >
                      <span className="text-muted-foreground">{q.emoji ?? '•'}</span>
                      <span className="max-w-[120px] truncate">{formatAnswer(q, answers[q.id])}</span>
                      <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Reset */}
      {(isComplete || currentQIndex > 0) && (
        <div className="border-t border-border px-4 py-2 flex justify-end">
          <button onClick={handleReset} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-accent transition-colors">
            <RotateCcw className="w-3 h-3" />
            {isRTL ? 'ابدأ من جديد' : 'Start over'}
          </button>
        </div>
      )}
    </div>
  );
}
