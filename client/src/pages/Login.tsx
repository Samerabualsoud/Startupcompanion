import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { TrendingUp, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { APP_PATH, REGISTER_PATH } from '@/const';

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || APP_PATH;
      navigate(next);
    },
    onError: (err) => {
      setError(err.message || t('invalidCredentials'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif';

  return (
    <div className="min-h-screen flex" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
        style={{ background: 'oklch(0.35 0.2 270)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.45 0.2 270)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily }}>
            {t('appName')}
          </span>
        </div>

        <div>
          <blockquote className="text-2xl font-medium leading-relaxed mb-6" style={{ color: 'oklch(0.88 0.03 80)', fontFamily }}>
            {isRTL
              ? '"أفضل وقت لتقييم شركتك الناشئة هو قبل أن تحتاج إلى ذلك."'
              : '"The best time to value your startup is before you need to."'}
          </blockquote>
          <div className="space-y-4">
            {[
              { num: '13+', label: isRTL ? 'أداة للشركات الناشئة في مكان واحد' : 'Startup tools in one place' },
              { num: '7', label: isRTL ? 'طرق تقييم' : 'Valuation methods' },
              { num: '100+', label: isRTL ? 'مستثمرون ومسرّعات أعمال' : 'Investors & accelerators' },
            ].map(item => (
              <div key={item.num} className="flex items-center gap-4">
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.65 0.13 30)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.num}
                </div>
                <div className="text-sm" style={{ color: 'oklch(0.55 0.03 240)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'oklch(0.4 0.03 240)' }}>
          © {new Date().getFullYear()} Polaris Arabia. {t('footerDisclaimer')}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo + language switcher */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.35 0.2 270)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.45 0.2 270)' }} />
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
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'oklch(0.35 0.2 270)' }}>
              {t('signInTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('signInSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm" style={{ background: 'oklch(0.97 0.02 30)', border: '1px solid oklch(0.85 0.06 30)', color: 'oklch(0.45 0.12 30)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>
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
                style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
                onFocus={e => e.target.style.borderColor = 'oklch(0.45 0.2 270)'}
                onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: 'oklch(0.3 0.04 240)' }}>
                  {t('passwordLabel')}
                </label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'oklch(0.45 0.2 270)' }}>
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-11"
                  style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
                  onFocus={e => e.target.style.borderColor = 'oklch(0.45 0.2 270)'}
                  onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'oklch(0.35 0.2 270)' }}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('signingIn')}</>
              ) : t('signInBtn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={REGISTER_PATH} className="font-semibold hover:underline" style={{ color: 'oklch(0.45 0.2 270)' }}>
              {t('registerLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
