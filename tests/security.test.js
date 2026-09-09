import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeGuestbookImage } from '../lib/guestbook-image.js';
import { enforceJsonPost } from '../lib/security.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) { this.headers[key] = value; },
    end(value = '') { this.body = String(value); }
  };
}

test('same-origin JSON POST is accepted', () => {
  const req = {
    headers: {
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
      origin: 'https://invite.example.com',
      host: 'invite.example.com'
    },
    body: { hello: 'world' }
  };
  const res = mockResponse();
  assert.equal(enforceJsonPost(req, res, { maxBytes: 1024 }), true);
});

test('cross-site POST is rejected', () => {
  const req = {
    headers: {
      'content-type': 'application/json',
      'sec-fetch-site': 'cross-site',
      origin: 'https://evil.example',
      host: 'invite.example.com'
    },
    body: { hello: 'world' }
  };
  const res = mockResponse();
  assert.equal(enforceJsonPost(req, res, { maxBytes: 1024 }), false);
  assert.equal(res.statusCode, 403);
});

test('oversized JSON POST is rejected', () => {
  const req = {
    headers: { 'content-type': 'application/json', host: 'invite.example.com' },
    body: { payload: 'x'.repeat(2048) }
  };
  const res = mockResponse();
  assert.equal(enforceJsonPost(req, res, { maxBytes: 256 }), false);
  assert.equal(res.statusCode, 413);
});

test('valid PNG bytes are accepted and dimensions are read', () => {
  const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const image = decodeGuestbookImage(`data:image/png;base64,${onePixelPng}`);
  assert.equal(image.contentType, 'image/png');
  assert.equal(image.width, 1);
  assert.equal(image.height, 1);
});

test('fake image MIME with non-image bytes is rejected', () => {
  const fake = Buffer.from('<script>alert(1)</script>').toString('base64');
  assert.throws(
    () => decodeGuestbookImage(`data:image/png;base64,${fake}`),
    /PNG không hợp lệ/
  );
});

test('CSP blocks arbitrary scripts, framing and objects', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const globalHeaders = config.headers.find(item => item.source === '/(.*)').headers;
  const csp = globalHeaders.find(header => header.key === 'Content-Security-Policy')?.value || '';
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
});
