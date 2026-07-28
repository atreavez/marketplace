"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const deals_service_1 = require("../deals/deals.service");
const stripe_provider_1 = require("./providers/stripe.provider");
const btcpay_provider_1 = require("./providers/btcpay.provider");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, deals, stripe, btcpay) {
        this.prisma = prisma;
        this.deals = deals;
        this.stripe = stripe;
        this.btcpay = btcpay;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async initiate(dealId, buyerId, provider) {
        const deal = await this.prisma.deal.findUnique({ where: { id: dealId }, include: { listing: true } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        if (deal.buyerId !== buyerId)
            throw new common_1.ForbiddenException('Only the buyer can pay for this deal');
        if (deal.stage !== 'ACCEPTED') {
            throw new common_1.BadRequestException(`Deal must be ACCEPTED before payment (currently ${deal.stage})`);
        }
        const amount = deal.listing.price;
        if (!amount)
            throw new common_1.BadRequestException('Listing has no price set');
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
    async handleStripeWebhook(rawBody, signature) {
        const event = this.stripe.verifyAndParseWebhook(rawBody, signature);
        this.logger.log(`Stripe event: ${event.type}`);
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            await this.confirmPayment('STRIPE', intent.id, event);
        }
        if (event.type === 'payment_intent.payment_failed') {
            const intent = event.data.object;
            await this.failPayment('STRIPE', intent.id);
        }
        return { received: true };
    }
    async handleBtcpayWebhook(rawBody, signatureHeader) {
        if (!this.btcpay.verifySignature(rawBody, signatureHeader)) {
            throw new common_1.ForbiddenException('Invalid BTCPay webhook signature');
        }
        const event = JSON.parse(rawBody.toString('utf8'));
        this.logger.log(`BTCPay event: ${event.type}`);
        if (event.type === 'InvoiceSettled') {
            await this.confirmPayment('BTCPAY', event.invoiceId, event, event.metadata?.txHash);
        }
        if (event.type === 'InvoiceInvalid' || event.type === 'InvoiceExpired') {
            await this.failPayment('BTCPAY', event.invoiceId);
        }
        return { received: true };
    }
    async confirmPayment(provider, providerRef, raw, cryptoTxHash) {
        const payment = await this.prisma.payment.findFirst({ where: { provider, providerRef } });
        if (!payment) {
            this.logger.error(`Webhook for unknown payment: ${provider} ${providerRef}`);
            return;
        }
        if (payment.status === 'CONFIRMED')
            return;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CONFIRMED', raw: raw, cryptoTxHash },
        });
        await this.deals.systemTransition(payment.dealId, 'PAID', `webhook:${provider}`);
    }
    async failPayment(provider, providerRef) {
        const payment = await this.prisma.payment.findFirst({ where: { provider, providerRef } });
        if (!payment)
            return;
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        deals_service_1.DealsService,
        stripe_provider_1.StripeProvider,
        btcpay_provider_1.BtcpayProvider])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map