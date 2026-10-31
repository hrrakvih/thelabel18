import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, modules) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, console: { error() {} }, require: name => {
    if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`)
    return modules[name]
  } })
  return exports
}
const variation = (id, visible, price) => ({ id, is_visible: visible, price, stock_quantity: 3, image_urls: ['first.jpg', 'second.jpg'] })
const product = (id, created_at) => ({ id, created_at, name: id, is_visible: true, category_id: 'category', sub_category_id: null, sub_sub_category_id: null,
  category: { is_visible: true }, product_variations: [variation('visible', true, 100), variation('hidden', false, 1)] })
function productsFixture({ fail = false } = {}) {
  const rows = [product('older', '2026-01-01'), product('newer', '2026-10-31')]
  const db = { from() {
    let items = rows.slice()
    const q = { select() { return q }, eq(k, v) { items = items.filter(row => row[k] === v); return q },
      neq(k, v) { items = items.filter(row => row[k] !== v); return q },
      order(k, { ascending }) { items.sort((a, b) => String(a[k]).localeCompare(String(b[k])) * (ascending ? 1 : -1)); return q },
      limit(n) { items = items.slice(0, n); return q },
      then(resolve, reject) { return Promise.resolve({ data: fail ? null : items, error: fail ? new Error('Catalog unavailable') : null }).then(resolve, reject) },
    }
    return q
  } }
  return load('../lib/supabase/products.ts', { '@/lib/supabase/public': { createPublicClient: () => db } })
}

test('newest catalog order is deterministic and hidden variations never reach product cards', async () => {
  const products = await productsFixture().getProducts({})
  assert.equal(products[0].id, 'newer')
  assert.equal(products[0].minPrice, 100)
  assert.equal(products[0].product_variations.length, 1)
  assert.equal(products[0].product_variations[0].id, 'visible')
  assert.equal(products[0].product_variations[0].image_urls.length, 1)
})
test('related product cards also exclude hidden variants', async () => {
  const products = await productsFixture().getRelatedProducts({ id: 'different', category_id: 'category' })
  assert.equal(products.length, 2)
  assert.ok(products.every(p => p.product_variations.length === 1 && p.minPrice === 100))
})
test('related product fetch failures propagate instead of caching an empty recommendation list', async () => {
  await assert.rejects(productsFixture({ fail: true }).getRelatedProducts({ id: 'x', category_id: 'category' }), /Catalog unavailable/)
  await assert.rejects(productsFixture({ fail: true }).getRelatedProducts({ id: 'x', category_id: 'category', sub_category_id: 'sub' }), /Catalog unavailable/)
})

test('cached category queries accept a legitimate empty catalog but propagate database failures', async () => {
  function categories(error) {
    const result = { data: [], error }
    const q = { select() { return q }, eq() { return q }, order: async () => result }
    return load('../lib/categories.ts', { '@/lib/supabase/client': { createClient: () => ({ from: () => q }) } })
  }
  const empty = await categories(null).getCategoriesTreeOrThrow()
  assert.equal(empty.length, 0)
  await assert.rejects(categories(new Error('Database unavailable')).getCategoriesTreeOrThrow(), /Database unavailable/)
})

test('retired large image URLs redirect to existing compressed files without loops', async () => {
  const nextConfig = load('../next.config.ts', {}).default
  const redirects = await nextConfig.redirects()
  assert.equal(redirects.length, 6)
  for (const redirect of redirects) {
    assert.equal(redirect.permanent, true)
    assert.ok(redirect.destination.endsWith('.webp'))
    assert.ok(existsSync(new URL('../public' + redirect.destination, import.meta.url)))
    assert.equal(redirects.some(other => other.source === redirect.destination), false)
  }
})
