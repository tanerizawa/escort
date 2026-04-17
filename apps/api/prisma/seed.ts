/**
 * ARETON.id — Prisma seed
 *
 * Idempotently creates baseline demo accounts used by local development
 * and CI smoke tests. Runs via `npm run prisma:seed` (inside apps/api).
 *
 * Accounts:
 *   admin@areton.id  / password123 (SUPER_ADMIN)
 *   client@test.com  / password123 (CLIENT)
 *   escort@test.com  / password123 (ESCORT + minimal profile)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@areton.id' },
    update: {},
    create: {
      email: 'admin@areton.id',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Client',
      role: 'CLIENT',
      isActive: true,
      isVerified: true,
    },
  });

  const escort = await prisma.user.upsert({
    where: { email: 'escort@test.com' },
    update: {},
    create: {
      email: 'escort@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Escort',
      role: 'ESCORT',
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.escortProfile.upsert({
    where: { userId: escort.id },
    update: {},
    create: {
      userId: escort.id,
      bio: 'Seeded demo escort account for local development.',
      age: '25',
      height: '165 cm',
      weight: '55 kg',
      complexion: 'Fair',
      hairStyle: 'Long',
      eyeColor: 'Brown',
      bodyType: 'Slim',
      nationality: 'Indonesian',
      basedIn: 'Jakarta',
      occupation: 'Professional',
      fieldOfWork: 'Entertainment',
      smoking: 'false',
      tattooPiercing: 'false',
      travelScope: 'Jakarta',
      hourlyRate: 1_000_000,
      languages: ['Indonesian', 'English'],
      skills: ['Companion', 'Conversation'],
    },
  });

  console.log('Seeded accounts:');
  console.log(`  - ${admin.email}  (SUPER_ADMIN)`);
  console.log(`  - ${client.email}  (CLIENT)`);
  console.log(`  - ${escort.email}  (ESCORT)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
