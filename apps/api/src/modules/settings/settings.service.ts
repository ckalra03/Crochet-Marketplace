import prisma from '../../config/database';

/**
 * Default platform settings.
 * Applied on first access if the platform_settings table is empty.
 */
const DEFAULT_SETTINGS: Record<string, unknown> = {
  commissionRate: 1500,                  // basis points (1500 = 15.00%)
  returnWindowDays: 7,
  minimumPayoutCents: 50000,             // INR 500.00
  payoutCycleFrequency: 'monthly',
  slaThresholds: {
    quoteResponseHours: 48,
    dispatchHours: 72,
    deliveryDays: 10,
    disputeResolutionHours: 120,
  },
};

/**
 * Platform settings service using key-value pairs stored in platform_settings table.
 * Each setting is stored as a JSON value keyed by a unique string.
 */
export class SettingsService {
  /**
   * Seed default settings if the table is empty.
   * Called internally before reads to ensure defaults exist.
   */
  private async seedDefaults() {
    const count = await (prisma as any).platformSetting.count();
    if (count > 0) return;

    const entries = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value: value as any,
    }));

    // Insert defaults one by one (upsert to be safe)
    for (const entry of entries) {
      await (prisma as any).platformSetting.upsert({
        where: { key: entry.key },
        update: {},
        create: { key: entry.key, value: entry.value },
      });
    }
  }

  /** Get a single setting by key. Returns null if not found. */
  async getSetting(key: string) {
    await this.seedDefaults();
    const setting = await (prisma as any).platformSetting.findUnique({
      where: { key },
    });
    return setting ? { key: setting.key, value: setting.value, updatedAt: setting.updatedAt } : null;
  }

  /** Get all platform settings as an array. */
  async getAllSettings() {
    await this.seedDefaults();
    const settings = await (prisma as any).platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return settings.map((s: any) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      updatedAt: s.updatedAt,
    }));
  }

  /** Upsert a single setting by key. */
  async updateSetting(key: string, value: unknown) {
    const setting = await (prisma as any).platformSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
    return { key: setting.key, value: setting.value, updatedAt: setting.updatedAt };
  }
}

export const settingsService = new SettingsService();
