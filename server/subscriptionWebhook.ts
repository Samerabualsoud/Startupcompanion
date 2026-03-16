/**
 * Stripe Webhook Event Handler
 * Handles subscription lifecycle events from Stripe
 */
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Webhook] Database not available, skipping event:', event.type);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id || session.client_reference_id || '0');
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as any)?.id;
    if (userId && subscriptionId) {
      await db.update(users).set({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
      }).where(eq(users.id, userId));
      console.log(`[Webhook] Subscription activated for user ${userId}`);
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = parseInt((sub.metadata as any)?.user_id || '0');
    if (userId) {
      const status = sub.status === 'active' || sub.status === 'trialing' ? sub.status
        : sub.status === 'canceled' ? 'canceled'
        : sub.status === 'past_due' ? 'past_due'
        : 'inactive';
      // billing_cycle_anchor is available; use cancel_at for period end if available
      const cancelAt = (sub as any).cancel_at;
      const periodEnd = cancelAt ? new Date(cancelAt * 1000) : null;
      await db.update(users).set({
        subscriptionStatus: status as any,
        ...(periodEnd ? { subscriptionCurrentPeriodEnd: periodEnd } : {}),
      }).where(eq(users.id, userId));
      console.log(`[Webhook] Subscription ${event.type} for user ${userId}: ${status}`);
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    if (customerId) {
      await db.update(users).set({ subscriptionStatus: 'past_due' })
        .where(eq(users.stripeCustomerId, customerId));
    }
  }
}
