'use client'

import { useState, useTransition } from 'react'
import { Poppins } from 'next/font/google'
import { Plus, Trash2, X, Pencil, Megaphone, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { addAnnouncement, updateAnnouncement, toggleAnnouncementActive, deleteAnnouncement } from './actions'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export type Announcement = {
  id: string
  text: string
  is_active: boolean
  created_at: string
}

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [checked, setChecked] = useState(isActive)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={pending}
      onClick={() => {
        const next = !checked
        setChecked(next)
        startTransition(async () => {
          try {
            await toggleAnnouncementActive(id, next)
            toast.success(next ? 'Announcement enabled' : 'Announcement disabled')
          } catch {
            setChecked(!next)
            toast.error('Failed to update')
          }
        })
      }}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50',
        checked ? 'bg-[#141414]' : 'bg-[#D1C9B8]',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#FAF7F1] shadow-md ring-0 transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#141414]">Add Announcement</h2>
          <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]"><X size={18} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            startTransition(async () => {
              try {
                await addAnnouncement(new FormData(e.currentTarget))
                toast.success('Announcement added!')
                onClose()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong')
              }
            })
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b8478]">
              Announcement Text
            </label>
            <textarea
              name="text"
              required
              rows={3}
              placeholder="e.g. Enjoy 10% Off on Orders Above ₹999/- | Use coupon Code- THELABEL18001"
              className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414] resize-none"
            />
            <p className="text-[11px] text-[#8b8478]">This text will scroll in the site header ticker.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#141414] py-3 text-xs font-bold uppercase tracking-widest text-[#F5F1E8] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Announcement'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EditModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#141414]">Edit Announcement</h2>
          <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]"><X size={18} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            startTransition(async () => {
              try {
                await updateAnnouncement(announcement.id, new FormData(e.currentTarget))
                toast.success('Announcement updated!')
                onClose()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong')
              }
            })
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b8478]">
              Announcement Text
            </label>
            <textarea
              name="text"
              required
              rows={3}
              defaultValue={announcement.text}
              className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414] resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#141414] py-3 text-xs font-bold uppercase tracking-widest text-[#F5F1E8] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [, startTransition] = useTransition()

  const activeCount = announcements.filter((a) => a.is_active).length

  return (
    <div className={poppins.className}>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2">
            <Megaphone size={22} className="text-amber-500" />
            Header Announcements
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} · {activeCount} active · scrolls in site header ticker
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.99]"
        >
          <Plus size={15} />
          Add Announcement
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100">
            <Megaphone size={18} className="text-stone-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{announcements.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Active</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <XCircle size={18} className="text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Inactive</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{announcements.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Preview strip */}
      {activeCount > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-[#12100c]">
          <div className="flex items-center gap-2 border-b border-amber-200/20 px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-400">Live Header Preview</span>
          </div>
          <div className="overflow-hidden py-2.5 px-4">
            <div className="flex gap-12 animate-none whitespace-nowrap text-[11px] text-white/80 tracking-wider">
              {announcements
                .filter((a) => a.is_active)
                .map((a, i) => (
                  <span key={i} className="flex items-center gap-3">
                    <span className="text-amber-400">✦</span>
                    {a.text}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3 font-semibold w-[60%]">Announcement Text</th>
                <th className="px-6 py-3 font-semibold">Added On</th>
                <th className="px-6 py-3 font-semibold">Active</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Megaphone size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-stone-800 leading-relaxed">{a.text}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-500 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <ActiveToggle id={a.id} isActive={a.is_active} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(a)}
                        className="rounded-lg p-2 text-stone-300 hover:bg-stone-100 hover:text-[#141414] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await deleteAnnouncement(a.id)
                              toast.success('Deleted')
                            } catch {
                              toast.error('Failed to delete')
                            }
                          })
                        }
                        className="rounded-lg p-2 text-stone-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {announcements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-stone-400">
                    No announcements yet. Click &quot;Add Announcement&quot; to create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-4 md:hidden">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2 mb-3">
              <Megaphone size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-stone-800 leading-relaxed">{a.text}</p>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Active</span>
                <ActiveToggle id={a.id} isActive={a.is_active} />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(a)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-black">
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => startTransition(async () => { try { await deleteAnnouncement(a.id); toast.success('Deleted') } catch { toast.error('Failed') } })}
                  className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-400">
            No announcements yet.
          </div>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      {editing && <EditModal announcement={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
