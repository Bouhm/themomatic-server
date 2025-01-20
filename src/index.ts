import { Hono } from 'hono'
import { ChatService } from './services/ChatService'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Type for how we'll store global usage in KV
interface GlobalUsage {
  count: number      // total requests for the day
  resetTime: number  // timestamp (ms) for next reset
}

const GLOBAL_KEY = 'GLOBAL_USAGE'

// Hard-coded limits
const GLOBAL_DAILY_LIMIT = 50

function getNextMidnight(): number {
  const d = new Date()
  d.setHours(24, 0, 0, 0) // set to next midnight local time
  return d.getTime()
}

app.post('/generateTheme', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader !== `Bearer ${c.env.CLIENT_KEY}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const kv = c.env.THEMOMATIC_KV
  // Fetch global usage from KV
  const globalUsageStr = await kv.get(GLOBAL_KEY)
  let globalUsage: GlobalUsage
  if (globalUsageStr) {
    globalUsage = JSON.parse(globalUsageStr)
  } else {
    // Not set yet
    globalUsage = { count: 0, resetTime: getNextMidnight() }
  }

  // Check if we passed reset time
  if (Date.now() > globalUsage.resetTime) {
    // Reset for new day
    globalUsage = { count: 0, resetTime: getNextMidnight() }
  }

  // If global usage >= 50, return 429 immediately
  if (globalUsage.count >= GLOBAL_DAILY_LIMIT) {
    return c.json({ error: 'Global daily limit (50) reached' }, 429)
  }

  // => If we pass all checks, increment usage
  globalUsage.count++

  // Write updated usage to KV (in parallel)
  await Promise.all([
    kv.put(GLOBAL_KEY, JSON.stringify(globalUsage))
  ])

  const body = await c.req.json<{ query: string }>()
  console.log("Received query: " + body.query)

  const query = body.query;
  const chatService = new ChatService(c.env);
  const result = await chatService.CallChatGpt(query);

  console.log(result)

  return c.json({ success: true, data: result })
})

export default app