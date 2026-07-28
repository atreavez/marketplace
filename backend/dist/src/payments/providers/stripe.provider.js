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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeProvider = class StripeProvider {
    constructor(config) {
        this.config = config;
        this.client = new stripe_1.default(this.config.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2024-06-20',
        });
    }
    async createPaymentIntent(amount, currency, dealId) {
        return this.client.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata: { dealId },
            automatic_payment_methods: { enabled: true },
        });
    }
    verifyAndParseWebhook(rawBody, signature) {
        const secret = this.config.get('STRIPE_WEBHOOK_SECRET') ?? '';
        return this.client.webhooks.constructEvent(rawBody, signature, secret);
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeProvider);
//# sourceMappingURL=stripe.provider.js.map