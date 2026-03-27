'use client';

import { useState } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAddresses, useAddAddress } from '@/lib/hooks/use-profile';
import { toast } from 'sonner';

interface AddressSelectorProps {
  /** Currently selected address ID */
  selectedId: string;
  /** Called when the user selects an address */
  onSelect: (addressId: string) => void;
}

/**
 * Address selector with radio group for saved addresses and
 * a dialog to add a new address inline during checkout.
 * Default address is pre-selected by the parent.
 */
export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
  const { data: addresses, isLoading } = useAddresses();
  const addAddressMutation = useAddAddress();
  const [dialogOpen, setDialogOpen] = useState(false);

  // New address form state
  const [form, setForm] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddAddress() {
    if (!form.line1 || !form.city || !form.state || !form.postalCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    addAddressMutation.mutate(
      {
        label: form.label || undefined,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      },
      {
        onSuccess: (newAddr: any) => {
          toast.success('Address added');
          setDialogOpen(false);
          setForm({ label: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
          // Auto-select the newly added address
          if (newAddr?.id) onSelect(newAddr.id);
        },
        onError: () => toast.error('Failed to add address'),
      },
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading addresses...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* No addresses fallback */}
        {(!addresses || addresses.length === 0) ? (
          <p className="text-muted-foreground text-sm mb-4">
            No saved addresses. Please add one to continue.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {addresses.map((addr: any) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedId === addr.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  value={addr.id}
                  checked={selectedId === addr.id}
                  onChange={() => onSelect(addr.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">
                    {addr.label || 'Address'}
                    {addr.isDefault && (
                      <span className="ml-2 text-xs text-primary-600 font-normal">(Default)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Add New Address dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Enter your shipping address details below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Label */}
              <div>
                <Label htmlFor="addr-label">Label (optional)</Label>
                <Input
                  id="addr-label"
                  placeholder="e.g. Home, Office"
                  value={form.label}
                  onChange={(e) => handleFormChange('label', e.target.value)}
                />
              </div>

              {/* Line 1 */}
              <div>
                <Label htmlFor="addr-line1">Address Line 1 *</Label>
                <Input
                  id="addr-line1"
                  placeholder="House/flat number, street"
                  value={form.line1}
                  onChange={(e) => handleFormChange('line1', e.target.value)}
                />
              </div>

              {/* Line 2 */}
              <div>
                <Label htmlFor="addr-line2">Address Line 2</Label>
                <Input
                  id="addr-line2"
                  placeholder="Landmark, area (optional)"
                  value={form.line2}
                  onChange={(e) => handleFormChange('line2', e.target.value)}
                />
              </div>

              {/* City + State row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="addr-city">City *</Label>
                  <Input
                    id="addr-city"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="addr-state">State *</Label>
                  <Input
                    id="addr-state"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                  />
                </div>
              </div>

              {/* Postal code */}
              <div>
                <Label htmlFor="addr-postal">Postal Code *</Label>
                <Input
                  id="addr-postal"
                  placeholder="6-digit PIN code"
                  value={form.postalCode}
                  onChange={(e) => handleFormChange('postalCode', e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAddAddress}
                disabled={addAddressMutation.isPending}
              >
                {addAddressMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
