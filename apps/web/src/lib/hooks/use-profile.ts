'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '@/lib/api/profile';
import type { UpdateProfileData, AddressData } from '@/lib/api/profile';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch the current user's profile. */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => getProfile(),
  });
}

/** Fetch all saved addresses for the current user. */
export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.profile.addresses(),
    queryFn: () => getAddresses(),
  });
}

/** Mutation to update the current user's profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
}

/** Mutation to add a new address. */
export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressData) => addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.addresses() });
    },
  });
}

/** Mutation to update an existing address. */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressData> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.addresses() });
    },
  });
}

/** Mutation to delete an address. */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.addresses() });
    },
  });
}
