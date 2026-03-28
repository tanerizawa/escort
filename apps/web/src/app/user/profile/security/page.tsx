'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';

export default function SecuritySettingsPage() {
  // ── 2FA State ──────────────────────────────────
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const res = await api.get('/auth/2fa/status');
      const d = res.data?.data || res.data;
      setTwoFAEnabled(d.twoFactorEnabled);
    } catch {
      // ignore
    }
  };

  const startSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/2fa/setup');
      const d = res.data?.data || res.data;
      setSecret(d.secret);
      setOtpauthUrl(d.otpauthUrl);
      setSetupMode(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memulai setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (verifyCode.length !== 6) {
      setError('Masukkan kode 6 digit');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/2fa/verify-setup', { code: verifyCode });
      const d = res.data?.data || res.data;
      setBackupCodes(d.backupCodes || []);
      setTwoFAEnabled(true);
      setSetupMode(false);
      setMessage('2FA berhasil diaktifkan!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kode tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (disableCode.length !== 6) {
      setError('Masukkan kode 6 digit');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/disable', { code: disableCode });
      setTwoFAEnabled(false);
      setDisableCode('');
      setMessage('2FA berhasil dinonaktifkan');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menonaktifkan 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Keamanan Akun</h1>

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* ── 2FA Card ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-gray-400 mt-1">
                Tambahkan lapisan keamanan ekstra dengan kode TOTP
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              twoFAEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-600/20 text-gray-400'
            }`}>
              {twoFAEnabled ? 'Aktif' : 'Nonaktif'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!twoFAEnabled && !setupMode && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Gunakan aplikasi autentikator seperti Google Authenticator, Authy, atau 1Password
                untuk menghasilkan kode verifikasi setiap kali login.
              </p>
              <Button onClick={startSetup} disabled={loading}>
                {loading ? 'Memproses...' : 'Aktifkan 2FA'}
              </Button>
            </div>
          )}

          {setupMode && (
            <WizardShell totalSteps={2}>
              <StepIndicator labels={['Scan QR Code', 'Verifikasi Kode']} />

              <WizardStep step={0}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-light text-white">Scan QR Code</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Scan dengan aplikasi autentikator (Google Authenticator, Authy, dll)
                  </p>
                </div>

                {/* QR Code Image */}
                <div className="flex justify-center bg-white rounded-lg p-4 w-fit mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`}
                    alt="2FA QR Code"
                    width={200}
                    height={200}
                  />
                </div>

                {/* Manual entry */}
                <div className="mx-auto mt-4 max-w-sm bg-dark-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Kode Manual:</p>
                  <p className="text-brand-400 font-mono text-sm tracking-wider select-all">
                    {secret}
                  </p>
                </div>

                <WizardNavigation
                  prevLabel="Batal"
                  onPrev={() => {
                    setSetupMode(false);
                    setSecret('');
                    setOtpauthUrl('');
                    setVerifyCode('');
                  }}
                />
              </WizardStep>

              <WizardStep step={1}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h3 className="text-lg font-light text-white">Verifikasi Kode</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Masukkan kode 6 digit dari aplikasi autentikator
                  </p>
                </div>

                <div className="mx-auto max-w-xs">
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-[0.5em]"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mx-auto mt-4 max-w-xs rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <WizardNavigation
                  nextLabel={loading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                  nextDisabled={loading || verifyCode.length !== 6}
                  onNext={() => { verifySetup(); return false; }}
                />
              </WizardStep>
            </WizardShell>
          )}

          {twoFAEnabled && !setupMode && (
            <div className="space-y-4">
              {/* Show backup codes if just enabled */}
              {backupCodes.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                  <h3 className="text-yellow-400 font-medium">Backup Codes</h3>
                  <p className="text-gray-300 text-sm">
                    Simpan kode cadangan ini di tempat aman. Kode ini dapat digunakan jika Anda
                    kehilangan akses ke aplikasi autentikator.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div
                        key={i}
                        className="bg-dark-800 rounded px-3 py-2 font-mono text-sm text-brand-400 text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disable 2FA */}
              <div className="border-t border-dark-700 pt-4">
                <h3 className="text-white font-medium mb-2">Nonaktifkan 2FA</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Masukkan kode dari aplikasi autentikator untuk menonaktifkan 2FA:
                </p>
                <div className="flex gap-3">
                  <Input
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-[0.5em]"
                  />
                  <Button
                    variant="ghost"
                    onClick={disable2FA}
                    disabled={loading || disableCode.length !== 6}
                  >
                    {loading ? 'Memproses...' : 'Nonaktifkan'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Password Change Card ────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Ubah Password</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Untuk mengubah password, gunakan fitur &quot;Lupa Password&quot; di halaman login.
          </p>
        </CardContent>
      </Card>

      {/* ── Active Sessions Card ────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Sesi Aktif</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Perangkat Saat Ini</p>
                  <p className="text-gray-400 text-xs">Sesi aktif sekarang</p>
                </div>
              </div>
              <span className="text-green-400 text-xs">Aktif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
