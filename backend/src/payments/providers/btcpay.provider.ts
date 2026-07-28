import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface BtcpayInvoice {
  id: string;
  checkoutLink: string;
  status: string;
}

@Injectable()
export class BtcpayProvider {
  constructor(private config: ConfigService) {}

  private get baseUrl() {
    return this.config.get<string>('BTCPAY_URL'); // e.g. https://btcpay.yourdomain.com
  }
  private get apiKey() {
    return this.config.get<string>('BTCPAY_API_KEY');
  }
  private get storeId() {
    return this.config.get<string>('BTCPAY_STORE_ID');
  }

  // Uses BTCPay's self-hosted Greenfield API. We never touch a wallet or private
  // key directly — BTCPay owns custody and confirmation monitoring; we only ask
  // it for an invoice and later trust its signed webhook.
  async createInvoice(amount: number, currency: string, dealId: string): Promise<BtcpayInvoice> {
    const res = await fetch(`${this.baseUrl}/api/v1/stores/${this.storeId}/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency,
        metadata: { dealId },
        checkout: { redirectURL: `${this.config.get('FRONTEND_URL')}/deals` },
      }),
    });
    if (!res.ok) {
      throw new Error(`BTCPay invoice creation failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  // BTCPay signs webhook payloads with HMAC-SHA256 using a per-webhook secret,
  // sent in the "BTCPAY-SIG" header as "sha256=<hex>". Constant-time compare to
  // avoid timing side-channels on the comparison itself.
  verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const secret = this.config.get<string>('BTCPAY_WEBHOOK_SECRET') ?? '';
    const expected =
      'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
