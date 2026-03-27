'use client';

import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile, useUpdateProfile } from '@/lib/hooks/use-profile';

/** Validation schema for profile fields. */
const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters'),
  phone: z
    .string()
    .regex(/^(\+?\d{10,15})?$/, 'Enter a valid phone number (10-15 digits)')
    .optional()
    .or(z.literal('')),
});

/**
 * PersonalInfoForm -- displays and edits the buyer's name, email, and phone.
 * Email is always read-only (changed via backend only).
 */
export function PersonalInfoForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Edit mode toggle
  const [editing, setEditing] = useState(false);

  // Local form state (populated when entering edit mode)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Enter edit mode and seed fields from current profile. */
  function startEditing() {
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
    setErrors({});
    setEditing(true);
  }

  /** Cancel editing without saving. */
  function cancelEditing() {
    setEditing(false);
    setErrors({});
  }

  /** Validate and submit the updated profile. */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Validate with Zod
    const result = profileSchema.safeParse({ name, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await updateProfile.mutateAsync({ name: result.data.name, phone: result.data.phone || undefined });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-9 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>

        {/* Toggle edit / cancel */}
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEditing}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={cancelEditing}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            {editing ? (
              <>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </>
            ) : (
              <p className="text-sm py-2">{profile?.name || '-'}</p>
            )}
          </div>

          {/* Email (always read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={profile?.email ?? ''}
              disabled
              readOnly
              className="disabled:opacity-70"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone</Label>
            {editing ? (
              <>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </>
            ) : (
              <p className="text-sm py-2">{profile?.phone || 'Not set'}</p>
            )}
          </div>

          {/* Save button (only in edit mode) */}
          {editing && (
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
