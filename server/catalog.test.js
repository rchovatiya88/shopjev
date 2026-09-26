import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyIntent, handleRecommendations, handleSearch, parseShoppingQuery, searchCatalog } from './catalog.js'

test('shopping query extracts a natural-language budget and retains product terms', () => {
  assert.deepEqual(parseShoppingQuery('black coffee table that is under $100', 2000), { query: 'black coffee table', maxPrice: 100 })
  assert.deepEqual(parseShoppingQuery('black coffee table under $100', 75), { query: 'black coffee table', maxPrice: 75 })
})

test('search applies a natural-language USD budget and ranks matching products first', async () => {
  let searched
  const result = await handleSearch({ query: 'black coffee table that is under $100', maxPrice: 2000 }, {
    classifyIntent: async (query) => { assert.equal(query, 'black coffee table'); return { code: 'home', confidence: 1 } },
    searchCatalog: async (query, options) => {
      searched = { query, maxPrice: options.maxPrice }
      return [
        { id: 'wood', title: 'Coffee Table in Rustic Oak', variants: [{ price: { amount: 6999, currency: 'USD' } }] },
        { id: 'black', title: 'Black Coffee Table', variants: [{ price: { amount: 7605, currency: 'USD' } }] },
        { id: 'over', title: 'Black Coffee Table', variants: [{ price: { amount: 12000, currency: 'USD' } }] },
        { id: 'foreign', title: 'Black Coffee Table', variants: [{ price: { amount: 5000, currency: 'AUD' } }] },
      ]
    },
  })
  assert.deepEqual(searched, { query: 'black coffee table', maxPrice: 100 })
  assert.deepEqual(result.products.map((product) => product.id), ['black', 'wood'])
  assert.deepEqual(result.filters, { maxPrice: 100, currency: 'USD' })
})

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
