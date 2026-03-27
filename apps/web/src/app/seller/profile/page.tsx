'use client';

/**
 * Seller Profile Page (Tabbed)
 *
 * Three tabs:
 *  1. Business Info  -- name, description (editable via useUpdateSellerProfile)
 *  2. Bank Details   -- account holder, number, IFSC, bank name (editable)
 *  3. Portfolio      -- placeholder for sample work images
 *
 * Loads the seller profile with useSellerProfile().
 */

import { useState, useEffect } from 'react';
import { useSellerProfile, useUpdateSellerProfile, useUpdateBankDetails } from '@/lib/hooks/use-seller';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageIcon } from 'lucide-react';

export default function SellerProfilePage() {
  const { data: profile, isLoading } = useSellerProfile();

  if (isLoading) return <ProfileLoadingSkeleton />;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Seller Profile</h1>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        {/* Tab 1: Business Info */}
        <TabsContent value="business">
          <BusinessInfoTab profile={profile} />
        </TabsContent>

        {/* Tab 2: Bank Details */}
        <TabsContent value="bank">
          <BankDetailsTab profile={profile} />
        </TabsContent>

        {/* Tab 3: Portfolio / Sample Work */}
        <TabsContent value="portfolio">
          <PortfolioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Tab 1: Business Info ─── */

function BusinessInfoTab({ profile }: { profile: any }) {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const updateProfile = useUpdateSellerProfile();

  // Populate form from profile data
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName ?? '');
      setDescription(profile.description ?? '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ businessName, description });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about your craft and business..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          {updateProfile.isSuccess && (
            <p className="text-sm text-green-600">Profile updated successfully.</p>
          )}
          {updateProfile.isError && (
            <p className="text-sm text-red-600">Failed to update profile. Please try again.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Tab 2: Bank Details ─── */

function BankDetailsTab({ profile }: { profile: any }) {
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const updateBank = useUpdateBankDetails();

  // Populate from profile bank details
  useEffect(() => {
    if (profile?.bankDetails) {
      setAccountHolderName(profile.bankDetails.accountHolderName ?? '');
      setAccountNumber(profile.bankDetails.accountNumber ?? '');
      setIfscCode(profile.bankDetails.ifscCode ?? '');
      setBankName(profile.bankDetails.bankName ?? '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBank.mutate({ accountHolderName, accountNumber, ifscCode, bankName });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bank Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Name as on bank account"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Bank account number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder="e.g. SBIN0001234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
              />
            </div>
          </div>
          <Button type="submit" disabled={updateBank.isPending}>
            {updateBank.isPending ? 'Saving...' : 'Save Bank Details'}
          </Button>
          {updateBank.isSuccess && (
            <p className="text-sm text-green-600">Bank details updated successfully.</p>
          )}
          {updateBank.isError && (
            <p className="text-sm text-red-600">Failed to update bank details. Please try again.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Tab 3: Portfolio ─── */

function PortfolioTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Portfolio / Sample Work</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">
            Upload images of your crochet work to showcase your skills.
          </p>
          <p className="text-xs text-muted-foreground">
            Image upload functionality coming soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Loading skeleton ─── */

function ProfileLoadingSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
