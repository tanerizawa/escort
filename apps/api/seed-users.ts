import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test users...');
  
  // Create test client
  const clientPasswordHash = await bcrypt.hash('password123', 12);
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      passwordHash: clientPasswordHash,
      firstName: 'Test',
      lastName: 'Client',
      role: 'CLIENT',
      isActive: true,
      isVerified: true,
    },
  });

  // Create test escort
  const escortPasswordHash = await bcrypt.hash('password123', 12);
  const escort = await prisma.user.upsert({
    where: { email: 'escort@test.com' },
    update: {},
    create: {
      email: 'escort@test.com',
      passwordHash: escortPasswordHash,
      firstName: 'Test',
      lastName: 'Escort',
      role: 'ESCORT',
      isActive: true,
      isVerified: true,
    },
  });

  // Create escort profile separately
  await prisma.escortProfile.upsert({
    where: { userId: escort.id },
    update: {},
    create: {
      userId: escort.id,
      bio: 'Test escort account',
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
      hourlyRate: 1000000,
      languages: ['Indonesian', 'English'],
      skills: ['Companion', 'Conversation'],
    }
  });
  console.log('Created users:', { client: client.email, escort: escort.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });