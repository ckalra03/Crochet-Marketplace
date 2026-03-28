'use client';

/**
 * Admin Coupons Page -- CRUD management for discount coupons.
 * Lists all coupons in a table and provides a dialog to create new ones.
 */

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminCoupons, useCreateCoupon, useDeleteCoupon } from '@/lib/hooks/use-admin';
import { formatMoney } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

/** Shape of a coupon record from the API */
interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderCents: number | null;
  maxDiscountCents: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { data, isLoading } = useAdminCoupons();
  const createMutation = useCreateCoupon();
  const deleteMutation = useDeleteCoupon();

  // Create coupon dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    minOrderRupees: '',
    maxDiscountRupees: '',
    maxUses: '',
    expiresAt: '',
  });

  const coupons: Coupon[] = data?.coupons ?? [];

  /** Handle creating a new coupon */
  async function handleCreate() {
    if (!form.code || !form.value) {
      toast.error('Code and value are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: form.code,
        type: form.type,
        value: form.type === 'FIXED'
          ? Math.round(Number(form.value) * 100) // Convert rupees to cents for FIXED
          : Number(form.value), // Percentage stays as-is
        minOrderCents: form.minOrderRupees
          ? Math.round(Number(form.minOrderRupees) * 100)
          : undefined,
        maxDiscountCents: form.maxDiscountRupees
          ? Math.round(Number(form.maxDiscountRupees) * 100)
          : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Coupon created');
      setShowCreate(false);
      // Reset form
      setForm({ code: '', type: 'PERCENTAGE', value: '', minOrderRupees: '', maxDiscountRupees: '', maxUses: '', expiresAt: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    }
  }

  /** Deactivate a coupon */
  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Coupon deactivated');
    } catch {
      toast.error('Failed to deactivate coupon');
    }
  }

  /** Display the value in a human-readable format */
  function displayValue(coupon: Coupon) {
    if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`;
    return formatMoney(coupon.value);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {/* Create coupon dialog -- shown inline as a card */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Create New Coupon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coupon code */}
              <div>
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE10"
                  className="mt-1"
                />
              </div>

              {/* Type selector */}
              <div>
                <Label>Discount Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                  className="mt-1 w-full border rounded-md p-2 text-sm bg-background"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rs.)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <Label htmlFor="coupon-value">
                  {form.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (Rs.)'}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'PERCENTAGE' ? '10' : '100'}
                  min={1}
                  className="mt-1"
                />
              </div>

              {/* Min order */}
              <div>
                <Label htmlFor="min-order">Min Order (Rs., optional)</Label>
                <Input
                  id="min-order"
                  type="number"
                  value={form.minOrderRupees}
                  onChange={(e) => setForm({ ...form, minOrderRupees: e.target.value })}
                  placeholder="500"
                  className="mt-1"
                />
              </div>

              {/* Max discount (for percentage type) */}
              {form.type === 'PERCENTAGE' && (
                <div>
                  <Label htmlFor="max-discount">Max Discount (Rs., optional)</Label>
                  <Input
                    id="max-discount"
                    type="number"
                    value={form.maxDiscountRupees}
                    onChange={(e) => setForm({ ...form, maxDiscountRupees: e.target.value })}
                    placeholder="200"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Max uses */}
              <div>
                <Label htmlFor="max-uses">Max Uses (optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="100"
                  className="mt-1"
                />
              </div>

              {/* Expiry date */}
              <div>
                <Label htmlFor="expires-at">Expires At (optional)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupons table */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          No coupons yet. Create one to get started.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Code</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Value</th>
                    <th className="text-left px-4 py-3 font-medium">Min Order</th>
                    <th className="text-left px-4 py-3 font-medium">Max Uses</th>
                    <th className="text-left px-4 py-3 font-medium">Used</th>
                    <th className="text-left px-4 py-3 font-medium">Expires</th>
                    <th className="text-left px-4 py-3 font-medium">Active</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                      <td className="px-4 py-3">{coupon.type}</td>
                      <td className="px-4 py-3">{displayValue(coupon)}</td>
                      <td className="px-4 py-3">
                        {coupon.minOrderCents ? formatMoney(coupon.minOrderCents) : '--'}
                      </td>
                      <td className="px-4 py-3">{coupon.maxUses ?? 'Unlimited'}</td>
                      <td className="px-4 py-3">{coupon.usedCount}</td>
                      <td className="px-4 py-3">
                        {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                            coupon.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {coupon.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(coupon.id)}
                            disabled={deleteMutation.isPending}
                            aria-label={`Deactivate ${coupon.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
