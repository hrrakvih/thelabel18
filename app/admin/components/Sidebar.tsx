'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Tag,
  Layers,
  FolderTree,
  Ticket,
  Package,
  Radio,
  History,
  Clapperboard,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Megaphone,
} from 'lucide-react'
import type { ReactNode } from 'react'

type NavItem = {
  href: string
  label: string
  icon: ReactNode
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} strokeWidth={1.75} /> },
    ],
  },
  {
    title: 'Categories',
    items: [
      { href: '/admin/categories', label: 'Category', icon: <Tag size={16} strokeWidth={1.75} /> },
      { href: '/admin/sub-categories', label: 'Sub Category', icon: <Layers size={16} strokeWidth={1.75} /> },
      { href: '/admin/sub-sub-categories', label: 'Sub Sub Categories', icon: <FolderTree size={16} strokeWidth={1.75} /> },
    ],
  },
  {
    title: 'Products',
    items: [
      { href: '/admin/products/add', label: 'Add Product', icon: <PlusCircle size={16} strokeWidth={1.75} /> },
      { href: '/admin/products/list', label: 'Product List', icon: <ListOrdered size={16} strokeWidth={1.75} /> },
    ],
  },
  {
    items: [
      { href: '/admin/coupons', label: 'Coupons', icon: <Ticket size={17} strokeWidth={1.75} /> },
      { href: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={17} strokeWidth={1.75} /> },
      { href: '/admin/orders', label: 'Orders', icon: <Package size={17} strokeWidth={1.75} /> },
    ],
  },
  {
    title: 'POS Terminal',
    items: [
      { href: '/admin/pos/register', label: 'Live Register', icon: <Radio size={16} strokeWidth={1.75} /> },
      { href: '/admin/pos/history', label: 'POS History', icon: <History size={16} strokeWidth={1.75} /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/admin/sub-admins', label: 'Sub Admin Management', icon: <ShieldCheck size={17} strokeWidth={1.75} /> },
    ],
  },
  {
    items: [
      { href: '/admin/videos-reels', label: 'Videos & Reels', icon: <Clapperboard size={17} strokeWidth={1.75} /> },
      { href: '/admin/reports', label: 'Reports', icon: <BarChart3 size={17} strokeWidth={1.75} /> },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [allowedPaths, setAllowedPaths] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadPermissions() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // 1. Check if primary admin
        if (user.email === 'admin@thelabel18.com') {
          setIsAdmin(true)
          setLoading(false)
          return
        }

        // 2. Fetch permissions from the 'sub_admins' table based on user email
        const { data: subAdmin, error } = await supabase
          .from('sub_admins')
          .select('permissions, role')
          .eq('email', user.email)
          .single()

        if (subAdmin && !error) {
          // If role is main admin or permissions array exists
          if (subAdmin.role === 'admin') {
            setIsAdmin(true)
          } else {
            // Ensure permissions is an array of strings (paths)
            setAllowedPaths(subAdmin.permissions || [])
          }
        }
      } catch (err) {
        console.error('Error fetching sub-admin permissions:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [])

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname?.startsWith(href)

  // Filter navigation items for sub-admins
  const filteredNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (isAdmin) return true

      // Check if their allowed paths include this href or parent path
      return allowedPaths.some(
        (path) => item.href === path || item.href.startsWith(path + '/')
      )
    }),
  })).filter((group) => group.items.length > 0)
  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#D4AF37]/10 bg-[#0a0a0a] p-4 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="-ml-2 rounded-lg p-2 text-[#F5F2EB] transition-colors hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/30 bg-[#141414] shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
            <Image src="/logo.jpg" alt="The Label 18 Logo" fill sizes="36px" className="object-cover" priority />
          </div>
          <span className="font-outfit text-[16px] font-medium tracking-[0.04em] text-[#F5F2EB]">
            The Label 18
          </span>
        </div>
        <Link
          href="/login"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-2 text-[#a89f96] transition-colors hover:bg-red-500/[0.08] hover:text-red-400"
          aria-label="Logout"
        >
          <LogOut size={20} strokeWidth={1.75} />
        </Link>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#D4AF37]/10 bg-[#0a0a0a] font-outfit text-[#F5F2EB] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand header */}
        <div className="sticky top-0 z-10 shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center gap-3.5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/30 bg-[#141414] shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
                <Image src="/logo.jpg" alt="The Label 18 Logo" fill sizes="64px" className="object-cover" priority />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-medium tracking-[0.04em] text-[#F5F2EB]">
                  The Label 18
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#D4AF37]/70">
                  Admin Panel
                </p>
              </div>
            </div>
            <button
              className="rounded-lg p-2 text-[#8a8178] transition-colors hover:bg-white/5 hover:text-[#F5F2EB] md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          <div className="mx-6 h-px bg-gradient-to-r from-[#D4AF37]/25 via-[#D4AF37]/5 to-transparent" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6 text-[13.5px]">
          {loading ? (
            <div className="px-3 text-xs text-[#8a8178] animate-pulse">Loading menu...</div>
          ) : (
            filteredNav.map((group, i) => (
              <div key={i} className="space-y-1">
                {group.title && (
                  <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8a8178]">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150',
                        active
                          ? 'bg-[#D4AF37]/[0.08] text-[#F5F2EB]'
                          : 'text-[#a89f96] hover:bg-white/[0.04] hover:text-[#F5F2EB]',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#D4AF37] transition-opacity duration-150',
                          active ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                      <span
                        className={active ? 'text-[#D4AF37]' : 'text-[#8a8178] group-hover:text-[#D4AF37]/80'}
                      >
                        {item.icon}
                      </span>
                      <span className={active ? 'font-medium' : 'font-normal'}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))
          )}
        </nav>

        {/* Footer & Logout */}
        <div className="sticky bottom-0 z-10 border-t border-white/[0.06] bg-[#0a0a0a]">
          <div className="p-4">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-[#a89f96] transition-colors duration-150 hover:bg-red-500/[0.08] hover:text-red-400"
            >
              <span className="text-[#8a8178] group-hover:text-red-400">
                <LogOut size={17} strokeWidth={1.75} />
              </span>
              <span className="font-normal">Logout</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}