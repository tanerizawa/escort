'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function EscortDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">
          Dashboard Partner
        </h1>
        <p className="mt-1 text-sm text-dark-400">
          Selamat datang kembali, <span className="text-brand-400">{user?.firstName}</span>. 
          Kelola booking dan profil Anda dari sini.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Booking Bulan Ini', value: '0', change: '—', icon: '📋' },
          { label: 'Pendapatan Bulan Ini', value: 'Rp 0', change: '—', icon: '💰' },
          { label: 'Rating', value: '—', change: 'Belum ada ulasan', icon: '⭐' },
          { label: 'Profile Views', value: '0', change: '—', icon: '👁️' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-light text-dark-100">{stat.value}</p>
                  <p className="mt-1 text-xs text-dark-500">{stat.change}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status & Profile Completion */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Profile Status */}
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-dark-200">Status Profil</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Foto Profil', done: false },
                { label: 'Bio & Deskripsi', done: false },
                { label: 'Spesialisasi', done: false },
                { label: 'Tarif & Harga', done: false },
                { label: 'Jadwal Ketersediaan', done: false },
                { label: 'Verifikasi KTP', done: false },
                { label: 'Sertifikasi', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">{item.label}</span>
                  <Badge variant={item.done ? 'success' : 'warning'} size="sm">
                    {item.done ? 'Selesai' : 'Belum'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Lengkapi Profil
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-dark-200">Booking Mendatang</h3>
              <Button variant="ghost" size="sm">
                Lihat Semua
              </Button>
            </div>
            <div className="mt-4">
              <div className="py-8 text-center">
                <p className="text-sm text-dark-500">Belum ada booking mendatang.</p>
                <p className="mt-1 text-xs text-dark-600">
                  Lengkapi profil Anda agar client menemukan Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="mt-8" variant="outline">
        <CardContent>
          <h3 className="text-sm font-medium text-dark-200">💡 Tips untuk Partner Baru</h3>
          <ul className="mt-3 space-y-2">
            {[
              'Lengkapi profil Anda 100% untuk meningkatkan visibilitas di pencarian',
              'Upload foto profesional berkualitas tinggi',
              'Atur jadwal ketersediaan secara teratur',
              'Respon booking dalam waktu maksimal 30 menit untuk rating lebih tinggi',
              'Jaga rating di atas 4.5 untuk maintain tier Anda',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-dark-400">
                <span className="mt-0.5 text-brand-400">▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
