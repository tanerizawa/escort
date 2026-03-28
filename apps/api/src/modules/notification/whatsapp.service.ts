import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WhatsAppTemplateData {
  [key: string]: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private readonly isMock: boolean;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER', '')
      || this.configService.get<string>('TWILIO_PHONE_NUMBER', '');
    this.isMock = !this.accountSid || !this.authToken || !this.fromNumber;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    if (this.isMock) {
      this.logger.warn('⚠️  Twilio not configured — WhatsApp notifications in MOCK mode');
    } else {
      this.logger.log('✅ WhatsApp notification service initialized (Twilio)');
    }
  }

  // ════════════════════════════════════════════
  //  Core Send Method
  // ════════════════════════════════════════════

  /**
   * Send a WhatsApp message via Twilio API.
   * For template messages, use Content SID (pre-approved templates).
   * For free-form, only works within 24h session window.
   */
  async sendMessage(to: string, body: string): Promise<boolean> {
    if (!to) return false;

    // Normalize phone number: ensure +62 prefix for Indonesian numbers
    const normalizedTo = this.normalizePhone(to);
    const whatsappTo = `whatsapp:${normalizedTo}`;
    const whatsappFrom = `whatsapp:${this.fromNumber}`;

    if (this.isMock) {
      this.logger.log(`[MOCK WA] → ${normalizedTo} | ${body.substring(0, 80)}...`);
      return true;
    }

    try {
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          To: whatsappTo,
          From: whatsappFrom,
          Body: body,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.logger.log(`WA sent to ${normalizedTo}, SID: ${data.sid}`);
        return true;
      }

      const error = await response.json().catch(() => ({}));
      this.logger.error(`WA send failed (${response.status}): ${JSON.stringify(error)}`);
      return false;
    } catch (err: any) {
      this.logger.error(`WA send error: ${err.message}`);
      return false;
    }
  }

  /**
   * Send a template message via Twilio Content API.
   * Templates must be pre-approved by WhatsApp.
   */
  async sendTemplateMessage(
    to: string,
    contentSid: string,
    variables?: WhatsAppTemplateData,
  ): Promise<boolean> {
    if (!to) return false;

    const normalizedTo = this.normalizePhone(to);
    const whatsappTo = `whatsapp:${normalizedTo}`;
    const whatsappFrom = `whatsapp:${this.fromNumber}`;

    if (this.isMock) {
      this.logger.log(`[MOCK WA TEMPLATE] → ${normalizedTo} | ContentSID: ${contentSid}`);
      return true;
    }

    try {
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        ContentSid: contentSid,
      });

      if (variables) {
        params.set('ContentVariables', JSON.stringify(variables));
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params,
      });

      if (response.ok) {
        return true;
      }

      const error = await response.json().catch(() => ({}));
      this.logger.error(`WA template send failed (${response.status}): ${JSON.stringify(error)}`);
      return false;
    } catch (err: any) {
      this.logger.error(`WA template send error: ${err.message}`);
      return false;
    }
  }

  // ════════════════════════════════════════════
  //  Pre-built WhatsApp Message Templates
  // ════════════════════════════════════════════

  async sendBookingConfirmation(phone: string, data: {
    clientName: string;
    escortName: string;
    date: string;
    bookingId: string;
  }): Promise<boolean> {
    const message = [
      `✅ *Booking Dikonfirmasi*`,
      ``,
      `Halo ${data.clientName},`,
      `Booking Anda telah dikonfirmasi oleh ${data.escortName}.`,
      ``,
      `📋 ID: #${data.bookingId}`,
      `📅 Tanggal: ${data.date}`,
      ``,
      `Buka aplikasi ARETON.id untuk detail lengkap.`,
    ].join('\n');

    return this.sendMessage(phone, message);
  }

  async sendBookingCancelled(phone: string, data: {
    name: string;
    bookingId: string;
    reason?: string;
  }): Promise<boolean> {
    const message = [
      `❌ *Booking Dibatalkan*`,
      ``,
      `Halo ${data.name},`,
      `Booking #${data.bookingId} telah dibatalkan.`,
      data.reason ? `Alasan: ${data.reason}` : '',
      ``,
      `Hubungi support jika ada pertanyaan.`,
    ].filter(Boolean).join('\n');

    return this.sendMessage(phone, message);
  }

  async sendBookingReminder(phone: string, data: {
    name: string;
    escortName: string;
    date: string;
    time: string;
    location: string;
  }): Promise<boolean> {
    const message = [
      `⏰ *Pengingat Booking*`,
      ``,
      `Halo ${data.name},`,
      `Booking Anda dengan ${data.escortName} akan segera dimulai.`,
      ``,
      `📅 ${data.date} pukul ${data.time}`,
      `📍 ${data.location}`,
      ``,
      `Pastikan Anda sudah siap. Sampai jumpa!`,
    ].join('\n');

    return this.sendMessage(phone, message);
  }

  async sendNewBookingRequest(phone: string, data: {
    escortName: string;
    clientName: string;
    date: string;
    bookingId: string;
  }): Promise<boolean> {
    const message = [
      `📋 *Booking Baru*`,
      ``,
      `Halo ${data.escortName},`,
      `Anda menerima permintaan booking baru dari ${data.clientName}.`,
      ``,
      `📋 ID: #${data.bookingId}`,
      `📅 Tanggal: ${data.date}`,
      ``,
      `Buka aplikasi untuk menerima atau menolak.`,
    ].join('\n');

    return this.sendMessage(phone, message);
  }

  async sendPaymentReceived(phone: string, data: {
    name: string;
    amount: string;
    bookingId: string;
  }): Promise<boolean> {
    const message = [
      `💰 *Pembayaran Diterima*`,
      ``,
      `Halo ${data.name},`,
      `Pembayaran untuk booking #${data.bookingId} telah diterima.`,
      ``,
      `💵 Jumlah: Rp ${data.amount}`,
      ``,
      `Terima kasih telah menggunakan ARETON.id`,
    ].join('\n');

    return this.sendMessage(phone, message);
  }

  async sendOTP(phone: string, code: string): Promise<boolean> {
    const message = [
      `🔐 *Kode Verifikasi ARETON.id*`,
      ``,
      `Kode OTP Anda: *${code}*`,
      ``,
      `Berlaku selama 5 menit.`,
      `Jangan bagikan kode ini kepada siapapun.`,
    ].join('\n');

    return this.sendMessage(phone, message);
  }

  // ════════════════════════════════════════════
  //  Utilities
  // ════════════════════════════════════════════

  /**
   * Normalize Indonesian phone numbers to +62 format.
   */
  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('08')) {
      cleaned = '+62' + cleaned.substring(1);
    } else if (cleaned.startsWith('62')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}
