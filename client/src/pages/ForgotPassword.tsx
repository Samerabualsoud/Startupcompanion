import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { LOGIN_PATH } from '@/const';

export default function ForgotPassword() {
  const { isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Playfair Display, serif';

  const requestReset = trpc.passwordReset.requestReset.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError(isRTL ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email address');
      return;
    }
    requestReset.mutate({ email, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'oklch(0.978 0.008 80)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
          </div>
          <span className="font-bold text-lg" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
            {isRTL ? 'أداة الشركات الناشئة' : 'AI Startup Toolkit'}
          </span>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'oklch(0.94 0.05 145)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'oklch(0.5 0.15 145)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
              {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {isRTL
                ? `إذا كان هناك حساب مرتبط بـ ${email}، فستتلقى رابط إعادة تعيين كلمة المرور خلال دقائق قليلة.`
                : `If an account exists for ${email}, you'll receive a password reset link within a few minutes.`}
            </p>
            <Link href={LOGIN_PATH} className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: 'oklch(0.55 0.13 30)' }}>
              <ArrowLeft className="w-4 h-4" />
              {isRTL ? 'العودة إلى تسجيل الدخول' : 'Back to Sign In'}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'oklch(0.18 0.05 240)' }}>
                {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.'
                  : "Enter your email and we'll send you a reset link."}
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
                  {isRTL ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
                    onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
                    onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={requestReset.isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'oklch(0.18 0.05 240)' }}
              >
                {requestReset.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {isRTL ? 'جارٍ الإرسال...' : 'Sending…'}</>
                ) : (isRTL ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href={LOGIN_PATH} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {isRTL ? 'العودة إلى تسجيل الدخول' : 'Back to Sign In'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
