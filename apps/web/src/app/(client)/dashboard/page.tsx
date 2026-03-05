'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">
          Halo, <span className="text-brand-400">{user?.firstName || 'User'}</span>
        </h1>
        <p className="mt-1 text-sm text-dark-400">
          Selamat datang di dashboard Anda. Apa yang ingin Anda lakukan hari ini?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Booking', value: '0', icon: '📋' },
          { label: 'Booking Aktif', value: '0', icon: '✨' },
          { label: 'Ulasan Diberikan', value: '0', icon: '⭐' },
          { label: 'Partner Favorit', value: '0', icon: '❤️' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-light text-dark-100">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-light text-dark-200">Aksi Cepat</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="outline" className="group cursor-pointer hover:border-brand-400/30 transition-all">
            <Link href="/escorts" className="block">
              <CardContent>
                <h3 className="text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors">
                  🔍 Cari Partner
                </h3>
                <p className="mt-1 text-xs text-dark-500">
                  Temukan pendamping profesional untuk kebutuhan Anda
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card variant="outline" className="group cursor-pointer hover:border-brand-400/30 transition-all">
            <Link href="/bookings" className="block">
              <CardContent>
                <h3 className="text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors">
                  📅 Lihat Booking
                </h3>
                <p className="mt-1 text-xs text-dark-500">
                  Kelola booking aktif dan riwayat booking Anda
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card variant="outline" className="group cursor-pointer hover:border-brand-400/30 transition-all">
            <Link href="/favorites" className="block">
              <CardContent>
                <h3 className="text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors">
                  ❤️ Favorit Saya
                </h3>
                <p className="mt-1 text-xs text-dark-500">
                  Lihat daftar partner favorit pilihan Anda
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Bookings Placeholder */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-light text-dark-200">Booking Terbaru</h2>
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </Link>
        </div>
        <Card className="mt-4">
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-sm text-dark-500">Belum ada booking.</p>
              <Link href="/escorts">
                <Button variant="outline" size="sm" className="mt-3">
                  Cari Partner Sekarang
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
