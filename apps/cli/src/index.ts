#!/usr/bin/env node
import { intro, text, outro, spinner, isCancel } from '@clack/prompts'
import { createClient } from '@supabase/supabase-js'
import { createPneumaClient } from '@pneuma/sdk'

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? ''
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? ''
const API_URL = process.env['PNEUMA_API_URL'] ?? 'https://api.pneuma.app'
const DEVICE_ID = process.env['PNEUMA_DEVICE_ID'] ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

const client = createPneumaClient({ baseUrl: API_URL, getToken })

let conversationId: string | undefined

async function chat(message: string) {
  let reply = ''
  process.stdout.write('\nPneuma: ')

  for await (const chunk of client.chat.send({ conversationId, message, deviceId: DEVICE_ID })) {
    if (chunk.type === 'delta') {
      process.stdout.write(chunk.content)
      reply += chunk.content
    }
    if (chunk.type === 'done') {
      conversationId = chunk.conversationId
    }
  }

  process.stdout.write('\n\n')
  return reply
}

async function main() {
  intro('Pneuma')

  while (true) {
    const input = await text({ message: 'You', placeholder: 'Ask anything (Ctrl+C to quit)' })
    if (isCancel(input)) break

    const s = spinner()
    s.start()

    try {
      s.stop()
      await chat(String(input))
    } catch (err) {
      s.stop()
      console.error('Error:', err)
    }
  }

  outro('Bye.')
}

main()
