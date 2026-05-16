import { useRef, useState, useCallback, useEffect } from 'react'
import { PNEUMA_API_URL as API_URL } from '../config'

export function useTTS(token: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const [speaking, setSpeaking] = useState(false)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  const stop = useCallback(() => {
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
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      stop()

      setSpeaking(true)
      try {
        const res = await fetch(`${API_URL}/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        })

        if (!res.ok) {
          setSpeaking(false)
          return
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        urlRef.current = url

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
      } catch {
        setSpeaking(false)
      }
    },
    [token, stop],
  )

  return { speaking, speak, stop }
}
