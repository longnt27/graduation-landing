import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceRateLimit, getClientIp, hashRateLimitIdentifier } from '../lib/rate-limit.js';

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) { this.headers[key] = value; },
    end(value = '') { this.body = String(value); }
  };
}

function withRedisEnv(fn) {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
      if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
    });
}

test('extracts first forwarded IP and hashes identifiers', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.4, 10.0.0.1' } };
  assert.equal(getClientIp(req), '203.0.113.4');
  assert.match(hashRateLimitIdentifier('203.0.113.4'), /^[a-f0-9]{32}$/);
});

test('allows request below Redis-backed limit', async () => {
  await withRedisEnv(async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => [{ result: 2 }, { result: 1 }]
    });

    try {
      const req = { headers: { 'x-forwarded-for': '203.0.113.4' } };
      const res = makeRes();
      const allowed = await enforceRateLimit(req, res, {
        scope: 'test', limit: 3, windowSeconds: 60
      });
      assert.equal(allowed, true);
      assert.equal(res.headers['X-RateLimit-Limit'], '3');
      assert.equal(res.headers['X-RateLimit-Remaining'], '1');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('returns 429 above Redis-backed limit', async () => {
  await withRedisEnv(async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => [{ result: 4 }, { result: 1 }]
    });

    try {
      const req = { headers: { 'x-forwarded-for': '203.0.113.4' } };
      const res = makeRes();
      const allowed = await enforceRateLimit(req, res, {
        scope: 'test', limit: 3, windowSeconds: 60
      });
      assert.equal(allowed, false);
      assert.equal(res.statusCode, 429);
      assert.ok(Number(res.headers['Retry-After']) >= 1);
      assert.match(res.body, /thao tác hơi nhanh/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
