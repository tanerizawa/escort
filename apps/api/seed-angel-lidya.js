/**
 * Seed: Angel Lidya professional escort profile
 * Run: cd apps/api && node seed-angel-lidya.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findUnique({ where: { email: 'angel.lidya@areton.id' } });
  
  if (!user) {
    const passwordHash = await bcrypt.hash('Angel@2026!', 12);
    user = await prisma.user.create({
      data: {
        email: 'angel.lidya@areton.id',
        passwordHash,
        firstName: 'Angel',
        lastName: 'Lidya',
        phone: '+6281200000001',
        role: 'ESCORT',
        isActive: true,
        isVerified: true,
      },
    });
    console.log('User created');
  }

  const existingProfile = await prisma.escortProfile.findUnique({ where: { userId: user.id } });
  if (existingProfile) {
    console.log('Angel Lidya profile already exists, skipping');
    return;
  }

  await prisma.escortProfile.create({
    data: {
      userId: user.id,
      tier: 'PLATINUM',
      hourlyRate: 1500000,
      languages: ['Indonesia', 'English', 'Japanese'],
      skills: ['Social Etiquette', 'Public Speaking', 'Fine Dining Protocol', 'Cross-Cultural Communication', 'Event Hosting', 'Photography Companion'],
      bio: `Pendamping profesional dengan standar tertinggi, menggabungkan keanggunan dan kecerdasan dalam setiap interaksi. Sebagai mahasiswi semester akhir jurusan Komunikasi dan model freelance, saya memiliki kemampuan adaptasi sosial yang sangat baik di berbagai lingkungan — dari gala dinner eksklusif hingga konferensi bisnis internasional.

Pengalaman saya mencakup pendampingan di acara-acara prestisius, perjalanan bisnis domestik dan internasional, serta event networking high-profile. Saya menguasai protokol formal, etika dining internasional, dan mampu menciptakan percakapan bermakna yang meninggalkan kesan positif.

Dengan penguasaan tiga bahasa dan pemahaman mendalam tentang budaya Indonesia serta internasional, saya berkomitmen memberikan pengalaman pendampingan yang tak terlupakan dengan profesionalisme dan kehangatan.`,
      age: 'Awal 20-an',
      height: '170',
      weight: '54',
      bodyType: 'Slim & Athletic',
      hairStyle: 'Panjang Lurus',
      eyeColor: 'Cokelat',
      complexion: 'Kuning Langsat',
      nationality: 'Indonesia',
      occupation: 'Mahasiswi & Model Freelance',
      fieldOfWork: 'Komunikasi & Fashion',
      basedIn: 'Jakarta',
      travelScope: 'Nasional & Internasional',
      smoking: 'false',
      tattooPiercing: 'false',
      favourites: {
        books: ['The Art of Communication', 'Atomic Habits', 'Filosofi Teras'],
        films: ['La La Land', 'The Grand Budapest Hotel', 'Parasite'],
        interests: ['Fashion', 'Photography', 'Travel', 'Cultural Events', 'Art Exhibitions'],
        sports: ['Yoga', 'Swimming', 'Tennis'],
        cuisine: ['Japanese', 'French', 'Indonesian Fine Dining'],
        drinks: ['Matcha Latte', 'Rosé Wine', 'Sparkling Water'],
        perfume: ['Chanel No. 5', 'Jo Malone Wood Sage', 'Dior J\'adore'],
      },
    },
  });

  console.log('Angel Lidya profile created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
