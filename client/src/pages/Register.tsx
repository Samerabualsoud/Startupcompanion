import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { TrendingUp, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { APP_PATH, LOGIN_PATH } from '@/const';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className={`w-3.5 h-3.5 ${c.ok ? 'text-green-500' : 'text-muted-foreground/40'}`} />
          <span className={c.ok ? 'text-green-700' : 'text-muted-foreground'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate(APP_PATH);
    },
    onError: (err) => {
      setError(err.message || 'Something went wrong. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
        style={{ background: 'oklch(0.18 0.05 240)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.55 0.13 30)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
            AI Startup Toolkit
          </span>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Everything you need to build, fund, and grow your startup.
          </h2>
          <div className="space-y-3">
            {[
              '7-method valuation calculator',
              'Co-founder equity split tool',
              'Fundraising readiness score',
              'Investor CRM & pipeline tracker',
              'VC, angel & grants database',
              'AI-powered idea feasibility check',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-sm" style={{ color: 'oklch(0.7 0.03 240)' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'oklch(0.65 0.13 30)' }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'oklch(0.4 0.03 240)' }}>
          Free forever · No credit card required
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
            </div>
            <span className="font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>AI Startup Toolkit</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Free forever. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm" style={{ background: 'oklch(0.97 0.02 30)', border: '1px solid oklch(0.85 0.06 30)', color: 'oklch(0.45 0.12 30)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
                onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
                onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>
                Email address
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
                onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
                onBlur={e => e.target.style.borderColor = 'oklch(0.88 0.02 240)'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.3 0.04 240)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-11"
                  style={{ background: 'white', border: '1.5px solid oklch(0.88 0.02 240)', color: 'oklch(0.2 0.04 240)' }}
                  onFocus={e => e.target.style.borderColor = 'oklch(0.55 0.13 30)'}
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
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'oklch(0.18 0.05 240)' }}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : 'Create free account'}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account you agree to our{' '}
              <span className="underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href={LOGIN_PATH} className="font-semibold hover:underline" style={{ color: 'oklch(0.55 0.13 30)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
