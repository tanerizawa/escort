'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingEvent {
  id: string;
  clientName: string;
  serviceType: string;
  status: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface BlockedDate {
  start: string;
  end: string;
  reason?: string;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  CONFIRMED: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  ONGOING: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  COMPLETED: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  CANCELLED: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function EscortCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<Record<string, TimeSlot>>({});
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState<Record<string, TimeSlot>>({});
  const [saving, setSaving] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  useEffect(() => {
    fetchAvailability();
    fetchBookings();
  }, [weekOffset]);

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/escorts/me/availability');
      const data = res.data?.data || res.data;
      setSchedule(data.weeklySchedule || {});
      setBlockedDates(data.blockedDates || []);
      setDraftSchedule(data.weeklySchedule || {});
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const startDate = weekDates[0].toISOString();
      const endDate = weekDates[6].toISOString();
      const res = await api.get('/bookings', {
        params: { limit: 100, startDate, endDate },
      });
      const payload = res.data?.data || res.data;
      const allItems = Array.isArray(payload) ? payload : (payload?.data || []);
      setBookings(
        allItems.map((b: any) => ({
          id: b.id,
          clientName: `${b.client?.firstName || ''} ${b.client?.lastName || ''}`.trim(),
          serviceType: b.serviceType,
          status: b.status,
          startTime: b.startTime,
          endTime: b.endTime,
          location: b.location,
        })),
      );
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      await api.put('/escorts/me/availability', {
        schedule: draftSchedule,
        blockedDates,
      });
      setSchedule(draftSchedule);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveBlockedDates = async (newBlockedDates: BlockedDate[]) => {
    try {
      await api.put('/escorts/me/availability', {
        schedule,
        blockedDates: newBlockedDates,
      });
      setSaveMessage('Tanggal blokir berhasil disimpan');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Gagal menyimpan tanggal blokir');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAddBlock = async () => {
    if (!blockStart || !blockEnd) return;
    const newBlocked = [...blockedDates, { start: blockStart, end: blockEnd, reason: blockReason || undefined }];
    setBlockedDates(newBlocked);
    setBlockStart('');
    setBlockEnd('');
    setBlockReason('');
    setShowBlockModal(false);
    await saveBlockedDates(newBlocked);
  };

  const handleRemoveBlock = async (index: number) => {
    const newBlocked = blockedDates.filter((_, i) => i !== index);
    setBlockedDates(newBlocked);
    await saveBlockedDates(newBlocked);
  };

  const toggleDay = (dayIndex: number) => {
    const key = String(dayIndex);
    if (draftSchedule[key]) {
      const next = { ...draftSchedule };
      delete next[key];
      setDraftSchedule(next);
    } else {
      setDraftSchedule({ ...draftSchedule, [key]: { start: '09:00', end: '21:00' } });
    }
  };

  const updateTime = (dayIndex: number, field: 'start' | 'end', value: string) => {
    setDraftSchedule({
      ...draftSchedule,
      [String(dayIndex)]: { ...draftSchedule[String(dayIndex)], [field]: value },
    });
  };

  const getBookingsForDay = (date: Date) => {
    return bookings.filter((b) => {
      const bDate = new Date(b.startTime);
      return bDate.toDateString() === date.toDateString() && b.status !== 'CANCELLED';
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('id-ID', opts)} — ${end.toLocaleDateString('id-ID', { ...opts, year: 'numeric' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          saveMessage.includes('berhasil')
            ? 'border-green-500/20 bg-green-500/10 text-green-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Kalender & Jadwal</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola ketersediaan dan lihat booking Anda</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setDraftSchedule(schedule); }}
                className="rounded-lg border border-dark-600/50 px-4 py-2 text-sm text-dark-300 transition-colors hover:border-dark-500/50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="rounded-lg bg-brand-400/10 px-4 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-400/20"
              >
                Edit Jadwal
              </button>
              <button
                onClick={() => setShowBlockModal(true)}
                className="rounded-lg border border-dark-600/50 px-4 py-2 text-sm text-dark-300 transition-colors hover:border-dark-500/50"
              >
                + Blok Tanggal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 px-5 py-3">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="text-dark-400 hover:text-dark-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-dark-100">{formatWeekRange()}</p>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="mt-0.5 text-xs text-brand-400 hover:underline">
              Kembali ke minggu ini
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="text-dark-400 hover:text-dark-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Weekly Availability Editor */}
      {editMode && (
        <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-5">
          <h2 className="mb-4 text-sm font-medium text-brand-400">Jadwal Mingguan</h2>
          <div className="space-y-3">
            {dayNames.map((day, i) => {
              const active = !!draftSchedule[String(i)];
              return (
                <div key={i} className="flex items-center gap-4">
                  <button
                    onClick={() => toggleDay(i)}
                    className={`w-24 rounded-lg border py-2 text-center text-sm transition-all ${
                      active
                        ? 'border-brand-400/50 bg-brand-400/10 text-brand-400'
                        : 'border-dark-600/50 text-dark-500 hover:border-dark-500/50'
                    }`}
                  >
                    {day}
                  </button>
                  {active ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={draftSchedule[String(i)]?.start || '09:00'}
                        onChange={(e) => updateTime(i, 'start', e.target.value)}
                        className="rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-100 focus:border-brand-400/50 focus:outline-none"
                      />
                      <span className="text-dark-500">—</span>
                      <input
                        type="time"
                        value={draftSchedule[String(i)]?.end || '21:00'}
                        onChange={(e) => updateTime(i, 'end', e.target.value)}
                        className="rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-100 focus:border-brand-400/50 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-dark-500">Tidak tersedia</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-xl border border-dark-700/30 bg-dark-800/10">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-dark-700/30">
            <div className="p-3 text-xs text-dark-500">Jam</div>
            {weekDates.map((date, i) => {
              const dayBookings = getBookingsForDay(date);
              const available = schedule[String(date.getDay())];
              return (
                <div
                  key={i}
                  className={`border-l border-dark-700/30 p-3 text-center ${isToday(date) ? 'bg-brand-400/5' : ''}`}
                >
                  <p className={`text-xs ${isToday(date) ? 'text-brand-400 font-medium' : 'text-dark-400'}`}>
                    {dayNamesShort[date.getDay()]}
                  </p>
                  <p className={`text-lg font-light ${isToday(date) ? 'text-brand-400' : 'text-dark-200'}`}>
                    {date.getDate()}
                  </p>
                  {available && (
                    <p className="mt-0.5 text-2xs text-emerald-500">{available.start}-{available.end}</p>
                  )}
                  {dayBookings.length > 0 && (
                    <p className="mt-0.5 text-2xs text-brand-400">{dayBookings.length} booking</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-dark-700/10">
              <div className="p-2 text-right text-xs text-dark-500">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayBookings = getBookingsForDay(date).filter((b) => {
                  const bHour = new Date(b.startTime).getHours();
                  return bHour === hour;
                });
                const daySchedule = schedule[String(date.getDay())];
                const isAvailable = daySchedule
                  ? hour >= parseInt(daySchedule.start) && hour < parseInt(daySchedule.end)
                  : false;

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-[48px] border-l border-dark-700/10 p-1 ${
                      isToday(date) ? 'bg-brand-400/[0.02]' : ''
                    } ${isAvailable ? 'bg-emerald-500/[0.03]' : ''}`}
                  >
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`rounded-md border px-2 py-1 text-2xs ${statusColors[b.status] || 'bg-dark-700/20 text-dark-300'}`}
                      >
                        <p className="font-medium truncate">{b.clientName}</p>
                        <p className="truncate opacity-70">{b.serviceType}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates */}
      {blockedDates.length > 0 && (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
          <h3 className="mb-3 text-sm font-medium text-dark-300">Tanggal Diblokir</h3>
          <div className="space-y-2">
            {blockedDates.map((block, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-2">
                <div>
                  <p className="text-sm text-dark-200">
                    {new Date(block.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {block.end !== block.start && ` — ${new Date(block.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                  {block.reason && <p className="text-xs text-dark-400">{block.reason}</p>}
                </div>
                <button onClick={() => handleRemoveBlock(i)} className="text-dark-500 hover:text-red-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-dark-700/50 bg-dark-800 p-6">
            <h2 className="text-lg font-medium text-dark-100">Blok Tanggal</h2>
            <p className="mt-1 text-sm text-dark-400">Anda tidak akan menerima booking pada tanggal ini.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-dark-400">Tanggal Mulai</label>
                <input
                  type="date"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full rounded-lg border border-dark-600/50 bg-dark-700/30 px-4 py-2.5 text-sm text-dark-100 focus:border-brand-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-dark-400">Tanggal Selesai</label>
                <input
                  type="date"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  min={blockStart}
                  className="w-full rounded-lg border border-dark-600/50 bg-dark-700/30 px-4 py-2.5 text-sm text-dark-100 focus:border-brand-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-dark-400">Alasan (Opsional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Liburan, sakit, dll."
                  className="w-full rounded-lg border border-dark-600/50 bg-dark-700/30 px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowBlockModal(false); setBlockStart(''); setBlockEnd(''); setBlockReason(''); }}
                className="rounded-lg px-4 py-2 text-sm text-dark-400 hover:text-dark-200"
              >
                Batal
              </button>
              <button
                onClick={handleAddBlock}
                disabled={!blockStart || !blockEnd}
                className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
