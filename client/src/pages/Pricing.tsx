/**
 * Pricing Page — $9.99/month Pro subscription
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, TrendingUp, ArrowLeft, Loader2, Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { toast } from 'sonner';
import { PLANS } from '../../../server/products';

const FEATURES = PLANS.pro.features;

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to secure checkout...');
      }
      setLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    },
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoading(true);
    createCheckout.mutate({ origin: window.location.origin });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Toolkit
        </a>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </div>
          <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Polaris Arabia
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary)', border: '1.5px solid var(--border)' }}>
              <Zap className="w-3 h-3" />
              Simple, transparent pricing
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Everything a Founder Needs
          </h1>
          <p className="text-center text-muted-foreground text-base mb-10 max-w-md mx-auto">
            One plan. All 9 tools. Built for early-stage founders who want professional-grade analysis without the consultant fees.
          </p>

          {/* Pricing Card */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border bg-card">
            {/* Card Header */}
            <div className="px-8 py-8 text-white" style={{ background: 'var(--primary)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
                    Pro Plan
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>$9.99</span>
                    <span className="text-lg mb-2" style={{ color: 'var(--muted-foreground)' }}>/month</span>
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                    Cancel anytime. No long-term commitment.
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: 'white' }}>
                  <Star className="w-3 h-3 fill-white" />
                  Most Popular
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--primary)' }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {isAuthenticated ? 'Subscribe Now — $9.99/month' : 'Sign in to Subscribe'}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                Secured by Stripe · Use card <strong>4242 4242 4242 4242</strong> for test payments
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-muted-foreground">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Instant access</span>
            <span>✓ Secure payment via Stripe</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
