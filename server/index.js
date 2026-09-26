import { createServer as createHttpServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleRecommendations, handleSearch } from './catalog.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = resolve(root, 'dist')
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV !== 'production'
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' }

function loadLocalEnv() {
  const envFile = resolve(root, '.env')
  if (!existsSync(envFile)) return
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]?.trim()) continue
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}
loadLocalEnv()

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 16_384) throw Object.assign(new Error('Request is too large.'), { statusCode: 413 })
  }
  try { return JSON.parse(raw || '{}') } catch { throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }) }
}

function validateInput(body) {
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) throw Object.assign(new Error('Enter a product, style, or shopping goal to search.'), { statusCode: 400 })
  if (query.length > 240) throw Object.assign(new Error('Search queries must be 240 characters or fewer.'), { statusCode: 400 })
  const maxPrice = body.maxPrice === undefined ? 2000 : Number(body.maxPrice)
  if (!Number.isFinite(maxPrice) || maxPrice < 0 || maxPrice > 2000) throw Object.assign(new Error('Maximum price must be between $0 and $2,000.'), { statusCode: 400 })
  if (body.cursor !== undefined && (typeof body.cursor !== 'string' || body.cursor.length > 2048)) throw Object.assign(new Error('Catalog cursor is invalid.'), { statusCode: 400 })
  return { query, maxPrice, cursor: body.cursor }
}

async function api(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') {
    return json(res, 200, { status: 'ok', shopify: 'live', jevConfigured: Boolean(process.env.TYPESAFE_API_KEY) })
  }
  if (req.method !== 'POST' || !['/api/search', '/api/recommendations'].includes(pathname)) {
    return json(res, 404, { error: 'API route not found.' })
  }
  try {
    const input = validateInput(await readJson(req))
    const result = pathname === '/api/search' ? await handleSearch(input) : await handleRecommendations(input)
    return json(res, 200, result)
  } catch (error) {
    const status = error.statusCode || 502
    return json(res, status, { error: status >= 500 ? 'The live catalog request failed. Please try again.' : error.message })
  }
}

async function start() {
  let vite
  if (isDev) {
    const { createServer } = await import('vite')
    vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' })
  }

  const server = createHttpServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost')
    if (url.pathname.startsWith('/api/')) return api(req, res, url.pathname)
    if (vite) return vite.middlewares(req, res, (error) => {
      if (error) json(res, 500, { error: 'Development server error.' })
      else { res.writeHead(404); res.end('Not found') }
    })

    let pathname
    try { pathname = decodeURIComponent(url.pathname) } catch { res.writeHead(400); return res.end('Bad path') }
    let file = resolve(dist, `.${pathname}`)
    if (!file.startsWith(`${dist}${sep}`) && file !== dist) { res.writeHead(403); return res.end('Forbidden') }
    if (!existsSync(file) || statSync(file).isDirectory()) file = resolve(dist, 'index.html')
    if (!existsSync(file)) { res.writeHead(503); return res.end('Build the app first with npm run build.') }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' })
    createReadStream(file).pipe(res)
  })

  const port = Number(process.env.PORT || 5173)
  server.listen(port, '0.0.0.0', () => console.log(`ShopJev listening on http://localhost:${port}${isDev ? ' (development)' : ''}`))
  const shutdown = async () => { server.close(); await vite?.close(); process.exit(0) }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((error) => { console.error('ShopJev could not start:', error.message); process.exit(1) })
