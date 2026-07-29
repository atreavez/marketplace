import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DealsService } from '../deals/deals.service';
import { StripeProvider } from './providers/stripe.provider';
import { BtcpayProvider } from './providers/btcpay.provider';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private deals: DealsService,
    private stripe: StripeProvider,
    private btcpay: BtcpayProvider,
  ) {}

  // Buyer initiates a payment for an ACCEPTED deal. Moves the deal to
  // AWAITING_PAYMENT (a normal client transition) and creates the provider-side
  // invoice/intent. The deal only reaches PAID later, from a verified webhook.
  async initiate(dealId: string, buyerId: string, provider: 'STRIPE' | 'BTCPAY') {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId }, include: { listing: true } });
    if (!deal) throw new NotFoundException('Deal not found');
    if (deal.buyerId !== buyerId) throw new ForbiddenException('Only the buyer can pay for this deal');
    if (deal.stage !== 'ACCEPTED') {
      throw new BadRequestException(`Deal must be ACCEPTED before payment (currently ${deal.stage})`);
    }

    const amount = deal.listing.price;
    if (!amount) throw new BadRequestException('Listing has no price set');
    const currency = deal.listing.currency;

    await this.deals.transition(dealId, buyerId, 'AWAITING_PAYMENT');

    if (provider === 'STRIPE') {
      const intent = await this.stripe.createPaymentIntent(Number(amount), currency, dealId);
      await this.prisma.payment.create({
        data: {
          dealId,
          provider: 'STRIPE',
          providerRef: intent.id,
          amount,
          currency,
          status: 'PENDING',
        },
      });
      return { provider: 'STRIPE', clientSecret: intent.client_secret };
    }

    const invoice = await this.btcpay.createInvoice(Number(amount), currency, dealId);
    await this.prisma.payment.create({
      data: {
        dealId,
        provider: 'BTCPAY',
        providerRef: invoice.id,
        amount,
        currency,
        status: 'PENDING',
      },
    });
    return { provider: 'BTCPAY', checkoutUrl: invoice.checkoutLink };
  }

  // --- Webhooks: the only path that can ever mark a Payment/Deal as PAID ---

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.verifyAndParseWebhook(rawBody, signature); // throws on bad signature
    this.logger.log(`Stripe event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as any;
      await this.confirmPayment('STRIPE', intent.id, event as unknown as Record<string, unknown>);
    }
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as any;
      await this.failPayment('STRIPE', intent.id);
    }
    return { received: true };
  }

  async handleBtcpayWebhook(rawBody: Buffer, signatureHeader: string | undefined) {
    if (!this.btcpay.verifySignature(rawBody, signatureHeader)) {
      throw new ForbiddenException('Invalid BTCPay webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    this.logger.log(`BTCPay event: ${event.type}`);

    // BTCPay's "InvoiceSettled" is the point at which funds are confirmed on-chain
    // per the store's configured confirmation-speed policy — this is the broker
    // doing the confirmation tracking, exactly per the architecture doc.
    if (event.type === 'InvoiceSettled') {
      await this.confirmPayment('BTCPAY', event.invoiceId, event, event.metadata?.txHash);
    }
    if (event.type === 'InvoiceInvalid' || event.type === 'InvoiceExpired') {
      await this.failPayment('BTCPAY', event.invoiceId);
    }
    return { received: true };
  }

  private async confirmPayment(
    provider: 'STRIPE' | 'BTCPAY',
    providerRef: string,
    raw: Record<string, unknown>,
    cryptoTxHash?: string,
  ) {
    const payment = await this.prisma.payment.findFirst({ where: { provider, providerRef } });
    if (!payment) {
      // Don't throw 4xx here — an unknown providerRef on a signature-verified webhook
      // is logged for investigation, but returning an error would make the provider
      // retry forever. Log loudly instead.
      this.logger.error(`Webhook for unknown payment: ${provider} ${providerRef}`);
      return;
    }
    if (payment.status === 'CONFIRMED') return; // idempotent — providers retry webhooks

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CONFIRMED', raw: raw as any, cryptoTxHash },
    });

    // This is the ONLY place in the entire codebase that can move a deal to PAID.
    await this.deals.systemTransition(payment.dealId, 'PAID', `webhook:${provider}`);
  }

  private async failPayment(provider: 'STRIPE' | 'BTCPAY', providerRef: string) {
    const payment = await this.prisma.payment.findFirst({ where: { provider, providerRef } });
    if (!payment) return;
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    // Deal stays in AWAITING_PAYMENT — buyer can retry with a fresh Payment row,
    // or either party can still CANCEL per the client transition table.
  }
}
