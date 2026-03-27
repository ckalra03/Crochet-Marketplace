'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PersonalInfoForm } from '@/components/profile/personal-info-form';
import { AddressManager } from '@/components/profile/address-manager';
import { PasswordChangeForm } from '@/components/profile/password-change-form';

/**
 * Buyer Profile page -- tabbed layout for personal info, addresses, and
 * password management. Each tab renders its own component that handles
 * data fetching and mutations independently.
 */
export default function ProfilePage() {
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">
          Manage your profile, addresses, and security settings.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal">
          <PersonalInfoForm />
        </TabsContent>

        {/* Tab 2: Addresses */}
        <TabsContent value="addresses">
          <AddressManager />
        </TabsContent>

        {/* Tab 3: Change Password */}
        <TabsContent value="password">
          <PasswordChangeForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
