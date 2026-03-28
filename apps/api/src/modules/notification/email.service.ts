import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isMock: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY', '');
    this.fromEmail = this.config.get<string>('EMAIL_FROM', 'noreply@areton.id');
    this.fromName = this.config.get<string>('EMAIL_FROM_NAME', 'ARETON.id');
    this.isMock = !this.apiKey;

    if (this.isMock) {
      this.logger.warn('Brevo API key not configured — running in MOCK mode');
    } else {
      this.logger.log('Brevo email service initialized');
    }
  }

  /**
   * Send email using Brevo (formerly Sendinblue) v3 SMTP API
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (this.isMock) {
      this.logger.log(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.fromEmail, name: this.fromName },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          ...(options.text ? { textContent: options.text } : {}),
        }),
      });

      if (response.ok || response.status === 201) {
        const result = await response.json().catch(() => ({}));
        const messageId = result.messageId || `brevo-${Date.now()}`;
        this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
        return { success: true, messageId };
      }

      const errorBody = await response.text();
      this.logger.error(`Brevo error (${response.status}): ${errorBody}`);
      return { success: false };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return { success: false };
    }
  }

  // ── Template-based email methods ──

  async sendBookingConfirmation(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Booking Dikonfirmasi — ARETON.id`,
      html: this.renderTemplate('booking-confirmed', data),
    });
  }

  async sendBookingCancelled(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Booking Dibatalkan — ARETON.id`,
      html: this.renderTemplate('booking-cancelled', data),
    });
  }

  async sendBookingCompleted(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Booking Selesai — ARETON.id`,
      html: this.renderTemplate('booking-completed', data),
    });
  }

  async sendPaymentReceived(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Pembayaran Diterima — ARETON.id`,
      html: this.renderTemplate('payment-received', data),
    });
  }

  async sendPaymentReleased(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Pembayaran Dilepaskan — ARETON.id`,
      html: this.renderTemplate('payment-released', data),
    });
  }

  async sendWelcome(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Selamat Datang di ARETON.id`,
      html: this.renderTemplate('welcome', data),
    });
  }

  async sendPasswordReset(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Reset Password — ARETON.id`,
      html: this.renderTemplate('password-reset', data),
    });
  }

  async sendEscortApproved(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Profil Partner Disetujui — ARETON.id`,
      html: this.renderTemplate('escort-approved', data),
    });
  }

  async sendNewReview(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Review Baru — ARETON.id`,
      html: this.renderTemplate('new-review', data),
    });
  }

  async sendEmailVerification(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Verifikasi Email Anda — ARETON.id`,
      html: this.renderTemplate('email-verification', data),
    });
  }

  async sendResendVerification(to: string, data: TemplateData) {
    return this.send({
      to,
      subject: `Kode Verifikasi Baru — ARETON.id`,
      html: this.renderTemplate('email-verification', data),
    });
  }

  // ── Template rendering ──

  private renderTemplate(templateName: string, data: TemplateData): string {
    const bodyContent = this.getTemplateBody(templateName, data);
    return this.baseLayout(bodyContent);
  }

  // ─── Design System ───
  // Colors: navy #0a0f1c, gold #c9a96e, light-gold #e8d5b0, cream #faf7f2
  // Typography: Georgia/serif for headings, system sans-serif for body
  // Spacing: 40px content padding, 24px section gaps

  private baseLayout(content: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ARETON.id</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0ece4;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;color:#f0ece4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ARETON.id — Professional Companion Service
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0ece4;">
    <tr><td align="center" style="padding:40px 16px 20px;">

      <!-- Top accent bar -->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="height:4px;background:linear-gradient(90deg,#c9a96e 0%,#e8d5b0 50%,#c9a96e 100%);border-radius:4px 4px 0 0;">&nbsp;</td></tr>
      </table>

      <!-- Main container -->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:0 0 4px 4px;box-shadow:0 4px 24px rgba(10,15,28,0.08);">

        <!-- Header -->
        <tr><td style="background-color:#0a0f1c;padding:36px 40px 32px;text-align:center;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td align="center">
              <!-- Logo mark -->
              <div style="display:inline-block;width:48px;height:48px;border:2px solid #c9a96e;border-radius:50%;line-height:48px;text-align:center;margin-bottom:12px;">
                <span style="color:#c9a96e;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">A</span>
              </div>
            </td></tr>
            <tr><td align="center" style="padding-top:4px;">
              <span style="color:#c9a96e;font-size:26px;font-weight:400;letter-spacing:6px;font-family:Georgia,'Times New Roman',serif;">ARETON</span>
              <span style="color:#e8d5b0;font-size:26px;font-weight:300;font-family:Georgia,'Times New Roman',serif;">.</span>
              <span style="color:#ffffff;font-size:26px;font-weight:400;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">id</span>
            </td></tr>
            <tr><td align="center" style="padding-top:8px;">
              <span style="color:#6b7280;font-size:10px;letter-spacing:4px;text-transform:uppercase;">Professional Companion Service</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Gold divider -->
        <tr><td style="padding:0 40px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width:40%;height:1px;background-color:#e8d5b0;">&nbsp;</td>
              <td style="width:20%;text-align:center;padding:0 12px;">
                <span style="color:#c9a96e;font-size:14px;">&#9670;</span>
              </td>
              <td style="width:40%;height:1px;background-color:#e8d5b0;">&nbsp;</td>
            </tr>
          </table>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:36px 40px 40px;">
          ${content}
        </td></tr>

        <!-- Footer separator -->
        <tr><td style="padding:0 40px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="height:1px;background-color:#e5e7eb;">&nbsp;</td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 40px 20px;text-align:center;">
          <!-- Social hint -->
          <p style="margin:0 0 16px;color:#9ca3af;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Follow Us</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="padding:0 8px;"><a href="https://instagram.com/areton.id" style="color:#c9a96e;font-size:13px;text-decoration:none;">Instagram</a></td>
              <td style="color:#e5e7eb;font-size:11px;">&#124;</td>
              <td style="padding:0 8px;"><a href="https://areton.id" style="color:#c9a96e;font-size:13px;text-decoration:none;">Website</a></td>
              <td style="color:#e5e7eb;font-size:11px;">&#124;</td>
              <td style="padding:0 8px;"><a href="mailto:support@areton.id" style="color:#c9a96e;font-size:13px;text-decoration:none;">Support</a></td>
            </tr>
          </table>
        </td></tr>

        <!-- Legal -->
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;line-height:1.6;">
            &copy; ${year} ARETON.id &mdash; All rights reserved.
          </p>
          <p style="margin:0;color:#b0b7c3;font-size:10px;line-height:1.6;">
            <a href="https://areton.id/terms" style="color:#b0b7c3;text-decoration:underline;">Syarat &amp; Ketentuan</a>
            &nbsp;&middot;&nbsp;
            <a href="https://areton.id/privacy" style="color:#b0b7c3;text-decoration:underline;">Kebijakan Privasi</a>
            &nbsp;&middot;&nbsp;
            <a href="https://areton.id/unsubscribe" style="color:#b0b7c3;text-decoration:underline;">Berhenti Berlangganan</a>
          </p>
        </td></tr>

      </table>

      <!-- Bottom accent -->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0">
        <tr><td align="center" style="padding:20px 0;">
          <span style="color:#b0b7c3;font-size:10px;letter-spacing:1px;">ARETON.id &mdash; Jakarta, Indonesia</span>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── Helper builders ───

  private heading(text: string, subtitle?: string): string {
    return `
      <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#0a0f1c;letter-spacing:0.5px;">${text}</h1>
      ${subtitle ? `<p style="margin:0 0 24px;font-size:13px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p>` : '<div style="height:20px;"></div>'}
    `;
  }

  private paragraph(text: string): string {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#374151;">${text}</p>`;
  }

  private button(label: string, url: string, style: 'primary' | 'outline' = 'primary'): string {
    const primary = `background-color:#c9a96e;color:#0a0f1c;border:2px solid #c9a96e;`;
    const outline = `background-color:transparent;color:#c9a96e;border:2px solid #c9a96e;`;
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td align="center" style="padding:28px 0 24px;">
          <a href="${url}" target="_blank" style="display:inline-block;${style === 'primary' ? primary : outline}padding:14px 40px;border-radius:4px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:1px;text-transform:uppercase;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;">${label}</a>
        </td></tr>
      </table>
    `;
  }

  private divider(): string {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0;">
        <tr>
          <td style="width:45%;height:1px;background-color:#e8d5b0;">&nbsp;</td>
          <td style="width:10%;text-align:center;"><span style="color:#c9a96e;font-size:8px;">&#9670;</span></td>
          <td style="width:45%;height:1px;background-color:#e8d5b0;">&nbsp;</td>
        </tr>
      </table>
    `;
  }

  private detailCard(rows: Array<{ label: string; value: string | number | boolean | undefined }>, accent?: string): string {
    const borderColor = accent || '#e8d5b0';
    const rowsHtml = rows.map(r => `
      <tr>
        <td style="padding:12px 16px;font-size:12px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;width:40%;vertical-align:top;">${r.label}</td>
        <td style="padding:12px 16px;font-size:14px;color:#0a0f1c;font-weight:600;border-bottom:1px solid #f3f4f6;vertical-align:top;">${r.value ?? '—'}</td>
      </tr>
    `).join('');
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;border:1px solid ${borderColor};border-radius:8px;overflow:hidden;">
        <tr><td style="height:3px;background-color:${borderColor};">&nbsp;</td><td style="height:3px;background-color:${borderColor};">&nbsp;</td></tr>
        ${rowsHtml}
      </table>
    `;
  }

  private infoBox(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
    const colors = {
      info:    { bg: '#f8f9fc', border: '#c9a96e', text: '#374151', icon: '&#9432;' },
      success: { bg: '#f0fdf4', border: '#059669', text: '#065f46', icon: '&#10003;' },
      warning: { bg: '#fffbeb', border: '#d97706', text: '#92400e', icon: '&#9888;' },
      error:   { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: '&#10007;' },
    };
    const c = colors[type];
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
        <tr>
          <td style="background-color:${c.bg};border-left:3px solid ${c.border};border-radius:0 6px 6px 0;padding:16px 20px;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:${c.text};">${text}</p>
          </td>
        </tr>
      </table>
    `;
  }

  private greeting(name: string): string {
    return `<p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#374151;">Halo <strong style="color:#0a0f1c;">${name}</strong>,</p>`;
  }

  private signature(): string {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px;">
        <tr><td style="padding-top:20px;border-top:1px solid #f3f4f6;">
          <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;font-style:italic;">Salam hangat,</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#0a0f1c;">Tim ARETON.id</p>
        </td></tr>
      </table>
    `;
  }

  // ─── Template bodies ───

  private getTemplateBody(template: string, d: TemplateData): string {
    switch (template) {

      // ━━━ 1. EMAIL VERIFICATION ━━━
      case 'email-verification':
        return `
          ${this.heading('Verifikasi Email Anda', 'Satu langkah lagi untuk memulai')}
          ${this.greeting(String(d.name || 'User'))}
          ${this.paragraph('Terima kasih telah mendaftar di <strong>ARETON.id</strong>. Untuk keamanan akun Anda, silakan verifikasi alamat email dengan mengklik tombol di bawah ini.')}
          ${this.button('Verifikasi Email Saya', String(d.verifyUrl))}
          ${this.divider()}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
            <tr><td align="center">
              <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">Kode Verifikasi Manual</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a0f1c;border-radius:8px;overflow:hidden;">
                <tr><td style="padding:20px 36px;">
                  <span style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#c9a96e;">${d.code}</span>
                </td></tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Berlaku selama 24 jam</p>
            </td></tr>
          </table>
          ${this.infoBox('Jika Anda tidak merasa mendaftar di ARETON.id, abaikan email ini. Akun tidak akan diaktifkan.', 'info')}
          ${this.signature()}
        `;

      // ━━━ 2. WELCOME ━━━
      case 'welcome':
        return `
          ${this.heading('Selamat Datang', 'Akun Anda telah aktif')}
          ${this.greeting(String(d.name || 'User'))}
          ${this.paragraph('Selamat bergabung dengan <strong>ARETON.id</strong> — platform layanan pendamping profesional premium di Indonesia.')}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
            <tr>
              <td width="33%" style="text-align:center;padding:20px 8px;">
                <div style="display:inline-block;width:44px;height:44px;border:1px solid #e8d5b0;border-radius:50%;line-height:44px;text-align:center;margin-bottom:10px;">
                  <span style="color:#c9a96e;font-size:18px;">&#9733;</span>
                </div>
                <p style="margin:0;font-size:12px;font-weight:600;color:#0a0f1c;">Terverifikasi</p>
                <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Semua partner screened</p>
              </td>
              <td width="33%" style="text-align:center;padding:20px 8px;">
                <div style="display:inline-block;width:44px;height:44px;border:1px solid #e8d5b0;border-radius:50%;line-height:44px;text-align:center;margin-bottom:10px;">
                  <span style="color:#c9a96e;font-size:18px;">&#9830;</span>
                </div>
                <p style="margin:0;font-size:12px;font-weight:600;color:#0a0f1c;">Premium</p>
                <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Layanan berkualitas tinggi</p>
              </td>
              <td width="33%" style="text-align:center;padding:20px 8px;">
                <div style="display:inline-block;width:44px;height:44px;border:1px solid #e8d5b0;border-radius:50%;line-height:44px;text-align:center;margin-bottom:10px;">
                  <span style="color:#c9a96e;font-size:18px;">&#9741;</span>
                </div>
                <p style="margin:0;font-size:12px;font-weight:600;color:#0a0f1c;">Aman</p>
                <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Pembayaran escrow</p>
              </td>
            </tr>
          </table>
          ${this.paragraph('Mulailah menjelajahi katalog pendamping profesional kami dan temukan partner yang sesuai dengan kebutuhan Anda.')}
          ${this.button('Jelajahi Sekarang', 'https://areton.id/search')}
          ${this.infoBox('Lengkapi profil Anda untuk mendapatkan pengalaman yang lebih personal.', 'info')}
          ${this.signature()}
        `;

      // ━━━ 3. BOOKING CONFIRMED ━━━
      case 'booking-confirmed':
        return `
          ${this.heading('Booking Dikonfirmasi', 'Reservasi Anda telah disetujui')}
          ${this.greeting(String(d.clientName || 'User'))}
          ${this.paragraph('Kabar baik! Booking Anda telah dikonfirmasi oleh <strong>' + (d.escortName || 'partner') + '</strong>. Berikut detail reservasi Anda:')}
          ${this.detailCard([
            { label: 'Booking ID', value: d.bookingId },
            { label: 'Partner', value: d.escortName },
            { label: 'Tanggal', value: d.date },
            { label: 'Durasi', value: d.duration + ' jam' },
            { label: 'Lokasi', value: d.location || 'Akan dikonfirmasi' },
            { label: 'Total', value: 'Rp ' + d.amount },
          ])}
          ${this.button('Lihat Detail Booking', 'https://areton.id/bookings/' + d.bookingId)}
          ${this.infoBox('Pastikan Anda hadir tepat waktu. Jika ada perubahan, silakan hubungi partner melalui fitur chat.', 'info')}
          ${this.signature()}
        `;

      // ━━━ 4. BOOKING CANCELLED ━━━
      case 'booking-cancelled':
        return `
          ${this.heading('Booking Dibatalkan', 'Reservasi tidak dapat dilanjutkan')}
          ${this.greeting(String(d.clientName || d.name || 'User'))}
          ${this.paragraph('Kami informasikan bahwa booking berikut telah dibatalkan:')}
          ${this.detailCard([
            { label: 'Booking ID', value: d.bookingId },
            { label: 'Partner', value: d.escortName || '—' },
            { label: 'Tanggal', value: d.date || '—' },
            { label: 'Alasan', value: d.reason || 'Tidak disebutkan' },
          ], '#dc2626')}
          ${this.infoBox('Jika pembayaran sudah diterima, dana akan di-refund ke metode pembayaran Anda dalam 1–3 hari kerja.', 'warning')}
          ${this.paragraph('Anda dapat melakukan pemesanan ulang kapan saja melalui platform kami.')}
          ${this.button('Buat Booking Baru', 'https://areton.id/search', 'outline')}
          ${this.signature()}
        `;

      // ━━━ 5. BOOKING COMPLETED ━━━
      case 'booking-completed':
        return `
          ${this.heading('Layanan Selesai', 'Terima kasih telah menggunakan ARETON.id')}
          ${this.greeting(String(d.clientName || d.name || 'User'))}
          ${this.paragraph('Booking Anda telah selesai dengan sukses. Kami harap pengalaman Anda menyenangkan!')}
          ${this.detailCard([
            { label: 'Booking ID', value: d.bookingId },
            { label: 'Partner', value: d.escortName },
            { label: 'Durasi', value: d.duration ? d.duration + ' jam' : '—' },
            { label: 'Total', value: 'Rp ' + d.amount },
          ], '#059669')}
          ${this.divider()}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;background-color:#faf7f2;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#0a0f1c;">Bagaimana pengalaman Anda?</p>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Review Anda sangat berarti bagi partner dan komunitas kami.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding:0 4px;font-size:28px;color:#e8d5b0;">&#9733;</td>
                  <td style="padding:0 4px;font-size:28px;color:#e8d5b0;">&#9733;</td>
                  <td style="padding:0 4px;font-size:28px;color:#e8d5b0;">&#9733;</td>
                  <td style="padding:0 4px;font-size:28px;color:#e8d5b0;">&#9733;</td>
                  <td style="padding:0 4px;font-size:28px;color:#e8d5b0;">&#9733;</td>
                </tr>
              </table>
            </td></tr>
          </table>
          ${this.button('Berikan Review', 'https://areton.id/bookings/' + d.bookingId)}
          ${this.signature()}
        `;

      // ━━━ 6. PAYMENT RECEIVED ━━━
      case 'payment-received':
        return `
          ${this.heading('Pembayaran Diterima', 'Transaksi berhasil diproses')}
          ${this.greeting(String(d.name || 'User'))}
          ${this.paragraph('Pembayaran Anda telah berhasil kami terima dan diproses. Dana saat ini disimpan dalam sistem <strong>escrow</strong> untuk keamanan transaksi.')}
          ${this.detailCard([
            { label: 'Jumlah', value: 'Rp ' + d.amount },
            { label: 'Metode', value: d.method },
            { label: 'Booking ID', value: d.bookingId || '—' },
            { label: 'Status', value: 'Escrow — Terjamin' },
          ])}

          <!-- Escrow flow visual -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
            <tr>
              <td width="30%" style="text-align:center;padding:16px 4px;">
                <div style="display:inline-block;width:36px;height:36px;background-color:#059669;border-radius:50%;line-height:36px;text-align:center;">
                  <span style="color:#fff;font-size:14px;font-weight:700;">&#10003;</span>
                </div>
                <p style="margin:8px 0 0;font-size:11px;color:#059669;font-weight:600;">Dibayar</p>
              </td>
              <td width="5%" style="text-align:center;vertical-align:middle;"><span style="color:#e8d5b0;">&#9654;</span></td>
              <td width="30%" style="text-align:center;padding:16px 4px;">
                <div style="display:inline-block;width:36px;height:36px;background-color:#c9a96e;border-radius:50%;line-height:36px;text-align:center;">
                  <span style="color:#fff;font-size:14px;font-weight:700;">&#8987;</span>
                </div>
                <p style="margin:8px 0 0;font-size:11px;color:#c9a96e;font-weight:600;">Escrow</p>
              </td>
              <td width="5%" style="text-align:center;vertical-align:middle;"><span style="color:#e5e7eb;">&#9654;</span></td>
              <td width="30%" style="text-align:center;padding:16px 4px;">
                <div style="display:inline-block;width:36px;height:36px;background-color:#e5e7eb;border-radius:50%;line-height:36px;text-align:center;">
                  <span style="color:#9ca3af;font-size:14px;">&#10003;</span>
                </div>
                <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">Selesai</p>
              </td>
            </tr>
          </table>

          ${this.infoBox('Dana akan secara otomatis dilepaskan ke partner setelah layanan selesai dan dikonfirmasi.', 'info')}
          ${this.signature()}
        `;

      // ━━━ 7. PAYMENT RELEASED ━━━
      case 'payment-released':
        return `
          ${this.heading('Pembayaran Dilepaskan', 'Dana telah dikirim ke rekening Anda')}
          ${this.greeting(String(d.name || 'Partner'))}
          ${this.paragraph('Selamat! Pembayaran untuk layanan Anda telah dilepaskan dari escrow dan sedang diproses untuk transfer ke rekening Anda.')}
          ${this.detailCard([
            { label: 'Jumlah', value: 'Rp ' + d.amount },
            { label: 'Booking ID', value: d.bookingId },
          ], '#059669')}
          ${this.infoBox('Dana akan masuk ke rekening Anda dalam <strong>1–2 hari kerja</strong>. Waktu transfer tergantung pada bank tujuan.', 'success')}
          ${this.paragraph('Terima kasih atas profesionalisme Anda. Terus jaga kualitas layanan untuk mendapatkan lebih banyak booking.')}
          ${this.button('Lihat Riwayat Pembayaran', 'https://areton.id/escort/earnings', 'outline')}
          ${this.signature()}
        `;

      // ━━━ 8. PASSWORD RESET ━━━
      case 'password-reset':
        return `
          ${this.heading('Reset Password', 'Permintaan pengaturan ulang kata sandi')}
          ${this.greeting(String(d.name || 'User'))}
          ${this.paragraph('Kami menerima permintaan untuk mengatur ulang password akun ARETON.id Anda. Klik tombol di bawah untuk membuat password baru:')}
          ${this.button('Atur Ulang Password', String(d.resetUrl))}
          ${this.infoBox('Link ini hanya berlaku selama <strong>1 jam</strong>. Setelah itu, Anda perlu mengajukan permintaan baru.', 'warning')}
          ${this.divider()}
          ${this.paragraph('<span style="font-size:13px;color:#6b7280;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Password Anda akan tetap aman dan tidak berubah.</span>')}
          ${this.signature()}
        `;

      // ━━━ 9. ESCORT APPROVED ━━━
      case 'escort-approved':
        return `
          ${this.heading('Profil Disetujui', 'Selamat, Anda resmi menjadi partner ARETON.id')}
          ${this.greeting(String(d.name || 'Partner'))}
          ${this.paragraph('Tim verifikasi kami telah mereview dan menyetujui profil partner Anda. Anda sekarang resmi terdaftar sebagai <strong>Companion Partner</strong> di ARETON.id.')}

          <!-- Celebration card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background-color:#0a0f1c;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:32px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;border:2px solid #c9a96e;border-radius:50%;line-height:60px;text-align:center;margin-bottom:12px;">
                <span style="color:#c9a96e;font-size:28px;">&#10003;</span>
              </div>
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#c9a96e;">Verified Partner</p>
              <p style="margin:0;font-size:12px;color:#6b7280;letter-spacing:1px;">${String(d.name || 'Partner').toUpperCase()}</p>
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
            <tr>
              <td width="50%" style="padding:12px 8px 12px 0;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:12px;color:#c9a96e;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Langkah Selanjutnya</p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Lengkapi jadwal ketersediaan dan atur tarif Anda.</p>
              </td>
              <td width="50%" style="padding:12px 0 12px 8px;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:12px;color:#c9a96e;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tips Sukses</p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Upload foto profesional dan tulis bio yang menarik.</p>
              </td>
            </tr>
          </table>

          ${this.button('Kelola Profil Saya', 'https://areton.id/escort/profile')}
          ${this.signature()}
        `;

      // ━━━ 10. NEW REVIEW ━━━
      case 'new-review':
        return `
          ${this.heading('Review Baru', 'Seseorang memberikan penilaian untuk Anda')}
          ${this.greeting(String(d.name || 'Partner'))}
          ${this.paragraph('<strong>' + (d.reviewerName || 'Seorang klien') + '</strong> telah memberikan review setelah menggunakan layanan Anda:')}

          <!-- Review card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;border:1px solid #e8d5b0;border-radius:8px;overflow:hidden;">
            <tr><td style="background-color:#faf7f2;padding:24px 24px 20px;">
              <!-- Stars -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  ${Array.from({ length: 5 }, (_, i) => `<td style="padding-right:4px;"><span style="font-size:22px;color:${i < (Number(d.rating) || 5) ? '#c9a96e' : '#e5e7eb'};">&#9733;</span></td>`).join('')}
                  <td style="padding-left:12px;"><span style="font-size:14px;font-weight:700;color:#0a0f1c;">${d.rating || 5}/5</span></td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:20px 24px;border-top:1px solid #e8d5b0;">
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-style:italic;color:#374151;line-height:1.7;">&ldquo;${d.comment || 'Tanpa komentar'}&rdquo;</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">— ${d.reviewerName || 'Anonim'}</p>
            </td></tr>
          </table>

          ${this.paragraph('Review positif membantu meningkatkan visibilitas profil Anda dan menarik lebih banyak klien.')}
          ${this.button('Lihat Semua Review', 'https://areton.id/escort/reviews', 'outline')}
          ${this.signature()}
        `;

      // ━━━ DEFAULT ━━━
      default:
        return `
          ${this.heading('Notifikasi', 'ARETON.id')}
          ${this.paragraph(String(d.message || 'Anda memiliki notifikasi baru dari ARETON.id.'))}
          ${this.button('Buka Dashboard', 'https://areton.id/dashboard')}
          ${this.signature()}
        `;
    }
  }
}
