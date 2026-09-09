import crypto from 'node:crypto';
import { json } from './http.js';

let warnedMissingCredentials = false;

function firstHeader(value) {
  return String(value || '').split(',')[0].trim();
}

function redisConfig() {
  const url = String(
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  ).trim().replace(/\/+$/, '');
  const token = String(
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  ).trim();

  return url && token ? { url, token } : null;
}

export function getClientIp(req) {
  return (
    firstHeader(req.headers?.['x-forwarded-for']) ||
    firstHeader(req.headers?.['x-real-ip']) ||
    firstHeader(req.socket?.remoteAddress) ||
    'unknown'
  );
}

export function hashRateLimitIdentifier(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}

export async function enforceRateLimit(
  req,
  res,
  { scope, limit, windowSeconds }
) {
  const config = redisConfig();
  if (!config) {
    if (!warnedMissingCredentials) {
      warnedMissingCredentials = true;
      console.warn(
        'Rate limiting disabled: missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN).'
      );
    }
    return true;
  }

  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowId = Math.floor(nowMs / windowMs);
  const ipHash = hashRateLimitIdentifier(getClientIp(req));
  const key = `graduation:ratelimit:${scope}:${windowId}:${ipHash}`;
  const resetAtMs = (windowId + 1) * windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));

  try {
    const response = await fetch(`${config.url}/multi-exec`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds + 5]
      ]),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) {
      throw new Error(`Upstash HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || payload[0]?.error) {
      throw new Error(payload?.error || payload?.[0]?.error || 'Invalid Upstash response');
    }

    const count = Number(payload[0]?.result);
    if (!Number.isFinite(count)) {
      throw new Error('Invalid Upstash counter value');
    }

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));

    if (count > limit) {
      res.setHeader('Retry-After', String(retryAfter));
      json(res, 429, {
        error: 'Bạn thao tác hơi nhanh. Vui lòng đợi một chút rồi thử lại.'
      });
      return false;
    }

    return true;
  } catch (err) {
    // Keep the invitation usable if the rate-limit backend has a transient outage.
    console.error('Rate limiter unavailable; allowing request:', err);
    return true;
  }
}
