// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

type GlobalThisWithPrisma = typeof globalThis & {
  prisma?: ReturnType<typeof prismaClientSingleton>;
};

const globalForPrisma = global as GlobalThisWithPrisma;

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
