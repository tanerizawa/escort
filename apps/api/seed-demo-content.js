/**
 * Seed Demo Content — Blog Articles, Testimonials, Additional Escorts
 * Run: node apps/api/seed-demo-content.js
 * Requires: DATABASE_URL in apps/api/.env
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo content...\n');

  // ══════════════════════════════════════════
  //  Additional Escort Profiles (4 more)
  // ══════════════════════════════════════════
  const escorts = [
    {
      email: 'jessica@demo.areton.id',
      firstName: 'Jessica',
      lastName: 'Tanoto',
      phone: '+6281234567893',
      profile: {
        tier: 'PLATINUM',
        hourlyRate: 2000000,
        bio: 'International relations graduate with extensive experience in diplomatic and corporate events. Fluent in four languages with a natural ability to navigate multicultural settings. Previously worked as a liaison officer for international organizations in Jakarta and Singapore.\n\nSpecializing in high-profile corporate gatherings, gala dinners, and cross-border business meetings. My background in diplomacy ensures seamless social interactions regardless of cultural context.\n\nPassionate about art, classical music, and contemporary literature. Available for both domestic and international engagements.',
        languages: ['Indonesia', 'English', 'Mandarin', 'Japanese'],
        skills: ['Diplomatic Protocol', 'Cross-Cultural Communication', 'Wine Knowledge', 'Classical Music', 'Art Gallery Guide'],
        age: '27',
        height: '168',
        weight: '55',
        bodyType: 'Slim',
        hairStyle: 'Long Straight',
        eyeColor: 'Brown',
        complexion: 'Fair',
        nationality: 'Indonesian',
        occupation: 'Diplomatic Consultant',
        fieldOfWork: 'International Relations',
        basedIn: 'Jakarta',
        travelScope: 'International',
        smoking: 'No',
        tattooPiercing: 'None',
        favourites: {
          books: ['Sapiens', 'The Art of War', 'Becoming'],
          films: ['The Grand Budapest Hotel', 'Babel', 'Lost in Translation'],
          interests: ['Opera', 'Wine Tasting', 'Contemporary Art', 'Calligraphy'],
          sports: ['Tennis', 'Swimming', 'Fencing'],
          cuisine: ['French', 'Japanese Omakase', 'Mediterranean'],
          drinks: ['Burgundy Wine', 'Matcha Latte', 'Champagne'],
          perfume: ['Chanel No. 5', 'Jo Malone Wood Sage']
        },
      },
    },
    {
      email: 'kevin@demo.areton.id',
      firstName: 'Kevin',
      lastName: 'Hartono',
      phone: '+6281234567894',
      profile: {
        tier: 'GOLD',
        hourlyRate: 900000,
        bio: 'Fitness trainer and lifestyle coach with a passion for wellness and social engagement. Background in sports science from Universitas Indonesia with professional certification in personal training.\n\nIdeal companion for active events, outdoor activities, fitness-related gatherings, and casual social functions. My energetic personality and warm demeanor make every interaction enjoyable and memorable.\n\nExperienced in corporate team building events, wellness retreats, and adventure outings.',
        languages: ['Indonesia', 'English'],
        skills: ['Fitness Training', 'Nutrition Consulting', 'Team Building', 'Adventure Sports', 'Photography'],
        age: '29',
        height: '180',
        weight: '78',
        bodyType: 'Athletic',
        hairStyle: 'Short',
        eyeColor: 'Brown',
        complexion: 'Tan',
        nationality: 'Indonesian',
        occupation: 'Fitness & Lifestyle Coach',
        fieldOfWork: 'Health & Wellness',
        basedIn: 'Bali',
        travelScope: 'Domestik',
        smoking: 'No',
        tattooPiercing: 'None',
        favourites: {
          books: ['Atomic Habits', 'Born to Run', "Can't Hurt Me"],
          films: ['Rocky', 'Ford v Ferrari', 'Free Solo'],
          interests: ['Surfing', 'Mountain Climbing', 'Drone Photography', 'Cooking'],
          sports: ['CrossFit', 'Surfing', 'Rock Climbing', 'Trail Running'],
          cuisine: ['Mediterranean', 'Hawaiian Poke', 'Indonesian Traditional'],
          drinks: ['Coconut Water', 'Green Smoothie', 'Cold Brew Coffee'],
          perfume: ['Bleu de Chanel', 'Versace Pour Homme']
        },
      },
    },
    {
      email: 'mira@demo.areton.id',
      firstName: 'Mira',
      lastName: 'Santoso',
      phone: '+6281234567895',
      profile: {
        tier: 'SILVER',
        hourlyRate: 500000,
        bio: 'Communications student at Universitas Gadjah Mada with a natural flair for social interaction. Part-time model and social media content creator with a growing following.\n\nBright, articulate, and naturally curious — perfect for casual social events, networking gatherings, photo opportunities, and lifestyle events. My youthful energy and genuine personality create authentic connections.\n\nAvailable for events in Yogyakarta, Solo, and surrounding areas. Open to travel for special occasions.',
        languages: ['Indonesia', 'English', 'Javanese'],
        skills: ['Content Creation', 'Social Media', 'Public Speaking', 'Event Hosting', 'Photography Modeling'],
        age: '22',
        height: '163',
        weight: '50',
        bodyType: 'Slim',
        hairStyle: 'Medium Wavy',
        eyeColor: 'Brown',
        complexion: 'Medium',
        nationality: 'Indonesian',
        occupation: 'Communications Student & Model',
        fieldOfWork: 'Media & Communications',
        basedIn: 'Yogyakarta',
        travelScope: 'Domestik',
        smoking: 'No',
        tattooPiercing: 'None',
        favourites: {
          books: ['The Alchemist', 'Laut Bercerita', 'Norwegian Wood'],
          films: ['La La Land', 'Parasite', 'Ada Apa Dengan Cinta'],
          interests: ['Traditional Batik', 'Gamelan Music', 'Coffee Culture', 'Photography'],
          sports: ['Yoga', 'Badminton', 'Cycling'],
          cuisine: ['Yogyakarta Traditional', 'Korean', 'Italian'],
          drinks: ['Jamu', 'Iced Coffee', 'Teh Poci'],
          perfume: ['Miss Dior', 'Zara Rose']
        },
      },
    },
    {
      email: 'rafael@demo.areton.id',
      firstName: 'Rafael',
      lastName: 'Kusuma',
      phone: '+6281234567896',
      profile: {
        tier: 'DIAMOND',
        hourlyRate: 3500000,
        bio: 'Former investment banker turned luxury lifestyle consultant. MBA from NUS Business School with extensive experience in the financial sector across Southeast Asia.\n\nSpecializing in ultra-premium events: private dinners with high-net-worth individuals, luxury yacht parties, private jet travel, exclusive art auctions, and VIP charity galas. My deep understanding of luxury culture and financial world makes conversations substantive and engaging.\n\nFluent negotiator, seasoned networker, and impeccable dresser. Available for international engagements with advance booking.',
        languages: ['Indonesia', 'English', 'Mandarin', 'French'],
        skills: ['Investment Analysis', 'Luxury Brand Knowledge', 'Wine Sommelier L2', 'Cigar Connoisseur', 'Networking Strategy'],
        age: '34',
        height: '182',
        weight: '76',
        bodyType: 'Athletic',
        hairStyle: 'Styled',
        eyeColor: 'Brown',
        complexion: 'Fair',
        nationality: 'Indonesian',
        occupation: 'Luxury Lifestyle Consultant',
        fieldOfWork: 'Finance & Luxury',
        basedIn: 'Jakarta',
        travelScope: 'International',
        smoking: 'No',
        tattooPiercing: 'None',
        favourites: {
          books: ['The Intelligent Investor', 'Shoe Dog', 'Sapiens'],
          films: ['The Wolf of Wall Street', 'Crazy Rich Asians', 'Inception'],
          interests: ['Luxury Watches', 'Fine Art Collection', 'Wine Cellar', 'Golf'],
          sports: ['Golf', 'Sailing', 'Polo', 'Tennis'],
          cuisine: ['Japanese Kaiseki', 'French Fine Dining', 'Italian Truffle'],
          drinks: ['Macallan 25', 'Dom Pérignon', 'Barolo'],
          perfume: ['Tom Ford Oud Wood', 'Creed Aventus']
        },
      },
    },
  ];

  const defaultSchedule = {
    monday: { available: true, start: '10:00', end: '22:00' },
    tuesday: { available: true, start: '10:00', end: '22:00' },
    wednesday: { available: true, start: '10:00', end: '22:00' },
    thursday: { available: true, start: '10:00', end: '22:00' },
    friday: { available: true, start: '10:00', end: '23:00' },
    saturday: { available: true, start: '09:00', end: '23:00' },
    sunday: { available: false, start: '00:00', end: '00:00' },
  };

  const passwordHash = await bcrypt.hash('demo123', 10);

  for (const escort of escorts) {
    const exists = await prisma.user.findUnique({ where: { email: escort.email } });
    if (exists) {
      console.log(`  ⏭️  ${escort.firstName} ${escort.lastName} already exists`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: escort.email,
        firstName: escort.firstName,
        lastName: escort.lastName,
        phone: escort.phone,
        passwordHash,
        role: 'ESCORT',
        isVerified: true,
        isActive: true,
        escortProfile: {
          create: {
            ...escort.profile,
            isApproved: true,
            approvedAt: new Date(),
            availabilitySchedule: defaultSchedule,
            favourites: escort.profile.favourites,
          },
        },
      },
    });
    console.log(`  ✅ ${escort.firstName} ${escort.lastName} (${escort.profile.tier}, Rp ${(escort.profile.hourlyRate / 1000).toFixed(0)}K)`);
  }

  // ══════════════════════════════════════════
  //  Blog Articles (6 articles)
  // ══════════════════════════════════════════
  console.log('\n📝 Seeding blog articles...');

  // Find admin user for article author
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('  ⚠️  No admin user found — skipping articles');
  } else {
    const articles = [
      {
        title: 'Etika Menghadiri Gala Dinner: Panduan Lengkap',
        slug: 'etika-gala-dinner-panduan-lengkap',
        excerpt: 'Panduan lengkap etika dan tata cara menghadiri gala dinner, dari dress code hingga table manners yang tepat.',
        content: `
# Etika Menghadiri Gala Dinner

Gala dinner adalah acara formal yang membutuhkan persiapan khusus. Berikut panduan lengkap agar Anda tampil percaya diri.

## 1. Dress Code

Untuk pria, tuxedo hitam atau dark suit adalah pilihan aman. Pastikan sepatu formal yang sudah dipoles. Untuk wanita, gaun malam panjang atau cocktail dress sesuai undangan.

## 2. Table Manners

- Serbet dilipat di pangkuan setelah duduk
- Gunakan peralatan dari luar ke dalam
- Jangan mulai makan sebelum tuan rumah
- Letakkan garpu dan pisau menyilang jika belum selesai

## 3. Percakapan

- Hindari topik kontroversial (politik, agama)
- Tunjukkan ketertarikan pada lawan bicara
- Siapkan beberapa topik ringan: travel, kuliner, seni
- Dengarkan lebih banyak daripada berbicara

## 4. Perkenalan & Networking

- Jabat tangan teguh tapi tidak terlalu keras
- Perkenalkan diri dengan nama lengkap
- Tukar kartu nama dengan sopan
- Follow up dalam 24-48 jam setelah acara

## Tips Tambahan

Datang tepat waktu (15 menit sebelum acara dimulai), matikan atau silent ponsel, dan selalu tersenyum. Pendamping profesional dapat membantu Anda navigasi acara dengan lebih percaya diri.
        `,
        category: 'Lifestyle',
        tags: ['etika', 'gala-dinner', 'panduan', 'formal-event'],
        status: 'published',
      },
      {
        title: 'Mengapa Pendamping Profesional Penting untuk Acara Bisnis',
        slug: 'pendamping-profesional-acara-bisnis',
        excerpt: 'Kehadiran pendamping profesional dapat meningkatkan citra dan networking Anda di acara bisnis. Simak alasannya.',
        content: `
# Pendamping Profesional untuk Acara Bisnis

Di dunia bisnis modern, kesan pertama sangat menentukan. Memiliki pendamping profesional yang tepat bisa menjadi aset strategis.

## Keuntungan Utama

### 1. Meningkatkan Kepercayaan Diri
Pendamping yang berpengalaman membantu Anda merasa lebih nyaman dalam situasi sosial yang menantang.

### 2. Memperluas Networking
Dengan dukungan pendamping yang cakap berkomunikasi, Anda bisa mengakses lebih banyak koneksi bisnis berharga.

### 3. Kesan Profesional
Tampil berpasangan di acara bisnis menunjukkan kematangan sosial dan profesionalisme.

### 4. Navigasi Budaya
Untuk acara internasional, pendamping multilingual membantu menjembatani perbedaan budaya dan bahasa.

## Kapan Membutuhkan Pendamping?

- Corporate gala dan awards ceremony
- Networking dinner dengan klien penting
- Konferensi dan pameran internasional
- Private dinner dengan investor

ARETON.id menyediakan pendamping profesional terverifikasi dengan keahlian di berbagai bidang industri.
        `,
        category: 'Business',
        tags: ['bisnis', 'networking', 'pendamping', 'profesional'],
        status: 'published',
      },
      {
        title: '5 Destinasi Terbaik untuk Corporate Retreat di Indonesia',
        slug: 'destinasi-corporate-retreat-indonesia',
        excerpt: 'Rekomendasi destinasi terbaik untuk corporate retreat yang menggabungkan produktivitas dan relaksasi.',
        content: `
# 5 Destinasi Corporate Retreat Terbaik

Perencanaan corporate retreat yang sempurna dimulai dari pemilihan lokasi yang tepat.

## 1. Ubud, Bali
Kombinasi spiritual dan alam yang sempurna. Resort dengan fasilitas meeting room berstandar internasional dikelilingi sawah dan hutan tropis.

## 2. Labuan Bajo, NTT
Untuk tim yang menginginkan petualangan. Sunset dinner di atas kapal pinisi sambil membahas strategi bisnis.

## 3. Bandung, Jawa Barat
Udara sejuk dan aksesibilitas dari Jakarta. Banyak boutique hotel dengan fasilitas teambuilding.

## 4. Yogyakarta, DIY
Budaya yang kaya dan kuliner yang luar biasa. Ideal untuk retreat yang menggabungkan team building dengan cultural experience.

## 5. Raja Ampat, Papua Barat
Untuk retreat eksklusif level premium. Keindahan bawah laut dunia dan ketenangan absolut.

## Tips Perencanaan

- Book minimal 2 bulan sebelumnya
- Sesuaikan aktivitas dengan tujuan retreat
- Alokasikan waktu free untuk eksplorasi personal
- Pertimbangkan pendamping profesional untuk koordinasi acara
        `,
        category: 'Travel',
        tags: ['corporate-retreat', 'indonesia', 'travel', 'destinasi'],
        status: 'published',
      },
      {
        title: 'Wine Pairing 101: Panduan untuk Pemula',
        slug: 'wine-pairing-panduan-pemula',
        excerpt: 'Pelajari dasar-dasar wine pairing agar Anda lebih percaya diri saat fine dining atau wine tasting event.',
        content: `
# Wine Pairing 101

Memahami dasar wine pairing akan meningkatkan pengalaman dining Anda secara signifikan.

## Prinsip Dasar

### Match Intensity
Wine ringan untuk makanan ringan, wine full-bodied untuk makanan berat.

### Complement atau Contrast
- **Complement**: Chardonnay + butter lobster (keduanya creamy)
- **Contrast**: Riesling + pad thai (manis melawan pedas)

## Panduan Cepat

| Makanan | Wine |
|---------|------|
| Steak | Cabernet Sauvignon |
| Salmon | Pinot Noir |
| Pasta Carbonara | Chardonnay |
| Sushi | Sauvignon Blanc |
| Dessert Cokelat | Port Wine |
| Keju | Merlot |

## Wine Indonesia

Jangan lupakan wine lokal yang semakin berkualitas:
- Hatten Wines (Bali)
- Sababay (Bali)
- Cape Discovery (Bali)

## Tips di Wine Event

- Pegang gelas di stem, bukan bowl
- Swirl, smell, sip — jangan langsung teguk
- Tidak perlu menghabiskan setiap gelas
- Bertanyalah ke sommelier — mereka senang membantu
        `,
        category: 'Lifestyle',
        tags: ['wine', 'fine-dining', 'panduan', 'lifestyle'],
        status: 'published',
      },
      {
        title: 'Keamanan Digital: Melindungi Privasi Anda di Platform Online',
        slug: 'keamanan-digital-privasi-online',
        excerpt: 'Tips praktis menjaga keamanan data dan privasi Anda saat menggunakan platform layanan online.',
        content: `
# Keamanan Digital & Privasi Online

Keamanan data pribadi adalah prioritas utama. Berikut cara melindungi diri Anda.

## 1. Password yang Kuat
- Minimum 12 karakter
- Kombinasi huruf besar, kecil, angka, simbol
- Jangan gunakan password yang sama untuk multiple akun
- Gunakan password manager

## 2. Two-Factor Authentication (2FA)
Aktifkan 2FA di semua akun penting. ARETON.id mendukung TOTP-based 2FA melalui Google Authenticator.

## 3. Hati-hati dengan Phishing
- Periksa URL sebelum klik
- Jangan berikan password melalui email atau chat
- Verifikasi identitas pengirim

## 4. Privasi di Social Media
- Batasi informasi publik
- Review privacy settings secara berkala
- Jangan overshare lokasi real-time

## 5. Enkripsi Data
ARETON.id menggunakan:
- AES-256-GCM untuk data sensitif
- SSL/TLS untuk semua komunikasi
- End-to-end encrypted chat

## Hak Privasi Anda

Berdasarkan UU PDP Indonesia, Anda berhak:
- Mengakses data pribadi Anda
- Meminta koreksi data
- Menghapus akun dan semua data
- Mengekspor data dalam format standar
        `,
        category: 'Safety',
        tags: ['keamanan', 'privasi', 'digital', 'tips'],
        status: 'published',
      },
      {
        title: 'Cara Memilih Pendamping yang Tepat untuk Acara Anda',
        slug: 'cara-memilih-pendamping-tepat',
        excerpt: 'Panduan memilih pendamping profesional sesuai jenis acara, dari casual gathering hingga formal gala.',
        content: `
# Memilih Pendamping yang Tepat

Setiap acara memiliki kebutuhan berbeda. Berikut panduan memilih pendamping yang sesuai.

## Berdasarkan Jenis Acara

### Acara Formal (Gala, Award Ceremony)
- Pilih tier PLATINUM atau DIAMOND
- Pastikan pengalaman di acara formal
- Cek kemampuan bahasa sesuai tamu undangan
- Dress code coordination penting

### Acara Bisnis (Meeting, Conference)
- Pilih pendamping dengan background bisnis
- Kemampuan networking dan small talk
- Pengetahuan industri menjadi nilai plus

### Acara Casual (Dinner, Party)
- GOLD atau SILVER tier sudah sesuai
- Personality match lebih penting dari background
- Hobi dan interest yang sejalan

### Acara Internasional
- Kemampuan multilingual wajib
- Pengalaman travel internasional
- Pemahaman etika lintas budaya

## Tips Booking

1. **Book lebih awal** — Pendamping premium cepat penuh
2. **Baca review** — Lihat pengalaman client sebelumnya
3. **Komunikasikan ekspektasi** — Jelaskan dress code, durasi, dan agenda
4. **Check availability** — Pastikan jadwal match sebelum booking

## Rating & Review

Setelah acara, berikan review jujur untuk membantu pendamping meningkatkan layanan dan membantu client lain.
        `,
        category: 'Guide',
        tags: ['panduan', 'tips', 'memilih', 'pendamping'],
        status: 'published',
      },
    ];

    for (const article of articles) {
      const exists = await prisma.article.findUnique({ where: { slug: article.slug } });
      if (exists) {
        console.log(`  ⏭️  "${article.title}" already exists`);
        continue;
      }

      await prisma.article.create({
        data: {
          ...article,
          status: article.status === 'published' ? 'PUBLISHED' : 'DRAFT',
          authorId: admin.id,
          publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // random within last 30 days
          viewCount: Math.floor(Math.random() * 500 + 50),
        },
      });
      console.log(`  ✅ "${article.title}" (${article.category})`);
    }
  }

  // ══════════════════════════════════════════
  //  Testimonials (8 testimonials)
  // ══════════════════════════════════════════
  console.log('\n💬 Seeding testimonials...');

  // Find or create demo client users for testimonials
  const testimonialUsers = [
    { email: 'budi@demo.areton.id', firstName: 'Budi', lastName: 'Santoso' },
    { email: 'ayu@demo.areton.id', firstName: 'Ayu', lastName: 'Lestari' },
    { email: 'marco@demo.areton.id', firstName: 'Marco', lastName: 'Chen' },
    { email: 'dewi@demo.areton.id', firstName: 'Dewi', lastName: 'Anggraini' },
    { email: 'james@demo.areton.id', firstName: 'James', lastName: 'Wibowo' },
    { email: 'sinta@demo.areton.id', firstName: 'Sinta', lastName: 'Permata' },
    { email: 'tommy@demo.areton.id', firstName: 'Tommy', lastName: 'Hidayat' },
    { email: 'lisa@demo.areton.id', firstName: 'Lisa', lastName: 'Kurniawan' },
  ];

  const testimonials = [
    { content: 'Pengalaman luar biasa menggunakan ARETON.id untuk corporate dinner saya. Pendamping sangat profesional, well-dressed, dan mampu berkonversasi dengan klien internasional kami. Sangat merekomendasikan!', rating: 5, isFeatured: true },
    { content: 'Platform yang sangat user-friendly. Proses booking cepat dan transparan. Pendamping yang saya pilih sesuai dengan profil dan review-nya. Overall experience sangat memuaskan.', rating: 5, isFeatured: true },
    { content: 'Sebagai event organizer, saya sering membutuhkan pendamping profesional untuk klien VIP. ARETON.id menjadi partner andalan kami. Kualitas terjaga dan layanan konsisten.', rating: 5, isFeatured: true },
    { content: 'Pertama kali menggunakan layanan ini untuk gala dinner di hotel bintang 5. Pendamping datang tepat waktu, penampilan impeccable, dan conversationnya engaging. Will definitely use again.', rating: 4, isFeatured: false },
    { content: 'Layanan customer support responsif. Ada kendala kecil saat booking pertama tapi langsung diatasi dengan cepat. Sistem pembayaran aman dan banyak pilihan metode.', rating: 4, isFeatured: false },
    { content: 'Saya menggunakan ARETON.id untuk mendampingi networking event startup. Pendamping memiliki knowledge tentang tech industry yang sangat membantu dalam membangun koneksi.', rating: 5, isFeatured: true },
    { content: 'Fitur keamanan platform sangat baik — 2FA, encrypted chat, dan panic button memberikan rasa aman. Transparansi rating dan review membantu dalam memilih pendamping yang tepat.', rating: 4, isFeatured: false },
    { content: 'Sudah 3 kali menggunakan layanan ini untuk berbagai acara. Konsistensi kualitas sangat baik. Sistem escrow pembayaran juga memberikan jaminan untuk kedua belah pihak.', rating: 5, isFeatured: true },
  ];

  for (let i = 0; i < testimonialUsers.length; i++) {
    const tu = testimonialUsers[i];
    const t = testimonials[i];

    let user = await prisma.user.findUnique({ where: { email: tu.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: tu.email,
          firstName: tu.firstName,
          lastName: tu.lastName,
          passwordHash,
          role: 'CLIENT',
          isVerified: true,
          isActive: true,
        },
      });
    }

    const existingTestimonial = await prisma.testimonial.findFirst({ where: { userId: user.id } });
    if (existingTestimonial) {
      console.log(`  ⏭️  Testimonial from ${tu.firstName} already exists`);
      continue;
    }

    await prisma.testimonial.create({
      data: {
        userId: user.id,
        content: t.content,
        rating: t.rating,
        isApproved: true,
        isFeatured: t.isFeatured,
      },
    });
    console.log(`  ✅ Testimonial from ${tu.firstName} ${tu.lastName} (${t.rating}⭐${t.isFeatured ? ' ⭐Featured' : ''})`);
  }

  console.log('\n🎉 Content seeding complete!');
  console.log('   - 4 additional escort profiles');
  console.log('   - 6 blog articles');
  console.log('   - 8 testimonials');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
