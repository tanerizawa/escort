'use client';

import { useState, useEffect, useRef } from 'react';
import { AlarmClock, AlertTriangle, Timer } from 'lucide-react';

interface TransactionTimerProps {
  startTime: string;     // booking startTime
  endTime: string;       // booking endTime
  checkinAt?: string;    // actual check-in time
  bookingStatus: string;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TransactionTimer({ startTime, endTime, checkinAt, bookingStatus }: TransactionTimerProps) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const checkinMs = checkinAt ? new Date(checkinAt).getTime() : null;

  // ONGOING: show elapsed
  if (bookingStatus === 'ONGOING' && checkinMs) {
    const elapsed = Math.floor((now - checkinMs) / 1000);
    const plannedDuration = Math.floor((endMs - startMs) / 1000);
    const remaining = Math.max(0, plannedDuration - elapsed);
    const progress = Math.min(100, (elapsed / plannedDuration) * 100);
    const isOvertime = elapsed > plannedDuration;

    return (
      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Sedang Berlangsung</span>
          </div>
          {isOvertime && (
            <span className="text-xs text-red-400 font-medium"><AlertTriangle className="h-4 w-4 inline-block mr-1" /> Overtime</span>
          )}
        </div>

        {/* Elapsed time */}
        <div className="text-center mb-3">
          <div className={`text-3xl font-mono font-light tracking-wider ${isOvertime ? 'text-red-400' : 'text-white'}`}>
            {formatDuration(elapsed)}
          </div>
          <p className="text-xs text-dark-400 mt-1">waktu berlangsung</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isOvertime ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-brand-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-dark-500">
          <span>Check-in: {new Date(checkinMs).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>
            {remaining > 0
              ? `Sisa: ${formatDuration(remaining)}`
              : `+${formatDuration(elapsed - plannedDuration)} overtime`
            }
          </span>
        </div>
      </div>
    );
  }

  // CONFIRMED (pre check-in): countdown to startTime
  const diffMs = startMs - now;
  const isStartTimePassed = diffMs <= 0;

  if (isStartTimePassed) {
    const overdue = Math.floor(Math.abs(diffMs) / 1000);
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlarmClock className="h-5 w-5" />
          <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">Waktunya Check-in!</span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-light text-yellow-400 tracking-wider animate-pulse">
            +{formatDuration(overdue)}
          </div>
          <p className="text-xs text-yellow-500/70 mt-1">melewati jadwal mulai</p>
        </div>
      </div>
    );
  }

  // Countdown to start
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-5 w-5" />
        <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Mulai Dalam</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {days > 0 && (
          <TimerBlock value={days} label="hari" />
        )}
        <TimerBlock value={hours} label="jam" />
        <span className="text-xl text-dark-500 font-light animate-pulse mt-[-12px]">:</span>
        <TimerBlock value={minutes} label="menit" />
        <span className="text-xl text-dark-500 font-light animate-pulse mt-[-12px]">:</span>
        <TimerBlock value={seconds} label="detik" />
      </div>
    </div>
  );
}

function TimerBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-dark-700/80 rounded-lg px-3 py-1.5 min-w-[44px] text-center">
        <span className="text-xl font-mono font-light text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[9px] text-dark-500 mt-1">{label}</span>
    </div>
  );
}
