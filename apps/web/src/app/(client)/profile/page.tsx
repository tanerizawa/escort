'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function ClientProfilePage() {
  const { user, fetchProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePhoto: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: (user as any).phone || '',
        profilePhoto: user.profilePhoto || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/users/me', form);
      await fetchProfile();
      setSuccess('Profil berhasil diperbarui');
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Profil Saya</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola informasi akun Anda</p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Avatar Section */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-400/30"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-400/10 ring-2 ring-brand-400/30">
                  <span className="text-2xl font-medium text-brand-400">
                    {user?.firstName?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-dark-100">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-dark-400">{user?.email}</p>
              <p className="mt-1 text-xs text-dark-500">
                {user?.role === 'CLIENT' ? 'Client' : user?.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Informasi Personal</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Depan</label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Belakang</label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">No. Telepon</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+6281234567890"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">URL Foto Profil</label>
                <Input
                  type="url"
                  value={form.profilePhoto}
                  onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })}
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-dark-500">Upload foto akan tersedia segera</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Nama Depan', value: user?.firstName },
                { label: 'Nama Belakang', value: user?.lastName },
                { label: 'Email', value: user?.email },
                { label: 'Telepon', value: (user as any)?.phone || '-' },
                { label: 'Role', value: user?.role },
                { label: 'Status Verifikasi', value: user?.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between border-b border-dark-700/50 pb-3 last:border-0">
                  <span className="text-sm text-dark-400">{field.label}</span>
                  <span className="text-sm font-medium text-dark-200">{field.value || '-'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
