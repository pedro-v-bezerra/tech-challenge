import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Tipos de transferência semeados (tabela de referência). */
const transactionTypes = [
  { id: 1, name: 'TRANSFER' },
  { id: 2, name: 'DEPOSIT' },
  { id: 3, name: 'WITHDRAWAL' },
];

async function main(): Promise<void> {
  for (const type of transactionTypes) {
    await prisma.transactionType.upsert({
      where: { id: type.id },
      update: { name: type.name },
      create: type,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
