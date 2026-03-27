import { api } from './client';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface AddressData {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

/** Fetch the current user's profile. */
export async function getProfile() {
  const res = await api.get('/profile');
  return res.data;
}

/** Update the current user's profile (name, phone). */
export async function updateProfile(data: UpdateProfileData) {
  const res = await api.put('/profile', data);
  return res.data;
}

/** Fetch all saved addresses for the current user. */
export async function getAddresses() {
  const res = await api.get('/profile/addresses');
  return res.data;
}

/** Add a new address. */
export async function addAddress(data: AddressData) {
  const res = await api.post('/profile/addresses', data);
  return res.data;
}

/** Update an existing address by ID. */
export async function updateAddress(id: string, data: Partial<AddressData>) {
  const res = await api.put(`/profile/addresses/${id}`, data);
  return res.data;
}

/** Delete an address by ID. */
export async function deleteAddress(id: string) {
  const res = await api.delete(`/profile/addresses/${id}`);
  return res.data;
}
