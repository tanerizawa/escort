export type ContestStatus = 'ONGOING' | 'UPCOMING';

export type ContestCard = {
  id: string;
  title: string;
  theme: string;
  status: ContestStatus;
  periodLabel: string;
  description: string;
  highlights: string[];
};

export const CONTESTS: ContestCard[] = [
  {
    id: 'elegance-night-apr',
    title: 'Elegance Night April',
    theme: 'Formal Companion Style',
    status: 'ONGOING',
    periodLabel: '15 Apr - 30 Apr 2026',
    description:
      'Kompetisi mingguan untuk companion dengan skor konsistensi layanan formal tertinggi.',
    highlights: [
      'Bobot utama: kualitas rating dan repeat booking',
      'Fresh score update setiap 6 jam',
      'Top 10 tampil di spotlight Discover',
    ],
  },
  {
    id: 'travel-charm-may',
    title: 'Travel Charm May',
    theme: 'Travel Partner Excellence',
    status: 'UPCOMING',
    periodLabel: '01 May - 15 May 2026',
    description:
      'Fokus pada layanan travel scope, ketepatan waktu, dan stabilitas rating selama periode event.',
    highlights: [
      'Bobot tambahan untuk travelScope match',
      'Countdown tampil di Discover highlight',
      'Badge final untuk top 3 pemenang',
    ],
  },
  {
    id: 'host-master-june',
    title: 'Host Master June',
    theme: 'Event Host Performance',
    status: 'UPCOMING',
    periodLabel: '05 Jun - 20 Jun 2026',
    description:
      'Papan peringkat khusus category event host dengan bobot pada booking repeat dan review quality.',
    highlights: [
      'Fokus metrik host performance',
      'Leaderboard dengan fairness cooldown',
      'Konten pemenang masuk Creator Gallery rail',
    ],
  },
];

export function getContestById(contestId: string) {
  return CONTESTS.find((contest) => contest.id === contestId) || null;
}
