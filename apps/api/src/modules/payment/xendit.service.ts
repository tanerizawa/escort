import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface XenditInvoiceParams {
  orderId: string;
  amount: number;
  paymentMethod?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  description?: string;
}

export interface XenditTransactionResult {
  transactionId: string;
  orderId: string;
  status: string;
  paymentType: string;
  redirectUrl?: string;
  invoiceUrl?: string;
  vaNumbers?: Array<{ bank: string; va_number: string }>;
  qrString?: string;
  expiryDate?: string;
  raw: any;
}

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get('XENDIT_SECRET_KEY') || '';
    this.webhookToken = this.configService.get('XENDIT_WEBHOOK_TOKEN') || '';
    this.baseUrl = 'https://api.xendit.co';

    if (this.secretKey) {
      this.logger.log('Xendit initialized (API key configured)');
    } else {
      this.logger.warn('Xendit keys not configured — running in MOCK mode');
    }
  }

  isConfigured(): boolean {
    return !!this.secretKey;
  }

  /**
   * Create a Xendit Invoice — user is redirected to hosted payment page
   * Supports all payment methods: VA, e-wallet, QRIS, credit card, retail outlet
   */
  async createInvoice(params: XenditInvoiceParams): Promise<XenditTransactionResult> {
    if (!this.isConfigured()) {
      return this.mockTransaction(params);
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://areton.id';

    const payload: Record<string, any> = {
      external_id: params.orderId,
      amount: params.amount,
      description: params.description || `Pembayaran Booking ${params.orderId.substring(0, 12)}`,
      currency: 'IDR',
      customer: {
        given_names: params.customer.firstName,
        surname: params.customer.lastName,
        email: params.customer.email,
        mobile_number: params.customer.phone || undefined,
      },
      customer_notification_preference: {
        invoice_paid: ['email'],
      },
      success_redirect_url: `${frontendUrl}/user/payments/status?order_id=${params.orderId}`,
      failure_redirect_url: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&failed=true`,
      invoice_duration: 86400, // 24 hours
    };

    if (params.itemDetails && params.itemDetails.length > 0) {
      payload.items = params.itemDetails.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    // Restrict to specific payment method if provided
    if (params.paymentMethod) {
      const methodMap = this.mapPaymentMethod(params.paymentMethod);
      if (methodMap) {
        payload.payment_methods = methodMap;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Xendit invoice creation failed: ${response.status} ${errorBody}`);
        throw new Error(`Xendit API error: ${response.status}`);
      }

      const invoice = await response.json();

      this.logger.log(`Xendit invoice created: ${params.orderId} → ${invoice.id}`);

      return {
        transactionId: invoice.id,
        orderId: params.orderId,
        status: invoice.status?.toLowerCase() || 'pending',
        paymentType: params.paymentMethod || 'all',
        redirectUrl: invoice.invoice_url,
        invoiceUrl: invoice.invoice_url,
        expiryDate: invoice.expiry_date,
        raw: invoice,
      };
    } catch (error: any) {
      this.logger.error(`Xendit invoice error: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Get invoice/transaction status from Xendit
   */
  async getTransactionStatus(invoiceId: string): Promise<any> {
    if (!this.isConfigured()) {
      return { status: 'PAID', id: invoiceId };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Xendit status check failed: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Status check failed for ${invoiceId}: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook callback token
   * Xendit sends x-callback-token header that must match our configured token
   */
  verifyWebhookToken(callbackToken: string): boolean {
    if (!this.isConfigured()) return true;
    if (!this.webhookToken) {
      this.logger.warn('Webhook token not configured — accepting all webhooks');
      return true;
    }
    return crypto.timingSafeEqual(
      Buffer.from(callbackToken),
      Buffer.from(this.webhookToken),
    );
  }

  /**
   * Parse Xendit webhook notification payload (invoice paid/expired)
   */
  parseWebhookNotification(body: any): {
    invoiceId: string;
    externalId: string;
    status: string;
    paymentMethod: string;
    paymentChannel: string;
    amount: number;
    paidAt: string | null;
  } {
    return {
      invoiceId: body.id,
      externalId: body.external_id,
      status: body.status, // PAID, EXPIRED
      paymentMethod: body.payment_method || '',
      paymentChannel: body.payment_channel || '',
      amount: body.amount || body.paid_amount || 0,
      paidAt: body.paid_at || null,
    };
  }

  /**
   * Process refund via Xendit
   */
  async processRefund(params: {
    invoiceId: string;
    amount: number;
    reason: string;
  }): Promise<any> {
    if (!this.isConfigured()) {
      this.logger.warn(`Mock refund for invoice ${params.invoiceId}: ${params.amount}`);
      return {
        status: 'success',
        refund_id: `MOCK-REFUND-${Date.now()}`,
        message: 'Mock refund processed',
        mock: true,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
          'Idempotency-key': `refund-${params.invoiceId}-${Date.now()}`,
        },
        body: JSON.stringify({
          invoice_id: params.invoiceId,
          amount: params.amount,
          reason: params.reason,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Xendit refund failed: ${response.status} ${errorBody}`);
        throw new Error(`Xendit refund error: ${response.status}`);
      }

      const refund = await response.json();
      this.logger.log(`Refund processed: ${params.invoiceId} - Rp ${params.amount}`);
      return refund;
    } catch (error: any) {
      this.logger.error('Xendit refund failed:', error);
      throw error;
    }
  }

  /**
   * Map our payment method names to Xendit payment_methods array
   */
  private mapPaymentMethod(method: string): string[] | null {
    const map: Record<string, string[]> = {
      bank_transfer: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI'],
      qris: ['QRIS'],
      ewallet: ['OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA', 'ASTRAPAY'],
      credit_card: ['CREDIT_CARD'],
      retail_outlet: ['ALFAMART', 'INDOMARET'],
    };
    return map[method] || null;
  }

  /**
   * Mock transaction for development without Xendit keys
   */
  private mockTransaction(params: XenditInvoiceParams): XenditTransactionResult {
    const mockId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.logger.warn(`Mock invoice created: ${params.orderId} → ${mockId}`);

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://areton.id';

    return {
      transactionId: mockId,
      orderId: params.orderId,
      status: 'pending',
      paymentType: params.paymentMethod || 'all',
      redirectUrl: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&mock=true`,
      invoiceUrl: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&mock=true`,
      raw: { mock: true, orderId: params.orderId },
    };
  }
}
