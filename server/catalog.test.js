import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyIntent, handleRecommendations, handleSearch, searchCatalog } from './catalog.js'

test('Jev receives only the shopper query, never catalog candidates', async () => {
  let request
  const intent = await classifyIntent('a quiet modern bedroom', {
    apiKey: 'test-key',
    fetchImpl: async (_url, init) => {
      request = JSON.parse(init.body)
      return Response.json({ answers: { intent: { choice: 'home', confidence: 0.94 } } })
    },
  })
  assert.equal(intent.code, 'home')
  assert.deepEqual(request.state, { query: 'a quiet modern bedroom' })
  assert.deepEqual(Object.keys(request.state), ['query'])
})

test('Shopify search uses live US context and price in minor units', async () => {
  let request
  const products = await searchCatalog('trail shoes', {
    maxPrice: 125,
    fetchImpl: async (_url, init) => {
      request = JSON.parse(init.body)
      return Response.json({ result: { structuredContent: { products: [{ id: 'p1' }] } } })
    },
  })
  const args = request.params.arguments
  assert.deepEqual(products, { products: [{ id: 'p1' }], pagination: null })
  assert.equal(request.params.name, 'search_catalog')
  assert.equal(args.catalog.context.address_country, 'US')
  assert.equal(args.catalog.filters.ships_to.country, 'US')
  assert.equal(args.catalog.filters.price.max, 12500)
  assert.equal(args.catalog.pagination.limit, 50)
})

test('Shopify cursors are forwarded as opaque pagination tokens', async () => {
  let request
  await searchCatalog('trail shoes', {
    cursor: 'opaque-cursor',
    fetchImpl: async (_url, init) => { request = JSON.parse(init.body); return Response.json({ result: { structuredContent: { products: [], pagination: { has_next_page: false } } } }) },
  })
  assert.deepEqual(request.params.arguments.catalog.pagination, { limit: 50, cursor: 'opaque-cursor' })
})

test('SKU query returns only an exact variant SKU and Jev failure does not block search', async () => {
  const result = await handleSearch({ query: 'AB-1234', maxPrice: 2000 }, {
    classifyIntent: async () => { throw new Error('offline') },
    searchCatalog: async () => [
      { id: 'matched', variants: [{ sku: 'AB-1234' }, { sku: 'OTHER' }] },
      { id: 'partial', variants: [{ sku: 'AB-12345' }] },
    ],
  })
  assert.deepEqual(result.products.map((product) => product.id), ['matched'])
  assert.deepEqual(result.products[0].variants.map((variant) => variant.sku), ['AB-1234'])
  assert.equal(result.jevAvailable, false)
})

test('ordinary uppercase words are not mistaken for SKUs', async () => {
  let classified = false
  await handleSearch({ query: 'SOFA', maxPrice: 2000 }, {
    classifyIntent: async () => { classified = true; return { code: 'home', confidence: 0.9 } },
    searchCatalog: async () => [],
  })
  assert.equal(classified, true)
})

test('recommendation searches stay on Shopify and attach intent modifiers', async () => {
  const searched = []
  const result = await handleRecommendations({ query: 'mid-century bedroom', maxPrice: 400 }, {
    classifyIntent: async () => ({ code: 'home', confidence: 0.9 }),
    searchCatalog: async (query) => { searched.push(query); return [{ id: query, variants: [] }] },
  })
  assert.equal(result.groups.length, 3)
  assert.equal(searched[0], 'mid-century bedroom lighting lamps ambient decor')
  assert.ok(result.groups.every((group) => group.products.length === 1))
})

test('low-confidence Jev output does not fabricate recommendation groups', async () => {
  const result = await handleRecommendations({ query: 'maybe something', maxPrice: 2000 }, {
    classifyIntent: async () => ({ code: 'home', confidence: 0.1 }),
    searchCatalog: async () => { throw new Error('should not query') },
  })
  assert.deepEqual(result, { groups: [] })
})
