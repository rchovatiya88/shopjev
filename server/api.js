import { handleRecommendations, handleSearch } from './catalog.js'

export function validateInput(body = {}) {
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) throw Object.assign(new Error('Enter a product, style, or shopping goal to search.'), { statusCode: 400 })
  if (query.length > 240) throw Object.assign(new Error('Search queries must be 240 characters or fewer.'), { statusCode: 400 })
  const maxPrice = body.maxPrice === undefined ? 2000 : Number(body.maxPrice)
  if (!Number.isFinite(maxPrice) || maxPrice < 0 || maxPrice > 2000) throw Object.assign(new Error('Maximum price must be between $0 and $2,000.'), { statusCode: 400 })
  if (body.cursor !== undefined && (typeof body.cursor !== 'string' || body.cursor.length > 2048)) throw Object.assign(new Error('Catalog cursor is invalid.'), { statusCode: 400 })
  return { query, maxPrice, cursor: body.cursor }
}

export async function dispatchApi(method, pathname, body = {}) {
  if (method === 'GET' && pathname === '/api/health') {
    return { status: 200, body: { status: 'ok', shopify: 'live', jevConfigured: Boolean(process.env.TYPESAFE_API_KEY) } }
  }
  if (method !== 'POST' || !['/api/search', '/api/recommendations'].includes(pathname)) {
    return { status: 404, body: { error: 'API route not found.' } }
  }
  try {
    const input = validateInput(body)
    const result = pathname === '/api/search' ? await handleSearch(input) : await handleRecommendations(input)
    return { status: 200, body: result }
  } catch (error) {
    const status = error.statusCode || 502
    return { status, body: { error: status >= 500 ? 'The live catalog request failed. Please try again.' : error.message } }
  }
}

export function createNetlifyHandler(pathname) {
  return async (request) => {
    let body = {}
    if (request.method === 'POST') {
      try { body = await request.json() } catch {
        return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
      }
    }
    const result = await dispatchApi(request.method, pathname, body)
    return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } })
  }
}
