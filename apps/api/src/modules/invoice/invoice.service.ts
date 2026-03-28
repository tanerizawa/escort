import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate invoice HTML for a payment
   */
  async generateInvoice(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            escort: {
              select: {
                id: true, firstName: true, lastName: true,
                escortProfile: { select: { tier: true, hourlyRate: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');

    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner) throw new ForbiddenException('Akses ditolak');

    const booking = payment.booking;
    const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}`;
    const durationHours = Math.round(
      (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 3600000,
    );

    const invoice = {
      invoiceNumber,
      date: payment.paidAt || payment.createdAt,
      dueDate: payment.paidAt || payment.createdAt,
      status: payment.status,

      client: {
        name: `${booking.client.firstName} ${booking.client.lastName || ''}`.trim(),
        email: booking.client.email,
        phone: booking.client.phone,
      },

      escort: {
        name: `${booking.escort.firstName} ${booking.escort.lastName || ''}`.trim(),
        tier: booking.escort.escortProfile?.tier,
      },

      booking: {
        id: booking.id.substring(0, 8).toUpperCase(),
        serviceType: booking.serviceType,
        date: booking.startTime,
        duration: `${durationHours} jam`,
        location: booking.location,
      },

      lineItems: [
        {
          description: `Layanan ${booking.serviceType} — ${durationHours} jam`,
          quantity: durationHours,
          unitPrice: Number(booking.escort.escortProfile?.hourlyRate || 0),
          total: Number(payment.amount),
        },
      ],

      subtotal: Number(payment.amount),
      platformFee: Number(payment.platformFee),
      tip: Number(payment.tipAmount || 0),
      total: Number(payment.amount) + Number(payment.tipAmount || 0),

      paymentMethod: payment.method,
      paymentRef: payment.paymentGatewayRef,
      paymentType: payment.paymentType,
    };

    return invoice;
  }

  /**
   * Generate printable invoice HTML
   */
  async generateInvoiceHTML(paymentId: string, userId: string): Promise<string> {
    const inv = await this.generateInvoice(paymentId, userId);

    const formatCurrency = (amount: number) =>
      `Rp ${amount.toLocaleString('id-ID')}`;

    const formatDate = (date: Date | string) =>
      new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1a2e; background: #f8fafc; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #0b1120; padding: 32px; display: flex; justify-content: space-between; align-items: center; }
    .brand { color: #e8e8e8; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
    .brand span { color: #c9a96e; }
    .inv-number { color: #c9a96e; font-size: 14px; text-align: right; }
    .inv-number .label { color: #8e99a4; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 32px; }
    .parties { display: flex; gap: 32px; margin-bottom: 32px; }
    .party { flex: 1; }
    .party h4 { color: #c9a96e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .party p { color: #333; font-size: 14px; line-height: 1.6; }
    .details { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .detail-item .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item .value { font-size: 14px; color: #1a1a2e; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: left; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .totals { border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 14px; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: 700; color: #0b1120; border-top: 2px solid #0b1120; margin-top: 8px; padding-top: 12px; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #888; font-size: 12px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-RELEASED, .status-ESCROW { background: #dcfce7; color: #166534; }
    .status-PENDING { background: #fef3c7; color: #92400e; }
    .status-REFUNDED { background: #fee2e2; color: #991b1b; }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice { box-shadow: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">ARETON<span>.</span>id</div>
      <div class="inv-number">
        <div class="label">Invoice</div>
        <div style="font-size:20px;margin-top:4px;">${inv.invoiceNumber}</div>
        <div style="margin-top:4px;font-size:12px;color:#8e99a4;">
          <span class="status status-${inv.status}">${inv.status}</span>
        </div>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        <div class="party">
          <h4>Diterbitkan Untuk</h4>
          <p><strong>${inv.client.name}</strong></p>
          <p>${inv.client.email}</p>
          ${inv.client.phone ? `<p>${inv.client.phone}</p>` : ''}
        </div>
        <div class="party">
          <h4>Partner</h4>
          <p><strong>${inv.escort.name}</strong></p>
          <p>Tier: ${inv.escort.tier || '-'}</p>
        </div>
      </div>

      <div class="details">
        <div class="details-grid">
          <div class="detail-item">
            <div class="label">Tanggal Invoice</div>
            <div class="value">${formatDate(inv.date)}</div>
          </div>
          <div class="detail-item">
            <div class="label">Booking ID</div>
            <div class="value">${inv.booking.id}</div>
          </div>
          <div class="detail-item">
            <div class="label">Metode Bayar</div>
            <div class="value">${inv.paymentMethod || '-'}</div>
          </div>
          <div class="detail-item">
            <div class="label">Tipe Bayar</div>
            <div class="value">${inv.paymentType}</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th style="text-align:center;">Durasi</th>
            <th style="text-align:right;">Harga/Jam</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${inv.lineItems.map((item) => `
          <tr>
            <td>${item.description}</td>
            <td style="text-align:center;">${item.quantity} jam</td>
            <td style="text-align:right;">${formatCurrency(item.unitPrice)}</td>
            <td style="text-align:right;">${formatCurrency(item.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(inv.subtotal)}</span>
        </div>
        <div class="total-row" style="color:#888;">
          <span>Platform Fee (20%)</span>
          <span>${formatCurrency(inv.platformFee)}</span>
        </div>
        ${inv.tip > 0 ? `
        <div class="total-row">
          <span>Tip</span>
          <span>${formatCurrency(inv.tip)}</span>
        </div>` : ''}
        <div class="total-row grand">
          <span>Total</span>
          <span>${formatCurrency(inv.total)}</span>
        </div>
      </div>

      ${inv.paymentRef ? `
      <div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px;">
        <p style="font-size:12px;color:#888;">Referensi Pembayaran: <strong>${inv.paymentRef}</strong></p>
      </div>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ARETON.id — Professional Companion Service</p>
      <p style="margin-top:4px;">Invoice ini digenerate secara otomatis dan sah tanpa tanda tangan.</p>
    </div>
  </div>
</body>
</html>`;
  }
}
