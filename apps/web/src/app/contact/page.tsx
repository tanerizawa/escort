'use client';

import { useState } from 'react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import { Mail, MessageCircle, Shield, MapPin } from 'lucide-react';

const contactMethods = [
  {
    title: 'Email',
    value: 'support@areton.id',
    desc: 'Respons dalam 1–2 jam di hari kerja',
    Icon: Mail,
    href: 'mailto:support@areton.id',
  },
  {
    title: 'WhatsApp',
    value: 'Chat via WhatsApp',
    desc: 'Chat langsung dengan tim kami',
    Icon: MessageCircle,
    href: 'https://wa.me/6281234567890',
  },
  {
    title: 'Data Privasi',
    value: 'privacy@areton.id',
    desc: 'Untuk pertanyaan terkait data pribadi',
    Icon: Shield,
    href: 'mailto:privacy@areton.id',
  },
  {
    title: 'Kantor',
    value: 'Jakarta, Indonesia',
    desc: 'Kunjungan hanya dengan appointment',
    Icon: MapPin,
    href: '#',
  },
];

const FORM_STEPS = [{ label: 'Perkenalan' }, { label: 'Pesan' }, { label: 'Konfirmasi' }];

function ContactFormWizard() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-rose-400/25 bg-rose-500/5 p-12 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-rose-300/40 text-rose-200">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="act-mark !text-rose-300/80">Terkirim</p>
        <h3 className="mt-3 font-display text-2xl font-medium text-dark-100">
          Pesan Anda telah kami terima
        </h3>
        <p className="mx-auto mt-4 max-w-md font-serif text-[15px] leading-relaxed text-dark-400">
          Tim kami akan merespons dalam 1–2 jam kerja. Untuk situasi darurat, gunakan tombol
          SOS di aplikasi.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
          }}
          className="mt-8 text-[11px] uppercase tracking-widest-2 text-rose-200 transition-colors hover:text-rose-100"
        >
          Kirim Pesan Lain →
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full border border-dark-700/40 bg-dark-800/40 px-4 py-3.5 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-rose-400/40 focus:outline-none transition-colors';

  return (
    <WizardShell totalSteps={3}>
      {({ currentStep }) => (
        <>
          <StepIndicator steps={FORM_STEPS} current={currentStep} className="mb-10" />

          <WizardStep step={0}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="act-mark !text-rose-300/80">Langkah 01</p>
                <h3 className="mt-3 font-display text-2xl font-medium text-dark-100">
                  Perkenalkan diri Anda
                </h3>
                <p className="mt-2 font-serif text-sm text-dark-400">
                  Kami perlu tahu siapa Anda untuk merespons.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-widest-2 text-dark-400">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Nama Anda"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-widest-2 text-dark-400">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="email@contoh.com"
                />
              </div>

              <WizardNavigation
                nextDisabled={!formData.name || !formData.email}
                nextLabel="Lanjut"
                showPrev={false}
              />
            </div>
          </WizardStep>

          <WizardStep step={1}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="act-mark !text-rose-300/80">Langkah 02</p>
                <h3 className="mt-3 font-display text-2xl font-medium text-dark-100">
                  Tulis pesan Anda
                </h3>
                <p className="mt-2 font-serif text-sm text-dark-400">
                  Jelaskan apa yang bisa kami bantu.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-widest-2 text-dark-400">
                  Subjek
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={inputClass}
                  placeholder="Topik pesan Anda"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-widest-2 text-dark-400">
                  Pesan
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="Tulis pesan Anda di sini..."
                />
              </div>

              <WizardNavigation
                nextDisabled={!formData.subject || !formData.message}
                nextLabel="Review"
              />
            </div>
          </WizardStep>

          <WizardStep step={2}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="act-mark !text-rose-300/80">Langkah 03</p>
                <h3 className="mt-3 font-display text-2xl font-medium text-dark-100">
                  Konfirmasi pesan
                </h3>
                <p className="mt-2 font-serif text-sm text-dark-400">
                  Periksa kembali sebelum mengirim.
                </p>
              </div>

              <div className="space-y-5 border border-dark-700/40 bg-dark-800/40 p-6">
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
                <div className="gold-rose-line" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-dark-500">Subjek</p>
                  <p className="mt-1 font-serif text-sm text-dark-200">{formData.subject}</p>
                </div>
                <div className="gold-rose-line" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-dark-500">Pesan</p>
                  <p className="mt-1 whitespace-pre-wrap font-serif text-sm text-dark-300">
                    {formData.message}
                  </p>
                </div>
              </div>

              <WizardNavigation
                nextLabel="Kirim Pesan"
                onNext={() => {
                  setSubmitted(true);
                  return false;
                }}
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
    <MarketingShell
      mark="Hubungi Kami"
      title="Kami senang"
      highlight="mendengar dari Anda"
      description="Pertanyaan, saran, atau kebutuhan bantuan — tim kami siap melayani dengan ketenangan dan ketepatan."
    >
      {/* Contact methods */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {contactMethods.map(({ Icon, ...method }) => (
          <a
            key={method.title}
            href={method.href}
            className="group border border-dark-700/30 bg-dark-800/30 p-7 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
          >
            <div className="flex h-10 w-10 items-center justify-center border border-rose-400/20 text-rose-300">
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-widest-2 text-rose-200/80">
              {method.title}
            </p>
            <p className="mt-2 font-display text-lg font-medium text-dark-100">
              {method.value}
            </p>
            <p className="mt-2 font-serif text-[13px] text-dark-400">{method.desc}</p>
            <div className="gold-line-left mt-4 w-0 transition-all duration-500 group-hover:w-12" />
          </a>
        ))}
      </section>

      {/* Form */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="mx-auto max-w-xl">
          <div className="mb-12 text-center">
            <p className="act-mark">Kirim Pesan</p>
            <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
              Sampaikan <span className="italic text-gradient-rose-gold">maksud Anda</span>
            </h2>
            <div className="gold-rose-line mx-auto mt-6 w-20" />
          </div>

          <ContactFormWizard />
        </div>
      </section>

      {/* Hours */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="text-center">
          <p className="act-mark">Jam Operasional</p>
          <h3 className="mt-5 font-display text-2xl font-medium text-dark-100">
            Kami menyambut Anda pada jam-jam ini
          </h3>
          <div className="gold-rose-line mx-auto mt-6 w-20" />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { day: 'Senin – Jumat', time: '09:00 – 21:00 WIB' },
            { day: 'Sabtu', time: '10:00 – 18:00 WIB' },
            { day: 'Minggu & Libur', time: '10:00 – 15:00 WIB' },
          ].map((schedule) => (
            <div
              key={schedule.day}
              className="border border-dark-700/30 bg-dark-800/30 p-6 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-rose-200/80">
                {schedule.day}
              </p>
              <p className="mt-2 font-display text-lg font-medium text-dark-100">
                {schedule.time}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center font-serif text-sm text-dark-500">
          Tim Safety &amp; Emergency Response tersedia{' '}
          <span className="text-rose-200">24/7</span> untuk situasi darurat.
        </p>
      </section>
    </MarketingShell>
  );
}
