import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { LOGIN_PATH } from '@/const';

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { isRTL } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fontFamily = isRTL ? 'Noto Kufi Arabic, sans-serif' : 'Plus Jakarta Sans, sans-serif';

  // Extract token from URL
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

  const { data: tokenCheck, isLoading: checkingToken } = trpc.passwordReset.verifyToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const resetPassword = trpc.passwordReset.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate(LOGIN_PATH), 3000);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(isRTL ? 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    resetPassword.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily }}>
            {isRTL ? 'رابط غير صالح' : 'Invalid Reset Link'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {isRTL ? 'هذا الرابط غير صالح أو منتهي الصلاحية.' : 'This reset link is invalid or has expired.'}
          </p>
          <Link href="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
            {isRTL ? 'طلب رابط جديد' : 'Request a new link'}
          </Link>
        </div>
      </div>
    );
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenCheck && !tokenCheck.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily }}>
            {isRTL ? 'الرابط منتهي الصلاحية' : 'Link Expired'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {tokenCheck.reason ?? (isRTL ? 'انتهت صلاحية هذا الرابط.' : 'This link has expired.')}
          </p>
          <Link href="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
            {isRTL ? 'طلب رابط جديد' : 'Request a new link'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </div>
          <span className="font-bold text-lg" style={{ fontFamily, color: 'var(--foreground)' }}>
            {isRTL ? 'أداة الشركات الناشئة' : 'Polaris Arabia'}
          </span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--background)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily, color: 'var(--foreground)' }}>
              {isRTL ? 'تم تغيير كلمة المرور!' : 'Password Changed!'}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">
              {isRTL ? 'تم تحديث كلمة مرورك بنجاح.' : 'Your password has been updated successfully.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'جارٍ تحويلك إلى صفحة تسجيل الدخول...' : 'Redirecting you to sign in…'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily, color: 'var(--foreground)' }}>
                {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'أدخل كلمة مرور جديدة لحسابك.' : 'Enter a new password for your account.'}
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
                  {isRTL ? 'كلمة المرور الجديدة' : 'New password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isRTL ? 'الحد الأدنى ٨ أحرف' : 'Min. 8 characters'}
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirm new password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <button
                type="submit"
                disabled={resetPassword.isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)' }}
              >
                {resetPassword.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {isRTL ? 'جارٍ التحديث...' : 'Updating…'}</>
                ) : (isRTL ? 'تعيين كلمة المرور الجديدة' : 'Set New Password')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
