import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { authMiddleware } from './middleware/auth'
import { chatRoute } from './routes/chat'
import { memoryRoute } from './routes/memory'
import { syncRoute } from './routes/sync'
import { devicesRoute } from './routes/devices'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }))

app.get('/health', (c) => c.json({ ok: true, service: 'pneuma-api' }))

app.use('/chat', authMiddleware)
app.use('/memory/*', authMiddleware)
app.use('/sync/*', authMiddleware)
app.use('/devices/*', authMiddleware)

app.route('/chat', chatRoute)
app.route('/memory', memoryRoute)
app.route('/sync', syncRoute)
app.route('/devices', devicesRoute)

export default app
