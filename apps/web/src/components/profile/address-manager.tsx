'use client';

import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/lib/hooks/use-profile';
import type { AddressData } from '@/lib/api/profile';

// ---------------------------------------------------------------------------
// Zod schema for address form validation
// ---------------------------------------------------------------------------
const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .regex(/^\d{5,10}$/, 'Enter a valid postal code'),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Address extends AddressData {
  id: string;
  isDefault?: boolean;
}

/** Initial empty address form values. */
const emptyAddress: AddressData = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: false,
};

/**
 * AddressManager -- lists, adds, edits, and deletes the buyer's saved addresses.
 * Uses a dialog for both add and edit operations.
 */
export function AddressManager() {
  const { data: addresses = [], isLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = adding
  const [form, setForm] = useState<AddressData>(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ------ Helpers ------

  /** Open dialog for adding a new address. */
  function openAdd() {
    setEditingId(null);
    setForm(emptyAddress);
    setErrors({});
    setDialogOpen(true);
  }

  /** Open dialog for editing an existing address. */
  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? '',
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country ?? 'IN',
      isDefault: addr.isDefault ?? false,
    });
    setErrors({});
    setDialogOpen(true);
  }

  /** Update a single form field. */
  function setField(field: keyof AddressData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /** Validate and submit (add or update). */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (editingId) {
        await updateAddress.mutateAsync({ id: editingId, data: result.data });
        toast.success('Address updated');
      } else {
        await addAddress.mutateAsync(result.data);
        toast.success('Address added');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save address');
    }
  }

  /** Confirm and delete an address. */
  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteAddress.mutateAsync(deleteId);
      toast.success('Address deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete address');
    } finally {
      setDeleteId(null);
    }
  }

  /** Set an address as the default. */
  async function handleSetDefault(id: string) {
    try {
      await updateAddress.mutateAsync({ id, data: { isDefault: true } });
      toast.success('Default address updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set default');
    }
  }

  // ------ Loading skeleton ------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ------ Saving state helper ------
  const isSaving = addAddress.isPending || updateAddress.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved Addresses</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Address
          </Button>
        </CardHeader>

        <CardContent>
          {(addresses as Address[]).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No saved addresses yet. Add one to speed up checkout.
            </p>
          ) : (
            <div className="space-y-3">
              {(addresses as Address[]).map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  {/* Address details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {addr.label && (
                        <span className="text-sm font-semibold">{addr.label}</span>
                      )}
                      {addr.isDefault && (
                        <span className="rounded bg-primary-600/10 px-2 py-0.5 text-xs font-medium text-primary-600">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{addr.line1}</p>
                    {addr.line2 && <p className="text-sm">{addr.line2}</p>}
                    <p className="text-sm">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Set as default"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() => openEdit(addr)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={() => setDeleteId(addr.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add Address'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your saved address details.'
                : 'Enter a new delivery address.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Label (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-label">Label (optional)</Label>
              <Input
                id="addr-label"
                value={form.label ?? ''}
                onChange={(e) => setField('label', e.target.value)}
                placeholder="e.g. Home, Office"
              />
            </div>

            {/* Line 1 */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-line1">Address Line 1</Label>
              <Input
                id="addr-line1"
                value={form.line1}
                onChange={(e) => setField('line1', e.target.value)}
                placeholder="Street address"
              />
              {errors.line1 && <p className="text-sm text-red-500">{errors.line1}</p>}
            </div>

            {/* Line 2 */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-line2">Address Line 2 (optional)</Label>
              <Input
                id="addr-line2"
                value={form.line2 ?? ''}
                onChange={(e) => setField('line2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>

            {/* City & State row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-state">State</Label>
                <Input
                  id="addr-state"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                />
                {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
              </div>
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-postal">Postal Code</Label>
              <Input
                id="addr-postal"
                value={form.postalCode}
                onChange={(e) => setField('postalCode', e.target.value)}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">{errors.postalCode}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteAddress.isPending}
            >
              {deleteAddress.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
