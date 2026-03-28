'use client';

import { useState } from 'react';
import { MagazineLayout } from '@/components/layout/magazine-layout';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

const contactMethods = [
  {
    title: 'Email',
    value: 'support@areton.id',
    desc: 'Respons dalam 1-2 jam di hari kerja',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    href: 'mailto:support@areton.id',
  },
  {
    title: 'WhatsApp',
    value: 'Chat via WhatsApp',
    desc: 'Chat langsung dengan tim kami',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    href: 'https://wa.me/6281234567890',
  },
  {
    title: 'Data Privasi',
    value: 'privacy@areton.id',
    desc: 'Untuk pertanyaan terkait data pribadi',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    href: 'mailto:privacy@areton.id',
  },
  {
    title: 'Kantor',
    value: 'Jakarta, Indonesia',
    desc: 'Kunjungan hanya dengan appointment',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '#',
  },
];

const FORM_STEPS = [{ label: 'Info' }, { label: 'Pesan' }, { label: 'Kirim' }];

function ContactFormWizard() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-medium text-dark-100">Pesan Terkirim</h3>
        <p className="mt-3 font-serif text-[15px] text-dark-400">
          Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1-2 jam kerja.
        </p>
        <button
          onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
          className="mt-6 text-[11px] uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors"
        >
          Kirim Pesan Lain
        </button>
      </div>
    );
  }

  return (
    <WizardShell totalSteps={3}>
      {({ currentStep }) => (
        <>
          <StepIndicator steps={FORM_STEPS} current={currentStep} className="mb-8" />

          {/* Step 1: Name & Email */}
          <WizardStep step={0}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-2xl mb-3">👤</p>
                <h3 className="font-display text-xl font-medium text-dark-100">Perkenalkan Diri Anda</h3>
                <p className="mt-1 font-serif text-sm text-dark-400">Kami perlu tahu siapa Anda untuk merespons</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest-2 text-dark-400 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/30 px-4 py-3.5 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors"
                  placeholder="Nama Anda"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest-2 text-dark-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/30 px-4 py-3.5 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors"
                  placeholder="email@contoh.com"
                />
              </div>

              <WizardNavigation
                nextDisabled={!formData.name || !formData.email}
                nextLabel="Lanjut →"
                showPrev={false}
              />
            </div>
          </WizardStep>

          {/* Step 2: Subject & Message */}
          <WizardStep step={1}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-2xl mb-3">💬</p>
                <h3 className="font-display text-xl font-medium text-dark-100">Tulis Pesan Anda</h3>
                <p className="mt-1 font-serif text-sm text-dark-400">Jelaskan apa yang bisa kami bantu</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest-2 text-dark-400 mb-2">Subjek</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/30 px-4 py-3.5 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors"
                  placeholder="Topik pesan Anda"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest-2 text-dark-400 mb-2">Pesan</label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/30 px-4 py-3.5 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors resize-none"
                  placeholder="Tulis pesan Anda di sini..."
                />
              </div>

              <WizardNavigation
                nextDisabled={!formData.subject || !formData.message}
                nextLabel="Review & Kirim →"
              />
            </div>
          </WizardStep>

          {/* Step 3: Review & Send */}
          <WizardStep step={2}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-2xl mb-3">📨</p>
                <h3 className="font-display text-xl font-medium text-dark-100">Konfirmasi Pesan</h3>
                <p className="mt-1 font-serif text-sm text-dark-400">Periksa kembali sebelum mengirim</p>
              </div>

              <div className="rounded-xl border border-dark-700/20 bg-dark-800/20 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-dark-500">Nama</p>
                    <p className="mt-1 font-serif text-sm text-dark-200">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-dark-500">Email</p>
                    <p className="mt-1 font-serif text-sm text-dark-200">{formData.email}</p>
                  </div>
                </div>
                <div className="border-t border-dark-700/20 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-dark-500">Subjek</p>
                  <p className="mt-1 font-serif text-sm text-dark-200">{formData.subject}</p>
                </div>
                <div className="border-t border-dark-700/20 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-dark-500">Pesan</p>
                  <p className="mt-1 font-serif text-sm text-dark-300 whitespace-pre-wrap">{formData.message}</p>
                </div>
              </div>

              <WizardNavigation
                nextLabel="Kirim Pesan"
                onNext={() => { setSubmitted(true); return false; }}
              />
            </div>
          </WizardStep>
        </>
      )}
    </WizardShell>
  );
}

export default function ContactPage() {
  return (
    <MagazineLayout breadcrumb="Hubungi Kami">
      {/* ── Hero ── */}
      <section className="py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Hubungi Kami</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Kami Senang<br />
            Mendengar <span className="italic text-brand-400">Dari Anda</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
            Apakah Anda memiliki pertanyaan, saran, atau membutuhkan bantuan? 
            Tim kami siap membantu Anda.
          </p>
        </div>
      </section>

      {/* ── Contact methods ── */}
      <section className="border-t border-dark-700/30 py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className="group rounded-2xl border border-dark-700/20 bg-dark-800/30 p-6 transition-all duration-500 hover:border-brand-400/20 hover:bg-dark-800/50"
              >
                <div className="mb-4 text-brand-400/60 transition-colors group-hover:text-brand-400">
                  {method.icon}
                </div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest-2 text-dark-300">{method.title}</h3>
                <p className="mt-2 font-display text-lg font-medium text-dark-100">{method.value}</p>
                <p className="mt-1 font-serif text-[13px] text-dark-500">{method.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact form (Wizard) ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto max-w-xl px-6">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Pesan</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Kirim Pesan
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>

          <ContactFormWizard />
        </div>
      </section>

      {/* ── Operating hours ── */}
      <section className="border-t border-dark-700/30 bg-dark-950/50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="font-display text-xl font-medium text-dark-100 mb-6">Jam Operasional</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { day: 'Senin – Jumat', time: '09:00 – 21:00 WIB' },
              { day: 'Sabtu', time: '10:00 – 18:00 WIB' },
              { day: 'Minggu & Libur', time: '10:00 – 15:00 WIB' },
            ].map((schedule) => (
              <div key={schedule.day} className="rounded-2xl border border-dark-700/20 bg-dark-800/30 p-5">
                <p className="text-[11px] uppercase tracking-widest text-dark-500">{schedule.day}</p>
                <p className="mt-2 font-display text-lg font-medium text-dark-100">{schedule.time}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 font-serif text-sm text-dark-500">
            Tim Safety &amp; Emergency Response tersedia <span className="text-brand-400">24/7</span> untuk situasi darurat.
          </p>
        </div>
      </section>
    </MagazineLayout>
  );
}
