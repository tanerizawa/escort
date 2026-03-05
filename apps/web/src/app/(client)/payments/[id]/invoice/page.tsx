'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
  client: { name: string; email: string };
  escort: { name: string };
  booking: {
    id: string;
    serviceType: string;
    startTime: string;
    endTime: string;
    location: string;
    durationHours: number;
  };
  breakdown: {
    serviceAmount: number;
    platformFee: number;
    escortPayout: number;
    tipAmount: number;
    totalPaid: number;
  };
  paymentMethod: string;
  paymentGatewayRef: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Belum Bayar', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  ESCROW: { label: 'Dibayar (Escrow)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  RELEASED: { label: 'Lunas', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  REFUNDED: { label: 'Refund', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  FAILED: { label: 'Gagal', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

export default function InvoicePage() {
  const params = useParams();
  const paymentId = params.id as string;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [paymentId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${paymentId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInvoice(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-dark-400">Invoice tidak ditemukan</p>
      </div>
    );
  }

  const statusInfo = statusLabels[invoice.status] || statusLabels.PENDING;

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Action Bar - hidden in print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-light text-dark-100">Invoice</h1>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak / Download PDF
        </button>
      </div>

      {/* Invoice Content */}
      <div
        ref={invoiceRef}
        className="rounded-2xl border border-dark-700/30 bg-dark-800/40 p-8 print:border-gray-200 print:bg-white print:text-gray-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-dark-700/30 pb-6 print:border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold tracking-wider text-brand-400 print:text-amber-600">
              ARETON<span className="text-dark-400 print:text-gray-400">.id</span>
            </h2>
            <p className="mt-1 text-xs text-dark-400 print:text-gray-500">
              Professional Companion Service
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-medium text-dark-100 print:text-gray-900">
              {invoice.invoiceNumber}
            </p>
            <p className="mt-1 text-xs text-dark-400 print:text-gray-500">
              Diterbitkan: {formatDate(invoice.issuedAt)}
            </p>
            <div className="mt-2">
              <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${statusInfo.color} print:border-gray-300 print:bg-gray-100 print:text-gray-700`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Escort Info */}
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500 print:text-gray-400">
              Ditagihkan Kepada
            </p>
            <p className="mt-2 text-sm font-medium text-dark-100 print:text-gray-900">{invoice.client.name}</p>
            <p className="text-xs text-dark-400 print:text-gray-500">{invoice.client.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500 print:text-gray-400">
              Escort Partner
            </p>
            <p className="mt-2 text-sm font-medium text-dark-100 print:text-gray-900">{invoice.escort.name}</p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="mt-8 rounded-xl border border-dark-700/20 bg-dark-800/20 p-5 print:border-gray-200 print:bg-gray-50">
          <p className="text-xs font-medium uppercase tracking-wider text-dark-500 print:text-gray-400">
            Detail Booking
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dark-500 print:text-gray-400">Tipe Layanan:</span>{' '}
              <span className="text-dark-100 print:text-gray-900">{invoice.booking.serviceType}</span>
            </div>
            <div>
              <span className="text-dark-500 print:text-gray-400">Durasi:</span>{' '}
              <span className="text-dark-100 print:text-gray-900">{invoice.booking.durationHours} jam</span>
            </div>
            <div>
              <span className="text-dark-500 print:text-gray-400">Mulai:</span>{' '}
              <span className="text-dark-100 print:text-gray-900">{formatDateTime(invoice.booking.startTime)}</span>
            </div>
            <div>
              <span className="text-dark-500 print:text-gray-400">Selesai:</span>{' '}
              <span className="text-dark-100 print:text-gray-900">{formatDateTime(invoice.booking.endTime)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-dark-500 print:text-gray-400">Lokasi:</span>{' '}
              <span className="text-dark-100 print:text-gray-900">{invoice.booking.location}</span>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/30 print:border-gray-200">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-dark-500 print:text-gray-400">
                  Deskripsi
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500 print:text-gray-400">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/10 print:divide-gray-100">
              <tr>
                <td className="py-3 text-dark-200 print:text-gray-700">
                  {invoice.booking.serviceType} — {invoice.booking.durationHours} jam
                </td>
                <td className="py-3 text-right text-dark-100 print:text-gray-900">
                  {formatCurrency(invoice.breakdown.serviceAmount)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-dark-400 print:text-gray-500">Platform Fee (20%)</td>
                <td className="py-3 text-right text-dark-400 print:text-gray-500">
                  {formatCurrency(invoice.breakdown.platformFee)}
                </td>
              </tr>
              {invoice.breakdown.tipAmount > 0 && (
                <tr>
                  <td className="py-3 text-brand-400 print:text-amber-600">Tip</td>
                  <td className="py-3 text-right text-brand-400 print:text-amber-600">
                    {formatCurrency(invoice.breakdown.tipAmount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-dark-700/30 print:border-gray-300">
                <td className="pt-4 text-base font-semibold text-dark-100 print:text-gray-900">
                  Total
                </td>
                <td className="pt-4 text-right text-lg font-bold text-brand-400 print:text-amber-600">
                  {formatCurrency(invoice.breakdown.totalPaid)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Info */}
        <div className="mt-8 border-t border-dark-700/30 pt-6 print:border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-dark-500 print:text-gray-400">Metode Pembayaran:</span>{' '}
              <span className="text-dark-200 print:text-gray-700">{invoice.paymentMethod}</span>
            </div>
            {invoice.paidAt && (
              <div>
                <span className="text-dark-500 print:text-gray-400">Dibayar pada:</span>{' '}
                <span className="text-dark-200 print:text-gray-700">{formatDate(invoice.paidAt)}</span>
              </div>
            )}
          </div>
          {invoice.paymentGatewayRef && (
            <p className="mt-2 text-xs text-dark-500 print:text-gray-400">
              Ref: {invoice.paymentGatewayRef}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-dark-700/30 pt-6 text-center print:border-gray-200">
          <p className="text-xs text-dark-500 print:text-gray-400">
            Ini adalah dokumen yang dihasilkan secara otomatis oleh ARETON.id.
          </p>
          <p className="mt-1 text-xs text-dark-600 print:text-gray-300">
            Untuk pertanyaan mengenai invoice ini, hubungi support@areton.id
          </p>
        </div>
      </div>
    </div>
  );
}
