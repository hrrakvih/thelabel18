'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const PRIMARY_ADMIN_EMAIL = 'admin@thelabel18.com'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!email || !password) redirect('/login?error=Email and password are required')

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error || !data.user) {
        redirect('/login?error=Invalid email or password')
    }

    // Primary admin always goes to the dashboard
    if (data.user.email === PRIMARY_ADMIN_EMAIL) {
        redirect('/admin/dashboard')
    }

    const { data: subAdmin } = await supabase
        .from('sub_admins')
        .select('role, permissions')
        .eq('email', data.user.email)
        .maybeSingle()

    // Full admin role → dashboard
    if (subAdmin?.role === 'admin') {
        redirect('/admin/dashboard')
    }

    const permissions: string[] = Array.isArray(subAdmin?.permissions)
        ? subAdmin.permissions.filter((path: unknown): path is string => typeof path === 'string' && path.startsWith('/admin/') && !path.includes('..') && !path.includes('\\'))
        : []

    // Send them to the first page they're actually allowed to see.
    // If they have no permissions at all, send them back to login with an error.
    if (permissions.length === 0) {
        redirect('/login?error=Your account has no assigned permissions. Contact an administrator.')
    }

    redirect(permissions[0])
}