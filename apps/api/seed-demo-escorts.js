/**
 * Seed script: Create 4 professional demo escort profiles
 * Run: cd apps/api && node seed-demo-escorts.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@2026!';

const escorts = [
  {
    user: {
      email: 'sarah.wijaya@demo.areton.id',
      firstName: 'Sarah',
      lastName: 'Wijaya',
      phone: '+6281200000002',
    },
    profile: {
      tier: 'GOLD',
      hourlyRate: 750000,
      languages: ['Indonesia', 'English', 'Mandarin'],
      skills: ['Business Etiquette', 'Public Speaking', 'Networking', 'Wine & Dining', 'Event Hosting'],
      bio: `Professional companion dengan pengalaman 3 tahun di industri hospitality dan event management internasional. Lulusan Hubungan Internasional dari universitas terkemuka di Jakarta, saya terbiasa berinteraksi di lingkungan multinasional dan multikultural.

Keahlian saya meliputi protokol bisnis, etika dining formal, dan kemampuan networking yang kuat. Saya telah menemani klien di berbagai acara high-profile — mulai dari corporate gala dinner, konferensi internasional, hingga private networking events.

Fasih dalam tiga bahasa (Indonesia, Inggris, Mandarin), saya siap menjadi pendamping ideal Anda untuk setiap kesempatan bisnis maupun sosial.`,
      age: 'Pertengahan 20-an',
      height: '168',
      weight: '52',
      bodyType: 'Langsing',
      hairStyle: 'Panjang & Bergelombang',
      eyeColor: 'Cokelat Gelap',
      complexion: 'Sawo Matang',
      nationality: 'Indonesia',
      occupation: 'Event Coordinator & Model',
      fieldOfWork: 'Hospitality & Event Management',
      basedIn: 'Jakarta Selatan',
      travelScope: 'Nasional',
      smoking: 'Tidak',
      tattooPiercing: 'Tidak ada',
      favourites: {
        books: 'Sapiens, Rich Dad Poor Dad, Educated',
        films: 'The Devil Wears Prada, Crazy Rich Asians, Parasite',
        interests: 'Wine tasting, Networking events, Traveling, Art exhibitions',
        sports: 'Tennis, Yoga, Swimming',
        cuisine: 'French, Japanese Omakase, Modern Indonesian',
        drinks: 'Champagne, Single Origin Coffee, Green Tea',
        perfume: 'Tom Ford Black Orchid, Dior J\'adore',
      },
    },
  },
  {
    user: {
      email: 'nadia.putri@demo.areton.id',
      firstName: 'Nadia',
      lastName: 'Putri',
      phone: '+6281200000003',
    },
    profile: {
      tier: 'PLATINUM',
      hourlyRate: 1500000,
      languages: ['Indonesia', 'English', 'French'],
      skills: ['Diplomacy', 'Cultural Intelligence', 'Luxury Concierge', 'Fine Dining', 'Art & Culture', 'Public Relations'],
      bio: `Saya adalah companion profesional dengan latar belakang diplomasi dan komunikasi internasional. Pengalaman bekerja di lingkungan kedutaan dan organisasi internasional membentuk kemampuan saya dalam cross-cultural communication dan high-level networking.

Dengan pemahaman mendalam tentang protokol diplomatik, etika bisnis internasional, dan seni percakapan, saya memberikan pengalaman pendampingan yang sophisticated dan berkesan. Setiap interaksi saya rancang untuk memberikan nilai tambah — baik dalam konteks bisnis maupun sosial.

Latar belakang pendidikan di Paris memberi saya perspektif global dan kemampuan berbahasa Prancis yang fasih, menjadikan saya pilihan ideal untuk acara-acara internasional dan perjalanan bisnis ke luar negeri.`,
      age: 'Akhir 20-an',
      height: '172',
      weight: '56',
      bodyType: 'Atletis',
      hairStyle: 'Bob Pendek',
      eyeColor: 'Hitam',
      complexion: 'Putih Langsat',
      nationality: 'Indonesia',
      occupation: 'Konsultan Komunikasi',
      fieldOfWork: 'Public Relations & Diplomasi',
      basedIn: 'Jakarta Pusat',
      travelScope: 'Internasional',
      smoking: 'Tidak',
      tattooPiercing: 'Tidak ada',
      favourites: {
        books: 'The Art of War, Thinking Fast and Slow, Le Petit Prince',
        films: 'The Grand Budapest Hotel, Amélie, Inception',
        interests: 'Museum & gallery visits, Opera, Wine collecting, Philosophy',
        sports: 'Horseback Riding, Fencing, Pilates',
        cuisine: 'French Haute Cuisine, Italian, Peruvian',
        drinks: 'Bordeaux Wine, Earl Grey Tea, Negroni',
        perfume: 'Chanel No. 5, Le Labo Santal 33',
      },
    },
  },
  {
    user: {
      email: 'ravi.pratama@demo.areton.id',
      firstName: 'Ravi',
      lastName: 'Pratama',
      phone: '+6281200000004',
    },
    profile: {
      tier: 'GOLD',
      hourlyRate: 800000,
      languages: ['Indonesia', 'English', 'Japanese'],
      skills: ['Business Companion', 'Translation', 'Tech Industry', 'Startup Networking', 'Golf Companion', 'Photography'],
      bio: `Profesional berlatakan belakang teknologi dan bisnis, saya memberikan pendampingan yang menggabungkan wawasan industri dengan kemampuan sosial yang kuat. Pengalaman di startup ecosystem dan korporasi multinasional memberi saya kemampuan unik untuk beradaptasi di berbagai lingkaran profesional.

Sebagai companion pria, saya menawarkan perspektif berbeda — ideal untuk accompany di acara golf, tech conferences, investor meetings, atau casual business dinners. Kemampuan bahasa Jepang saya menjadi nilai tambah untuk klien yang berbisnis dengan partner dari Jepang.

Saya percaya bahwa pendampingan profesional bukan hanya tentang kehadiran, tapi tentang memberikan kontribusi bermakna dalam setiap percakapan dan interaksi.`,
      age: 'Awal 30-an',
      height: '178',
      weight: '72',
      bodyType: 'Atletis',
      hairStyle: 'Pendek & Rapi',
      eyeColor: 'Cokelat',
      complexion: 'Sawo Matang',
      nationality: 'Indonesia',
      occupation: 'Tech Consultant',
      fieldOfWork: 'Technology & Business Development',
      basedIn: 'Bandung',
      travelScope: 'Nasional',
      smoking: 'Tidak',
      tattooPiercing: 'Tidak ada',
      favourites: {
        books: 'Zero to One, The Lean Startup, Shoe Dog',
        films: 'The Social Network, Interstellar, Your Name',
        interests: 'Golf, Tech meetups, Photography, Coffee brewing',
        sports: 'Golf, Running, Gym',
        cuisine: 'Japanese, Korean BBQ, Sundanese',
        drinks: 'Pour Over Coffee, Whisky Sour, Matcha',
        perfume: 'Bleu de Chanel, Creed Aventus',
      },
    },
  },
  {
    user: {
      email: 'diana.maharani@demo.areton.id',
      firstName: 'Diana',
      lastName: 'Maharani',
      phone: '+6281200000005',
    },
    profile: {
      tier: 'DIAMOND',
      hourlyRate: 3000000,
      languages: ['Indonesia', 'English', 'German', 'Dutch'],
      skills: ['C-Level Accompaniment', 'International Protocol', 'Luxury Travel', 'Art Curation', 'Philanthropy Events', 'Multilingual Interpretation'],
      bio: `Companion premium dengan pengalaman mendampingi eksekutif C-level dan high-net-worth individuals di kancah internasional. Latar belakang pendidikan di Eropa (MBA dari Rotterdam) dan pengalaman kerja di luxury hospitality membentuk standar layanan saya yang eksklusif.

Spesialisasi saya mencakup pendampingan di acara philanthropy galas, international summits, luxury travel arrangements, dan high-stakes business negotiations. Saya memahami nuansa komunikasi di tingkat tertinggi — dari small talk yang strategis hingga diskusi bisnis yang substantif.

Dengan kemampuan empat bahasa dan pemahaman mendalam tentang protokol internasional, saya memberikan pengalaman pendampingan yang seamless di mana pun di dunia. Setiap detail, dari penampilan hingga percakapan, saya persiapkan dengan standar kesempurnaan.`,
      age: 'Akhir 20-an',
      height: '170',
      weight: '54',
      bodyType: 'Langsing',
      hairStyle: 'Panjang & Lurus',
      eyeColor: 'Cokelat Madu',
      complexion: 'Putih',
      nationality: 'Indonesia',
      occupation: 'Luxury Brand Consultant',
      fieldOfWork: 'Luxury & International Business',
      basedIn: 'Jakarta Selatan',
      travelScope: 'Internasional',
      smoking: 'Tidak',
      tattooPiercing: 'Tidak ada',
      favourites: {
        books: 'The Great Gatsby, Luxury Strategy, When Breath Becomes Air',
        films: 'Breakfast at Tiffany\'s, The King\'s Speech, Phantom Thread',
        interests: 'Art collecting, Classical music, Philanthropy, Haute couture',
        sports: 'Equestrian, Skiing, Tennis',
        cuisine: 'Michelin-starred dining, Japanese Kaiseki, Modern European',
        drinks: 'Dom Pérignon, Rare Teas, Craft Cocktails',
        perfume: 'Maison Francis Kurkdjian Baccarat Rouge 540, Hermès Un Jardin Sur Le Nil',
      },
    },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const escort of escorts) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: escort.user.email },
    });

    if (existing) {
      process.stdout.write(`Skipping ${escort.user.firstName} ${escort.user.lastName} (already exists)\n`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        ...escort.user,
        passwordHash,
        role: 'ESCORT',
        isVerified: true,
        isActive: true,
        escortProfile: {
          create: {
            ...escort.profile,
            isApproved: true,
            approvedAt: new Date(),
            availabilitySchedule: {
              weeklySchedule: {
                0: { start: '10:00', end: '22:00' },
                1: { start: '10:00', end: '22:00' },
                2: { start: '10:00', end: '22:00' },
                3: { start: '10:00', end: '22:00' },
                4: { start: '10:00', end: '22:00' },
                5: { start: '10:00', end: '23:00' },
                6: { start: '10:00', end: '23:00' },
              },
              blockedDates: [],
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
      include: { escortProfile: true },
    });

    process.stdout.write(
      `✓ Created: ${user.firstName} ${user.lastName} | Tier: ${escort.profile.tier} | Rate: Rp ${escort.profile.hourlyRate.toLocaleString()}/hr\n`,
    );
  }

  process.stdout.write('\nDone! All demo escorts seeded.\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    process.stderr.write(String(e) + '\n');
    prisma.$disconnect();
    process.exit(1);
  });
