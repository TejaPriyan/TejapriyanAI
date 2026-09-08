/**
 * Tiny in-memory sliding-window rate limiter, keyed per user id.
 * Keeps one user from burning the whole shared free quota.
 * (For multi-instance deploys swap the Map for Redis/Upstash.)
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 15);
/** Maximum distinct user keys to track — prevents unbounded memory growth. */
const MAX_KEYS = 10_000;
/** Stale entries are pruned every this many milliseconds. */
const PRUNE_INTERVAL_MS = 5 * 60_000;

const hits = new Map<string, number[]>();

/** Remove entries whose timestamps are all older than the sliding window. */
function prune() {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

// Schedule automatic pruning so the map doesn't grow without bound.
let pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePruneTimer() {
  if (pruneTimer) return;
  pruneTimer = setInterval(prune, PRUNE_INTERVAL_MS);
  // Allow Node to exit even with the timer running.
  if (typeof pruneTimer === "object" && "unref" in pruneTimer) {
    (pruneTimer as NodeJS.Timeout).unref();
  }
}

export function checkRateLimit(key: string): { ok: boolean; retryAfter: number } {
  ensurePruneTimer();
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    hits.set(key, recent);
    return { ok: false, retryAfter };
  }

  // Evict oldest entry if we've hit the key cap (unlikely but safe).
  if (!hits.has(key) && hits.size >= MAX_KEYS) {
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfter: 0 };
}
