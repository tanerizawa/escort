'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const statusConfig = {
  PENDING: { label: 'Menunggu', variant: 'warning' as const },
  CONFIRMED: { label: 'Dikonfirmasi', variant: 'info' as const },
  ONGOING: { label: 'Berlangsung', variant: 'brand' as const },
  COMPLETED: { label: 'Selesai', variant: 'success' as const },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' as const },
};

export default function BookingsPage() {
  // Placeholder — akan diganti dengan react-query
  const bookings: any[] = [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Booking Saya</h1>
          <p className="mt-1 text-sm text-dark-400">
            Kelola semua booking aktif dan riwayat Anda
          </p>
        </div>
        <Link href="/escorts">
          <Button size="sm">
            + Booking Baru
          </Button>
        </Link>
      </div>

      {/* Tab Filters */}
      <div className="mb-6 flex gap-2 border-b border-dark-700/30 pb-3">
        {['Semua', 'Aktif', 'Selesai', 'Dibatalkan'].map((tab) => (
          <button
            key={tab}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              tab === 'Semua'
                ? 'bg-brand-400/10 text-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">📅</div>
              <h3 className="text-lg font-light text-dark-200">Belum Ada Booking</h3>
              <p className="mt-2 text-sm text-dark-500">
                Anda belum memiliki booking. Mulai cari partner untuk membuat booking pertama.
              </p>
              <Link href="/escorts">
                <Button size="sm" className="mt-4">
                  Cari Partner
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking: any) => (
            <Card key={booking.id} variant="outline" className="hover:border-dark-600/50 transition-all">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-dark-100">
                          {booking.escortName}
                        </h3>
                        <Badge variant={statusConfig[booking.status as keyof typeof statusConfig]?.variant}>
                          {statusConfig[booking.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-dark-500">
                        {booking.serviceType} — {booking.date} • {booking.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-400">
                      Rp {booking.totalPrice?.toLocaleString('id-ID')}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-1">
                      Detail
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
