import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require('midtrans-client');

export interface MidtransChargeParams {
  orderId: string;
  amount: number;
  paymentMethod: string; // 'bank_transfer' | 'gopay' | 'shopeepay' | 'qris' | 'credit_card'
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
  bankType?: string; // 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata'
}

export interface MidtransTransactionResult {
  transactionId: string;
  orderId: string;
  status: string;
  paymentType: string;
  redirectUrl?: string;
  token?: string;
  vaNumbers?: Array<{ bank: string; va_number: string }>;
  actions?: Array<{ name: string; method: string; url: string }>;
  qrString?: string;
  expiryTime?: string;
  raw: any;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly snap: any;
  private readonly coreApi: any;
  private readonly serverKey: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.serverKey = this.configService.get('MIDTRANS_SERVER_KEY') || '';
    const clientKey = this.configService.get('MIDTRANS_CLIENT_KEY') || '';
    this.isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';

    if (this.serverKey) {
      this.snap = new midtransClient.Snap({
        isProduction: this.isProduction,
        serverKey: this.serverKey,
        clientKey: clientKey,
      });

      this.coreApi = new midtransClient.CoreApi({
        isProduction: this.isProduction,
        serverKey: this.serverKey,
        clientKey: clientKey,
      });

      this.logger.log(`Midtrans initialized (${this.isProduction ? 'PRODUCTION' : 'SANDBOX'})`);
    } else {
      this.logger.warn('Midtrans keys not configured — running in MOCK mode');
    }
  }

  /**
   * Returns true if Midtrans is properly configured, false for mock mode
   */
  isConfigured(): boolean {
    return !!this.serverKey;
  }

  /**
   * Create a Snap transaction (redirect-based payment)
   * This is the simplest integration — redirects user to Midtrans payment page
   */
  async createSnapTransaction(params: MidtransChargeParams): Promise<MidtransTransactionResult> {
    if (!this.isConfigured()) {
      return this.mockTransaction(params);
    }

    const snapParams: any = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customer.firstName,
        last_name: params.customer.lastName,
        email: params.customer.email,
        phone: params.customer.phone || '',
      },
      item_details: params.itemDetails || [
        {
          id: params.orderId,
          price: params.amount,
          quantity: 1,
          name: `Booking ${params.orderId.substring(0, 8)}`,
        },
      ],
      callbacks: {
        finish: `${this.configService.get('FRONTEND_URL') || 'https://areton.id'}/payments/status`,
        error: `${this.configService.get('FRONTEND_URL') || 'https://areton.id'}/payments/status`,
        pending: `${this.configService.get('FRONTEND_URL') || 'https://areton.id'}/payments/status`,
      },
    };

    // If specific payment method, enable only that
    if (params.paymentMethod === 'bank_transfer') {
      snapParams['enabled_payments'] = ['bank_transfer'];
      if (params.bankType) {
        snapParams['bank_transfer'] = { bank: params.bankType };
      }
    } else if (params.paymentMethod === 'gopay') {
      snapParams['enabled_payments'] = ['gopay'];
    } else if (params.paymentMethod === 'shopeepay') {
      snapParams['enabled_payments'] = ['shopeepay'];
    } else if (params.paymentMethod === 'qris') {
      snapParams['enabled_payments'] = ['other_qris'];
    } else if (params.paymentMethod === 'credit_card') {
      snapParams['enabled_payments'] = ['credit_card'];
      snapParams['credit_card'] = { secure: true };
    }

    try {
      const transaction = await this.snap.createTransaction(snapParams);

      this.logger.log(`Snap transaction created: ${params.orderId} → ${transaction.token}`);

      return {
        transactionId: params.orderId,
        orderId: params.orderId,
        status: 'pending',
        paymentType: params.paymentMethod,
        redirectUrl: transaction.redirect_url,
        token: transaction.token,
        raw: transaction,
      };
    } catch (error: any) {
      this.logger.error(`Midtrans Snap error: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Create a Core API charge (server-to-server, no redirect)
   * Used for bank transfer VA, e-wallet direct charge
   */
  async createCoreCharge(params: MidtransChargeParams): Promise<MidtransTransactionResult> {
    if (!this.isConfigured()) {
      return this.mockTransaction(params);
    }

    const chargeParams: any = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customer.firstName,
        last_name: params.customer.lastName,
        email: params.customer.email,
        phone: params.customer.phone || '',
      },
    };

    // Set payment type
    if (params.paymentMethod === 'bank_transfer') {
      chargeParams.payment_type = 'bank_transfer';
      chargeParams.bank_transfer = { bank: params.bankType || 'bca' };
    } else if (params.paymentMethod === 'gopay') {
      chargeParams.payment_type = 'gopay';
    } else if (params.paymentMethod === 'shopeepay') {
      chargeParams.payment_type = 'shopeepay';
    } else if (params.paymentMethod === 'qris') {
      chargeParams.payment_type = 'qris';
    }

    try {
      const charge = await this.coreApi.charge(chargeParams);

      this.logger.log(`Core API charge: ${params.orderId} → ${charge.transaction_status}`);

      return {
        transactionId: charge.transaction_id,
        orderId: charge.order_id,
        status: charge.transaction_status,
        paymentType: charge.payment_type,
        vaNumbers: charge.va_numbers,
        actions: charge.actions,
        qrString: charge.qr_string,
        expiryTime: charge.expiry_time,
        raw: charge,
      };
    } catch (error: any) {
      this.logger.error(`Midtrans Core API error: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(orderId: string): Promise<any> {
    if (!this.isConfigured()) {
      return { transaction_status: 'settlement', order_id: orderId };
    }

    try {
      return await this.coreApi.transaction.status(orderId);
    } catch (error: any) {
      this.logger.error(`Status check failed for ${orderId}: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook notification signature
   * Midtrans sends SHA512(order_id + status_code + gross_amount + server_key)
   */
  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    if (!this.isConfigured()) return true;

    const payload = orderId + statusCode + grossAmount + this.serverKey;
    const hash = crypto.createHash('sha512').update(payload).digest('hex');
    return hash === signatureKey;
  }

  /**
   * Parse Midtrans webhook notification payload
   */
  parseWebhookNotification(body: any): {
    orderId: string;
    transactionId: string;
    transactionStatus: string;
    paymentType: string;
    fraudStatus: string;
    grossAmount: string;
    statusCode: string;
    signatureKey: string;
  } {
    return {
      orderId: body.order_id,
      transactionId: body.transaction_id,
      transactionStatus: body.transaction_status,
      paymentType: body.payment_type,
      fraudStatus: body.fraud_status || 'accept',
      grossAmount: body.gross_amount,
      statusCode: body.status_code,
      signatureKey: body.signature_key,
    };
  }

  /**
   * Mock transaction for development without Midtrans keys
   */
  private mockTransaction(params: MidtransChargeParams): MidtransTransactionResult {
    const mockId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.logger.warn(`Mock transaction created: ${params.orderId} → ${mockId}`);

    return {
      transactionId: mockId,
      orderId: params.orderId,
      status: 'pending',
      paymentType: params.paymentMethod,
      redirectUrl: `${this.configService.get('FRONTEND_URL') || 'https://areton.id'}/payments/status?order_id=${params.orderId}&mock=true`,
      token: `mock-token-${mockId}`,
      vaNumbers: params.paymentMethod === 'bank_transfer'
        ? [{ bank: params.bankType || 'bca', va_number: `8001${Date.now().toString().slice(-10)}` }]
        : undefined,
      raw: { mock: true, orderId: params.orderId },
    };
  }

  /**
   * Process refund through Midtrans
   */
  async processRefund(params: {
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<any> {
    try {
      if (!this.coreApi) {
        this.logger.warn(`Mock refund for transaction ${params.transactionId}: ${params.amount}`);
        return {
          status: 'success',
          refund_key: `MOCK-REFUND-${Date.now()}`,
          message: 'Mock refund processed',
          mock: true
        };
      }

      const refundResponse = await this.coreApi.refund(params.transactionId, {
        amount: params.amount,
        reason: params.reason
      });

      this.logger.log(`Refund processed: ${params.transactionId} - ${params.amount}`);
      return refundResponse;
    } catch (error) {
      this.logger.error('Midtrans refund failed:', error);
      throw error;
    }
  }
}
