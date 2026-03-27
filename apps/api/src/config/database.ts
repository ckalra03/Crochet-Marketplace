import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { softDeleteExtension } from '../middleware/soft-delete';

const globalForPrisma = globalThis as unknown as { prisma: any };

// Create the base Prisma client and apply the soft-delete extension.
// The extension intercepts delete -> update (sets deletedAt) and
// auto-filters out soft-deleted rows on find queries for User & Product.
const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(softDeleteExtension());

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

export const prisma = basePrisma;
export default prisma;
