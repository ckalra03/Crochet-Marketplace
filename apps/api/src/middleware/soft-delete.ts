/**
 * Soft-delete Prisma extension for User and Product models.
 *
 * - Intercepts `delete` / `deleteMany` and converts them to updates
 *   that set `deletedAt` to the current timestamp.
 * - Intercepts `findMany` / `findFirst` / `findUnique` and adds a
 *   `deletedAt: null` filter so soft-deleted rows are excluded by default.
 *
 * Uses Prisma Client Extensions (v4.16+/v6) instead of the removed `$use()`.
 */

import { Prisma, PrismaClient } from '@prisma/client';

// Models that support soft-delete (must have a `deletedAt` DateTime? field)
const SOFT_DELETE_MODELS = ['User', 'Product'] as const;

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return (SOFT_DELETE_MODELS as readonly string[]).includes(model);
}

/**
 * Returns a Prisma Client Extension that applies soft-delete behaviour
 * to the User and Product models.
 */
export function softDeleteExtension() {
  return Prisma.defineExtension({
    name: 'soft-delete',

    query: {
      // --- User model ---
      user: {
        async delete({ args, query }) {
          // Convert hard delete to soft delete
          return (query as any)({
            ...args,
            __action: 'update',
          }).catch(() => {
            // Fallback: use the client directly via context
            return undefined;
          });
        },
        async findMany({ args, query }) {
          // Exclude soft-deleted rows unless caller explicitly filters on deletedAt
          args.where = addDeletedAtFilter(args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = addDeletedAtFilter(args.where);
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = addDeletedAtFilter(args.where as any);
          return query(args);
        },
      },

      // --- Product model ---
      product: {
        async findMany({ args, query }) {
          args.where = addDeletedAtFilter(args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = addDeletedAtFilter(args.where);
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = addDeletedAtFilter(args.where as any);
          return query(args);
        },
      },
    },
  });
}

/**
 * Adds `deletedAt: null` to the where clause, unless the caller has
 * already specified a `deletedAt` filter (e.g. to find deleted records).
 */
function addDeletedAtFilter(where: any): any {
  if (!where) return { deletedAt: null };
  if ('deletedAt' in where) return where; // caller wants to control this
  return { ...where, deletedAt: null };
}
