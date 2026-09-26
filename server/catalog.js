const SHOPIFY_ENDPOINT = 'https://catalog.shopify.com/api/ucp/mcp'
const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const DEFAULT_PROFILE = 'https://shopify.dev/ucp/agent-profiles/2026-08-25/valid-with-capabilities.json'

const INTENTS = {
  home: {
    label: 'Home, furniture, or decor',
    groups: [
      { title: 'Lighting & atmosphere', query: 'lighting lamps ambient decor' },
      { title: 'Textiles & rugs', query: 'rugs bedding soft furnishings' },
      { title: 'Finishing touches', query: 'home storage decor accents' },
    ],
  },
  fashion: {
    label: 'Clothing or outfit discovery',
    groups: [
      { title: 'Shoes to complete the look', query: 'shoes footwear' },
      { title: 'Bags & accessories', query: 'bags accessories' },
      { title: 'Layers & finishing pieces', query: 'jackets layers accessories' },
    ],
  },
  footwear: {
    label: 'Shoes or footwear',
    groups: [
      { title: 'Socks & shoe care', query: 'socks shoe care' },
      { title: 'Bags for the occasion', query: 'bags accessories' },
      { title: 'Clothing to pair with it', query: 'clothing apparel' },
    ],
  },
  travel: {
    label: 'Travel or outdoor activity',
    groups: [
      { title: 'Bags & luggage', query: 'travel bags luggage' },
      { title: 'Weather-ready layers', query: 'outdoor clothing layers' },
      { title: 'Useful accessories', query: 'travel outdoor accessories' },
    ],
  },
  electronics: {
    label: 'Electronics or tech setup',
    groups: [
      { title: 'Useful accessories', query: 'electronics accessories' },
      { title: 'Desk setup', query: 'desk workspace accessories' },
      { title: 'Audio & everyday carry', query: 'audio headphones bags' },
    ],
  },
  kitchen: {
    label: 'Kitchen or cooking',
    groups: [
      { title: 'Cookware & tools', query: 'cookware kitchen tools' },
      { title: 'Tableware', query: 'dining tableware dishes' },
      { title: 'Kitchen organization', query: 'kitchen storage organization' },
    ],
  },
  beauty: {
    label: 'Beauty or personal care',
    groups: [
      { title: 'Skincare essentials', query: 'skincare personal care' },
      { title: 'Beauty tools', query: 'beauty makeup tools' },
      { title: 'Travel-sized essentials', query: 'travel beauty accessories' },
    ],
  },
  gifts: {
    label: 'Gift discovery',
    groups: [
      { title: 'Popular gifts', query: 'gift ideas best sellers' },
      { title: 'Personal touches', query: 'personalized gifts accessories' },
      { title: 'Useful finds', query: 'unique practical gifts' },
    ],
  },
  sports: {
    label: 'Sports or fitness gear',
    groups: [
      { title: 'Clothing & footwear', query: 'sports clothing footwear' },
      { title: 'Gear & accessories', query: 'fitness sports equipment accessories' },
      { title: 'Recovery & hydration', query: 'fitness recovery hydration' },
    ],
  },
  other: { label: 'General product discovery', groups: [] },
}

const INTENT_CRITERIA = Object.fromEntries(Object.entries(INTENTS).map(([key, value]) => [key, value.label]))

function exactIdentifier(query) {
  const value = query.trim()
  if (/^gid:\/\/shopify\/(?:Product|ProductVariant|p)\/[A-Za-z0-9_-]+$/i.test(value)) return value
  if (/^(?=.*\d)[A-Z0-9][A-Z0-9._/-]{3,}$/.test(value)) return value
  return null
}

function intentFromResponse(payload) {
  const data = payload?.answers?.intent
  const code = data?.choice
  if (!Object.hasOwn(INTENTS, code)) return null
  return { code, label: INTENTS[code].label, confidence: Number(data.confidence) || 0 }
}

export async function classifyIntent(query, options = {}) {
  const apiKey = options.apiKey ?? process.env.TYPESAFE_API_KEY
  if (!apiKey) return null
  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(options.endpoint ?? TYPESAFE_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(7000),
    body: JSON.stringify({
      model: 'jev-latest',
      state: { query },
      questions: {
        intent: {
          type: 'choice',
          instructions: 'Classify the shopper query by its main product category or shopping purpose. Use only the query text. If it asks for one identifiable product, return other unless the broad category is clear. Do not invent user preferences.',
          criteria: INTENT_CRITERIA,
        },
      },
    }),
  })
  if (!response.ok) throw new Error(`Jev returned ${response.status}`)
  return intentFromResponse(await response.json())
}

async function callCatalog(name, catalog, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch
  const args = {
    meta: { 'ucp-agent': { profile: options.profileUrl || process.env.SHOPIFY_AGENT_PROFILE_URL || DEFAULT_PROFILE } },
    catalog,
  }
  const response = await fetchImpl(options.endpoint ?? SHOPIFY_ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', id: 1, params: { name, arguments: args } }),
  })
  if (!response.ok) throw new Error(`Shopify Catalog returned ${response.status}`)
  const payload = await response.json()
  if (payload.error) throw new Error(payload.error.message || 'Shopify Catalog returned an error.')
  const result = payload.result?.structuredContent ?? payload.structuredContent ?? {}
  if (Array.isArray(result.messages) && result.messages.some((message) => message.type === 'error')) {
    throw new Error(result.messages.find((message) => message.type === 'error')?.content || 'Shopify Catalog could not complete this search.')
  }
  return { products: Array.isArray(result.products) ? result.products : [], pagination: result.pagination || null }
}

export async function searchCatalog(query, options = {}) {
  const filters = { ships_to: { country: 'US' }, available: true }
  if (Number.isFinite(options.maxPrice) && options.maxPrice >= 0 && options.maxPrice < 2000) filters.price = { max: Math.round(options.maxPrice * 100) }
  const pagination = { limit: 50 }
  if (typeof options.cursor === 'string' && options.cursor.length <= 2048) pagination.cursor = options.cursor
  return callCatalog('search_catalog', {
    query,
    context: { address_country: 'US' },
    filters,
    pagination,
  }, options)
}

export async function lookupCatalog(id, options = {}) {
  return callCatalog('lookup_catalog', { ids: [id], context: { address_country: 'US' } }, options)
}

export async function handleSearch({ query, maxPrice, cursor }, deps = {}) {
  const id = exactIdentifier(query)
  const intentTask = id || cursor ? Promise.resolve(null) : (deps.classifyIntent ?? classifyIntent)(query, deps.jevOptions).catch(() => null)
  const productTask = id?.startsWith('gid://')
    ? (deps.lookupCatalog ?? lookupCatalog)(id, deps.shopifyOptions)
    : (deps.searchCatalog ?? searchCatalog)(query, { ...deps.shopifyOptions, maxPrice, cursor })
  const [intent, foundProducts] = await Promise.all([intentTask, productTask])
  let products = Array.isArray(foundProducts) ? foundProducts : foundProducts.products || []
  const pagination = Array.isArray(foundProducts) ? null : foundProducts.pagination || null
  if (id && !id.startsWith('gid://')) {
    products = products.map((product) => ({
      ...product,
      variants: (product.variants || []).filter((variant) => variant.sku?.toUpperCase() === id.toUpperCase()),
    })).filter((product) => product.variants.length > 0)
  } else if (id?.startsWith('gid://') && Number.isFinite(maxPrice) && maxPrice < 2000) {
    products = products.map((product) => ({
      ...product,
      variants: (product.variants || []).filter((variant) => Number(variant.price?.amount) <= Math.round(maxPrice * 100)),
    })).filter((product) => product.variants.length > 0)
  }
  return { products, pagination, intent, jevAvailable: Boolean(intent) }
}

export async function handleRecommendations({ query, maxPrice }, deps = {}) {
  if (exactIdentifier(query)) return { groups: [] }
  let intent
  try {
    intent = await (deps.classifyIntent ?? classifyIntent)(query, deps.jevOptions)
  } catch {
    intent = null
  }
  if (!intent || intent.confidence < 0.25) return { groups: [] }
  const config = INTENTS[intent.code]
  if (!config?.groups.length) return { groups: [] }
  const search = deps.searchCatalog ?? searchCatalog
  const groups = await Promise.all(config.groups.map(async (group) => ({
    title: group.title,
    queryLabel: `Shopify matches for ${group.query}`,
    products: await search(`${query} ${group.query}`, { ...deps.shopifyOptions, maxPrice }),
  })))
  return { groups: groups.map((group) => ({ ...group, products: Array.isArray(group.products) ? group.products : group.products.products || [] })).filter((group) => group.products.length > 0) }
}

export const catalogConfig = { endpoint: SHOPIFY_ENDPOINT, defaultProfile: DEFAULT_PROFILE }
