import { useCallback, useEffect, useRef, useState } from 'react'

interface UseVoiceInputOpts {
  onFinal: (text: string) => void
  disabled?: boolean
  lang?: string
}

export interface VoiceInput {
  supported: boolean
  listening: boolean
  interim: string
  error: string | null
  start: () => void
  stop: () => void
}

function getCtor(): { new (): SpeechRecognition } | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function useVoiceInput({
  onFinal,
  disabled = false,
  lang,
}: UseVoiceInputOpts): VoiceInput {
  const supported = typeof window !== 'undefined' && !!getCtor()
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recogRef = useRef<SpeechRecognition | null>(null)
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const stop = useCallback(() => {
    recogRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (disabled || listening) return
    const Ctor = getCtor()
    if (!Ctor) return

    const recog = new Ctor()
    recog.lang = lang || navigator.language || 'en-US'
    recog.continuous = false
    recog.interimResults = true
    recog.maxAlternatives = 1

    recog.onstart = () => {
      setError(null)
      setListening(true)
    }
    recog.onresult = (e) => {
      let live = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else live += r[0].transcript
      }
      setInterim(live)
      const trimmed = final.trim()
      if (trimmed) {
        onFinalRef.current(trimmed)
        recog.stop()
      }
    }
    recog.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone permission denied')
      else if (e.error !== 'no-speech' && e.error !== 'aborted')
        setError('Voice input error')
      setListening(false)
    }
    recog.onend = () => {
      setListening(false)
      setInterim('')
    }

    recogRef.current = recog
    try {
      recog.start()
    } catch {
      setListening(false)
    }
  }, [disabled, listening, lang])

  // Don't talk over the agent: abort if a response starts while listening.
  useEffect(() => {
    if (disabled && listening) recogRef.current?.abort()
  }, [disabled, listening])

  useEffect(() => {
    return () => {
      const r = recogRef.current
      if (r) {
        r.onresult = null
        r.onerror = null
        r.onend = null
        r.onstart = null
        r.abort()
      }
    }
  }, [])

  return { supported, listening, interim, error, start, stop }
}
