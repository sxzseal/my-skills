/**
 * In-memory token-bucket rate limiter for write endpoints.
 *
 * Caveat: on Vercel serverless each invocation may hit a fresh instance, so
 * this is a soft ceiling per instance rather than a global one. It stops
 * trivial scripted abuse; for a strict global bound wire `@upstash/ratelimit`
 * (Redis-backed) or an equivalent shared store.
 */

interface Bucket {
  tokens: number
  refilledAt: number
}

export interface RateLimitOptions {
  capacity?: number
  refillPerSec?: number
}

const DEFAULT_CAPACITY = 10
const DEFAULT_REFILL_PER_SEC = 10 / 60 // 10 tokens / minute
const MAX_KEYS = 10_000

const buckets = new Map<string, Bucket>()

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return
  const staleBefore = now - 60 * 60 * 1000
  for (const [key, bucket] of buckets) {
    if (bucket.refilledAt < staleBefore) buckets.delete(key)
    if (buckets.size < MAX_KEYS / 2) break
  }
}

export function checkRateLimit(
  key: string,
  cost = 1,
  opts: RateLimitOptions = {},
): boolean {
  const capacity = opts.capacity ?? DEFAULT_CAPACITY
  const refillPerSec = opts.refillPerSec ?? DEFAULT_REFILL_PER_SEC
  const now = Date.now()

  prune(now)

  const bucket = buckets.get(key) ?? { tokens: capacity, refilledAt: now }
  const elapsedSec = (now - bucket.refilledAt) / 1000
  const nextTokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec)
  bucket.tokens = nextTokens
  bucket.refilledAt = now

  if (bucket.tokens < cost) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= cost
  buckets.set(key, bucket)
  return true
}

export function __resetRateLimitForTests() {
  buckets.clear()
}
