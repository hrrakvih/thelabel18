'use client'

import { useEffect, useState, useTransition } from 'react'
import { Upload, Link2, Trash2, Loader2, Film, Layers, Video, AtSign, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadVideoReel, addInstagramReel, deleteReel, type Reel } from './actions'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

// Renders a date only after mount, so the server-rendered HTML (no date yet)
// always matches the client's first paint. Prevents hydration mismatches
// caused by toLocaleDateString() resolving differently server vs. browser.
function ClientDate({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <span>&nbsp;</span>
  return <span>{new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
}

function VideoDropzone({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    const selected = fileList?.[0]
    if (selected && selected.type.startsWith('video/')) {
      onChange(selected)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
        Video file
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging
            ? 'border-black bg-stone-50'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload size={20} className="text-stone-400" />
        {file ? (
          <div>
            <p className="text-sm font-medium text-black">{file.name}</p>
            <p className="text-xs text-stone-400">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-black">
              Drop a video here, or click to browse
            </p>
            <p className="text-xs text-stone-400">MP4, MOV, WebM, etc.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReelsClient({ initialReels }: { initialReels: Reel[] }) {
  const [tab, setTab] = useState<'upload' | 'instagram'>('upload')
  const [reels, setReels] = useState(initialReels)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [igUrl, setIgUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)

  const uploadCount = reels.filter((r) => r.type === 'upload').length
  const instagramCount = reels.filter((r) => r.type === 'instagram').length

  // Load Instagram's embed script once, and re-process whenever the list changes
  useEffect(() => {
    if (!document.getElementById('ig-embed-script')) {
      const script = document.createElement('script')
      script.id = 'ig-embed-script'
      script.src = '//www.instagram.com/embed.js'
      script.async = true
      document.body.appendChild(script)
    } else {
      window.instgrm?.Embeds.process()
    }
  }, [reels])

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [showModal])

  function resetForm() {
    setCaption('')
    setFile(null)
    setIgUrl('')
    setError(null)
  }

  function closeModal() {
    setShowModal(false)
    resetForm()
    setTab('upload')
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a video file first')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('file', file)
        formData.set('caption', caption)
        await uploadVideoReel(formData)
        toast.success('Video uploaded successfully')
        resetForm()
        setShowModal(false)
        window.location.reload() // simplest way to refresh the server-fetched list + storage URL
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        toast.error('Failed to upload video')
      }
    })
  }

  function handleInstagram(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await addInstagramReel({ url: igUrl, caption })
        toast.success('Instagram reel added successfully')
        resetForm()
        setShowModal(false)
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add link')
        toast.error('Failed to add Instagram reel')
      }
    })
  }

  function handleDelete(id: string, storagePath: string | null) {
    setReels((prev) => prev.filter((r) => r.id !== id))
    startTransition(async () => {
      try {
        await deleteReel(id, storagePath)
        toast.success('Reel deleted successfully')
      } catch (err) {
        console.error(err)
        toast.error('Failed to delete reel')
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Videos & Reels</h1>
          <p className="mt-1 text-sm font-medium text-stone-600">
            {reels.length} item{reels.length === 1 ? '' : 's'} · upload a video directly, or add an Instagram reel/post link
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          Add Video
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Items</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{reels.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Video size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Uploaded Videos</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{uploadCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
            <AtSign size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Instagram Links</p>
            <p className="mt-0.5 text-2xl font-bold text-black">{instagramCount}</p>
          </div>
        </div>
      </div>

      {/* Add Video modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-base font-bold text-black">Add Video</h2>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-stone-200 bg-stone-50">
              <button
                onClick={() => {
                  setTab('upload')
                  setError(null)
                }}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                  tab === 'upload'
                    ? 'border-black bg-white text-black'
                    : 'border-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                <Upload size={15} />
                Upload Video
              </button>
              <button
                onClick={() => {
                  setTab('instagram')
                  setError(null)
                }}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                  tab === 'instagram'
                    ? 'border-black bg-white text-black'
                    : 'border-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                <Link2 size={15} />
                Instagram Link
              </button>
            </div>

            <div className="p-5">
              {tab === 'upload' ? (
                <form onSubmit={handleUpload} className="space-y-4">
                  <VideoDropzone file={file} onChange={setFile} />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Caption
                    </label>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Optional — shown under the video"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-black"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {pending && <Loader2 size={14} className="animate-spin" />}
                    {pending ? 'Uploading…' : 'Upload Video'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleInstagram} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Instagram URL
                    </label>
                    <div className="relative">
                      <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        value={igUrl}
                        onChange={(e) => setIgUrl(e.target.value)}
                        placeholder="https://www.instagram.com/reel/…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Caption
                    </label>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Optional — shown under the post"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-black"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {pending && <Loader2 size={14} className="animate-spin" />}
                    {pending ? 'Adding…' : 'Add Instagram Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing reels — smaller tiles, more per row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {reels.map((r) => (
          <div
            key={r.id}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[9/16] bg-stone-100">
              {r.type === 'upload' && r.video_url ? (
                <video src={r.video_url} controls className="h-full w-full object-cover" />
              ) : r.type === 'instagram' && r.instagram_url ? (
                <div className="h-full w-full overflow-y-auto">
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={r.instagram_url}
                    data-instgrm-version="14"
                    style={{ margin: 0, width: '100%' }}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-300">
                  <Film size={20} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-2">
              <div className="min-w-0">
                {r.caption && (
                  <p className="truncate text-[11px] text-black">{r.caption}</p>
                )}
                <p className="truncate text-[10px] text-stone-400">
                  {r.type === 'upload' ? 'Uploaded' : 'Instagram'} · <ClientDate iso={r.created_at} />
                </p>
              </div>
              <button
                onClick={() => handleDelete(r.id, r.storage_path)}
                className="shrink-0 text-stone-300 hover:text-rose-500"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {reels.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-400">
            No videos or reels yet.
          </p>
        )}
      </div>
    </div>
  )
}