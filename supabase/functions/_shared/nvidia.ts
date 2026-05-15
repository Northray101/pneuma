import OpenAI from 'npm:openai@4'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'

// Default text model and vision model
export const DEFAULT_TEXT_MODEL = 'meta/llama-3.1-70b-instruct'
export const DEFAULT_VISION_MODEL = 'nvidia/llama-3.2-90b-vision-instruct'
export const EXTRACTION_MODEL = 'meta/llama-3.1-8b-instruct'

function makeClient(key: string) {
  return new OpenAI({ baseURL: NVIDIA_BASE_URL, apiKey: key })
}

function isOverloaded(err: unknown): boolean {
  return (
    err instanceof OpenAI.APIError && (err.status === 429 || err.status === 503 || err.status === 502)
  )
}

// Non-streaming call with primary → backup failover
export async function nvidiaComplete(
  params: OpenAI.ChatCompletionCreateParamsNonStreaming,
): Promise<OpenAI.ChatCompletion> {
  const primaryKey = Deno.env.get('NVIDIA_API_KEY')!
  const backupKey = Deno.env.get('NVIDIA_API_KEY_BACKUP')!

  try {
    return await makeClient(primaryKey).chat.completions.create(params)
  } catch (err) {
    if (isOverloaded(err)) {
      console.warn('[nvidia] primary key overloaded, switching to backup')
      return await makeClient(backupKey).chat.completions.create(params)
    }
    throw err
  }
}

// Streaming call with primary → backup failover (failover on initial connection only)
export async function nvidiaStream(
  params: OpenAI.ChatCompletionCreateParamsStreaming,
): Promise<AsyncIterable<OpenAI.ChatCompletionChunk>> {
  const primaryKey = Deno.env.get('NVIDIA_API_KEY')!
  const backupKey = Deno.env.get('NVIDIA_API_KEY_BACKUP')!

  try {
    return await makeClient(primaryKey).chat.completions.create(params)
  } catch (err) {
    if (isOverloaded(err)) {
      console.warn('[nvidia] primary key overloaded on stream start, switching to backup')
      return await makeClient(backupKey).chat.completions.create(params)
    }
    throw err
  }
}

// Build content array for multimodal (image + text) messages
export function buildUserContent(
  text: string,
  imageUrl?: string,
): string | OpenAI.ChatCompletionContentPart[] {
  if (!imageUrl) return text
  return [
    { type: 'image_url', image_url: { url: imageUrl } },
    { type: 'text', text },
  ]
}
