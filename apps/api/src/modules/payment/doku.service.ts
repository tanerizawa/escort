import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface DokuInvoiceParams {
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

export interface DokuTransactionResult {
  transactionId: string;
  orderId: string;
  status: string;
  paymentType: string;
  redirectUrl?: string;
  invoiceUrl?: string;
  expiryDate?: string;
  raw: any;
}

@Injectable()
export class DokuService {
  private readonly logger = new Logger(DokuService.name);
  private readonly clientId: string;
  private readonly secretKey: string;
  private readonly dokuPublicKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get('DOKU_CLIENT_ID') || '';
    this.secretKey = this.configService.get('DOKU_SECRET_KEY') || '';
    this.dokuPublicKey = this.configService.get('DOKU_PUBLIC_KEY') || '';
    // Use sandbox by default; set DOKU_BASE_URL=https://api.doku.com for production
    this.baseUrl = this.configService.get('DOKU_BASE_URL') || 'https://api-sandbox.doku.com';

    if (this.clientId && this.secretKey) {
      this.logger.log('DOKU initialized (API keys configured)');
    } else {
      this.logger.warn('DOKU keys not configured — running in MOCK mode');
    }
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.secretKey);
  }

  /**
   * Generate DOKU request signature
   * Signature = HMAC-SHA256(Client-Id + ":" + Request-Id + ":" + Request-Timestamp + ":" + Request-Target + ":" + Digest, Secret-Key)
   * Digest = SHA-256(JSON body) base64-encoded
   */
  private generateSignature(
    requestId: string,
    requestTimestamp: string,
    requestTarget: string,
    body: string,
  ): string {
    // Digest = Base64(SHA-256(request body))
    const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');

    // Component signature
    const componentSignature = `Client-Id:${this.clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

    // HMAC-SHA256 sign
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(componentSignature);
    return `HMACSHA256=${hmac.digest('base64')}`;
  }

  /**
   * Generate notification signature for webhook verification
   * Notification Signature = HMAC-SHA256(Client-Id + ":" + Request-Id + ":" + Request-Timestamp + ":" + Request-Target + ":" + Digest, Secret-Key)
   */
  verifyNotificationSignature(
    payload: any,
    clientId: string,
    requestId: string,
    requestTimestamp: string,
    notificationSignature: string,
  ): boolean {
    if (!this.isConfigured()) return true;

    const requestTarget = '/payments/doku-webhook';
    const body = JSON.stringify(payload);
    const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');

    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(componentSignature);
    const expectedSignature = `HMACSHA256=${hmac.digest('base64')}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(notificationSignature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  /**
   * Create DOKU Checkout — redirects to DOKU hosted payment page
   * Supports: VA, QRIS, E-wallet, Credit Card, Convenience Store, etc.
   */
  async createInvoice(params: DokuInvoiceParams): Promise<DokuTransactionResult> {
    if (!this.isConfigured()) {
      return this.mockTransaction(params);
    }

    const frontendUrl = this.configService.get('WEB_URL') || 'https://areton.id';
    const apiUrl = this.configService.get('API_URL') || 'https://api.areton.id';

    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const requestTarget = '/checkout/v1/payment';

    // Build request body — use minimal required fields per DOKU docs
    const paymentMethodTypes = params.paymentMethod ? this.mapPaymentMethod(params.paymentMethod) : null;

    const orderBody: Record<string, any> = {
      order: {
        amount: params.amount,
        invoice_number: params.orderId,
        callback_url: `${apiUrl}/api/payments/doku-webhook`,
        callback_url_cancel: `${frontendUrl}/user/payments/status?order_id=${params.orderId}&cancelled=true`,
        callback_url_result: `${frontendUrl}/user/payments/status?order_id=${params.orderId}`,
      },
      payment: {
        payment_due_date: 60,
        ...(paymentMethodTypes ? { payment_method_types: paymentMethodTypes } : {}),
      },
      customer: {
        id: params.customer.email.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 50),
        name: params.customer.firstName || 'Customer',
        last_name: params.customer.lastName || '',
        email: params.customer.email,
        phone: this.normalizePhone(params.customer.phone),
        country: 'ID',
      },
      additional_info: {
        override_notification_url: `${apiUrl}/api/payments/doku-webhook`,
      },
    };

    const bodyString = JSON.stringify(orderBody);
    const signature = this.generateSignature(requestId, requestTimestamp, requestTarget, bodyString);

    this.logger.log(`DOKU request → ${this.baseUrl}${requestTarget} | order: ${params.orderId} | amount: ${params.amount}`);

    try {
      const response = await fetch(`${this.baseUrl}${requestTarget}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': this.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': requestTimestamp,
          'Signature': signature,
        },
        body: bodyString,
      });

      const responseText = await response.text();

      if (!response.ok) {
        this.logger.error(`DOKU API error ${response.status}: ${responseText}`);
        throw new Error(`DOKU API error ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      const paymentUrl = result?.response?.payment?.url;
      const tokenId = result?.response?.payment?.token_id;
      const expiredDate = result?.response?.payment?.expired_date;

      this.logger.log(`DOKU checkout created: ${params.orderId} → url: ${paymentUrl}`);

      return {
        transactionId: tokenId || params.orderId,
        orderId: params.orderId,
        status: 'pending',
        paymentType: params.paymentMethod || 'all',
        redirectUrl: paymentUrl,
        invoiceUrl: paymentUrl,
        expiryDate: expiredDate,
        raw: result,
      };
    } catch (error: any) {
      this.logger.error(`DOKU checkout error: ${error?.message}`);
      throw new Error(`Gagal membuat pembayaran DOKU: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Parse DOKU HTTP notification payload
   */
  parseWebhookNotification(body: any): {
    invoiceNumber: string;
    status: string;
    paymentMethod: string;
    paymentChannel: string;
    amount: number;
    transactionId: string;
  } {
    const transaction = body?.transaction || {};
    const order = body?.order || {};

    return {
      invoiceNumber: order?.invoice_number || '',
      status: transaction?.status || '',
      paymentMethod: body?.service?.id || '',
      paymentChannel: body?.channel?.id || '',
      amount: Number(order?.amount) || 0,
      transactionId: transaction?.identifier?.[0]?.value || '',
    };
  }

  /**
   * Map our payment method names to DOKU payment_method_types
   */
  private mapPaymentMethod(method: string): string[] | null {
    const map: Record<string, string[]> = {
      bank_transfer: [
        'VIRTUAL_ACCOUNT_BCA',
        'VIRTUAL_ACCOUNT_BANK_MANDIRI',
        'VIRTUAL_ACCOUNT_BRI',
        'VIRTUAL_ACCOUNT_BNI',
        'VIRTUAL_ACCOUNT_BANK_PERMATA',
        'VIRTUAL_ACCOUNT_BANK_CIMB',
        'VIRTUAL_ACCOUNT_BANK_DANAMON',
      ],
      qris: ['QRIS'],
      ewallet: [
        'EMONEY_SHOPEE_PAY',
        'EMONEY_OVO',
        'EMONEY_DANA',
        'EMONEY_LINKAJA',
      ],
      credit_card: ['CREDIT_CARD'],
      retail_outlet: [
        'ONLINE_TO_OFFLINE_ALFA',
        'ONLINE_TO_OFFLINE_INDOMARET',
      ],
    };
    return map[method] || null;
  }

  /**
   * Normalize phone to DOKU format: 628xxx (no + or leading 0)
   */
  private normalizePhone(phone?: string): string {
    if (!phone) return '628123456789';
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('08')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned || '628123456789';
  }

  /**
   * Mock transaction for development without DOKU keys
   */
  private mockTransaction(params: DokuInvoiceParams): DokuTransactionResult {
    const mockId = `MOCK-DOKU-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.logger.warn(`Mock DOKU checkout created: ${params.orderId} → ${mockId}`);

    const frontendUrl = this.configService.get('WEB_URL') || 'https://areton.id';

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
