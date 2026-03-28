'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Hand, MessageCircle, Search, Shield } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

const steps = [
  {
    icon: 'Hand',
    title: 'Selamat Datang di ARETON.id',
    description: 'Platform pendamping profesional premium di Indonesia. Kami menghubungkan Anda dengan escort profesional terverifikasi untuk berbagai acara.',
  },
  {
    icon: 'Search',
    title: 'Jelajahi Partner',
    description: 'Temukan pendamping yang sesuai berdasarkan skill, bahasa, ketersediaan, dan rating. Gunakan filter untuk menemukan match terbaik.',
  },
  {
    icon: 'Calendar',
    title: 'Booking Mudah',
    description: 'Pilih tanggal, waktu, dan lokasi. Pembayaran aman melalui escrow system — dana ditahan hingga layanan selesai.',
  },
  {
    icon: 'MessageCircle',
    title: 'Chat & Koordinasi',
    description: 'Komunikasi langsung dengan partner melalui chat real-time terenkripsi. Koordinasikan detail acara dengan mudah.',
  },
  {
    icon: 'Shield',
    title: 'Keamanan Terjamin',
    description: 'Semua partner telah diverifikasi KYC. Fitur SOS darurat, live tracking, dan tim support 24/7 untuk keamanan Anda.',
  },
];

interface WelcomeTourProps {
  onComplete?: () => void;
}

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcome_tour_done');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('welcome_tour_done', '1');
    setVisible(false);
    onComplete?.();
  };

  if (!visible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-dark-600/50 bg-dark-800 p-8 shadow-2xl">
        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= currentStep ? 'bg-brand-400' : 'bg-dark-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <span className="mb-4 inline-block"><Icon name={step.icon} className="h-12 w-12 text-brand-400" /></span>
          <h2 className="mb-3 text-xl font-semibold text-dark-100">{step.title}</h2>
          <p className="leading-relaxed text-dark-400">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-sm text-dark-500 transition-colors hover:text-dark-300"
          >
            Lewati
          </button>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Kembali
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Lanjut' : 'Mulai Jelajahi'}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="mt-4 text-center text-xs text-dark-600">
          {currentStep + 1} / {steps.length}
        </p>
      </div>
    </div>
  );
}
