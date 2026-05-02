import type { Word } from './sheet'
import { speakSwedish, ttsSupported } from './tts'

export type RevealKey = 'pronunciation' | 'translation'

export type AppState = {
  words: Word[]
  order: number[]
  cursor: number
  revealed: { pronunciation: boolean; translation: boolean }
}

export type Handlers = {
  onReveal: (which: RevealKey | 'auto') => void
  onNext: () => void
}

let appEl: HTMLElement | null = null

function ensureRoot(): HTMLElement {
  if (!appEl) {
    appEl = document.getElementById('app')
    if (!appEl) throw new Error('#app root not found')
  }
  return appEl
}

export function mount(builder: () => HTMLElement): void {
  const root = ensureRoot()
  root.innerHTML = ''
  root.appendChild(builder())
}

export function renderMessage(opts: { title?: string; body: string; tone?: 'neutral' | 'error' }): void {
  const tone = opts.tone ?? 'neutral'
  mount(() => {
    const el = document.createElement('div')
    el.className = 'min-h-full flex items-center justify-center p-8'
    el.innerHTML = `
      <div class="max-w-md text-center ${tone === 'error' ? 'text-ink dark:text-ink-dark' : 'text-muted'}">
        ${opts.title ? `<h2 class="text-xl font-semibold mb-2 text-ink dark:text-ink-dark">${escapeHtml(opts.title)}</h2>` : ''}
        <p class="leading-relaxed">${opts.body}</p>
      </div>
    `
    return el
  })
}

export function render(state: AppState, handlers: Handlers): void {
  const word = state.words[state.order[state.cursor]]
  const total = state.words.length
  const current = state.cursor + 1
  const progress = Math.round((current / total) * 100)
  const showTts = ttsSupported()

  const html = `
    <div class="min-h-full flex flex-col">
      <header class="px-5 sm:px-8 pt-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-muted text-sm">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sweblue text-white text-xs font-semibold">Sv</span>
            <span class="hidden sm:inline font-medium">Svenska Vocab</span>
          </div>
          <div class="text-muted text-sm tabular-nums" aria-label="Progress">${current} / ${total}</div>
        </div>
        <div class="progress-bar mt-4" aria-hidden="true">
          <span style="width: ${progress}%"></span>
        </div>
      </header>

      <main class="flex-1 flex items-center justify-center px-5 sm:px-8 py-6">
        <article class="w-full max-w-xl animate-card-in" data-card>
          <div class="text-center mb-8 sm:mb-10">
            <div class="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <h1 class="font-serif font-semibold leading-none tracking-tight text-5xl sm:text-7xl break-words">${escapeHtml(word.swedish)}</h1>
              ${showTts ? renderTtsButton() : ''}
            </div>
          </div>

          <div class="space-y-3">
            ${renderSlot('pronunciation', 'Pronunciation', word.pronunciation, state.revealed.pronunciation)}
            ${renderSlot('translation', 'Meaning', word.english, state.revealed.translation)}
          </div>
        </article>
      </main>

      <footer class="flex items-center justify-center pb-8 sm:pb-10 px-5">
        <button type="button" data-action="next" class="btn-primary" aria-label="Next word">
          <span>Next</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </footer>
    </div>
  `

  const root = ensureRoot()
  root.innerHTML = html

  root.querySelector('[data-action="next"]')?.addEventListener('click', handlers.onNext)
  root.querySelector('[data-action="tts"]')?.addEventListener('click', (e) => {
    e.stopPropagation()
    speakSwedish(word.swedish)
  })
  root.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => {
    const which = el.dataset.slot as RevealKey
    if (!state.revealed[which]) {
      el.addEventListener('click', () => handlers.onReveal(which))
    }
  })
}

function renderTtsButton(): string {
  return `
    <button type="button" data-action="tts" class="icon-btn" aria-label="Hear pronunciation">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  `
}

function renderSlot(key: RevealKey, label: string, value: string, revealed: boolean): string {
  if (revealed) {
    return `
      <div data-slot="${key}" class="slot slot-revealed" aria-live="polite">
        <div class="text-[11px] uppercase tracking-[0.12em] text-muted mb-1 font-medium">${label}</div>
        <div class="text-2xl sm:text-3xl font-medium">${escapeHtml(value)}</div>
      </div>
    `
  }

  const revealLabel = key === 'translation' ? 'meaning' : label.toLowerCase()
  return `
    <button type="button" data-slot="${key}" class="slot slot-hidden" aria-label="Reveal ${revealLabel}">
      Tap to reveal ${revealLabel}
    </button>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
