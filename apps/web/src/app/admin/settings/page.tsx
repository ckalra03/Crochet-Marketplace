'use client';

/**
 * Admin Platform Settings Page (A-18)
 *
 * Card-based layout for managing platform configuration:
 * - Commission Rate: number input (basis points, displayed as %)
 * - Return Window: number input (days)
 * - Minimum Payout: number input (INR, converts to/from cents)
 * - Payout Cycle: select (weekly / bi-weekly / monthly)
 * - SLA Thresholds: individual inputs for each threshold value
 *
 * Each setting has its own save button and shows a success toast on save.
 * Loading skeletons are displayed while settings are being fetched.
 *
 * Data is managed via useSettings() and useUpdateSetting().
 */

import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useUpdateSetting } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Helper: extract setting value by key from settings array or object ─── */

function getSettingValue(settings: any, key: string): unknown {
  if (!settings) return undefined;
  // If settings is an array of { key, value } objects
  if (Array.isArray(settings)) {
    const found = settings.find((s: any) => s.key === key);
    return found?.value;
  }
  // If settings is a plain object keyed by setting name
  if (typeof settings === 'object') {
    return settings[key];
  }
  return undefined;
}

/* ─── SLA threshold keys and their display labels ─── */

const SLA_THRESHOLD_KEYS = [
  { key: 'quoteResponseHours', label: 'Quote Response (hours)' },
  { key: 'dispatchDays', label: 'Dispatch (days)' },
  { key: 'deliveryDays', label: 'Delivery (days)' },
  { key: 'disputeResolutionDays', label: 'Dispute Resolution (days)' },
];

/* ─── Page component ─── */

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  // ── Local state for each setting ──
  const [commissionBps, setCommissionBps] = useState('');
  const [returnWindowDays, setReturnWindowDays] = useState('');
  const [minPayoutInr, setMinPayoutInr] = useState('');
  const [payoutCycle, setPayoutCycle] = useState('');
  const [slaThresholds, setSlaThresholds] = useState<Record<string, string>>({});

  // Populate local state when settings load
  useEffect(() => {
    if (!settings) return;

    // Commission rate (stored as basis points, e.g. 1000 = 10%)
    const commission = getSettingValue(settings, 'commissionRate');
    if (commission !== undefined) setCommissionBps(String(commission));

    // Return window in days
    const returnWindow = getSettingValue(settings, 'returnWindowDays');
    if (returnWindow !== undefined) setReturnWindowDays(String(returnWindow));

    // Minimum payout (stored in cents, display as INR)
    const minPayout = getSettingValue(settings, 'minimumPayoutCents');
    if (minPayout !== undefined) setMinPayoutInr(String(Number(minPayout) / 100));

    // Payout cycle
    const cycle = getSettingValue(settings, 'payoutCycle');
    if (cycle !== undefined) setPayoutCycle(String(cycle));

    // SLA thresholds (stored as a JSON object)
    const thresholds = getSettingValue(settings, 'slaThresholds');
    if (thresholds && typeof thresholds === 'object') {
      const parsed: Record<string, string> = {};
      for (const key of SLA_THRESHOLD_KEYS) {
        const val = (thresholds as any)[key.key];
        if (val !== undefined) parsed[key.key] = String(val);
      }
      setSlaThresholds(parsed);
    }
  }, [settings]);

  /** Generic save handler that calls updateSetting and shows a toast. */
  const saveSetting = useCallback(
    (key: string, value: unknown, label: string) => {
      updateSetting.mutate(
        { key, value },
        {
          onSuccess: () => toast.success(`${label} updated successfully`),
          onError: (err: any) =>
            toast.error(err?.response?.data?.error || `Failed to update ${label}`),
        },
      );
    },
    [updateSetting],
  );

  // Show loading skeletons while settings load
  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure commission rates, payout rules, return policies, and SLA thresholds.
        </p>
      </div>

      {/* Settings cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Commission Rate ── */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Rate</CardTitle>
            <CardDescription>
              Platform commission in basis points. 100 bps = 1%.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="commission-bps">Basis Points</Label>
                <Input
                  id="commission-bps"
                  type="number"
                  min="0"
                  max="10000"
                  value={commissionBps}
                  onChange={(e) => setCommissionBps(e.target.value)}
                />
              </div>
              <div className="pt-6 text-sm text-muted-foreground min-w-[60px]">
                = {commissionBps ? (Number(commissionBps) / 100).toFixed(2) : '0.00'}%
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                saveSetting('commissionRate', Number(commissionBps), 'Commission Rate')
              }
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </CardContent>
        </Card>

        {/* ── Return Window ── */}
        <Card>
          <CardHeader>
            <CardTitle>Return Window</CardTitle>
            <CardDescription>
              Number of days a buyer has to initiate a return after delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="return-days">Days</Label>
              <Input
                id="return-days"
                type="number"
                min="0"
                value={returnWindowDays}
                onChange={(e) => setReturnWindowDays(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={() =>
                saveSetting('returnWindowDays', Number(returnWindowDays), 'Return Window')
              }
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </CardContent>
        </Card>

        {/* ── Minimum Payout ── */}
        <Card>
          <CardHeader>
            <CardTitle>Minimum Payout</CardTitle>
            <CardDescription>
              Minimum amount (in INR) required before a payout is generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="min-payout">Amount (INR)</Label>
              <Input
                id="min-payout"
                type="number"
                min="0"
                step="0.01"
                value={minPayoutInr}
                onChange={(e) => setMinPayoutInr(e.target.value)}
              />
              {minPayoutInr && !isNaN(parseFloat(minPayoutInr)) && (
                <p className="text-xs text-muted-foreground">
                  = {Math.round(parseFloat(minPayoutInr) * 100)} cents (stored value)
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() =>
                saveSetting(
                  'minimumPayoutCents',
                  Math.round(parseFloat(minPayoutInr) * 100),
                  'Minimum Payout',
                )
              }
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </CardContent>
        </Card>

        {/* ── Payout Cycle ── */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Cycle</CardTitle>
            <CardDescription>
              How frequently payouts are generated for sellers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Frequency</Label>
              <Select value={payoutCycle} onValueChange={setPayoutCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() => saveSetting('payoutCycle', payoutCycle, 'Payout Cycle')}
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </CardContent>
        </Card>

        {/* ── SLA Thresholds ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Thresholds</CardTitle>
            <CardDescription>
              Maximum time allowed for each SLA type before a breach is recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SLA_THRESHOLD_KEYS.map((threshold) => (
                <div key={threshold.key} className="space-y-1">
                  <Label htmlFor={`sla-${threshold.key}`}>{threshold.label}</Label>
                  <Input
                    id={`sla-${threshold.key}`}
                    type="number"
                    min="0"
                    value={slaThresholds[threshold.key] ?? ''}
                    onChange={(e) =>
                      setSlaThresholds((prev) => ({
                        ...prev,
                        [threshold.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                // Convert string values back to numbers
                const thresholdValues: Record<string, number> = {};
                for (const key of SLA_THRESHOLD_KEYS) {
                  const val = slaThresholds[key.key];
                  if (val !== undefined && val !== '') {
                    thresholdValues[key.key] = Number(val);
                  }
                }
                saveSetting('slaThresholds', thresholdValues, 'SLA Thresholds');
              }}
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Thresholds
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Loading skeleton ─── */

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`h-48 rounded-lg ${i === 4 ? 'lg:col-span-2' : ''}`} />
        ))}
      </div>
    </div>
  );
}
