import assert from 'node:assert/strict'
import test from 'node:test'
import worker from './index.js'

const env = {
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname
      if (path === '/' || path === '/missing.js') {
        return new Response('<html/>', { headers: { 'content-type': 'text/html' } })
      }
      return new Response('ok', {
        headers: {
          'cache-control': 'public, max-age=0, must-revalidate',
          'content-type': path.endsWith('.png') ? 'image/png' : 'application/javascript',
        },
      })
    },
  },
}

const request = (path) => worker.fetch(new Request(`https://example.test${path}`), env)

test('applies safe cache policies and rejects asset fallbacks', async () => {
  const hashed = await request('/assets/app-abc123.js')
  assert.equal(hashed.headers.get('cache-control'), 'public, max-age=31536000, immutable')

  const heavy = await request('/live2d/Fern/texture.png')
  assert.equal(heavy.headers.get('cache-control'), 'public, max-age=86400, stale-while-revalidate=604800')

  const html = await request('/')
  assert.match(html.headers.get('cache-control'), /no-store/)

  const missing = await request('/missing.js')
  assert.equal(missing.status, 404)
})
