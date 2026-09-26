import test from 'node:test'
import assert from 'node:assert/strict'
import { createNetlifyHandler, dispatchApi } from './api.js'

test('shared API keeps health status provider credentials server-side', async () => {
  const response = await createNetlifyHandler('/api/health')(new Request('https://shopjev.example/api/health'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { status: 'ok', shopify: 'live', jevConfigured: Boolean(process.env.TYPESAFE_API_KEY) })
})

test('Netlify search function validates request before catalog access', async () => {
  const response = await createNetlifyHandler('/api/search')(new Request('https://shopjev.example/api/search', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
  }))
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Enter a product, style, or shopping goal to search.' })
})

test('shared API returns 404 for unknown endpoints', async () => {
  assert.deepEqual(await dispatchApi('GET', '/api/missing'), { status: 404, body: { error: 'API route not found.' } })
})
