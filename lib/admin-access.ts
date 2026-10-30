import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function requireAdminPath(path: string) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user?.email) throw new Error('Administrator sign-in is required.')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server database access is not configured.')
  const db = getAdminSupabase()
  if (user.email === 'admin@thelabel18.com') return db
  const { data, error } = await db.from('sub_admins').select('role, permissions').eq('email', user.email).maybeSingle()
  if (error || !data || (data.role !== 'admin' && !Array.isArray(data.permissions))) throw new Error('Access denied.')
  if (data.role !== 'admin' && !data.permissions.some((allowed: string) => path === allowed || path.startsWith(allowed + '/'))) throw new Error('Access denied.')
  return db
}
