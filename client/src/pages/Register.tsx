import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { TrendingUp, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LOGIN_PATH } from '@/const';

const KYC_PATH = '/onboarding';

function PasswordStrength({ password, isRTL }: { password: string; isRTL: boolean }) {
  const checks = [
    { label: isRTL ? '٨ أحرف على الأقل' : 'At least 8 characters', ok: password.length >= 8 },
    { label: isRTL ? 'يحتوي على رقم' : 'Contains a number', ok: /\d/.test(password) },
    { label: isRTL ? 'يحتوي على حرف' : 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className={`w-3.5 h-3.5 ${c.ok ? 'text-green-500' : 'text-muted-foreground/40'}`} />
          <span className={c.ok ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      // Redirect to KYC onboarding after registration
      navigate(KYC_PATH);
    },
    onError: (err) => {
      setError(err.message || (isRTL ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError(isRTL ? 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif';

  const FEATURES = isRTL ? [
    'حاسبة تقييم بـ ٧ طرق',
    'أداة تقسيم أسهم المؤسسين',
    'نقاط الاستعداد للتمويل',
    'إدارة علاقات المستثمرين وتتبع خط الأنابيب',
    'قاعدة بيانات رأس المال المخاطر والملائكيين والمنح',
    'فحص جدوى الأفكار بالذكاء الاصطناعي',
  ] : [
    '7-method valuation calculator',
    'Co-founder equity split tool',
    'Fundraising readiness score',
    'Investor CRM & pipeline tracker',
    'VC, angel & grants database',
    'AI-powered idea feasibility check',
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
        style={{ background: 'var(--primary)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily }}>
            {t('appName')}
          </span>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily }}>
            {isRTL
              ? 'كل ما تحتاجه لبناء شركتك الناشئة وتمويلها وتنميتها.'
              : 'Everything you need to build, fund, and grow your startup.'}
          </h2>
          <div className="space-y-3">
            {FEATURES.map(feat => (
              <div key={feat} className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--secondary)' }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'مجاني للأبد · لا يلزم بطاقة ائتمان' : 'Free forever · No credit card required'}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo + language switcher */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <span className="font-bold" style={{ fontFamily }}>{t('appName')}</span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Desktop language switcher */}
          <div className="hidden lg:flex justify-end mb-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'var(--foreground)' }}>
              {t('registerTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'مجاني للأبد. لا يلزم بطاقة ائتمان.' : 'Free forever. No credit card required.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm" style={{ background: 'var(--background)', border: '1.5px solid var(--border)', color: 'var(--primary)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                {t('nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isRTL ? 'محمد أحمد' : 'Jane Smith'}
                autoComplete="name"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                {t('emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isRTL ? 'الحد الأدنى ٨ أحرف' : 'Min. 8 characters'}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-11"
                  style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} isRTL={isRTL} />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isRTL ? 'جارٍ إنشاء الحساب...' : 'Creating account…'}</>
              ) : t('createAccount')}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              {isRTL
                ? 'بإنشاء حساب، أنت توافق على '
                : 'By creating an account you agree to our '}
              <span className="underline cursor-pointer">{isRTL ? 'شروط الخدمة' : 'Terms of Service'}</span>
              {isRTL ? ' و' : ' and '}
              <span className="underline cursor-pointer">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href={LOGIN_PATH} className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              {t('signInLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
