import './style.css'
import { fetchWords, type Word } from './sheet'
import { mount, render, renderMessage, type AppState, type RevealKey } from './ui'
import { speakSwedish } from './tts'

const SHEET_ID = import.meta.env.VITE_SHEET_ID
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME || undefined

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildOrder(words: Word[], avoidFirst?: number): number[] {
  const next = shuffle(words.map((_, i) => i))
  if (avoidFirst !== undefined && next.length > 1 && next[0] === avoidFirst) {
    ;[next[0], next[1]] = [next[1], next[0]]
  }
  return next
}

async function main() {
  if (!SHEET_ID) {
    renderMessage({
      title: 'Setup needed',
      body: 'Missing <code class="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">VITE_SHEET_ID</code>. Add it to <code class="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">.env.local</code> for local dev, or to your Vercel project Environment Variables.',
      tone: 'error',
    })
    return
  }

  mount(() => {
    const el = document.createElement('div')
    el.className = 'min-h-full flex items-center justify-center'
    el.innerHTML = `<div class="text-muted animate-pulse">Loading words…</div>`
    return el
  })

  let words: Word[]
  try {
    words = await fetchWords(SHEET_ID, SHEET_NAME)
  } catch (err) {
    console.error('[swe-words] fetch failed:', err)
    renderMessage({
      title: "Couldn't load the sheet",
      body: 'Make sure the Google Sheet is shared as <strong>Anyone with the link → Viewer</strong> and that the Sheet ID is correct.',
      tone: 'error',
    })
    return
  }

  if (words.length === 0) {
    renderMessage({ body: 'No words found in the sheet.' })
    return
  }

  const state: AppState = {
    words,
    order: buildOrder(words),
    cursor: 0,
    revealed: { pronunciation: false, translation: false },
  }

  const next = () => {
    state.cursor++
    if (state.cursor >= state.order.length) {
      const lastShown = state.order[state.order.length - 1]
      state.order = buildOrder(words, lastShown)
      state.cursor = 0
    }
    state.revealed = { pronunciation: false, translation: false }
    render(state, { onReveal: reveal, onNext: next })
  }

  const reveal = (which: RevealKey | 'auto') => {
    if (which === 'auto') {
      if (!state.revealed.pronunciation) state.revealed.pronunciation = true
      else if (!state.revealed.translation) state.revealed.translation = true
      else {
        next()
        return
      }
    } else {
      state.revealed[which] = true
    }
    render(state, { onReveal: reveal, onNext: next })
  }

  render(state, { onReveal: reveal, onNext: next })

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return
    }
    if (e.key === ' ') {
      e.preventDefault()
      reveal('auto')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'r' || e.key === 'R') {
      const w = words[state.order[state.cursor]]
      speakSwedish(w.swedish)
    }
  })

  let touchStartX = 0
  let touchStartY = 0
  window.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    },
    { passive: true },
  )
  window.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40 && dx < 0) next()
  })
}

main()
