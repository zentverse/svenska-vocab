let currentAudio: HTMLAudioElement | null = null

export function ttsSupported(): boolean {
  return typeof Audio !== 'undefined'
}

export function speakSwedish(text: string): void {
  if (!text || !ttsSupported()) return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=sv`)
  currentAudio = audio
  audio.play().catch((err) => {
    console.warn('[tts] /api/tts failed, falling back to Web Speech API:', err)
    fallbackSpeak(text)
  })
}

function fallbackSpeak(text: string): void {
  if (typeof speechSynthesis === 'undefined') return
  const voices = speechSynthesis.getVoices()
  const sv = voices.find((v) => v.lang?.toLowerCase().startsWith('sv')) ?? null
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'sv-SE'
  utter.rate = 0.9
  if (sv) utter.voice = sv
  speechSynthesis.cancel()
  speechSynthesis.speak(utter)
}
