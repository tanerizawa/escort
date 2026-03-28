import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CryptoInvoiceParams {
  orderId: string;
  amount: number; // IDR amount
  currency?: string; // price currency, default IDR
  payCurrency?: string; // specific crypto e.g. 'eth', 'usdt', 'sol'
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  description?: string;
}

export interface CryptoTransactionResult {
  transactionId: string;
  orderId: string;
  status: string;
  invoiceUrl: string;
  payCurrency?: string;
  payAmount?: number;
  priceAmount: number;
  priceCurrency: string;
  raw: any;
}

@Injectable()
export class CryptoPaymentService {
  private readonly logger = new Logger(CryptoPaymentService.name);
  private readonly apiKey: string;
  private readonly ipnSecret: string;
  private readonly baseUrl = 'https://api.nowpayments.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('NOWPAYMENTS_API_KEY') || '';
    this.ipnSecret = this.configService.get('NOWPAYMENTS_IPN_SECRET') || '';

    if (this.apiKey) {
      this.logger.log('NOWPayments crypto gateway initialized (API key configured)');
    } else {
      this.logger.warn('NOWPayments keys not configured — running in MOCK mode');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create a NOWPayments Invoice — user is redirected to hosted payment page
   * where they choose which crypto to pay with (ETH, USDT, SOL, BTC, etc.)
   */
  async createInvoice(params: CryptoInvoiceParams): Promise<CryptoTransactionResult> {
    if (!this.isConfigured()) {
      return this.mockTransaction(params);
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') ||
      this.configService.get('WEB_URL') || 'https://areton.id';

    const payload: Record<string, any> = {
      price_amount: params.amount,
      price_currency: params.currency || 'idr',
      order_id: params.orderId,
      order_description: params.description || `Booking Payment ${params.orderId.substring(0, 12)}`,
      ipn_callback_url: `${this.configService.get('API_BASE_URL') || 'https://api.areton.id'}/api/payments/crypto-webhook`,
      success_url: `${frontendUrl}/user/payments/status?order_id=${params.orderId}`,
      cancel_url: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&failed=true`,
    };

    // If specific crypto requested, lock to that currency
    if (params.payCurrency) {
      payload.pay_currency = params.payCurrency.toLowerCase();
    }

    try {
      const response = await fetch(`${this.baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`NOWPayments invoice creation failed: ${response.status} ${errorBody}`);
        throw new Error(`NOWPayments API error: ${response.status}`);
      }

      const invoice = await response.json();

      this.logger.log(`Crypto invoice created: ${params.orderId} → ${invoice.id}`);

      return {
        transactionId: String(invoice.id),
        orderId: params.orderId,
        status: 'pending',
        invoiceUrl: invoice.invoice_url,
        payCurrency: invoice.pay_currency || undefined,
        payAmount: invoice.pay_amount || undefined,
        priceAmount: params.amount,
        priceCurrency: params.currency || 'idr',
        raw: invoice,
      };
    } catch (error: any) {
      this.logger.error(`Crypto invoice error: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Get payment status from NOWPayments
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    if (!this.isConfigured()) {
      return { payment_status: 'finished', payment_id: paymentId };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
        headers: { 'x-api-key': this.apiKey },
      });

      if (!response.ok) {
        throw new Error(`NOWPayments status check failed: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Status check failed for ${paymentId}: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Verify IPN (Instant Payment Notification) webhook signature
   * NOWPayments sends HMAC-SHA512 of sorted JSON payload in x-nowpayments-sig header
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.isConfigured()) return true;
    if (!this.ipnSecret) {
      this.logger.warn('IPN secret not configured — accepting all webhooks');
      return true;
    }

    try {
      // NOWPayments requires sorting the JSON keys before hashing
      const sortedPayload = this.sortObject(payload);
      const hmac = crypto
        .createHmac('sha512', this.ipnSecret)
        .update(JSON.stringify(sortedPayload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse NOWPayments IPN webhook payload
   */
  parseWebhookNotification(body: any): {
    paymentId: string;
    orderId: string;
    status: string;
    payCurrency: string;
    payAmount: number;
    actuallyPaid: number;
    priceAmount: number;
    priceCurrency: string;
  } {
    return {
      paymentId: String(body.payment_id || ''),
      orderId: body.order_id || '',
      status: body.payment_status || '', // waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
      payCurrency: body.pay_currency || '',
      payAmount: body.pay_amount || 0,
      actuallyPaid: body.actually_paid || 0,
      priceAmount: body.price_amount || 0,
      priceCurrency: body.price_currency || 'idr',
    };
  }

  /**
   * Sort object keys recursively — required for NOWPayments HMAC verification
   */
  private sortObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sortObject(item));
    return Object.keys(obj)
      .sort()
      .reduce((sorted: Record<string, any>, key) => {
        sorted[key] = this.sortObject(obj[key]);
        return sorted;
      }, {});
  }

  /**
   * Mock transaction for development without API keys
   */
  private mockTransaction(params: CryptoInvoiceParams): CryptoTransactionResult {
    const mockId = `MOCK-CRYPTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.logger.warn(`Mock crypto invoice created: ${params.orderId} → ${mockId}`);

    const frontendUrl = this.configService.get('FRONTEND_URL') ||
      this.configService.get('WEB_URL') || 'https://areton.id';

    return {
      transactionId: mockId,
      orderId: params.orderId,
      status: 'pending',
      invoiceUrl: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&mock=true`,
      payCurrency: params.payCurrency || 'eth',
      priceAmount: params.amount,
      priceCurrency: params.currency || 'idr',
      raw: { mock: true, orderId: params.orderId },
    };
  }
}
