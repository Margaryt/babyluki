/**
 * Database seed script.
 * Creates a test baby for local development. Run via `npm run db:seed`.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baby = await prisma.baby.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Luki',
      /** Born ~7 weeks before the project started. */
      birthDate: new Date('2026-01-17'),
    },
  });

  console.log(`Seeded baby: ${baby.name} (${baby.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
