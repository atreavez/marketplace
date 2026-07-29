import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Services', slug: 'services' },
    { name: 'Vehicles', slug: 'vehicles' },
    { name: 'Real Estate', slug: 'real-estate' },
    { name: 'Freelance', slug: 'freelance' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  console.log('Seeded categories.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
