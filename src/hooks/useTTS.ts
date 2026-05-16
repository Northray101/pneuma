import { useRef, useState, useCallback, useEffect } from 'react'
import { PNEUMA_API_URL as API_URL } from '../config'

export function useTTS(token: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(false)   // fetching audio from server
  const [speaking, setSpeaking] = useState(false) // audio is playing

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (audioRef.current) audioRef.current.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setLoading(false)
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      stop()

      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)

      try {
        const res = await fetch(`${API_URL}/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
          signal: ac.signal,
        })

        if (!res.ok) {
          setLoading(false)
          return
        }

        const blob = await res.blob()

        if (ac.signal.aborted) return

        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setLoading(false)
        setSpeaking(true)

        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(url)
          if (urlRef.current === url) urlRef.current = null
          if (audioRef.current === audio) audioRef.current = null
          setSpeaking(false)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          if (urlRef.current === url) urlRef.current = null
          if (audioRef.current === audio) audioRef.current = null
          setSpeaking(false)
        }

        await audio.play()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setLoading(false)
        setSpeaking(false)
      }
    },
    [token, stop],
  )

  return { loading, speaking, speak, stop }
}
