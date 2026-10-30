// app/admin/pos/register/RegisterClient.tsx
'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  ScanLine,
  Search,
  Trash2,
  Plus,
  Minus,
  ImageOff,
  CheckCircle2,
  ShoppingCart,
  Banknote,
  CreditCard,
  Smartphone,
  X,
} from 'lucide-react'
import { findVariationBySku, searchVariations, checkout, type ScannedItem, type CartLine } from './actions'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
] as const

// Live clock, mounted client-side only to avoid hydration mismatches.
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(t)
  }, [])
  if (!now) return <span>&nbsp;</span>
  return (
    <span>
      {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} ·{' '}
      {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export default function RegisterClient({ initialProducts }: { initialProducts: ScannedItem[] }) {
  const scanInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false) // NEW
  const [scanValue, setScanValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ScannedItem[]>(initialProducts)
  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash')
  const [scanError, setScanError] = useState<string | null>(null)
  const [lastOrder, setLastOrder] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Keep the scan input focused at all times so a physical USB barcode
  // scanner (which just "types" the code + Enter) always lands here.
  useEffect(() => {
    scanInputRef.current?.focus()
    const refocus = () => scanInputRef.current?.focus()
    window.addEventListener('click', refocus)
    return () => window.removeEventListener('click', refocus)
  }, [])

  function addToCart(item: ScannedItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.variationId === item.variationId)
      if (existing) {
        return prev.map((l) =>
          l.variationId === item.variationId ? { ...l, quantity: l.quantity + 1 } : l
        )
      }
      return [
        ...prev,
        {
          variationId: item.variationId,
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          size: item.size,
          color: item.color,
          price: item.price,
          quantity: 1,
        },
      ]
    })
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scanValue.trim()) return
    setScanError(null)
    startTransition(async () => {
      const item = await findVariationBySku(scanValue.trim())
      if (!item) {
        setScanError(`No product found for SKU "${scanValue}"`)
      } else if (item.stockQuantity <= 0) {
        setScanError(`${item.productName} (${item.sku}) is out of stock`)
      } else {
        addToCart(item)
      }
      setScanValue('')
    })
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults(initialProducts)
      return
    }
    // instant client-side filter over what we already have loaded
    const q = query.trim().toLowerCase()
    const localMatches = initialProducts.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        (p.color || '').toLowerCase().includes(q)
    )
    setSearchResults(localMatches)

    // also check the server in case there are products beyond the initial 100 loaded
    startTransition(async () => {
      const serverMatches = await searchVariations(query)
      setSearchResults((prev) => {
        const merged = [...prev]
        for (const m of serverMatches) {
          if (!merged.some((x) => x.variationId === m.variationId)) merged.push(m)
        }
        return merged
      })
    })
  }

  function updateQuantity(variationId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.variationId === variationId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    )
  }

  function removeLine(variationId: string) {
    setCart((prev) => prev.filter((l) => l.variationId !== variationId))
  }

  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0)
  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  function handleCheckout() {
    if (submittingRef.current || cart.length === 0) return // NEW guard
    submittingRef.current = true
    setScanError(null)
    startTransition(async () => {
      try {
        const result = await checkout({ cart, discount, paymentMethod })
        setLastOrder(result.orderNumber)
        setCart([])
        setDiscount(0)
        scanInputRef.current?.focus()
        toast.success(`POS Order #${result.orderNumber} completed successfully!`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Checkout failed'
        setScanError(msg)
        toast.error(msg)
      } finally {
        submittingRef.current = false // NEW — release the lock either way
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
   
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">Live Register</h1>
            <p className="mt-0.5 text-sm font-medium text-stone-600">
              Scan a barcode, or search by name / SKU
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
            <LiveClock />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <ShoppingCart size={13} />
            {itemCount} in cart
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: scan + search + results */}
        <div className="space-y-5">
          <form
            onSubmit={handleScanSubmit}
            className="flex items-center gap-3 rounded-2xl border-2 border-black bg-white p-4 shadow-sm transition-shadow focus-within:shadow-md"
          >
            <ScanLine size={22} className="shrink-0 text-black" />
            <input
              ref={scanInputRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              placeholder="Scan barcode here…"
              autoFocus
              className="flex-1 border-none bg-transparent text-lg font-outfit text-black outline-none placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Add
            </button>
          </form>

          {scanError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <span>{scanError}</span>
              <button onClick={() => setScanError(null)} className="shrink-0 text-rose-400 hover:text-rose-600">
                <X size={14} />
              </button>
            </div>
          )}
          {lastOrder && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Order {lastOrder} completed successfully.
              </span>
              <button onClick={() => setLastOrder(null)} className="shrink-0 text-emerald-400 hover:text-emerald-600">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search product name or SKU…"
              className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
            />
          </div>

          {searchResults.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                {searchQuery ? 'Matching Products' : 'All Products'} · {searchResults.length}
              </p>
              <div className="max-h-[440px] divide-y divide-stone-100 overflow-y-auto overflow-x-hidden rounded-2xl border border-stone-200 bg-white">
                {searchResults.map((item) => {
                  const lowStock = item.stockQuantity > 0 && item.stockQuantity <= 3
                  const outOfStock = item.stockQuantity <= 0
                  return (
                    <button
                      key={item.variationId}
                      onClick={() => addToCart(item)}
                      disabled={outOfStock}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      {item.imageUrl ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="100vw" />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
                          <ImageOff size={14} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">{item.productName}</p>
                        <p className="flex items-center gap-1.5 text-xs text-stone-500">
                          <span className="truncate">
                            {[item.size, item.color].filter(Boolean).join(' · ') || item.sku}
                          </span>
                          <span className="shrink-0 text-stone-300">·</span>
                          <span
                            className={`shrink-0 font-medium ${
                              outOfStock ? 'text-rose-500' : lowStock ? 'text-amber-600' : 'text-stone-500'
                            }`}
                          >
                            {outOfStock ? 'Out of stock' : `${item.stockQuantity} in stock`}
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-black">
                        ₹{item.price.toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">
              {searchQuery
                ? `No products match "${searchQuery}"`
                : 'No products found — check the console for a Supabase error, or confirm product_variations has rows with a linked product.'}
            </p>
          )}
        </div>

        {/* Right: cart */}
        <div className="flex h-fit flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500">
              <ShoppingCart size={14} />
              Cart · {itemCount} item{itemCount === 1 ? '' : 's'}
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs font-medium text-stone-400 hover:text-rose-500"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-[420px] divide-y divide-stone-100 overflow-y-auto">
            {cart.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <ShoppingCart size={22} className="text-stone-200" />
                <p className="text-sm text-stone-400">Cart is empty — scan or search to add items</p>
              </div>
            )}
            {cart.map((l) => (
              <div key={l.variationId} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{l.productName}</p>
                  <p className="text-xs text-stone-500">
                    {[l.size, l.color].filter(Boolean).join(' · ') || l.sku}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 p-0.5">
                  <button
                    onClick={() => updateQuantity(l.variationId, -1)}
                    className="rounded-md p-1 text-stone-600 hover:bg-stone-100"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm font-medium text-black">{l.quantity}</span>
                  <button
                    onClick={() => updateQuantity(l.variationId, 1)}
                    className="rounded-md p-1 text-stone-600 hover:bg-stone-100"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-semibold text-black">
                  ₹{(l.price * l.quantity).toLocaleString()}
                </span>
                <button
                  onClick={() => removeLine(l.variationId)}
                  className="shrink-0 text-stone-300 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-stone-200 bg-stone-50 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-medium text-black">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Discount</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-24 rounded-lg border border-stone-300 bg-white py-1 pl-5 pr-2 text-right text-sm text-black outline-none focus:border-black"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-base">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black">₹{total.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    paymentMethod === id
                      ? 'border-black bg-black text-white'
                      : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || pending}
              className="w-full rounded-xl bg-black py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {pending ? 'Processing…' : `Complete Sale · ₹${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
