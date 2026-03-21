import prisma from '../config/database';
import { createModuleLogger } from './logger';

const log = createModuleLogger('audit');

interface AuditLogParams {
  userId?: string | null;
  action: string;
  auditableType: string;
  auditableId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an audit log entry to the database.
 * Used for business-critical actions: order state changes, approvals,
 * payouts, dispute resolutions, etc.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        auditableType: params.auditableType,
        auditableId: params.auditableId,
        oldValues: params.oldValues ?? undefined,
        newValues: params.newValues ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    });

    log.debug(`Audit: ${params.action} on ${params.auditableType}:${params.auditableId}`, {
      userId: params.userId,
    });
  } catch (error) {
    // Audit log failures should not crash the app
    log.error('Failed to write audit log', { error, params });
  }
}
