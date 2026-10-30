'use client'

import { useState } from 'react'

type Photos = { image_url?: string | null; image_urls?: string[] | null }
export type OrderPhotoSource = {
  product_variations?: Photos | null
  products?: (Photos & { product_variations?: Photos[] | null }) | null
}

export function orderPhotoCandidates(item: OrderPhotoSource): string[] {
  const sources = [item.product_variations, item.products, ...(item.products?.product_variations || [])]
  return [...new Set(sources.flatMap(source => [source?.image_url, ...(source?.image_urls || [])])
    .filter((url): url is string => typeof url === 'string' && !!url.trim()).map(url => url.trim()))]
}

export default function OrderItemPhoto({ item, name }: { item: OrderPhotoSource; name: string }) {
  const urls = orderPhotoCandidates(item)
  const [failed, setFailed] = useState<string[]>([])
  const src = urls.find(url => !failed.includes(url))
  if (!src) return <div className="flex h-full w-full items-center justify-center bg-stone-50 text-center text-[9px] text-stone-400" role="img" aria-label={`No photo available for ${name}`}>No photo</div>
  // Raw images support fallback when a stored image is missing or no longer accessible.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setFailed(previous => previous.includes(src) ? previous : [...previous, src])} />
}
