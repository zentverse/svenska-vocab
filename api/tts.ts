export const config = { runtime: 'edge' }

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const text = url.searchParams.get('text')?.trim()
  const lang = (url.searchParams.get('lang') ?? 'sv').toLowerCase()

  if (!text) return new Response('missing text', { status: 400 })
  if (text.length > 200) return new Response('text too long', { status: 413 })

  const upstreamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    text,
  )}&tl=${encodeURIComponent(lang)}&client=tw-ob`

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Referer: 'https://translate.google.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
  } catch (err) {
    return new Response(`upstream fetch error: ${String(err)}`, { status: 502 })
  }

  if (!upstream.ok) {
    return new Response(`upstream status ${upstream.status}`, { status: 502 })
  }

  const buf = await upstream.arrayBuffer()
  if (buf.byteLength < 100) {
    return new Response('upstream returned empty audio', { status: 502 })
  }

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
