import { corsHeaders, handleCors, error } from '../_shared/cors.ts'
import { authenticate } from '../_shared/auth.ts'

const GEMINI_TTS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent'

// 44-byte WAV header for 16-bit PCM at 24 kHz mono
function buildWavHeader(pcmLength: number): Uint8Array {
  const buf = new ArrayBuffer(44)
  const v = new DataView(buf)
  const write = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
  }
  const sampleRate = 24000
  const channels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  write(0, 'RIFF')
  v.setUint32(4, 36 + pcmLength, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, channels, true)
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, byteRate, true)
  v.setUint16(32, blockAlign, true)
  v.setUint16(34, bitsPerSample, true)
  write(36, 'data')
  v.setUint32(40, pcmLength, true)
  return new Uint8Array(buf)
}

Deno.serve(async (req) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    const user = await authenticate(req)
    if (!user) return error('Unauthorized', 401)

    let body: { text?: string }
    try {
      body = await req.json()
    } catch {
      return error('Invalid JSON body', 400)
    }

    const text = body?.text?.trim()
    if (!text) return error('text is required')

    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) return error('TTS not configured', 503)

    const geminiRes = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '')
      console.error('[tts] Gemini error:', geminiRes.status, errText)
      return error(`TTS upstream error: ${geminiRes.status}`, 502)
    }

    const data = await geminiRes.json()
    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (!inlineData?.data) {
      console.error('[tts] No audio data in Gemini response:', JSON.stringify(data).slice(0, 200))
      return error('No audio in TTS response', 502)
    }

    // Gemini returns raw 16-bit PCM, base64-encoded
    const pcmBytes = Uint8Array.from(atob(inlineData.data), (c) => c.charCodeAt(0))
    const wavHeader = buildWavHeader(pcmBytes.byteLength)
    const wav = new Uint8Array(wavHeader.byteLength + pcmBytes.byteLength)
    wav.set(wavHeader, 0)
    wav.set(pcmBytes, wavHeader.byteLength)

    return new Response(wav, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Content-Length': String(wav.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[tts] unhandled error:', e)
    return error('Internal server error', 500)
  }
})
