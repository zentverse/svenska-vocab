import { defineConfig, type Plugin } from 'vite'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function ttsProxyDev(): Plugin {
  return {
    name: 'tts-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const text = url.searchParams.get('text')?.trim()
          const lang = (url.searchParams.get('lang') ?? 'sv').toLowerCase()

          if (!text) {
            res.statusCode = 400
            res.end('missing text')
            return
          }
          if (text.length > 200) {
            res.statusCode = 413
            res.end('text too long')
            return
          }

          const upstreamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
            text,
          )}&tl=${encodeURIComponent(lang)}&client=tw-ob`

          const upstream = await fetch(upstreamUrl, {
            headers: {
              'User-Agent': BROWSER_UA,
              Referer: 'https://translate.google.com/',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          })

          if (!upstream.ok) {
            res.statusCode = 502
            res.end(`upstream status ${upstream.status}`)
            return
          }

          const buf = Buffer.from(await upstream.arrayBuffer())
          if (buf.byteLength < 100) {
            res.statusCode = 502
            res.end('upstream returned empty audio')
            return
          }

          res.setHeader('Content-Type', 'audio/mpeg')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(buf)
        } catch (err) {
          res.statusCode = 500
          res.end(`tts proxy error: ${String(err)}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [ttsProxyDev()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  server: {
    open: true,
  },
})
