import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TrendingUp, Building2, Users, Scale, Rocket, HelpCircle,
  ChevronRight, ChevronLeft, Check, Loader2, Globe, Linkedin,
  Mail, MapPin, DollarSign
} from 'lucide-react';
import { APP_PATH } from '@/const';

type UserType = 'startup' | 'vc' | 'angel' | 'venture_lawyer' | 'other';

const USER_TYPES: { id: UserType; icon: React.ElementType; color: string }[] = [
  { id: 'startup', icon: Rocket, color: '#C4614A' },
  { id: 'vc', icon: Building2, color: '#2D4A6B' },
  { id: 'angel', icon: Users, color: '#F59E0B' },
  { id: 'venture_lawyer', icon: Scale, color: '#6366F1' },
  { id: 'other', icon: HelpCircle, color: '#6B7280' },
];

const SECTORS = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'AI/ML', 'CleanTech', 'DeepTech', 'Consumer', 'B2B', 'Marketplace', 'Web3', 'Other'];
const STAGES = ['Pre-Idea', 'Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];
const REGIONS = ['North America', 'Europe', 'MENA', 'Africa', 'South Asia', 'Southeast Asia', 'Latin America', 'Global'];

function TagSelector({ options, selected, onChange, max }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selected.includes(opt)
              ? 'text-white'
              : 'border border-border text-muted-foreground hover:border-foreground/30'
          }`}
          style={selected.includes(opt) ? { background: 'oklch(0.18 0.05 240)' } : {}}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
        onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
        onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
      />
    </div>
  );
}

// ── VC Profile Form ──
function VCForm({ data, onChange }: { data: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const { isRTL } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم الصندوق' : 'Firm name'} value={data.firmName || ''} onChange={v => onChange('firmName', v)} placeholder="Sequoia Capital" />
        <InputField label={isRTL ? 'مسمّاك الوظيفي' : 'Your title'} value={data.title || ''} onChange={v => onChange('title', v)} placeholder="Partner" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'الوصف' : 'Description'}</label>
        <textarea
          value={data.description || ''}
          onChange={e => onChange('description', e.target.value)}
          rows={3}
          placeholder={isRTL ? 'صف صندوقك وتركيزه الاستثماري...' : 'Describe your fund and investment focus...'}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
          style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
          onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://sequoiacap.com" type="url" />
        <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." type="url" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'المدينة' : 'HQ city'} value={data.hqCity || ''} onChange={v => onChange('hqCity', v)} placeholder="San Francisco" />
        <InputField label={isRTL ? 'الدولة' : 'HQ country'} value={data.hqCountry || ''} onChange={v => onChange('hqCountry', v)} placeholder="USA" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label={isRTL ? 'الحد الأدنى للشيك ($K)' : 'Min check ($K)'} value={data.checkSizeMin || ''} onChange={v => onChange('checkSizeMin', v)} placeholder="100" type="number" />
        <InputField label={isRTL ? 'الحد الأقصى للشيك ($K)' : 'Max check ($K)'} value={data.checkSizeMax || ''} onChange={v => onChange('checkSizeMax', v)} placeholder="5000" type="number" />
        <InputField label={isRTL ? 'الأصول تحت الإدارة ($M)' : 'AUM ($M)'} value={data.aum || ''} onChange={v => onChange('aum', v)} placeholder="500" type="number" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'مراحل الاستثمار' : 'Investment stages'}</label>
        <TagSelector options={STAGES} selected={data.stages || []} onChange={v => onChange('stages', v)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'القطاعات' : 'Sectors'}</label>
        <TagSelector options={SECTORS} selected={data.sectors || []} onChange={v => onChange('sectors', v)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'المناطق' : 'Regions'}</label>
        <TagSelector options={REGIONS} selected={data.regions || []} onChange={v => onChange('regions', v)} />
      </div>
      <InputField label={isRTL ? 'المحفظة البارزة' : 'Notable portfolio (comma-separated)'} value={data.notablePortfolio || ''} onChange={v => onChange('notablePortfolio', v)} placeholder="Airbnb, Stripe, DoorDash" />
      <InputField label={isRTL ? 'رابط التقديم' : 'Apply / contact URL'} value={data.applyUrl || ''} onChange={v => onChange('applyUrl', v)} placeholder="https://..." type="url" />
    </div>
  );
}

// ── Angel Profile Form ──
function AngelForm({ data, onChange }: { data: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const { isRTL } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الاسم المعروض' : 'Display name'} value={data.displayName || ''} onChange={v => onChange('displayName', v)} placeholder="John Smith" />
        <InputField label={isRTL ? 'الموقع' : 'Location'} value={data.location || ''} onChange={v => onChange('location', v)} placeholder="New York, USA" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'نبذة شخصية' : 'Bio'}</label>
        <textarea
          value={data.bio || ''}
          onChange={e => onChange('bio', e.target.value)}
          rows={3}
          placeholder={isRTL ? 'أخبرنا عن خلفيتك ومجالات اهتمامك...' : 'Tell us about your background and investment interests...'}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
          style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
          onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label={isRTL ? 'الحد الأدنى للشيك ($K)' : 'Min check ($K)'} value={data.checkSizeMin || ''} onChange={v => onChange('checkSizeMin', v)} placeholder="10" type="number" />
        <InputField label={isRTL ? 'الحد الأقصى للشيك ($K)' : 'Max check ($K)'} value={data.checkSizeMax || ''} onChange={v => onChange('checkSizeMax', v)} placeholder="250" type="number" />
        <InputField label={isRTL ? 'عدد الاستثمارات' : 'Total investments'} value={data.totalInvestments || ''} onChange={v => onChange('totalInvestments', v)} placeholder="15" type="number" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'القطاعات المفضلة' : 'Preferred sectors'}</label>
        <TagSelector options={SECTORS} selected={data.sectors || []} onChange={v => onChange('sectors', v)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'المناطق' : 'Regions'}</label>
        <TagSelector options={REGIONS} selected={data.regions || []} onChange={v => onChange('regions', v)} />
      </div>
      <InputField label={isRTL ? 'الاستثمارات البارزة' : 'Notable investments (comma-separated)'} value={data.notableInvestments || ''} onChange={v => onChange('notableInvestments', v)} placeholder="Uber, Figma, Notion" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/in/..." type="url" />
        <InputField label={isRTL ? 'رابط AngelList' : 'AngelList URL'} value={data.angellistUrl || ''} onChange={v => onChange('angellistUrl', v)} placeholder="https://angel.co/u/..." type="url" />
      </div>
    </div>
  );
}

// ── Lawyer Profile Form ──
function LawyerForm({ data, onChange }: { data: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const { isRTL } = useLanguage();
  const SPECS = ['Incorporation', 'Term Sheets', 'Cap Table', 'IP/Patents', 'Employment', 'Fundraising Docs', 'M&A', 'SAFE/Convertible Notes', 'Equity Compensation', 'International'];
  const LANGS = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Mandarin', 'Hindi', 'Portuguese'];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم المكتب (اختياري)' : 'Firm name (optional)'} value={data.firmName || ''} onChange={v => onChange('firmName', v)} placeholder="Cooley LLP" />
        <InputField label={isRTL ? 'مسمّاك الوظيفي' : 'Your title'} value={data.title || ''} onChange={v => onChange('title', v)} placeholder="Partner" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'نبذة' : 'Bio'}</label>
        <textarea
          value={data.bio || ''}
          onChange={e => onChange('bio', e.target.value)}
          rows={3}
          placeholder={isRTL ? 'صف خبرتك في العمل مع الشركات الناشئة...' : 'Describe your experience working with startups...'}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
          style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
          onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'المدينة' : 'City'} value={data.city || ''} onChange={v => onChange('city', v)} placeholder="Dubai" />
        <InputField label={isRTL ? 'الدولة' : 'Country'} value={data.country || ''} onChange={v => onChange('country', v)} placeholder="UAE" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'التخصصات' : 'Specializations'}</label>
        <TagSelector options={SPECS} selected={data.specializations || []} onChange={v => onChange('specializations', v)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'اللغات' : 'Languages spoken'}</label>
        <TagSelector options={LANGS} selected={data.languages || []} onChange={v => onChange('languages', v)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://cooley.com" type="url" />
        <InputField label={isRTL ? 'البريد الإلكتروني للتواصل' : 'Contact email'} value={data.contactEmail || ''} onChange={v => onChange('contactEmail', v)} placeholder="john@cooley.com" type="email" />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="freeConsult"
          checked={data.offersFreeConsult || false}
          onChange={e => onChange('offersFreeConsult', e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="freeConsult" className="text-sm text-muted-foreground cursor-pointer">
          {isRTL ? 'أقدم استشارة أولية مجانية للشركات الناشئة' : 'I offer a free initial consultation for startups'}
        </label>
      </div>
    </div>
  );
}

// ── Startup Profile Form ──
function StartupForm({ data, onChange }: { data: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const { isRTL } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'اسم الشركة' : 'Company name'} value={data.companyName || ''} onChange={v => onChange('companyName', v)} placeholder="Acme Inc." />
        <InputField label={isRTL ? 'الشعار' : 'Tagline'} value={data.tagline || ''} onChange={v => onChange('tagline', v)} placeholder="One sentence about your startup" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'الوصف' : 'Description'}</label>
        <textarea
          value={data.description || ''}
          onChange={e => onChange('description', e.target.value)}
          rows={3}
          placeholder={isRTL ? 'صف ما تبنيه ومن تخدم...' : 'Describe what you\'re building and who you serve...'}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
          style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
          onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'القطاع' : 'Sector'}</label>
          <select
            value={data.sector || ''}
            onChange={e => onChange('sector', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          >
            <option value="">{isRTL ? 'اختر...' : 'Select...'}</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>{isRTL ? 'المرحلة' : 'Stage'}</label>
          <select
            value={data.stage || ''}
            onChange={e => onChange('stage', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
          >
            <option value="">{isRTL ? 'اختر...' : 'Select...'}</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <InputField label={isRTL ? 'سنة التأسيس' : 'Founded year'} value={data.foundedYear || ''} onChange={v => onChange('foundedYear', v)} placeholder="2024" type="number" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label={isRTL ? 'الدولة' : 'Country'} value={data.country || ''} onChange={v => onChange('country', v)} placeholder="UAE" />
        <InputField label={isRTL ? 'المدينة' : 'City'} value={data.city || ''} onChange={v => onChange('city', v)} placeholder="Dubai" />
        <InputField label={isRTL ? 'حجم الفريق' : 'Team size'} value={data.teamSize || ''} onChange={v => onChange('teamSize', v)} placeholder="5" type="number" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'التمويل المستهدف ($K)' : 'Target raise ($K)'} value={data.targetRaise || ''} onChange={v => onChange('targetRaise', v)} placeholder="500" type="number" />
        <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} value={data.website || ''} onChange={v => onChange('website', v)} placeholder="https://acme.io" type="url" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label={isRTL ? 'رابط لينكد إن' : 'LinkedIn URL'} value={data.linkedinUrl || ''} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." type="url" />
        <InputField label={isRTL ? 'رابط تويتر / X' : 'Twitter / X URL'} value={data.twitterUrl || ''} onChange={v => onChange('twitterUrl', v)} placeholder="https://twitter.com/..." type="url" />
      </div>
    </div>
  );
}

// ── Main Onboarding Component ──
export default function Onboarding() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const submitVcKyc = trpc.kyc.submitVcKyc.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); setSubmitted(true); setTimeout(() => navigate(APP_PATH), 2000); } });
  const submitAngelKyc = trpc.kyc.submitAngelKyc.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); setSubmitted(true); setTimeout(() => navigate(APP_PATH), 2000); } });
  const submitLawyerKyc = trpc.kyc.submitLawyerKyc.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); setSubmitted(true); setTimeout(() => navigate(APP_PATH), 2000); } });
  const submitStartupKyc = trpc.kyc.submitStartupKyc.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); setSubmitted(true); setTimeout(() => navigate(APP_PATH), 2000); } });
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
        displayName: fd.displayName || fd.name || 'Anonymous',
        title: fd.title,
        bio: fd.bio,
        location: fd.location,
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
        displayName: fd.displayName || fd.name || 'Anonymous',
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
        stage: 'idea',
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

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif';

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'oklch(0.978 0.008 80)' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'oklch(0.18 0.05 240)' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
            {isRTL ? 'تم إرسال ملفك الشخصي!' : 'Profile submitted!'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'أنت الآن مدرج في قاعدة بيانات مجتمعنا. جارٍ التوجيه إلى التطبيق...'
              : 'You\'re now listed in our community database. Redirecting to the app...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.13 30)' }} />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>{t('appName')}</span>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? 'text-white' : 'text-muted-foreground border border-border'
                  }`}
                  style={step >= s ? { background: 'oklch(0.18 0.05 240)' } : {}}
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
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
                {t('kycTitle')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('kycSubtitle')}</p>
            </div>

            <p className="text-sm font-medium mb-4" style={{ color: 'oklch(0.3 0.04 240)' }}>{t('iAm')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {USER_TYPES.map(({ id, icon: Icon, color }) => {
                const labelKey = id === 'venture_lawyer' ? 'ventureLawyer' : id;
                const descKey = id === 'vc' ? 'vcDesc2' : id === 'angel' ? 'angelDesc2' : id === 'venture_lawyer' ? 'ventureLawyerDesc' : id === 'startup' ? 'startupDesc' : 'otherDesc';
                return (
                  <button
                    key={id}
                    onClick={() => setUserType(id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      userType === id ? 'border-transparent shadow-md' : 'border-border hover:border-foreground/20'
                    }`}
                    style={userType === id ? { background: color + '10', borderColor: color } : {}}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: color + '18' }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'oklch(0.18 0.05 240)' }}>
                        {t(labelKey as any)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t(descKey as any)}
                      </div>
                    </div>
                    {userType === id && (
                      <div className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
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
                style={{ background: 'oklch(0.18 0.05 240)' }}
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
                {t('kycStep2')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'سيظهر ملفك الشخصي في قاعدة البيانات المجتمعية ليتمكن المؤسسون من اكتشافك.'
                  : 'Your profile will appear in the community database so founders can discover you.'}
              </p>
            </div>

            {/* Error */}
            {mutationError && (
              <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: 'oklch(0.97 0.02 30)', border: '1px solid oklch(0.85 0.06 30)', color: 'oklch(0.45 0.12 30)' }}>
                {mutationError.message}
              </div>
            )}

            <div className="p-6 rounded-2xl border border-border bg-white mb-6">
              {userType === 'vc' && <VCForm data={formData} onChange={handleFieldChange} />}
              {userType === 'angel' && <AngelForm data={formData} onChange={handleFieldChange} />}
              {userType === 'venture_lawyer' && <LawyerForm data={formData} onChange={handleFieldChange} />}
              {(userType === 'startup' || userType === 'other') && <StartupForm data={formData} onChange={handleFieldChange} />}
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
                  style={{ background: 'oklch(0.18 0.05 240)' }}
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
