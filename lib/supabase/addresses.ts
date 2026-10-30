import { createClient } from "@/lib/supabase/client";

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
};

export type AddressInput = Omit<Address, "id" | "user_id" | "created_at">;

export async function getAddresses(userId: string): Promise<Address[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addAddress(userId: string, input: AddressInput): Promise<Address> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("addresses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}