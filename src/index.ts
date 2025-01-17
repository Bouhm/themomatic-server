import { Hono } from 'hono'
import { RateLimiterDO } from './middleware/rateLimiter'

type Bindings = {
  OPENAI_API_KEY: string
  GOOGLE_API_KEY: string
  GOOGLE_CSE_ID: string
  RATE_LIMITER_DO: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.post('/generateThemeConfig', async (c, next) => {
  const id = c.env.RATE_LIMITER_DO.idFromName('GLOBAL-QUEUE')
  const obj = c.env.RATE_LIMITER_DO.get(id)

  // Forward the request to DO’s "/enqueue" route
  return obj.fetch('https://dummy/enqueue', {
    method: 'POST',
    headers: c.req.headers,
    body: c.req.body,
  })
})

app.fire()