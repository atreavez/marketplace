import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
  private client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    });
  }

  // Stripe amounts are integer minor units (cents) — never send a float dollar amount.
  async createPaymentIntent(amount: number, currency: string, dealId: string) {
    return this.client.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { dealId }, // used to map the webhook back to our Deal
      automatic_payment_methods: { enabled: true },
    });
  }

  verifyAndParseWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    // Throws if the signature doesn't match — this is the entire security boundary
    // for "did this webhook really come from Stripe." Never skip this check.
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}
