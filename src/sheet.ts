export type Word = {
  swedish: string
  pronunciation: string
  english: string
}

type GvizCell = { v?: unknown } | null
type GvizRow = { c?: GvizCell[] }
type GvizResponse = { table?: { rows?: GvizRow[] } }

const PREFIX_RE = /^[^(]*\(/
const SUFFIX_RE = /\);?\s*$/

export async function fetchWords(sheetId: string, sheetName?: string): Promise<Word[]> {
  const params = new URLSearchParams({ tqx: 'out:json', headers: '1' })
  if (sheetName) params.set('sheet', sheetName)
  params.set('_', Date.now().toString())
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?${params.toString()}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`gviz fetch failed: ${res.status} ${res.statusText}`)

  const text = await res.text()
  const json = text.replace(PREFIX_RE, '').replace(SUFFIX_RE, '')
  const data: GvizResponse = JSON.parse(json)

  const rows = data?.table?.rows ?? []
  const out: Word[] = []

  for (const row of rows) {
    const cells = row.c ?? []
    const sw = cellString(cells[0])
    if (!sw) continue
    if (out.length === 0 && /^swedish(\s|$)/i.test(sw)) continue
    const pr = cellString(cells[1]) || '—'
    const en = cellString(cells[2]) || '—'
    out.push({ swedish: sw, pronunciation: pr, english: en })
  }

  return out
}

function cellString(cell: GvizCell): string {
  if (!cell || cell.v === undefined || cell.v === null) return ''
  return String(cell.v).trim()
}
