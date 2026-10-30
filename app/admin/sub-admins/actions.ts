'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function addSubAdmin(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const permissionsJson = formData.get('permissions') as string
  const permissions = JSON.parse(permissionsJson || '[]')

  if (!name || !email || !password) {
    throw new Error('Name, email and password are required.')
  }

  // 1. Create a real Supabase Auth user so they can actually sign in
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification for admin-created accounts
    })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create auth user.')
  }

  // 2. Store role/permissions metadata, keyed by the auth user's id.
  //    No password column — Supabase Auth owns the credential.
  const { error: dbError } = await supabase.from('sub_admins').insert([
    {
      id: authData.user.id,
      name,
      email,
      role,
      permissions,
    },
  ])

  if (dbError) {
    // Roll back the auth user if the metadata insert fails,
    // so we don't end up with an orphaned login with no permissions row.
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(dbError.message)
  }

  revalidatePath('/admin/sub-admins')
}

export async function updateSubAdmin(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const permissionsJson = formData.get('permissions') as string
  const permissions = JSON.parse(permissionsJson || '[]')

  // Update the Auth user (email + optional password)
  const authUpdate: { email?: string; password?: string } = { email }
  if (password && password.trim() !== '') {
    authUpdate.password = password
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    id,
    authUpdate
  )

  if (authError) {
    throw new Error(authError.message)
  }

  // Update the metadata row
  const { error: dbError } = await supabase
    .from('sub_admins')
    .update({ name, email, role, permissions })
    .eq('id', id)

  if (dbError) {
    throw new Error(dbError.message)
  }

  revalidatePath('/admin/sub-admins')
}

export async function deleteSubAdmin(id: string) {
  // Remove the Auth user first...
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError && !authError.message.includes('User not found')) {
    throw new Error(authError.message)
  }

  // ...then the metadata row.
  const { error: dbError } = await supabase
    .from('sub_admins')
    .delete()
    .eq('id', id)

  if (dbError) {
    throw new Error(dbError.message)
  }

  revalidatePath('/admin/sub-admins')
}