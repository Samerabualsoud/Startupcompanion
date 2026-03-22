import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TrendingUp, Building2, Users, Scale, Rocket, HelpCircle,
  ChevronRight, ChevronLeft, Check, Loader2
} from 'lucide-react';
import { APP_PATH } from '@/const';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  SECTORS, STARTUP_STAGES, FUNDING_STAGES, CHECK_SIZES,
  REGIONS, COUNTRIES, JURISDICTIONS, LEGAL_SPECIALIZATIONS,
  COFOUNDER_ROLES, VESTING_SCHEDULES
} from '@shared/dropdowns';

type UserType = 'startup' | 'vc' | 'angel' | 'venture_lawyer' | 'other';

const USER_TYPES: { id: UserType; icon: React.ElementType; color: string }[] = [
  { id: 'startup', icon: Rocket, color: '#C4614A' },
  { id: 'vc', icon: Building2, color: '#2D4A6B' },
  { id: 'angel', icon: Users, color: '#F59E0B' },
  { id: 'venture_lawyer', icon: Scale, color: '#6366F1' },
  { id: 'other', icon: HelpCircle, color: '#6B7280' },
];

const INVESTMENT_STAGES = [...FUNDING_STAGES];
const LANGS = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Mandarin', 'Hindi', 'Portuguese', 'Turkish', 'Persian'];

// ── Reusable field components ──
function InputField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--primary)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all bg-white"
        style={{ border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: readonly string[]; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--primary)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-full rounded-xl text-sm h-10 bg-white" style={{ border: '1.5px solid var(--border)' }}>
          <SelectValue placeholder={placeholder || 'Select...'} />
        </SelectTrigger>
        <SelectContent className="max-h-64 overflow-y-auto">
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TagSelector({ label, options, selected, onChange, max }: {
  label?: string; options: readonly string[]; selected: string[];
  onChange: (v: string[]) => void; max?: number;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--primary)' }}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              selected.includes(opt)
                ? 'text-white border-transparent'
                : 'border-border text-muted-foreground hover:border-foreground/30 bg-white'
            }`}
            style={selected.includes(opt) ? { background: 'var(--primary)' } : {}}
          >
            {opt}
          </button>
        ))}
      </div>
      {max && selected.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">{selected.length}/{max} selected</p>
      )}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--primary)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none bg-white"
        style={{ border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

// ── VC Profile Form ──
function VCForm({ data, onChange, isRTL }: { data: Record<string, any>; onChange: (k: string, v: any) => void; isRTL: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم الصندوق' : 'Firm Name'} value={data.firmName || ''} onChange={v => onChange('firmName', v)} placeholder="Sequoia Capital" required />
        <InputField label={isRTL ? 'مسمّاك الوظيفي' : 'Your Title'} value={data.title || ''} onChange={v => onChange('title', v)} placeholder="Partner" />
      </div>
      <TextareaField label={isRTL ? 'الوصف' : 'Fund Description'} value={data.description || ''} onChange={v => onChange('description', v)} placeholder={isRTL ? 'صف صندوقك وتركيزه الاستثماري...' : 'Describe your fund and investment thesis...'} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://sequoiacap.com" type="url" />
        <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." type="url" />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'الموقع الجغرافي' : 'Headquarters'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label={isRTL ? 'الدولة' : 'HQ Country'} value={data.hqCountry || ''} onChange={v => onChange('hqCountry', v)} options={COUNTRIES} placeholder={isRTL ? 'اختر الدولة' : 'Select country'} />
          <InputField label={isRTL ? 'المدينة' : 'HQ City'} value={data.hqCity || ''} onChange={v => onChange('hqCity', v)} placeholder="San Francisco" />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'معلومات الاستثمار' : 'Investment Details'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField label={isRTL ? 'الحد الأدنى للشيك' : 'Min Check Size'} value={data.checkSizeMin || ''} onChange={v => onChange('checkSizeMin', v)} options={CHECK_SIZES} placeholder="Min" />
          <SelectField label={isRTL ? 'الحد الأقصى للشيك' : 'Max Check Size'} value={data.checkSizeMax || ''} onChange={v => onChange('checkSizeMax', v)} options={CHECK_SIZES} placeholder="Max" />
          <InputField label={isRTL ? 'الأصول تحت الإدارة ($M)' : 'AUM ($M)'} value={data.aum || ''} onChange={v => onChange('aum', v)} placeholder="500" type="number" />
        </div>
      </div>

      <TagSelector label={isRTL ? 'مراحل الاستثمار' : 'Investment Stages'} options={INVESTMENT_STAGES} selected={data.stages || []} onChange={v => onChange('stages', v)} />
      <TagSelector label={isRTL ? 'القطاعات' : 'Sectors / Verticals'} options={SECTORS} selected={data.sectors || []} onChange={v => onChange('sectors', v)} />
      <TagSelector label={isRTL ? 'المناطق الجغرافية' : 'Regions'} options={REGIONS} selected={data.regions || []} onChange={v => onChange('regions', v)} />

      <InputField label={isRTL ? 'المحفظة البارزة (مفصولة بفاصلة)' : 'Notable Portfolio (comma-separated)'} value={data.notablePortfolio || ''} onChange={v => onChange('notablePortfolio', v)} placeholder="Airbnb, Stripe, DoorDash" />
      <InputField label={isRTL ? 'رابط التقديم' : 'Apply / Contact URL'} value={data.applyUrl || ''} onChange={v => onChange('applyUrl', v)} placeholder="https://..." type="url" />
    </div>
  );
}

// ── Angel Profile Form ──
function AngelForm({ data, onChange, isRTL }: { data: Record<string, any>; onChange: (k: string, v: any) => void; isRTL: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الاسم المعروض' : 'Display Name'} value={data.displayName || ''} onChange={v => onChange('displayName', v)} placeholder="John Smith" required />
        <InputField label={isRTL ? 'المسمى الوظيفي' : 'Title / Background'} value={data.title || ''} onChange={v => onChange('title', v)} placeholder="Ex-Founder, Serial Angel" />
      </div>
      <TextareaField label={isRTL ? 'نبذة شخصية' : 'Bio'} value={data.bio || ''} onChange={v => onChange('bio', v)} placeholder={isRTL ? 'أخبرنا عن خلفيتك ومجالات اهتمامك...' : 'Tell us about your background and investment interests...'} />

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'الموقع والتواصل' : 'Location & Contact'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label={isRTL ? 'الدولة' : 'Country'} value={data.country || ''} onChange={v => onChange('country', v)} options={COUNTRIES} placeholder={isRTL ? 'اختر الدولة' : 'Select country'} />
          <InputField label={isRTL ? 'المدينة' : 'City'} value={data.city || ''} onChange={v => onChange('city', v)} placeholder="Dubai" />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'معلومات الاستثمار' : 'Investment Details'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField label={isRTL ? 'الحد الأدنى للشيك' : 'Min Check Size'} value={data.checkSizeMin || ''} onChange={v => onChange('checkSizeMin', v)} options={CHECK_SIZES} placeholder="Min" />
          <SelectField label={isRTL ? 'الحد الأقصى للشيك' : 'Max Check Size'} value={data.checkSizeMax || ''} onChange={v => onChange('checkSizeMax', v)} options={CHECK_SIZES} placeholder="Max" />
          <InputField label={isRTL ? 'عدد الاستثمارات' : 'Total Investments'} value={data.totalInvestments || ''} onChange={v => onChange('totalInvestments', v)} placeholder="15" type="number" />
        </div>
      </div>

      <TagSelector label={isRTL ? 'مراحل الاستثمار المفضلة' : 'Preferred Stages'} options={INVESTMENT_STAGES} selected={data.stages || []} onChange={v => onChange('stages', v)} />
      <TagSelector label={isRTL ? 'القطاعات المفضلة' : 'Preferred Sectors'} options={SECTORS} selected={data.sectors || []} onChange={v => onChange('sectors', v)} />
      <TagSelector label={isRTL ? 'المناطق' : 'Regions'} options={REGIONS} selected={data.regions || []} onChange={v => onChange('regions', v)} />

      <InputField label={isRTL ? 'الاستثمارات البارزة (مفصولة بفاصلة)' : 'Notable Investments (comma-separated)'} value={data.notableInvestments || ''} onChange={v => onChange('notableInvestments', v)} placeholder="Uber, Figma, Notion" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/in/..." type="url" />
        <InputField label={isRTL ? 'رابط AngelList' : 'AngelList URL'} value={data.angellistUrl || ''} onChange={v => onChange('angellistUrl', v)} placeholder="https://angel.co/u/..." type="url" />
      </div>
    </div>
  );
}

// ── Lawyer Profile Form ──
function LawyerForm({ data, onChange, isRTL }: { data: Record<string, any>; onChange: (k: string, v: any) => void; isRTL: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم المكتب (اختياري)' : 'Firm Name (optional)'} value={data.firmName || ''} onChange={v => onChange('firmName', v)} placeholder="Cooley LLP" />
        <InputField label={isRTL ? 'مسمّاك الوظيفي' : 'Your Title'} value={data.title || ''} onChange={v => onChange('title', v)} placeholder="Partner" />
      </div>
      <TextareaField label={isRTL ? 'نبذة' : 'Bio'} value={data.bio || ''} onChange={v => onChange('bio', v)} placeholder={isRTL ? 'صف خبرتك في العمل مع الشركات الناشئة...' : 'Describe your experience working with startups...'} />

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'الموقع والاختصاص القانوني' : 'Location & Jurisdiction'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label={isRTL ? 'الدولة' : 'Country'} value={data.country || ''} onChange={v => onChange('country', v)} options={COUNTRIES} placeholder={isRTL ? 'اختر الدولة' : 'Select country'} />
          <InputField label={isRTL ? 'المدينة' : 'City'} value={data.city || ''} onChange={v => onChange('city', v)} placeholder="Dubai" />
        </div>
        <div className="mt-4">
          <SelectField label={isRTL ? 'الاختصاص القانوني الرئيسي' : 'Primary Jurisdiction'} value={data.jurisdiction || ''} onChange={v => onChange('jurisdiction', v)} options={JURISDICTIONS} placeholder={isRTL ? 'اختر الاختصاص القانوني' : 'Select jurisdiction'} />
        </div>
      </div>

      <TagSelector label={isRTL ? 'التخصصات القانونية' : 'Legal Specializations'} options={LEGAL_SPECIALIZATIONS} selected={data.specializations || []} onChange={v => onChange('specializations', v)} />
      <TagSelector label={isRTL ? 'المناطق التي تخدمها' : 'Regions Served'} options={REGIONS} selected={data.regions || []} onChange={v => onChange('regions', v)} />
      <TagSelector label={isRTL ? 'اللغات' : 'Languages Spoken'} options={LANGS} selected={data.languages || []} onChange={v => onChange('languages', v)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://cooley.com" type="url" />
        <InputField label={isRTL ? 'البريد الإلكتروني للتواصل' : 'Contact Email'} value={data.contactEmail || ''} onChange={v => onChange('contactEmail', v)} placeholder="john@cooley.com" type="email" />
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <input
          type="checkbox"
          id="freeConsult"
          checked={data.offersFreeConsult || false}
          onChange={e => onChange('offersFreeConsult', e.target.checked)}
          className="w-4 h-4 rounded accent-foreground"
        />
        <label htmlFor="freeConsult" className="text-sm text-muted-foreground cursor-pointer">
          {isRTL ? 'أقدم استشارة أولية مجانية للشركات الناشئة' : 'I offer a free initial consultation for startups'}
        </label>
      </div>
    </div>
  );
}

// ── Startup Profile Form ──
function StartupForm({ data, onChange, isRTL }: { data: Record<string, any>; onChange: (k: string, v: any) => void; isRTL: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم الشركة' : 'Company Name'} value={data.companyName || ''} onChange={v => onChange('companyName', v)} placeholder="Acme Inc." required />
        <InputField label={isRTL ? 'الشعار / الوصف المختصر' : 'Tagline'} value={data.tagline || ''} onChange={v => onChange('tagline', v)} placeholder="One sentence about your startup" />
      </div>
      <TextareaField label={isRTL ? 'الوصف' : 'Description'} value={data.description || ''} onChange={v => onChange('description', v)} placeholder={isRTL ? 'صف ما تبنيه ومن تخدم...' : "Describe what you're building and who you serve..."} />

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'تفاصيل الشركة' : 'Company Details'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField label={isRTL ? 'القطاع / الصناعة' : 'Sector / Vertical'} value={data.sector || ''} onChange={v => onChange('sector', v)} options={SECTORS} placeholder={isRTL ? 'اختر القطاع' : 'Select sector'} required />
          <SelectField label={isRTL ? 'المرحلة' : 'Stage'} value={data.stage || ''} onChange={v => onChange('stage', v)} options={STARTUP_STAGES} placeholder={isRTL ? 'اختر المرحلة' : 'Select stage'} />
          <InputField label={isRTL ? 'سنة التأسيس' : 'Founded Year'} value={data.foundedYear || ''} onChange={v => onChange('foundedYear', v)} placeholder="2024" type="number" />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'الموقع والفريق' : 'Location & Team'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField label={isRTL ? 'الدولة' : 'Country'} value={data.country || ''} onChange={v => onChange('country', v)} options={COUNTRIES} placeholder={isRTL ? 'اختر الدولة' : 'Select country'} />
          <InputField label={isRTL ? 'المدينة' : 'City'} value={data.city || ''} onChange={v => onChange('city', v)} placeholder="Dubai" />
          <InputField label={isRTL ? 'حجم الفريق' : 'Team Size'} value={data.teamSize || ''} onChange={v => onChange('teamSize', v)} placeholder="5" type="number" />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--primary)' }}>
          {isRTL ? 'التمويل والتواصل' : 'Funding & Links'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label={isRTL ? 'التمويل المستهدف' : 'Target Raise'} value={data.targetRaise || ''} onChange={v => onChange('targetRaise', v)} options={CHECK_SIZES} placeholder={isRTL ? 'اختر النطاق' : 'Select range'} />
          <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://acme.io" type="url" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." type="url" />
          <InputField label={isRTL ? 'رابط تويتر / X' : 'Twitter / X URL'} value={data.twitterUrl || ''} onChange={v => onChange('twitterUrl', v)} placeholder="https://twitter.com/..." type="url" />
        </div>
      </div>
    </div>
  );
}

// ── Main Onboarding Component ──
export default function Onboarding() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const onSuccess = async () => {
    await utils.auth.me.invalidate();
    setSubmitted(true);
    setTimeout(() => navigate(APP_PATH), 2000);
  };

  const submitVcKyc = trpc.kyc.submitVcKyc.useMutation({ onSuccess });
  const submitAngelKyc = trpc.kyc.submitAngelKyc.useMutation({ onSuccess });
  const submitLawyerKyc = trpc.kyc.submitLawyerKyc.useMutation({ onSuccess });
  const submitStartupKyc = trpc.kyc.submitStartupKyc.useMutation({ onSuccess });
  const skipKyc = trpc.kyc.skipKyc.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); navigate(APP_PATH); } });

  const isPending = submitVcKyc.isPending || submitAngelKyc.isPending || submitLawyerKyc.isPending || submitStartupKyc.isPending;
  const mutationError = submitVcKyc.error || submitAngelKyc.error || submitLawyerKyc.error || submitStartupKyc.error;

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSkip = () => skipKyc.mutate();

  const handleSubmit = () => {
    if (!userType) return;
    const fd = formData;
    const toNum = (v: any) => v ? Number(v) : undefined;
    if (userType === 'vc') {
      submitVcKyc.mutate({
        firmName: fd.firmName || 'My Fund',
        yourTitle: fd.title,
        description: fd.description,
        website: fd.website || '',
        hqCity: fd.hqCity,
        hqCountry: fd.hqCountry,
        regions: fd.regions || [],
        stages: fd.stages || [],
        sectors: fd.sectors || [],
        checkSizeMin: toNum(fd.checkSizeMin),
        checkSizeMax: toNum(fd.checkSizeMax),
        aum: toNum(fd.aum),
        portfolioCount: toNum(fd.portfolioCount),
        notablePortfolio: fd.notablePortfolio ? fd.notablePortfolio.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        linkedinUrl: fd.linkedinUrl,
        twitterUrl: fd.twitterUrl,
        applyUrl: fd.applyUrl,
        isPublic,
      });
    } else if (userType === 'angel') {
      submitAngelKyc.mutate({
        displayName: fd.displayName || 'Anonymous',
        title: fd.title,
        bio: fd.bio,
        location: fd.city && fd.country ? `${fd.city}, ${fd.country}` : fd.city || fd.country,
        regions: fd.regions || [],
        stages: fd.stages || [],
        sectors: fd.sectors || [],
        checkSizeMin: toNum(fd.checkSizeMin),
        checkSizeMax: toNum(fd.checkSizeMax),
        notableInvestments: fd.notableInvestments ? fd.notableInvestments.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        linkedinUrl: fd.linkedinUrl,
        angellistUrl: fd.angellistUrl,
        isPublic,
      });
    } else if (userType === 'venture_lawyer') {
      submitLawyerKyc.mutate({
        displayName: fd.displayName || fd.firmName || 'Anonymous',
        firmName: fd.firmName,
        title: fd.title,
        bio: fd.bio,
        location: fd.city && fd.country ? `${fd.city}, ${fd.country}` : fd.city || fd.country,
        regions: fd.regions || [],
        specializations: fd.specializations || [],
        languages: fd.languages || [],
        offersFreeConsult: fd.offersFreeConsult || false,
        linkedinUrl: fd.linkedinUrl,
        websiteUrl: fd.website || '',
        contactEmail: fd.contactEmail || '',
        isPublic,
      });
    } else {
      submitStartupKyc.mutate({
        companyName: fd.companyName || 'My Startup',
        tagline: fd.tagline,
        description: fd.description,
        website: fd.website,
        sector: fd.sector,
        stage: fd.stage || 'idea',
        country: fd.country,
        city: fd.city,
        foundedYear: toNum(fd.foundedYear),
        teamSize: toNum(fd.teamSize),
        targetRaise: toNum(fd.targetRaise),
        linkedinUrl: fd.linkedinUrl,
        twitterUrl: fd.twitterUrl,
        isPublic,
      });
    }
  };

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif';

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--primary)' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily, color: 'var(--foreground)' }}>
            {isRTL ? 'تم إرسال ملفك الشخصي!' : 'Profile submitted!'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'أنت الآن مدرج في قاعدة بيانات مجتمعنا. جارٍ التوجيه إلى التطبيق...'
              : "You're now listed in our community database. Redirecting to the app..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily, color: 'var(--foreground)' }}>{t('appName')}</span>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? 'text-white' : 'text-muted-foreground border border-border'
                  }`}
                  style={step >= s ? { background: 'var(--primary)' } : {}}
                >
                  {step > s ? <Check className="w-3 h-3" /> : s}
                </div>
                {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-foreground/30' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step 1: Who are you? */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'var(--foreground)' }}>
                {t('kycTitle')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('kycSubtitle')}</p>
            </div>

            <p className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>{t('iAm')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {USER_TYPES.map(({ id, icon: Icon, color }) => {
                const labelKey = id === 'venture_lawyer' ? 'ventureLawyer' : id;
                const descKey = id === 'vc' ? 'vcDesc2' : id === 'angel' ? 'angelDesc2' : id === 'venture_lawyer' ? 'ventureLawyerDesc' : id === 'startup' ? 'startupDesc' : 'otherDesc';
                return (
                  <button
                    key={id}
                    onClick={() => setUserType(id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      userType === id ? 'border-transparent shadow-md' : 'border-border hover:border-foreground/20 bg-white'
                    }`}
                    style={userType === id ? { background: color + '10', borderColor: color } : {}}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: color + '18' }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {t(labelKey as any)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t(descKey as any)}
                      </div>
                    </div>
                    {userType === id && (
                      <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: color }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('skip')}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!userType}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--primary)' }}
              >
                {t('next')}
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile form */}
        {step === 2 && userType && (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'var(--foreground)' }}>
                {t('kycStep2')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'سيظهر ملفك الشخصي في قاعدة البيانات المجتمعية ليتمكن المؤسسون من اكتشافك.'
                  : 'Your profile will appear in the community database so founders can discover you.'}
              </p>
            </div>

            {mutationError && (
              <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: 'var(--background)', border: '1.5px solid var(--border)', color: 'var(--primary)' }}>
                {mutationError.message}
              </div>
            )}

            <div className="p-6 rounded-2xl border border-border bg-white/60 backdrop-blur-sm mb-5 shadow-sm">
              {userType === 'vc' && <VCForm data={formData} onChange={handleFieldChange} isRTL={isRTL} />}
              {userType === 'angel' && <AngelForm data={formData} onChange={handleFieldChange} isRTL={isRTL} />}
              {userType === 'venture_lawyer' && <LawyerForm data={formData} onChange={handleFieldChange} isRTL={isRTL} />}
              {(userType === 'startup' || userType === 'other') && <StartupForm data={formData} onChange={handleFieldChange} isRTL={isRTL} />}
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border border-border bg-white">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-muted-foreground cursor-pointer flex-1">
                {t('isPublic')}
              </label>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {t('back')}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('skip')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('submitting')}</>
                  ) : t('submit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
