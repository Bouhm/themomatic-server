import { EnvWithBindings } from 'hono' // or your own env type

type JobStatus = 'pending' | 'processing' | 'done' | 'error'

interface JobRecord {
  id: string
  userId: string
  query: string
  status: JobStatus
  result?: any
  error?: string
  createdAt: number
}

export class RateLimiterDO {
  private state: DurableObjectState
  private env: EnvWithBindings

  // Jobs keyed by jobId
  private jobs: Map<string, JobRecord> = new Map()

  // FIFO queue of job IDs to process
  private queue: string[] = []

  // Is a job currently processing?
  private processing = false

  // Global usage
  private dailyUsage = 0
  private dailyResetTime = 0

  // Per-user usage map
  private userUsage = new Map<string, {
    dailyUsage: number
    lastRequestTime: number
  }>()

  // Constants
  private DAILY_LIMIT_GLOBAL = 50
  private DAILY_LIMIT_PER_USER = 5
  private USER_COOLDOWN_MS = 60_000
  private GLOBAL_COOLDOWN_MS = 60_000

  constructor(state: DurableObjectState, env: EnvWithBindings) {
    this.state = state
    this.env = env
  }

  /**
   * Main fetch handler for the DO.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // POST /jobs -> Enqueue a new job
    if (pathname === '/jobs' && request.method === 'POST') {
      return this.createJob(request)
    }

    // GET /jobs/:jobId -> Get job status/result
    const jobIdMatch = pathname.match(/^\/jobs\/([^/]+)$/)
    if (jobIdMatch && request.method === 'GET') {
      const jobId = jobIdMatch[1]
      return this.getJobStatus(jobId)
    }

    return new Response('Not found', { status: 404 })
  }

  /**
   * POST /jobs -> Enqueue a new job
   */
  private async createJob(request: Request): Promise<Response> {
    this.checkDailyReset()

    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check global daily limit
    if (this.dailyUsage >= this.DAILY_LIMIT_GLOBAL) {
      return new Response(
        JSON.stringify({ error: 'Global daily limit (50) reached' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Check (and init) user record
    const userRecord = this.getOrInitUserRecord(userId)
    if (userRecord.dailyUsage >= this.DAILY_LIMIT_PER_USER) {
      return new Response(
        JSON.stringify({ error: 'User daily limit (5) reached' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Check 1-min cooldown for user
    const now = Date.now()
    const nextAllowed = userRecord.lastRequestTime + this.USER_COOLDOWN_MS
    if (now < nextAllowed) {
      const secondsLeft = Math.ceil((nextAllowed - now) / 1000)
      return new Response(
        JSON.stringify({
          error: `User must wait ${secondsLeft}s before next request`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Parse JSON
    const { query } = await request.json<{ query: string }>()
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing "query" in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // All checks passed: increment user + global usage
    userRecord.dailyUsage++
    userRecord.lastRequestTime = now
    this.dailyUsage++

    // Create a job record
    const jobId = crypto.randomUUID()
    const job: JobRecord = {
      id: jobId,
      userId,
      query,
      status: 'pending',
      createdAt: now,
    }
    this.jobs.set(jobId, job)
    this.queue.push(jobId)

    // Trigger async processing
    this.processQueue()

    // Return 202 Accepted with jobId
    return new Response(JSON.stringify({ jobId }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * GET /jobs/:jobId -> Return job status (pending, processing, done) and result/error
   */
  private async getJobStatus(jobId: string): Promise<Response> {
    const job = this.jobs.get(jobId)
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        status: job.status,
        result: job.result,
        error: job.error,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  /**
   * Process the queue (one job at a time).
   * After finishing each job, wait GLOBAL_COOLDOWN_MS before next job.
   */
  private async processQueue() {
    // If already processing, do nothing
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const jobId = this.queue.shift()!
      const job = this.jobs.get(jobId)
      if (!job) {
        // Shouldn’t happen, but just in case
        continue
      }

      // Process this job
      job.status = 'processing'
      this.jobs.set(jobId, job)

      try {
        const result = await this.handleChatGPT(job.query)
        job.status = 'done'
        job.result = result
      } catch (err: any) {
        job.status = 'error'
        job.error = err?.message || 'Unknown error'
      } finally {
        this.jobs.set(jobId, job)
      }

      // After finishing this job, wait 1 minute before next
      await this.sleep(this.GLOBAL_COOLDOWN_MS)
    }

    this.processing = false
  }

  /**
   * Where we actually call ChatGPT or do some work.
   * Replace with your real ChatGPT call logic.
   */
  private async handleChatGPT(query: string): Promise<any> {
    // Simulate ChatGPT call
    // const response = await fetch('https://api.openai.com/v1/...', {...})
    // return await response.json()

    // For demo:
    await this.sleep(2000) // simulate network
    return { answer: `Echo from ChatGPT: ${query}` }
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Reset usage if we've passed dailyResetTime
   */
  private checkDailyReset() {
    const now = Date.now()
    if (now > this.dailyResetTime) {
      this.dailyUsage = 0
      for (const [_, usage] of this.userUsage) {
        usage.dailyUsage = 0
      }
      // Next local midnight
      const nextMidnight = new Date()
      nextMidnight.setHours(24, 0, 0, 0)
      this.dailyResetTime = nextMidnight.getTime()
    }
  }

  private getOrInitUserRecord(userId: string) {
    let rec = this.userUsage.get(userId)
    if (!rec) {
      rec = {
        dailyUsage: 0,
        lastRequestTime: 0,
      }
      this.userUsage.set(userId, rec)
    }
    return rec
  }
}
