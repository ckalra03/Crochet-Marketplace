import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Soft-delete middleware: automatically filter deleted records
prisma.$use(async (params, next) => {
  const modelsWithSoftDelete = ['User', 'Product'];

  if (modelsWithSoftDelete.includes(params.model ?? '')) {
    // Filter out soft-deleted records on find operations
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.action = 'findFirst';
      params.args.where = { ...params.args.where, deletedAt: null };
    }

    if (params.action === 'findMany') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    // Convert delete to soft delete
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args.data) params.args.data = {};
      params.args.data.deletedAt = new Date();
    }
  }

  return next(params);
});

export default prisma;
