/**
 * Subscription Router — Stripe $9.99/month subscription
 */
import Stripe from 'stripe';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { PLANS } from './products';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export const subscriptionRouter = router({
  /** Get current user's subscription status */
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { subscriptionStatus: 'inactive' as const, plan: null, periodEnd: null };

    const result = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlan: users.subscriptionPlan,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
        stripeSubscriptionId: users.stripeSubscriptionId,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const user = result[0];
    if (!user) return { subscriptionStatus: 'inactive' as const, plan: null, periodEnd: null };

    return {
      subscriptionStatus: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      periodEnd: user.subscriptionCurrentPeriodEnd,
      isActive: user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing',
    };
  }),

  /** Create a Stripe Checkout Session for the Pro plan */
  createCheckout: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();

      // Get or create Stripe customer
      let stripeCustomerId: string | undefined;
      if (db) {
        const result = await db
          .select({ stripeCustomerId: users.stripeCustomerId })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        stripeCustomerId = result[0]?.stripeCustomerId ?? undefined;
      }

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { userId: ctx.user.id.toString() },
        });
        stripeCustomerId = customer.id;
        if (db) {
          await db.update(users)
            .set({ stripeCustomerId })
            .where(eq(users.id, ctx.user.id));
        }
      }

      // Create a price on-the-fly (or use a cached price ID)
      // We create the product/price dynamically so no dashboard setup is needed
      const priceList = await stripe.prices.list({
        lookup_keys: ['ai_startup_toolkit_pro_monthly'],
        limit: 1,
      });

      let priceId: string;
      if (priceList.data.length > 0) {
        priceId = priceList.data[0].id;
      } else {
        // Create product and price
        const product = await stripe.products.create({
          name: PLANS.pro.name,
          description: PLANS.pro.description,
        });
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: PLANS.pro.price,
          currency: PLANS.pro.currency,
          recurring: { interval: PLANS.pro.interval },
          lookup_key: 'ai_startup_toolkit_pro_monthly',
        });
        priceId = price.id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${input.origin}/?subscription=success`,
        cancel_url: `${input.origin}/?subscription=canceled`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? '',
          customer_name: ctx.user.name ?? '',
        },
        subscription_data: {
          metadata: {
            user_id: ctx.user.id.toString(),
          },
        },
      });

      return { url: session.url };
    }),

  /** Create a Stripe Customer Portal session for managing subscription */
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();

      let stripeCustomerId: string | null = null;
      if (db) {
        const result = await db
          .select({ stripeCustomerId: users.stripeCustomerId })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        stripeCustomerId = result[0]?.stripeCustomerId ?? null;
      }

      if (!stripeCustomerId) {
        throw new Error('No Stripe customer found. Please subscribe first.');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${input.origin}/`,
      });

      return { url: session.url };
    }),
});
