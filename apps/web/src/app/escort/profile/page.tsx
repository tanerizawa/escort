'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface EscortProfile {
  bio?: string;
  languages: string[];
  skills: string[];
  hourlyRate: number;
  portfolioUrls: string[];
  videoIntroUrl?: string;
  ratingAvg: number;
  totalReviews: number;
  tier: string;
  isApproved: boolean;
  certifications: Array<{
    id: string;
    name: string;
    issuingOrganization: string;
    isVerified: boolean;
  }>;
}

export default function EscortProfilePage() {
  const { user, fetchProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<EscortProfile | null>(null);

  const [form, setForm] = useState({
    bio: '',
    languages: '',
    skills: '',
    hourlyRate: 0,
    portfolioUrls: '',
    videoIntroUrl: '',
  });

  // Certification form
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuingOrganization: '',
    documentUrl: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const ep = res.data?.escortProfile;
      if (ep) {
        setProfile(ep);
        setForm({
          bio: ep.bio || '',
          languages: (ep.languages || []).join(', '),
          skills: (ep.skills || []).join(', '),
          hourlyRate: ep.hourlyRate || 0,
          portfolioUrls: (ep.portfolioUrls || []).join('\n'),
          videoIntroUrl: ep.videoIntroUrl || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/escorts/me/profile', {
        bio: form.bio,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(form.hourlyRate),
        portfolioUrls: form.portfolioUrls.split('\n').map((s) => s.trim()).filter(Boolean),
        videoIntroUrl: form.videoIntroUrl || undefined,
      });
      await loadProfile();
      setSuccess('Profil escort berhasil diperbarui');
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memperbarui profil escort');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCert = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/escorts/me/certifications', certForm);
      await loadProfile();
      setShowCertForm(false);
      setCertForm({ name: '', issuingOrganization: '', documentUrl: '' });
      setSuccess('Sertifikasi berhasil ditambahkan');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menambahkan sertifikasi');
    }
  };

  const handleDeleteCert = async (certId: string) => {
    try {
      await api.delete(`/escorts/me/certifications/${certId}`);
      await loadProfile();
      setSuccess('Sertifikasi berhasil dihapus');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menghapus sertifikasi');
    }
  };

  const tierColors: Record<string, string> = {
    SILVER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    GOLD: 'bg-brand-400/10 text-brand-400 border-brand-400/20',
    PLATINUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DIAMOND: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Profil Escort</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola profil layanan dan sertifikasi Anda</p>
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

      {/* Status Card */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Avatar"
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-400/30"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10 ring-2 ring-brand-400/30">
                  <span className="text-xl font-medium text-brand-400">
                    {user?.firstName?.[0] || 'E'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-dark-100">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-xs text-dark-400">{user?.email}</p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              {profile?.tier && (
                <Badge className={tierColors[profile.tier] || ''}>
                  {profile.tier}
                </Badge>
              )}
              <Badge className={profile?.isApproved
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }>
                {profile?.isApproved ? 'Terverifikasi' : 'Menunggu Verifikasi'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-dark-700/50 pt-4">
            <div className="text-center">
              <p className="text-lg font-medium text-brand-400">{profile?.ratingAvg?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-dark-500">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-dark-100">{profile?.totalReviews || 0}</p>
              <p className="text-xs text-dark-500">Ulasan</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-dark-100">
                Rp {(profile?.hourlyRate || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-dark-500">Per Jam</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details / Edit */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Detail Layanan</h3>
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Bio</label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder="Ceritakan tentang diri Anda dan layanan yang ditawarkan..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Tarif Per Jam (Rp)</label>
                <Input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                  min={100000}
                  step={50000}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Bahasa (pisahkan dengan koma)</label>
                <Input
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="Indonesia, English, Mandarin"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Keahlian (pisahkan dengan koma)</label>
                <Input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="Public Speaking, Networking, Wine Tasting"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Portfolio URLs (satu per baris)</label>
                <Textarea
                  value={form.portfolioUrls}
                  onChange={(e) => setForm({ ...form, portfolioUrls: e.target.value })}
                  rows={3}
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Video Intro URL</label>
                <Input
                  type="url"
                  value={form.videoIntroUrl}
                  onChange={(e) => setForm({ ...form, videoIntroUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-dark-400">Bio</span>
                <p className="mt-1 text-sm text-dark-200">{profile?.bio || '-'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-dark-400">Bahasa</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(profile?.languages || []).map((lang) => (
                      <Badge key={lang}>{lang}</Badge>
                    ))}
                    {(!profile?.languages?.length) && <span className="text-sm text-dark-500">-</span>}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-dark-400">Keahlian</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(profile?.skills || []).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                    {(!profile?.skills?.length) && <span className="text-sm text-dark-500">-</span>}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm text-dark-400">Video Intro</span>
                <p className="mt-1 text-sm text-dark-200">
                  {profile?.videoIntroUrl ? (
                    <a href={profile.videoIntroUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                      {profile.videoIntroUrl}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-dark-400">Portfolio</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(profile?.portfolioUrls || []).map((url, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-dark-700">
                      <img src={url} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {(!profile?.portfolioUrls?.length) && (
                    <p className="col-span-3 text-sm text-dark-500">Belum ada portfolio</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Sertifikasi</h3>
            <Button variant="outline" size="sm" onClick={() => setShowCertForm(!showCertForm)}>
              {showCertForm ? 'Batal' : '+ Tambah'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCertForm && (
            <form onSubmit={handleAddCert} className="mb-6 space-y-3 rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">Nama Sertifikasi</label>
                <Input
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  placeholder="First Aid Certificate"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">Institusi Penerbit</label>
                <Input
                  value={certForm.issuingOrganization}
                  onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                  placeholder="Red Cross Indonesia"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">URL Dokumen</label>
                <Input
                  type="url"
                  value={certForm.documentUrl}
                  onChange={(e) => setCertForm({ ...certForm, documentUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" size="sm">Tambah Sertifikasi</Button>
            </form>
          )}

          {profile?.certifications?.length ? (
            <div className="space-y-3">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-lg border border-dark-700/50 bg-dark-800/30 p-3">
                  <div>
                    <p className="text-sm font-medium text-dark-200">{cert.name}</p>
                    <p className="text-xs text-dark-400">{cert.issuingOrganization}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cert.isVerified
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }>
                      {cert.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                    <button
                      onClick={() => handleDeleteCert(cert.id)}
                      className="rounded p-1 text-dark-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-dark-500 py-4">
              Belum ada sertifikasi. Tambahkan sertifikasi untuk meningkatkan kepercayaan client.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
