import { useRef, useState, useCallback, useEffect } from 'react'

export function useSpeechSynthesis() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const pendingRef = useRef('')
  const pendingUtterances = useRef(0)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const speakSegment = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return
      const u = new SpeechSynthesisUtterance(text.trim())
      u.rate = 1.0

      // Prefer a local English voice if available (sounds better offline)
      const voices = window.speechSynthesis.getVoices()
      const local = voices.find((v) => v.lang.startsWith('en') && v.localService)
      if (local) u.voice = local

      pendingUtterances.current++
      setSpeaking(true)

      u.onend = () => {
        pendingUtterances.current = Math.max(0, pendingUtterances.current - 1)
        if (pendingUtterances.current === 0) setSpeaking(false)
      }
      u.onerror = () => {
        pendingUtterances.current = Math.max(0, pendingUtterances.current - 1)
        if (pendingUtterances.current === 0) setSpeaking(false)
      }

      window.speechSynthesis.speak(u)
    },
    [supported],
  )

  // Feed streaming delta text — speaks each sentence as it completes
  const queueChunk = useCallback(
    (delta: string) => {
      if (!supported) return
      pendingRef.current += delta

      // Extract and speak all complete sentences from the buffer
      let idx: number
      while (
        (idx = pendingRef.current.search(/[.!?](\s|$)/)) !== -1
      ) {
        const sentence = pendingRef.current.slice(0, idx + 1)
        pendingRef.current = pendingRef.current.slice(idx + 1).trimStart()
        speakSegment(sentence)
      }
    },
    [supported, speakSegment],
  )

  // Speak whatever's left in the buffer (call when streaming ends)
  const flushRemaining = useCallback(() => {
    if (!supported) return
    const leftover = pendingRef.current.trim()
    pendingRef.current = ''
    speakSegment(leftover)
  }, [supported, speakSegment])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    pendingRef.current = ''
    pendingUtterances.current = 0
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, queueChunk, flushRemaining, stop }
}
