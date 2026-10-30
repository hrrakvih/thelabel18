// middleware.ts (project root, same level as app/)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PRIMARY_ADMIN_EMAIL = 'admin@thelabel18.com'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Please log in to continue')
    return NextResponse.redirect(url)
  }

  if (user.email === PRIMARY_ADMIN_EMAIL) return response

  const { data: subAdmin } = await supabase
    .from('sub_admins')
    .select('role, permissions')
    .eq('email', user.email)
    .maybeSingle()

  if (!subAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Your account has no assigned permissions')
    return NextResponse.redirect(url)
  }

  if (subAdmin.role === 'admin') return response

  const permissions: string[] = subAdmin.permissions || []
  const hasAccess = permissions.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (!hasAccess) {
    const url = request.nextUrl.clone()
    url.pathname = permissions[0] || '/login'
    if (!permissions[0]) url.searchParams.set('error', 'You do not have access to this page')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}